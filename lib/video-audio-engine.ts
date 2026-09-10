"use client";

/**
 * -------------------------------------------------------------
 * 1. PURE CLIENT-SIDE AUDIO ENCODER & UTILITIES
 * -------------------------------------------------------------
 */

/**
 * Encodes an AudioBuffer into a standard 16-bit PCM WAV Blob
 */
export function encodeAudioBufferToWav(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let samples: Float32Array;
  if (numChannels === 2) {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    samples = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      samples[i * 2] = left[i];
      samples[i * 2 + 1] = right[i];
    }
  } else {
    samples = audioBuffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(view, 8, "WAVE");

  // fmt sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * bytesPerSample, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Decodes an audio or video file into an AudioBuffer using Web Audio API
 */
export async function decodeMediaFileToAudioBuffer(file: File | Blob): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  try {
    return await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    audioCtx.close();
  }
}

/**
 * Trims an AudioBuffer between start and end seconds
 */
export async function trimAudioBuffer(
  audioBuffer: AudioBuffer,
  startSec: number,
  endSec: number
): Promise<AudioBuffer> {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;

  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(audioBuffer.length, Math.floor(endSec * sampleRate));
  const length = Math.max(1, endSample - startSample);

  const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);
  const trimmedBuffer = offlineCtx.createBuffer(numChannels, length, sampleRate);

  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = audioBuffer.getChannelData(ch);
    const trimmedData = trimmedBuffer.getChannelData(ch);
    trimmedData.set(channelData.subarray(startSample, endSample));
  }

  return trimmedBuffer;
}

/**
 * Compresses/resamples an AudioBuffer with custom sample rate & channels
 */
export async function compressAudioBuffer(
  audioBuffer: AudioBuffer,
  options: {
    targetSampleRate?: number;
    forceMono?: boolean;
    gain?: number;
  }
): Promise<AudioBuffer> {
  const inRate = audioBuffer.sampleRate;
  const inChannels = audioBuffer.numberOfChannels;
  const outRate = options.targetSampleRate || inRate;
  const outChannels = options.forceMono ? 1 : inChannels;

  const ratio = outRate / inRate;
  const outLength = Math.max(1, Math.floor(audioBuffer.length * ratio));

  const offlineCtx = new OfflineAudioContext(outChannels, outLength, outRate);
  const src = offlineCtx.createBufferSource();
  src.buffer = audioBuffer;

  if (options.gain && options.gain !== 1) {
    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = options.gain;
    src.connect(gainNode);
    gainNode.connect(offlineCtx.destination);
  } else {
    src.connect(offlineCtx.destination);
  }

  src.start(0);
  return await offlineCtx.startRendering();
}

/**
 * -------------------------------------------------------------
 * 2. CLIENT-SIDE VIDEO PROCESSING ENGINE (CANVAS + MEDIARECORDER)
 * -------------------------------------------------------------
 */

export interface VideoProcessOptions {
  width?: number;
  height?: number;
  videoBitrate?: number; // e.g. 1500000 for 1.5 Mbps
  fps?: number;
  trimStart?: number;
  trimEnd?: number;
  cropBox?: { x: number; y: number; width: number; height: number }; // In normalized 0..1 or px
  fitMode?: "contain" | "cover" | "stretch";
  onProgress?: (percent: number) => void;
}

/**
 * Processes a video file client-side via HTML5 video, canvas, and MediaRecorder
 */
export async function processVideoClientSide(
  videoFile: File,
  options: VideoProcessOptions = {}
): Promise<{ blob: Blob; url: string; width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(videoFile);
    video.crossOrigin = "anonymous";
    video.muted = false;
    video.playsInline = true;

    video.onloadedmetadata = async () => {
      try {
        const origW = video.videoWidth;
        const origH = video.videoHeight;
        const origDuration = video.duration || 10;

        const trimStart = Math.max(0, options.trimStart ?? 0);
        const trimEnd = Math.min(origDuration, options.trimEnd ?? origDuration);
        const processDuration = Math.max(0.5, trimEnd - trimStart);

        const targetW = options.width || origW;
        const targetH = options.height || origH;
        const fps = options.fps || 30;
        const bitrate = options.videoBitrate || 2000000;

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Could not create 2D canvas context");
        }

        // Setup audio stream from video
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        let audioDestNode: MediaStreamAudioDestinationNode | null = null;
        let sourceNode: MediaElementAudioSourceNode | null = null;

        try {
          sourceNode = audioCtx.createMediaElementSource(video);
          audioDestNode = audioCtx.createMediaStreamDestination();
          sourceNode.connect(audioDestNode);
          sourceNode.connect(audioCtx.destination);
        } catch {
          // Audio routing fallback if cross-origin or already connected
        }

        const canvasStream = canvas.captureStream(fps);
        if (audioDestNode && audioDestNode.stream.getAudioTracks().length > 0) {
          canvasStream.addTrack(audioDestNode.stream.getAudioTracks()[0]);
        }

        // Determine best supported MIME type
        const mimeTypes = [
          'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
          "video/mp4",
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
        ];
        let chosenMime = "video/webm";
        for (const mime of mimeTypes) {
          if (MediaRecorder.isTypeSupported(mime)) {
            chosenMime = mime;
            break;
          }
        }

        const recorder = new MediaRecorder(canvasStream, {
          mimeType: chosenMime,
          videoBitsPerSecond: bitrate,
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        let animationFrameId: number;
        let isComplete = false;

        const renderFrame = () => {
          if (isComplete) return;

          const currentT = video.currentTime;
          const progress = Math.min(100, Math.round(((currentT - trimStart) / processDuration) * 100));
          if (options.onProgress) {
            options.onProgress(Math.max(0, progress));
          }

          if (currentT >= trimEnd || video.ended) {
            isComplete = true;
            cancelAnimationFrame(animationFrameId);
            video.pause();
            if (recorder.state === "recording") {
              recorder.stop();
            }
            return;
          }

          // Draw video frame to canvas
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, targetW, targetH);

          if (options.cropBox) {
            const cb = options.cropBox;
            const sx = cb.x < 1 ? cb.x * origW : cb.x;
            const sy = cb.y < 1 ? cb.y * origH : cb.y;
            const sw = cb.width < 1 ? cb.width * origW : cb.width;
            const sh = cb.height < 1 ? cb.height * origH : cb.height;
            ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH);
          } else if (options.fitMode === "cover") {
            const scale = Math.max(targetW / origW, targetH / origH);
            const w = origW * scale;
            const h = origH * scale;
            const x = (targetW - w) / 2;
            const y = (targetH - h) / 2;
            ctx.drawImage(video, x, y, w, h);
          } else if (options.fitMode === "stretch") {
            ctx.drawImage(video, 0, 0, targetW, targetH);
          } else {
            // Default "contain" with letterbox padding
            const scale = Math.min(targetW / origW, targetH / origH);
            const w = origW * scale;
            const h = origH * scale;
            const x = (targetW - w) / 2;
            const y = (targetH - h) / 2;
            ctx.drawImage(video, x, y, w, h);
          }

          animationFrameId = requestAnimationFrame(renderFrame);
        };

        recorder.onstop = () => {
          audioCtx.close();
          const blob = new Blob(chunks, { type: chosenMime });
          const url = URL.createObjectURL(blob);
          if (options.onProgress) options.onProgress(100);
          resolve({
            blob,
            url,
            width: targetW,
            height: targetH,
            duration: processDuration,
          });
        };

        // Start seek & record
        video.currentTime = trimStart;
        video.onseeked = () => {
          video.onseeked = null;
          recorder.start(100);
          video.play();
          renderFrame();
        };
      } catch (err) {
        reject(err);
      }
    };

    video.onerror = () => reject(new Error("Failed to load video"));
  });
}

/**
 * -------------------------------------------------------------
 * 3. VIDEO TO ANIMATED GIF & GIF TO VIDEO
 * -------------------------------------------------------------
 */

/**
 * Converts a video clip to an animated GIF using an embedded pure JS GIF builder
 */
export async function convertVideoToAnimatedGif(
  videoFile: File,
  options: {
    startTime?: number;
    duration?: number;
    fps?: number;
    width?: number;
    onProgress?: (percent: number) => void;
  } = {}
): Promise<{ blob: Blob; url: string; frameCount: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(videoFile);
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = async () => {
      try {
        const origW = video.videoWidth;
        const origH = video.videoHeight;
        const targetW = options.width || Math.min(480, origW);
        const targetH = Math.round((targetW * origH) / origW);
        const fps = options.fps || 12;
        const start = options.startTime || 0;
        const maxDur = Math.min(8, options.duration || 4);
        const totalFrames = Math.floor(maxDur * fps);

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");

        if (!ctx) throw new Error("Canvas context creation failed");

        const frames: ImageData[] = [];
        const delayMs = Math.round(1000 / fps);

        for (let i = 0; i < totalFrames; i++) {
          const seekTime = start + i * (1 / fps);
          if (seekTime > video.duration) break;

          await new Promise<void>((res) => {
            video.currentTime = seekTime;
            video.onseeked = () => {
              ctx.drawImage(video, 0, 0, targetW, targetH);
              frames.push(ctx.getImageData(0, 0, targetW, targetH));
              if (options.onProgress) {
                options.onProgress(Math.round(((i + 1) / totalFrames) * 60));
              }
              res();
            };
          });
        }

        // Build Animated GIF Binary (Standard GIF89a with 256-color palette per frame)
        const gifBlob = buildAnimatedGifFromFrames(frames, targetW, targetH, delayMs, (p) => {
          if (options.onProgress) options.onProgress(60 + Math.round(p * 0.4));
        });

        resolve({
          blob: gifBlob,
          url: URL.createObjectURL(gifBlob),
          frameCount: frames.length,
        });
      } catch (err) {
        reject(err);
      }
    };

    video.onerror = () => reject(new Error("Failed to load video"));
  });
}

/**
 * Pure client-side GIF89a encoder
 */
function buildAnimatedGifFromFrames(
  frames: ImageData[],
  width: number,
  height: number,
  delayMs: number,
  onProgress?: (percent: number) => void
): Blob {
  const bytes: number[] = [];

  // Header: GIF89a
  writeBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);

  // Logical Screen Descriptor
  writeUint16(bytes, width);
  writeUint16(bytes, height);
  bytes.push(0x70); // GCT Flag = 0, Color Res = 7, Sort = 0, GCT Size = 0
  bytes.push(0x00); // Background Color Index
  bytes.push(0x00); // Pixel Aspect Ratio

  // Netscape 2.0 Loop Application Extension (Infinite loop)
  writeBytes(bytes, [0x21, 0xff, 0x0b]);
  writeBytes(bytes, stringToBytes("NETSCAPE2.0"));
  writeBytes(bytes, [0x03, 0x01, 0x00, 0x00, 0x00]);

  const delayHundredths = Math.max(2, Math.round(delayMs / 10));

  frames.forEach((frame, fIdx) => {
    if (onProgress) onProgress(Math.round((fIdx / frames.length) * 100));

    // Graphics Control Extension
    writeBytes(bytes, [0x21, 0xf9, 0x04, 0x04]); // Disposal: do not dispose
    writeUint16(bytes, delayHundredths);
    bytes.push(0x00); // Transparent color index
    bytes.push(0x00); // Terminator

    // Build 64-color quantized palette for this frame (fast 6x6x6 web palette quantization)
    const { indexedPixels, palette } = quantizeFrameToPalette(frame.data);

    // Image Descriptor
    bytes.push(0x2c); // Image separator
    writeUint16(bytes, 0); // Left
    writeUint16(bytes, 0); // Top
    writeUint16(bytes, width);
    writeUint16(bytes, height);
    bytes.push(0x85); // Local Color Table Present, 64 colors (2^(5+1) = 64)

    // Write Local Color Table (64 RGB triplets = 192 bytes)
    for (let i = 0; i < 64; i++) {
      const col = palette[i] || [0, 0, 0];
      bytes.push(col[0], col[1], col[2]);
    }

    // Write LZW Image Data
    encodeLzwData(bytes, indexedPixels, 6);
  });

  // GIF Trailer
  bytes.push(0x3b);

  return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
}

function quantizeFrameToPalette(rgba: Uint8ClampedArray): { indexedPixels: number[]; palette: number[][] } {
  const palette: number[][] = [];
  const paletteMap = new Map<number, number>();
  const indexedPixels: number[] = [];

  for (let i = 0; i < rgba.length; i += 4) {
    // Quantize 8-bit to 2-bit per channel (0..3) => 64 colors max
    const r = Math.min(3, Math.floor(rgba[i] / 64));
    const g = Math.min(3, Math.floor(rgba[i + 1] / 64));
    const b = Math.min(3, Math.floor(rgba[i + 2] / 64));
    const key = (r << 4) | (g << 2) | b;

    let index = paletteMap.get(key);
    if (index === undefined) {
      if (palette.length < 64) {
        index = palette.length;
        palette.push([r * 85, g * 85, b * 85]);
        paletteMap.set(key, index);
      } else {
        index = key % 64;
      }
    }
    indexedPixels.push(index);
  }

  while (palette.length < 64) {
    palette.push([0, 0, 0]);
  }

  return { indexedPixels, palette };
}

function encodeLzwData(output: number[], indexedPixels: number[], minCodeSize: number) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;

  output.push(minCodeSize); // Minimum code size

  // Simple uncompressed sub-block stream format with clear & EOI
  const subBlock: number[] = [];
  let curBit = 0;
  let curVal = 0;
  let codeSize = minCodeSize + 1;

  const emitCode = (code: number) => {
    curVal |= code << curBit;
    curBit += codeSize;
    while (curBit >= 8) {
      subBlock.push(curVal & 0xff);
      curVal >>= 8;
      curBit -= 8;
      if (subBlock.length === 254) {
        output.push(subBlock.length);
        writeBytes(output, subBlock);
        subBlock.length = 0;
      }
    }
  };

  emitCode(clearCode);

  let dict = new Map<string, number>();
  let nextCode = eoiCode + 1;

  let currentPrefix = "";
  for (let i = 0; i < indexedPixels.length; i++) {
    const pixel = indexedPixels[i];
    const combined = currentPrefix === "" ? `${pixel}` : `${currentPrefix},${pixel}`;

    if (dict.has(combined)) {
      currentPrefix = combined;
    } else {
      if (currentPrefix === "") {
        emitCode(pixel);
      } else {
        const code = dict.get(currentPrefix) ?? parseInt(currentPrefix, 10);
        emitCode(code);
      }

      if (nextCode < 4096) {
        dict.set(combined, nextCode++);
        if (nextCode > (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        emitCode(clearCode);
        dict.clear();
        nextCode = eoiCode + 1;
        codeSize = minCodeSize + 1;
      }

      currentPrefix = `${pixel}`;
    }
  }

  if (currentPrefix !== "") {
    const code = dict.get(currentPrefix) ?? parseInt(currentPrefix, 10);
    emitCode(code);
  }

  emitCode(eoiCode);

  if (curBit > 0) {
    subBlock.push(curVal & 0xff);
  }

  if (subBlock.length > 0) {
    output.push(subBlock.length);
    writeBytes(output, subBlock);
  }

  output.push(0x00); // Block terminator
}

function writeBytes(target: number[], src: number[]) {
  for (let i = 0; i < src.length; i++) {
    target.push(src[i]);
  }
}

function writeUint16(target: number[], val: number) {
  target.push(val & 0xff);
  target.push((val >> 8) & 0xff);
}

function stringToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
}

/**
 * -------------------------------------------------------------
 * 4. SUBTITLE CONVERTERS (SRT <-> VTT)
 * -------------------------------------------------------------
 */

export interface SubtitleCue {
  id: number;
  start: string;
  end: string;
  text: string;
}

/**
 * Converts SubRip (.srt) to WebVTT (.vtt)
 */
export function convertSrtToVtt(srtContent: string): { vtt: string; cueCount: number } {
  const cleaned = srtContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const blocks = cleaned.split(/\n\s*\n/);
  let vtt = "WEBVTT\n\n";
  let count = 0;

  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length === 0) continue;

    // Find timestamp line
    let timeLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("-->")) {
        timeLineIdx = i;
        break;
      }
    }

    if (timeLineIdx === -1) continue;

    const timeLine = lines[timeLineIdx];
    // Replace commas with dots in timestamps: 00:01:23,456 --> 00:01:25,789
    const convertedTime = timeLine.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
    const textLines = lines.slice(timeLineIdx + 1).join("\n");

    vtt += `${convertedTime}\n${textLines}\n\n`;
    count++;
  }

  return { vtt: vtt.trim(), cueCount: count };
}

/**
 * Converts WebVTT (.vtt) to SubRip (.srt)
 */
export function convertVttToSrt(vttContent: string): { srt: string; cueCount: number } {
  let cleaned = vttContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  // Strip WEBVTT header and comments/regions
  cleaned = cleaned.replace(/^WEBVTT[^\n]*\n+/i, "");
  cleaned = cleaned.replace(/^NOTE[^\n]*\n+/gm, "");
  cleaned = cleaned.replace(/^STYLE[^\n]*\n[\s\S]*?\n\n/gm, "");

  const blocks = cleaned.split(/\n\s*\n/);
  let srt = "";
  let cueNumber = 1;

  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length === 0) continue;

    let timeLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("-->")) {
        timeLineIdx = i;
        break;
      }
    }

    if (timeLineIdx === -1) continue;

    let timeLine = lines[timeLineIdx];
    // Strip WebVTT positioning cues (e.g. line:0% position:50% align:middle)
    timeLine = timeLine.replace(/ align:\S+| line:\S+| position:\S+| size:\S+/g, "");
    // Replace dots with commas: 00:01:23.456 --> 00:01:25.789
    let convertedTime = timeLine.replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})/g, "$1,$2");
    // Handle short timestamps 01:23.456 => 00:01:23,456
    convertedTime = convertedTime.replace(/(^|\s)(\d{2}:\d{2})\.(\d{3})/g, "$100:$2,$3");

    const textLines = lines.slice(timeLineIdx + 1).join("\n");

    srt += `${cueNumber}\n${convertedTime}\n${textLines}\n\n`;
    cueNumber++;
  }

  return { srt: srt.trim(), cueCount: cueNumber - 1 };
}

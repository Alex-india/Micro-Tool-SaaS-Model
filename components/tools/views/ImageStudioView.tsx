"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Input } from "@/components/ui/Input";
import { Dropzone } from "@/components/ui/Dropzone";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  Download,
  Sparkles,
  Sliders,
  RefreshCw,
  Lock,
  Unlock,
  Palette,
  Copy,
  Check,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Pipette,
  ShieldCheck,
  ShieldAlert,
  FileText,
  CheckCircle2,
  AlertCircle,
  Layers,
  ZoomIn,
  Eye,
  SlidersHorizontal,
  Package,
  Info,
} from "lucide-react";

// ==========================================
// BINARY UTILITIES: CRC-32 & METADATA PATCHING
// ==========================================

const makeCRCTable = (): number[] => {
  let c: number;
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
};

const CRC_TABLE = makeCRCTable();

function crc32(buf: Uint8Array, offset: number, len: number): number {
  let crc = 0xffffffff;
  for (let i = 0; i < len; i++) {
    crc = CRC_TABLE[(crc ^ buf[offset + i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function patchJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  const dpiHigh = (dpi >> 8) & 0xff;
  const dpiLow = dpi & 0xff;

  // If JFIF APP0 exists right after SOI (offset 2)
  if (bytes[2] === 0xff && bytes[3] === 0xe0) {
    const result = new Uint8Array(bytes);
    result[13] = 1; // 1 = dots per inch
    result[14] = dpiHigh;
    result[15] = dpiLow;
    result[16] = dpiHigh;
    result[17] = dpiLow;
    return result;
  }

  // If no APP0 header exists (e.g. phone camera Exif-only photos), inject standard 18-byte JFIF
  const jfifHeader = new Uint8Array([
    0xff, 0xe0, // APP0
    0x00, 0x10, // Length: 16 bytes
    0x4a, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
    0x01, 0x01, // Version 1.1
    0x01, // Units: 1 = dots per inch
    dpiHigh, dpiLow, // Xdensity
    dpiHigh, dpiLow, // Ydensity
    0x00, 0x00, // Xthumbnail, Ythumbnail
  ]);

  const output = new Uint8Array(bytes.length + jfifHeader.length);
  output.set(bytes.subarray(0, 2), 0);
  output.set(jfifHeader, 2);
  output.set(bytes.subarray(2), 2 + jfifHeader.length);
  return output;
}

function patchPngDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) return bytes;

  const ppm = Math.round(dpi * 39.3701);
  const ppmBytes = new Uint8Array([
    (ppm >> 24) & 0xff,
    (ppm >> 16) & 0xff,
    (ppm >> 8) & 0xff,
    ppm & 0xff,
  ]);

  const chunkTypeAndData = new Uint8Array(4 + 9);
  chunkTypeAndData[0] = 0x70; // 'p'
  chunkTypeAndData[1] = 0x48; // 'H'
  chunkTypeAndData[2] = 0x59; // 'Y'
  chunkTypeAndData[3] = 0x73; // 's'
  chunkTypeAndData.set(ppmBytes, 4);
  chunkTypeAndData.set(ppmBytes, 8);
  chunkTypeAndData[12] = 1; // 1 = meters

  const crc = crc32(chunkTypeAndData, 0, chunkTypeAndData.length);
  const crcBytes = new Uint8Array([
    (crc >> 24) & 0xff,
    (crc >> 16) & 0xff,
    (crc >> 8) & 0xff,
    crc & 0xff,
  ]);

  const fullPhysChunk = new Uint8Array(4 + 13 + 4);
  fullPhysChunk[0] = 0x00;
  fullPhysChunk[1] = 0x00;
  fullPhysChunk[2] = 0x00;
  fullPhysChunk[3] = 0x09; // Length = 9
  fullPhysChunk.set(chunkTypeAndData, 4);
  fullPhysChunk.set(crcBytes, 17);

  // Locate insertion point before IDAT or existing pHYs
  let insertIndex = -1;
  let pos = 8;
  while (pos < bytes.length - 8) {
    const len = (bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    if (type === "IDAT" || type === "pHYs") {
      insertIndex = pos;
      break;
    }
    pos += 8 + len + 4;
  }

  if (insertIndex === -1) insertIndex = 33;

  let existingPhysLen = 0;
  if (
    bytes[insertIndex + 4] === 0x70 &&
    bytes[insertIndex + 5] === 0x48 &&
    bytes[insertIndex + 6] === 0x59 &&
    bytes[insertIndex + 7] === 0x73
  ) {
    const len = (bytes[insertIndex] << 24) | (bytes[insertIndex + 1] << 16) | (bytes[insertIndex + 2] << 8) | bytes[insertIndex + 3];
    existingPhysLen = 8 + len + 4;
  }

  const output = new Uint8Array(bytes.length - existingPhysLen + fullPhysChunk.length);
  output.set(bytes.subarray(0, insertIndex), 0);
  output.set(fullPhysChunk, insertIndex);
  output.set(bytes.subarray(insertIndex + existingPhysLen), insertIndex + fullPhysChunk.length);
  return output;
}

// Native ICO Binary Encoder
async function createIcoBundle(images: { size: number; pngBlob: Blob }[]): Promise<Blob> {
  const buffers: Uint8Array[] = [];
  for (const img of images) {
    const buf = new Uint8Array(await img.pngBlob.arrayBuffer());
    buffers.push(buf);
  }

  const count = images.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = headerSize + count * dirEntrySize;

  let totalSize = dirSize;
  for (const b of buffers) {
    totalSize += b.length;
  }

  const ico = new Uint8Array(totalSize);
  const view = new DataView(ico.buffer);

  // ICONDIR
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true); // 1 = ICO
  view.setUint16(4, count, true);

  let currentOffset = dirSize;
  for (let i = 0; i < count; i++) {
    const size = images[i].size;
    const entryOffset = headerSize + i * dirEntrySize;
    const bWidth = size >= 256 ? 0 : size;
    const bHeight = size >= 256 ? 0 : size;

    ico[entryOffset + 0] = bWidth;
    ico[entryOffset + 1] = bHeight;
    ico[entryOffset + 2] = 0;
    ico[entryOffset + 3] = 0;
    view.setUint16(entryOffset + 4, 1, true); // Planes
    view.setUint16(entryOffset + 6, 32, true); // Bits per pixel
    view.setUint32(entryOffset + 8, buffers[i].length, true);
    view.setUint32(entryOffset + 12, currentOffset, true);

    ico.set(buffers[i], currentOffset);
    currentOffset += buffers[i].length;
  }

  return new Blob([ico], { type: "image/x-icon" });
}

// RGB to CMYK Approximation
function rgbToCmyk(r: number, g: number, b: number) {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = Math.round(((1 - rNorm - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gNorm - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bNorm - k) / (1 - k)) * 100);
  return { c, m, y, k: Math.round(k * 100) };
}

// RGB to HSL
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// EXIF / Metadata Scanner
interface MetadataScanResult {
  hasExif: boolean;
  hasGps: boolean;
  hasJfif: boolean;
  hasIptc: boolean;
  detectedTags: string[];
}

function scanImageMetadata(bytes: Uint8Array): MetadataScanResult {
  const result: MetadataScanResult = {
    hasExif: false,
    hasGps: false,
    hasJfif: false,
    hasIptc: false,
    detectedTags: [],
  };

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset < bytes.length - 4) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1];
      const len = (bytes[offset + 2] << 8) | bytes[offset + 3];

      if (marker === 0xe0) {
        result.hasJfif = true;
        result.detectedTags.push("JFIF Density & Resolution Marker");
      } else if (marker === 0xe1) {
        result.hasExif = true;
        result.detectedTags.push("EXIF Camera & Device Metadata");
        for (let i = offset + 4; i < Math.min(bytes.length - 4, offset + 4 + len - 4); i++) {
          if (
            (bytes[i] === 0x47 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x53) ||
            (bytes[i] === 0x00 && bytes[i + 1] === 0x02 && bytes[i + 2] === 0x00)
          ) {
            result.hasGps = true;
            result.detectedTags.push("GPS Coordinates & Location Tag");
            break;
          }
        }
      } else if (marker === 0xed) {
        result.hasIptc = true;
        result.detectedTags.push("IPTC Author & Copyright Tags");
      }
      offset += 2 + len;
    }
  } else if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    let offset = 8;
    while (offset < bytes.length - 8) {
      const len = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
      const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
      if (type === "tEXt" || type === "iTXt" || type === "zTXt") {
        result.detectedTags.push(`PNG Text Chunk (${type})`);
      } else if (type === "eXIf") {
        result.hasExif = true;
        result.detectedTags.push("PNG Embedded EXIF Block");
      }
      offset += 8 + len + 4;
    }
  }

  return result;
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export interface ImageStudioViewProps {
  tool: ToolMeta;
}

export const ImageStudioView: React.FC<ImageStudioViewProps> = ({ tool }) => {
  const slug = tool.slug;

  // Tool Type Detection
  const isCropper = slug === "image-cropper";
  const isRotator = slug === "image-rotator";
  const isColorPicker = slug === "color-picker";
  const isPalette = slug === "color-palette";
  const isFavicon = slug === "favicon-generator";
  const isMetadataRemover = slug === "image-metadata-remover";
  const isImageToPdf = slug === "image-to-pdf";
  const isDpiConverter = slug === "image-dpi-converter";

  // Auto detect format from slug
  let initialFormat = "image/jpeg";
  if (slug.includes("to-png") || slug.includes("png")) initialFormat = "image/png";
  else if (slug.includes("to-webp") || slug.includes("webp")) initialFormat = "image/webp";
  else if (slug.includes("to-jpg") || slug.includes("jpg")) initialFormat = "image/jpeg";

  // Standard Image Studio States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [processedUrl, setProcessedUrl] = useState<string>("");
  const [quality, setQuality] = useState<number>(85);
  const [targetWidth, setTargetWidth] = useState<number>(1200);
  const [targetHeight, setTargetHeight] = useState<number>(800);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(true);
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number>(1.5);
  const [outputFormat, setOutputFormat] = useState<string>(initialFormat);
  const [filterMode, setFilterMode] = useState<string>("none");
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [copiedColor, setCopiedColor] = useState<string>("");

  // Specialized: Rotator State
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Specialized: Cropper State
  const [cropPreset, setCropPreset] = useState<string>("free");
  const [cropXPercent, setCropXPercent] = useState<number>(10);
  const [cropYPercent, setCropYPercent] = useState<number>(10);
  const [cropWPercent, setCropWPercent] = useState<number>(80);
  const [cropHPercent, setCropHPercent] = useState<number>(80);

  // Specialized: Color Picker State
  const [hoveredColor, setHoveredColor] = useState<{ hex: string; r: number; g: number; b: number } | null>(null);
  const [pinnedColor, setPinnedColor] = useState<{ hex: string; r: number; g: number; b: number } | null>(null);
  const [colorHistory, setColorHistory] = useState<string[]>([]);
  const [loupePos, setLoupePos] = useState<{ x: number; y: number } | null>(null);

  // Specialized: Favicon Generator State
  const [faviconBlobs, setFaviconBlobs] = useState<{ size: number; url: string; blob: Blob }[]>([]);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Specialized: Metadata Remover State
  const [metadataScan, setMetadataScan] = useState<MetadataScanResult | null>(null);
  const [isMetadataCleaned, setIsMetadataCleaned] = useState<boolean>(false);

  // Specialized: Image to PDF State
  const [pdfOrientation, setPdfOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
  const [pdfMargin, setPdfMargin] = useState<"none" | "small" | "standard">("small");
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Specialized: DPI Converter State
  const [targetDpi, setTargetDpi] = useState<number>(300);
  const [isDpiProcessed, setIsDpiProcessed] = useState<boolean>(false);

  const imgElementRef = useRef<HTMLImageElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  // ==========================================
  // CORE CANVAS PROCESSING
  // ==========================================

  const processImage = useCallback(
    (
      q: number,
      w: number,
      h: number,
      fmt: string,
      filter: string,
      rot: number = 0,
      fH: boolean = false,
      fV: boolean = false
    ) => {
      if (!imgElementRef.current) return;
      setIsProcessing(true);

      const img = imgElementRef.current;
      const canvas = document.createElement("canvas");

      // Handle Rotator Dimension Swapping
      const is90or270 = rot === 90 || rot === 270;
      const canvasW = is90or270 ? Math.max(10, Math.round(h)) : Math.max(10, Math.round(w));
      const canvasH = is90or270 ? Math.max(10, Math.round(w)) : Math.max(10, Math.round(h));

      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Apply CSS filters
      if (filter === "grayscale") ctx.filter = "grayscale(100%)";
      else if (filter === "sepia") ctx.filter = "sepia(100%)";
      else if (filter === "invert") ctx.filter = "invert(100%)";
      else if (filter === "high-contrast") ctx.filter = "contrast(150%) brightness(110%)";
      else ctx.filter = "none";

      // Transform & Rotate
      ctx.save();
      ctx.translate(canvasW / 2, canvasH / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.scale(fH ? -1 : 1, fV ? -1 : 1);

      const drawW = Math.max(10, Math.round(w));
      const drawH = Math.max(10, Math.round(h));
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setCompressedSize(blob.size);
            if (processedUrl) URL.revokeObjectURL(processedUrl);
            const processed = URL.createObjectURL(blob);
            setProcessedUrl(processed);
          }
          setIsProcessing(false);
        },
        fmt,
        q / 100
      );
    },
    [processedUrl]
  );

  // Extract Dominant Colors for Palette
  const extractDominantColors = (img: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, 100, 100);
    const data = ctx.getImageData(0, 0, 100, 100).data;
    const colors: string[] = [];

    for (let i = 0; i < data.length; i += 400) {
      const r = data[i].toString(16).padStart(2, "0");
      const g = data[i + 1].toString(16).padStart(2, "0");
      const b = data[i + 2].toString(16).padStart(2, "0");
      const hex = `#${r}${g}${b}`.toUpperCase();
      if (!colors.includes(hex) && colors.length < 8) {
        colors.push(hex);
      }
    }
    setExtractedColors(colors);
  };

  // Generate All Favicon Sizes
  const generateFaviconPackage = async (img: HTMLImageElement) => {
    const sizes = [16, 32, 48, 180, 192, 512];
    const generated: { size: number; url: string; blob: Blob }[] = [];

    for (const size of sizes) {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, size, size);
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
        if (blob) {
          generated.push({
            size,
            url: URL.createObjectURL(blob),
            blob,
          });
        }
      }
    }
    setFaviconBlobs(generated);
  };

  // Handle File Drop
  const handleFilesDropped = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setOriginalSize(file.size);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setProcessedUrl("");
      setIsMetadataCleaned(false);
      setIsDpiProcessed(false);
      setGeneratedPdfBlob(null);

      // Binary Metadata Pre-Scan
      try {
        const arrayBuf = await file.arrayBuffer();
        const scan = scanImageMetadata(new Uint8Array(arrayBuf));
        setMetadataScan(scan);
      } catch (e) {
        console.error("Metadata scan error:", e);
      }

      const img = new Image();
      img.onload = () => {
        imgElementRef.current = img;
        const ar = img.width / (img.height || 1);
        setOriginalAspectRatio(ar);
        setTargetWidth(img.width);
        setTargetHeight(img.height);
        extractDominantColors(img);

        if (isFavicon) {
          generateFaviconPackage(img);
        }

        processImage(quality, img.width, img.height, outputFormat, filterMode, rotationAngle, flipH, flipV);
      };
      img.src = url;
    }
  };

  // ==========================================
  // SPECIALIZED TOOL HANDLERS
  // ==========================================

  // 1. Image Rotator Actions
  const handleRotate = (deg: number) => {
    const nextRot = (rotationAngle + deg + 360) % 360;
    setRotationAngle(nextRot);
    if (imgElementRef.current) {
      processImage(quality, targetWidth, targetHeight, outputFormat, filterMode, nextRot, flipH, flipV);
    }
  };

  const handleFlipHorizontal = () => {
    const next = !flipH;
    setFlipH(next);
    if (imgElementRef.current) {
      processImage(quality, targetWidth, targetHeight, outputFormat, filterMode, rotationAngle, next, flipV);
    }
  };

  const handleFlipVertical = () => {
    const next = !flipV;
    setFlipV(next);
    if (imgElementRef.current) {
      processImage(quality, targetWidth, targetHeight, outputFormat, filterMode, rotationAngle, flipH, next);
    }
  };

  // 2. Image Cropper Actions with Precise Display-to-Natural Coordinate Scaling
  const handleCropPreset = (preset: string) => {
    setCropPreset(preset);
    if (preset === "1:1") {
      setCropWPercent(60);
      setCropHPercent(60);
    } else if (preset === "16:9") {
      setCropWPercent(80);
      setCropHPercent(45);
    } else if (preset === "4:3") {
      setCropWPercent(80);
      setCropHPercent(60);
    } else if (preset === "9:16") {
      setCropWPercent(45);
      setCropHPercent(80);
    }
  };

  const executeCrop = (triggerDownload: boolean = true) => {
    if (!imgElementRef.current) return;
    setIsProcessing(true);
    const img = imgElementRef.current;

    const natW = img.naturalWidth || img.width;
    const natH = img.naturalHeight || img.height;

    // Convert percentages to natural image coordinates
    const cropX = Math.round((cropXPercent / 100) * natW);
    const cropY = Math.round((cropYPercent / 100) * natH);
    const cropW = Math.max(10, Math.round((cropWPercent / 100) * natW));
    const cropH = Math.max(10, Math.round((cropHPercent / 100) * natH));

    const canvas = document.createElement("canvas");
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCompressedSize(blob.size);
          if (processedUrl) URL.revokeObjectURL(processedUrl);
          const processed = URL.createObjectURL(blob);
          setProcessedUrl(processed);

          if (triggerDownload) {
            const a = document.createElement("a");
            a.href = processed;
            let ext = "jpg";
            if (outputFormat === "image/png") ext = "png";
            if (outputFormat === "image/webp") ext = "webp";
            const baseName = selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, "") : "image";
            a.download = `toolverse-cropped-${baseName}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }
        setIsProcessing(false);
      },
      outputFormat,
      quality / 100
    );
  };

  // 3. Color Picker Canvas Interaction
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgElementRef.current || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const img = imgElementRef.current;
    const natW = img.naturalWidth || img.width;
    const natH = img.naturalHeight || img.height;

    // Display to Natural scaling
    const scaleX = natW / rect.width;
    const scaleY = natH / rect.height;

    const natX = Math.floor(clientX * scaleX);
    const natY = Math.floor(clientY * scaleY);

    if (natX < 0 || natX >= natW || natY < 0 || natY >= natH) {
      setHoveredColor(null);
      setLoupePos(null);
      return;
    }

    // Sample pixel from hidden canvas
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 1;
    sampleCanvas.height = 1;
    const ctx = sampleCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, natX, natY, 1, 1, 0, 0, 1, 1);
    const pixel = ctx.getImageData(0, 0, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();

    setHoveredColor({ hex, r, g, b });
    setLoupePos({ x: clientX, y: clientY });
  };

  const handleCanvasClick = () => {
    if (hoveredColor) {
      setPinnedColor(hoveredColor);
      if (!colorHistory.includes(hoveredColor.hex)) {
        setColorHistory((prev) => [hoveredColor.hex, ...prev.slice(0, 7)]);
      }
    }
  };

  const handleEyeDropperApi = async () => {
    if ("EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        const hex = result.sRGBHex.toUpperCase();
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        setPinnedColor({ hex, r, g, b });
        if (!colorHistory.includes(hex)) {
          setColorHistory((prev) => [hex, ...prev.slice(0, 7)]);
        }
      } catch (err) {
        console.log("EyeDropper canceled or failed");
      }
    }
  };

  // 4. Favicon Package ZIP Export
  const downloadFaviconZip = async () => {
    if (faviconBlobs.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Create multi-size .ICO file for 16, 32, 48
      const icoSizes = faviconBlobs.filter((f) => [16, 32, 48].includes(f.size)).map((f) => ({ size: f.size, pngBlob: f.blob }));
      if (icoSizes.length > 0) {
        const icoBlob = await createIcoBundle(icoSizes);
        zip.file("favicon.ico", icoBlob);
      }

      // Add individual PNGs
      for (const item of faviconBlobs) {
        if (item.size === 180) {
          zip.file("apple-touch-icon.png", item.blob);
        } else if (item.size === 192) {
          zip.file("android-chrome-192x192.png", item.blob);
        } else if (item.size === 512) {
          zip.file("android-chrome-512x512.png", item.blob);
        } else {
          zip.file(`favicon-${item.size}x${item.size}.png`, item.blob);
        }
      }

      // HTML Code snippet
      const htmlSnippet = `<!-- ToolVerse Favicon Package -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;
      zip.file("favicon-html-code.html", htmlSnippet);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(zipBlob);
      a.download = "toolverse-favicon-package.zip";
      a.click();
    } catch (e) {
      console.error("ZIP Generation error:", e);
    } finally {
      setIsZipping(false);
    }
  };

  // 5. Image to PDF Generation using pdf-lib
  const handleGeneratePdf = async () => {
    if (!imgElementRef.current || !selectedFile) return;
    setIsGeneratingPdf(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const img = imgElementRef.current;

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context creation failed");
      ctx.drawImage(img, 0, 0);

      const pngBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!pngBlob) throw new Error("PNG conversion failed");
      const pngBytes = await pngBlob.arrayBuffer();
      const embeddedImage = await pdfDoc.embedPng(pngBytes);

      const imgW = embeddedImage.width;
      const imgH = embeddedImage.height;

      let pageWidth = 595.28; // A4 Portrait
      let pageHeight = 841.89;

      if (pdfOrientation === "auto") {
        if (imgW > imgH) {
          pageWidth = 841.89;
          pageHeight = 595.28;
        }
      } else if (pdfOrientation === "landscape") {
        pageWidth = 841.89;
        pageHeight = 595.28;
      }

      let margin = 0;
      if (pdfMargin === "small") margin = 20;
      if (pdfMargin === "standard") margin = 40;

      const usableW = pageWidth - 2 * margin;
      const usableH = pageHeight - 2 * margin;
      const scale = Math.min(usableW / imgW, usableH / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const drawX = margin + (usableW - drawW) / 2;
      const drawY = margin + (usableH - drawH) / 2;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      setGeneratedPdfBlob(blob);

      // Auto trigger download
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `toolverse-${selectedFile.name.replace(/\.[^/.]+$/, "")}.pdf`;
      a.click();
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 6. Image DPI Converter: Header-Only Manipulation (Zero Pixel Resampling)
  const handleConvertDpi = async () => {
    if (!selectedFile || !imgElementRef.current) return;
    setIsProcessing(true);
    try {
      const isPng = selectedFile.type === "image/png" || outputFormat === "image/png";
      const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());

      let outputBytes: Uint8Array;
      let mimeType = selectedFile.type || "image/jpeg";
      let ext = "jpg";

      if (isPng) {
        outputBytes = patchPngDpi(fileBytes, targetDpi);
        mimeType = "image/png";
        ext = "png";
      } else {
        outputBytes = patchJpegDpi(fileBytes, targetDpi);
        mimeType = "image/jpeg";
        ext = "jpg";
      }

      const blob = new Blob([outputBytes as unknown as BlobPart], { type: mimeType });
      const dlUrl = URL.createObjectURL(blob);
      setIsDpiProcessed(true);

      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = `toolverse-${targetDpi}dpi-${selectedFile.name.replace(/\.[^/.]+$/, "")}.${ext}`;
      a.click();
    } catch (err) {
      console.error("DPI conversion error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 7. Image Metadata Remover: 100% Cleansed Download
  const handleCleanMetadataDownload = () => {
    if (!imgElementRef.current || !selectedFile) return;
    setIsProcessing(true);

    const img = imgElementRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    ctx.drawImage(img, 0, 0);

    const isPng = selectedFile.type === "image/png";
    const mime = isPng ? "image/png" : "image/jpeg";
    const ext = isPng ? "png" : "jpg";

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setIsMetadataCleaned(true);
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `toolverse-clean-private-${selectedFile.name.replace(/\.[^/.]+$/, "")}.${ext}`;
          a.click();
        }
        setIsProcessing(false);
      },
      mime,
      0.95
    );
  };

  // Standard Download Handler
  const handleDownload = () => {
    if (isImageToPdf) {
      handleGeneratePdf();
      return;
    }
    if (isDpiConverter) {
      handleConvertDpi();
      return;
    }
    if (isMetadataRemover) {
      handleCleanMetadataDownload();
      return;
    }
    if (isCropper) {
      executeCrop(true);
      return;
    }
    if (!processedUrl && !previewUrl) return;

    const a = document.createElement("a");
    a.href = processedUrl || previewUrl;
    let ext = "jpg";
    if (outputFormat === "image/png") ext = "png";
    if (outputFormat === "image/webp") ext = "webp";
    a.download = `toolverse-${tool.slug}-optimized.${ext}`;
    a.click();
  };

  // Standard Dimension Controls
  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (aspectRatioLocked && originalAspectRatio > 0) {
      const h = Math.round(val / originalAspectRatio);
      setTargetHeight(h);
      processImage(quality, val, h, outputFormat, filterMode, rotationAngle, flipH, flipV);
    } else {
      processImage(quality, val, targetHeight, outputFormat, filterMode, rotationAngle, flipH, flipV);
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (aspectRatioLocked && originalAspectRatio > 0) {
      const w = Math.round(val * originalAspectRatio);
      setTargetWidth(w);
      processImage(quality, w, val, outputFormat, filterMode, rotationAngle, flipH, flipV);
    } else {
      processImage(quality, targetWidth, val, outputFormat, filterMode, rotationAngle, flipH, flipV);
    }
  };

  const handleQualityChange = (val: number) => {
    setQuality(val);
    processImage(val, targetWidth, targetHeight, outputFormat, filterMode, rotationAngle, flipH, flipV);
  };

  const handleFormatChange = (fmt: string) => {
    setOutputFormat(fmt);
    processImage(quality, targetWidth, targetHeight, fmt, filterMode, rotationAngle, flipH, flipV);
  };

  const handleFilterChange = (flt: string) => {
    setFilterMode(flt);
    processImage(quality, targetWidth, targetHeight, outputFormat, flt, rotationAngle, flipH, flipV);
  };

  const savingsPercent =
    originalSize > 0 && compressedSize > 0
      ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
      : 0;

  // Active color for color picker
  const activeColor = pinnedColor || hoveredColor;
  const cmykVals = activeColor ? rgbToCmyk(activeColor.r, activeColor.g, activeColor.b) : null;
  const hslVals = activeColor ? rgbToHsl(activeColor.r, activeColor.g, activeColor.b) : null;

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Specialized Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          <Dropzone
            accept="image/*,.jpg,.jpeg,.png,.webp,.svg,.avif"
            maxFiles={1}
            onDrop={handleFilesDropped}
            helperText={`Drop image here to ${tool.name.toLowerCase()}`}
          />

          {selectedFile && (
            <div className="flex flex-col gap-5 pt-4 border-t border-border">
              {/* ------------------------------------------------ */}
              {/* TOOL 1: IMAGE CROPPER SPECIALIZED CONTROLS      */}
              {/* ------------------------------------------------ */}
              {isCropper && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Crop className="w-4 h-4 text-accent" /> Aspect Ratio Presets
                    </span>
                    <span className="text-[11px] font-mono text-accent font-semibold">{cropPreset.toUpperCase()}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "free", label: "Free" },
                      { id: "1:1", label: "1:1 Square" },
                      { id: "16:9", label: "16:9 YT" },
                      { id: "4:3", label: "4:3 Standard" },
                      { id: "9:16", label: "9:16 Reel" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleCropPreset(p.id)}
                        className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                          cropPreset === p.id
                            ? "bg-accent/15 border-accent text-accent font-bold"
                            : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Crop Sliders */}
                  <div className="flex flex-col gap-3 pt-2">
                    <Slider
                      label="Crop Width"
                      min={10}
                      max={100}
                      step={1}
                      value={cropWPercent}
                      unit="%"
                      onChangeValue={setCropWPercent}
                    />
                    <Slider
                      label="Crop Height"
                      min={10}
                      max={100}
                      step={1}
                      value={cropHPercent}
                      unit="%"
                      onChangeValue={setCropHPercent}
                    />
                    <Slider
                      label="Horizontal Offset (X)"
                      min={0}
                      max={100 - cropWPercent}
                      step={1}
                      value={cropXPercent}
                      unit="%"
                      onChangeValue={setCropXPercent}
                    />
                    <Slider
                      label="Vertical Offset (Y)"
                      min={0}
                      max={100 - cropHPercent}
                      step={1}
                      value={cropYPercent}
                      unit="%"
                      onChangeValue={setCropYPercent}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button variant="secondary" size="md" onClick={() => executeCrop(false)} leftIcon={<Eye className="w-4 h-4" />}>
                      Preview Crop
                    </Button>
                    <Button variant="primary" size="md" onClick={() => executeCrop(true)} leftIcon={<Download className="w-4 h-4" />}>
                      Crop & Download
                    </Button>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------ */}
              {/* TOOL 2: IMAGE ROTATOR SPECIALIZED CONTROLS      */}
              {/* ------------------------------------------------ */}
              {isRotator && (
                <div className="flex flex-col gap-4">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <RotateCw className="w-4 h-4 text-accent" /> Rotation & Flip Controls
                  </span>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRotate(90)}
                      leftIcon={<RotateCw className="w-4 h-4 text-accent" />}
                    >
                      Rotate 90° CW
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRotate(-90)}
                      leftIcon={<RotateCcw className="w-4 h-4 text-accent" />}
                    >
                      Rotate 90° CCW
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRotate(180)}
                      leftIcon={<RefreshCw className="w-4 h-4 text-accent" />}
                    >
                      Rotate 180°
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleFlipHorizontal}
                      leftIcon={<FlipHorizontal className="w-4 h-4 text-accent" />}
                    >
                      Flip Horizontal
                    </Button>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleFlipVertical}
                    leftIcon={<FlipVertical className="w-4 h-4 text-accent" />}
                    className="w-full"
                  >
                    Flip Vertical
                  </Button>

                  <div className="p-3 bg-surface-raised border border-border rounded-lg text-xs flex items-center justify-between">
                    <span className="text-text-secondary">Current Rotation:</span>
                    <span className="font-mono font-bold text-accent">{rotationAngle}°</span>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------ */}
              {/* TOOL 3: COLOR PICKER SPECIALIZED CONTROLS       */}
              {/* ------------------------------------------------ */}
              {isColorPicker && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Pipette className="w-4 h-4 text-accent" /> Interactive Eyedropper
                    </span>
                    {"EyeDropper" in (typeof window !== "undefined" ? window : {}) && (
                      <button
                        type="button"
                        onClick={handleEyeDropperApi}
                        className="text-[11px] text-accent font-semibold flex items-center gap-1 hover:underline"
                      >
                        <Pipette className="w-3.5 h-3.5" /> Browser Pipette
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-text-secondary">
                    Hover or click anywhere on the image preview to sample pixel colors in real-time.
                  </p>

                  {activeColor ? (
                    <div className="flex flex-col gap-3 p-3.5 bg-surface-raised border border-border rounded-xl">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg border-2 border-border shadow-inner"
                          style={{ backgroundColor: activeColor.hex }}
                        />
                        <div className="flex flex-col">
                          <span className="text-base font-mono font-extrabold text-text-primary">
                            {activeColor.hex}
                          </span>
                          <span className="text-[11px] font-mono text-text-secondary">
                            rgb({activeColor.r}, {activeColor.g}, {activeColor.b})
                          </span>
                        </div>
                      </div>

                      {/* Color Code Outputs */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/70 text-xs">
                        <div className="p-2 bg-surface rounded-lg border border-border/60">
                          <span className="text-[10px] text-text-tertiary block">HSL Format</span>
                          <span className="font-mono font-semibold text-text-primary text-[11px]">
                            hsl({hslVals?.h}, {hslVals?.s}%, {hslVals?.l}%)
                          </span>
                        </div>
                        <div className="p-2 bg-surface rounded-lg border border-border/60">
                          <span className="text-[10px] text-text-tertiary block">CMYK (Approx)</span>
                          <span className="font-mono font-semibold text-text-primary text-[11px]">
                            cmyk({cmykVals?.c}%, {cmykVals?.m}%, {cmykVals?.y}%, {cmykVals?.k}%)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
                        <Info className="w-3 h-3 text-accent" />
                        <span>CMYK values are standard mathematical RGB approximations.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-surface-raised border border-border rounded-lg text-center text-xs text-text-tertiary">
                      Click anywhere on the preview image to pin a pixel color.
                    </div>
                  )}

                  {/* Picked Colors History */}
                  {colorHistory.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-border">
                      <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                        Sampled Colors History
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {colorHistory.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(hex);
                              setCopiedColor(hex);
                              setTimeout(() => setCopiedColor(""), 1500);
                            }}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-surface-raised border border-border group hover:border-accent"
                          >
                            <div className="w-full h-5 rounded border border-border/60" style={{ backgroundColor: hex }} />
                            <span className="text-[10px] font-mono text-text-secondary group-hover:text-accent">
                              {copiedColor === hex ? "Copied" : hex}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------ */}
              {/* TOOL 4: FAVICON GENERATOR SPECIALIZED CONTROLS  */}
              {/* ------------------------------------------------ */}
              {isFavicon && (
                <div className="flex flex-col gap-4">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-accent" /> Multi-Size Favicon Package
                  </span>

                  <p className="text-xs text-text-secondary">
                    Automatically renders standard browser favicons, Apple Touch icons, and Android PWA icons.
                  </p>

                  <div className="grid grid-cols-3 gap-2.5">
                    {faviconBlobs.map((f) => (
                      <div
                        key={f.size}
                        className="p-3 bg-surface-raised border border-border rounded-xl flex flex-col items-center gap-2 text-center"
                      >
                        <div className="w-12 h-12 flex items-center justify-center bg-surface border border-border/60 rounded-lg p-1">
                          <img src={f.url} alt={`${f.size}x${f.size}`} className="max-w-full max-h-full object-contain" />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-text-primary">
                          {f.size}x{f.size}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = f.url;
                            a.download = `favicon-${f.size}x${f.size}.png`;
                            a.click();
                          }}
                          className="text-[10px] text-accent font-semibold hover:underline"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={downloadFaviconZip}
                    isLoading={isZipping}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    {isZipping ? "Creating ZIP..." : "Download Full Package (.ZIP)"}
                  </Button>
                </div>
              )}

              {/* ------------------------------------------------ */}
              {/* TOOL 5: METADATA REMOVER SPECIALIZED CONTROLS   */}
              {/* ------------------------------------------------ */}
              {isMetadataRemover && (
                <div className="flex flex-col gap-4">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> EXIF & Privacy Pre-Scan
                  </span>

                  {metadataScan && metadataScan.detectedTags.length > 0 ? (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                        <AlertCircle className="w-4 h-4" /> Detected Hidden Metadata:
                      </div>
                      <ul className="text-[11px] text-text-secondary list-disc pl-4 space-y-1 font-mono">
                        {metadataScan.detectedTags.map((tag, idx) => (
                          <li key={idx}>{tag}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-3 bg-surface-raised border border-border rounded-lg text-xs text-text-secondary flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Ready to strip metadata via high-fidelity clean re-encoding.</span>
                    </div>
                  )}

                  {isMetadataCleaned && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Metadata Sanitized: 100% of EXIF, Camera & GPS tags stripped!</span>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCleanMetadataDownload}
                    leftIcon={<ShieldCheck className="w-4 h-4" />}
                  >
                    Strip Metadata & Download Private Image
                  </Button>
                </div>
              )}

              {/* ------------------------------------------------ */}
              {/* TOOL 6: IMAGE TO PDF SPECIALIZED CONTROLS       */}
              {/* ------------------------------------------------ */}
              {isImageToPdf && (
                <div className="flex flex-col gap-4">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-accent" /> PDF Page Layout Settings
                  </span>

                  <div className="flex flex-col gap-1.5 text-xs font-semibold">
                    <label className="text-text-secondary">Page Orientation</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "auto", label: "Auto Fit" },
                        { id: "portrait", label: "Portrait" },
                        { id: "landscape", label: "Landscape" },
                      ].map((ori) => (
                        <button
                          key={ori.id}
                          type="button"
                          onClick={() => setPdfOrientation(ori.id as any)}
                          className={`p-2 rounded-lg border text-xs transition-colors ${
                            pdfOrientation === ori.id
                              ? "bg-accent/15 border-accent text-accent font-bold"
                              : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
                          }`}
                        >
                          {ori.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs font-semibold">
                    <label className="text-text-secondary">Page Margin</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "none", label: "No Margin" },
                        { id: "small", label: "Small (20pt)" },
                        { id: "standard", label: "Standard (40pt)" },
                      ].map((mar) => (
                        <button
                          key={mar.id}
                          type="button"
                          onClick={() => setPdfMargin(mar.id as any)}
                          className={`p-2 rounded-lg border text-xs transition-colors ${
                            pdfMargin === mar.id
                              ? "bg-accent/15 border-accent text-accent font-bold"
                              : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
                          }`}
                        >
                          {mar.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleGeneratePdf}
                    isLoading={isGeneratingPdf}
                    leftIcon={<FileText className="w-4 h-4" />}
                  >
                    {isGeneratingPdf ? "Building PDF..." : "Convert & Download PDF"}
                  </Button>
                </div>
              )}

              {/* ------------------------------------------------ */}
              {/* TOOL 7: IMAGE DPI CONVERTER SPECIALIZED CONTROLS*/}
              {/* ------------------------------------------------ */}
              {isDpiConverter && (
                <div className="flex flex-col gap-4">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-accent" /> Target Print DPI Metadata
                  </span>

                  <p className="text-xs text-text-secondary">
                    Embeds physical DPI density headers (JFIF for JPEG, pHYs for PNG with CRC-32) without resampling or degrading pixel quality.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { dpi: 72, label: "72 DPI (Web)" },
                      { dpi: 150, label: "150 DPI (Print)" },
                      { dpi: 300, label: "300 DPI (High-Res)" },
                      { dpi: 600, label: "600 DPI (Ultra)" },
                    ].map((item) => (
                      <button
                        key={item.dpi}
                        type="button"
                        onClick={() => setTargetDpi(item.dpi)}
                        className={`p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                          targetDpi === item.dpi
                            ? "bg-accent/15 border-accent text-accent font-bold"
                            : "bg-surface-raised border-border text-text-secondary hover:border-accent/40"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <Input
                    label="Custom DPI Value"
                    type="number"
                    value={targetDpi}
                    onChange={(e) => setTargetDpi(Math.max(10, parseInt(e.target.value, 10) || 72))}
                    suffixSymbol="DPI"
                  />

                  {isDpiProcessed && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Physical DPI header embedded successfully!</span>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleConvertDpi}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Embed {targetDpi} DPI & Download
                  </Button>
                </div>
              )}

              {/* ------------------------------------------------ */}
              {/* STANDARD CONTROLS (For Compressor, Resizer, Formats) */}
              {/* ------------------------------------------------ */}
              {!isCropper && !isRotator && !isColorPicker && !isFavicon && !isMetadataRemover && !isImageToPdf && !isDpiConverter && (
                <>
                  {/* Quality Slider */}
                  <Slider
                    label="Compression Quality"
                    min={10}
                    max={100}
                    step={1}
                    value={quality}
                    unit="%"
                    onChangeValue={handleQualityChange}
                  />

                  {/* Dimensions */}
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-secondary">Image Dimensions (px)</span>
                      <button
                        type="button"
                        onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
                        className="flex items-center gap-1 text-accent font-semibold hover:underline"
                      >
                        {aspectRatioLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        {aspectRatioLocked ? "Locked 16:9" : "Free Scale"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Width"
                        type="number"
                        value={targetWidth}
                        onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 10)}
                        suffixSymbol="px"
                      />
                      <Input
                        label="Height"
                        type="number"
                        value={targetHeight}
                        onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 10)}
                        suffixSymbol="px"
                      />
                    </div>
                  </div>

                  {/* Format selector */}
                  <div className="flex flex-col gap-1.5 text-xs font-semibold">
                    <label className="text-text-secondary">Target Format</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "image/jpeg", label: "JPG / JPEG" },
                        { id: "image/png", label: "PNG" },
                        { id: "image/webp", label: "WebP" },
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => handleFormatChange(fmt.id)}
                          className={`p-2 rounded-lg border text-xs transition-colors ${
                            outputFormat === fmt.id
                              ? "bg-accent/15 border-accent text-accent font-bold"
                              : "bg-surface-raised border-border text-text-secondary"
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter presets */}
                  <div className="flex flex-col gap-1.5 text-xs font-semibold">
                    <label className="text-text-secondary">Filter Preset</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "none", label: "Original" },
                        { id: "grayscale", label: "B&W" },
                        { id: "sepia", label: "Sepia" },
                        { id: "high-contrast", label: "Punchy" },
                        { id: "invert", label: "Inverted" },
                      ].map((flt) => (
                        <button
                          key={flt.id}
                          type="button"
                          onClick={() => handleFilterChange(flt.id)}
                          className={`p-2 rounded-lg border text-xs transition-colors ${
                            filterMode === flt.id
                              ? "bg-accent/15 border-accent text-accent font-bold"
                              : "bg-surface-raised border-border text-text-secondary"
                          }`}
                        >
                          {flt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Palette Extraction */}
                  {extractedColors.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-border">
                      <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-accent" /> Extracted Color Palette
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {extractedColors.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(hex);
                              setCopiedColor(hex);
                              setTimeout(() => setCopiedColor(""), 1500);
                            }}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-surface-raised border border-border group"
                          >
                            <div className="w-full h-6 rounded border border-border/60" style={{ backgroundColor: hex }} />
                            <span className="text-[10px] font-mono text-text-secondary group-hover:text-accent">
                              {copiedColor === hex ? "Copied" : hex}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Preview */}
        <div className="lg:col-span-7 flex flex-col gap-5 bg-surface border border-border rounded-xl p-6 shadow-card sticky top-20">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              {isCropper ? "Crop Area Preview" : isColorPicker ? "Interactive Pixel Canvas" : "Processed Result Preview"}
            </h3>
            {(processedUrl || previewUrl) && !isColorPicker && !isFavicon && (
              <Button variant="primary" size="sm" onClick={handleDownload} leftIcon={<Download className="w-4 h-4" />}>
                {isImageToPdf
                  ? "Download PDF"
                  : isDpiConverter
                  ? "Download DPI Image"
                  : isMetadataRemover
                  ? "Download Clean Image"
                  : isCropper
                  ? "Apply & Download"
                  : "Download Image"}
              </Button>
            )}
          </div>

          <div
            ref={previewContainerRef}
            onMouseMove={isColorPicker ? handleCanvasMouseMove : undefined}
            onClick={isColorPicker ? handleCanvasClick : undefined}
            className={`w-full aspect-video bg-surface-raised border border-border rounded-xl flex items-center justify-center overflow-hidden relative p-2 ${
              isColorPicker ? "cursor-crosshair select-none" : ""
            }`}
          >
            {processedUrl || previewUrl ? (
              <div className="relative max-h-full max-w-full flex items-center justify-center">
                <img
                  src={isCropper ? previewUrl : (processedUrl || previewUrl)}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                />

                {/* Cropper Bounding Box Visual Overlay */}
                {isCropper && (
                  <div
                    className="absolute border-2 border-accent bg-accent/20 rounded shadow-md pointer-events-none transition-all"
                    style={{
                      left: `${cropXPercent}%`,
                      top: `${cropYPercent}%`,
                      width: `${cropWPercent}%`,
                      height: `${cropHPercent}%`,
                    }}
                  >
                    <span className="absolute top-1 left-1.5 bg-accent text-white font-mono text-[9px] px-1 rounded font-bold">
                      {cropWPercent}% x {cropHPercent}%
                    </span>
                  </div>
                )}

                {/* Color Picker Magnifier Loupe */}
                {isColorPicker && loupePos && hoveredColor && (
                  <div
                    className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-full shadow-2xl overflow-hidden flex items-center justify-center"
                    style={{
                      left: `${loupePos.x}px`,
                      top: `${loupePos.y}px`,
                      width: "60px",
                      height: "60px",
                      backgroundColor: hoveredColor.hex,
                    }}
                  >
                    <div className="w-2 h-2 rounded-full border border-white bg-black/40" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-text-tertiary p-6">
                <Sliders className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Upload an image on the left to see live processing</p>
              </div>
            )}
          </div>

          {/* Size Reduction Badge Card for standard tools */}
          {selectedFile && !isColorPicker && !isFavicon && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-surface-raised border border-border rounded-lg text-center">
                <span className="text-[11px] text-text-tertiary block">Original Size</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 block">
                  {(originalSize / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="p-3 bg-surface-raised border border-border rounded-lg text-center">
                <span className="text-[11px] text-text-tertiary block">
                  {isImageToPdf ? "PDF Engine" : isDpiConverter ? "Target DPI" : "Processed Size"}
                </span>
                <span className="text-sm font-bold text-accent mt-0.5 block">
                  {isImageToPdf
                    ? "pdf-lib vector"
                    : isDpiConverter
                    ? `${targetDpi} DPI`
                    : `${(compressedSize / 1024).toFixed(1)} KB`}
                </span>
              </div>
              <div className="p-3 bg-surface-raised border border-border rounded-lg text-center">
                <span className="text-[11px] text-text-tertiary block">Status</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                  {savingsPercent > 0 ? `-${savingsPercent}%` : "Ready"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};

/**
 * Base64 Encoding & Decoding Engine (RFC 4648 & RFC 4648 §5 URL-Safe).
 * Supports arbitrary UTF-8 text, binary files, Data URIs, magic byte detection,
 * hex dump generation, and automatic sanitization.
 */

export interface Base64EncodeOptions {
  urlSafe?: boolean;
  padding?: boolean;
  lineBreaks?: 0 | 64 | 76;
  dataUriPrefix?: boolean;
  mimeType?: string;
}

export interface Base64EncodeResult {
  encodedText: string;
  dataUri: string;
  rawBytesCount: number;
  encodedBytesCount: number;
  expansionPercent: number;
  mimeType: string;
}

export interface Base64DecodeOptions {
  charset?: "utf-8" | "ascii" | "iso-8859-1" | "utf-16le";
}

export interface Base64DecodeResult {
  isValid: boolean;
  error?: string;
  decodedText?: string;
  isBinary: boolean;
  isJson: boolean;
  formattedJson?: string;
  mimeType: string;
  dataUrl?: string;
  rawBytesCount: number;
  decodedBytesCount: number;
  uint8Array?: Uint8Array;
  hexDump?: string;
  fixesApplied: string[];
}

/**
 * Converts a Uint8Array into a standard Base64 string in chunks.
 * Avoids call-stack overflow on large arrays.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Generates an industry-standard Hex Dump of binary bytes.
 */
export function generateHexDump(bytes: Uint8Array, maxBytes = 512): string {
  const lines: string[] = [];
  const len = Math.min(bytes.length, maxBytes);
  for (let i = 0; i < len; i += 16) {
    const chunk = bytes.subarray(i, Math.min(i + 16, len));
    const offset = i.toString(16).padStart(8, "0");

    const hexParts: string[] = [];
    const asciiParts: string[] = [];
    for (let j = 0; j < 16; j++) {
      if (j < chunk.length) {
        const b = chunk[j];
        hexParts.push(b.toString(16).padStart(2, "0").toUpperCase());
        asciiParts.push(b >= 32 && b <= 126 ? String.fromCharCode(b) : ".");
      } else {
        hexParts.push("  ");
        asciiParts.push(" ");
      }
    }

    const hex1 = hexParts.slice(0, 8).join(" ");
    const hex2 = hexParts.slice(8, 16).join(" ");
    lines.push(`${offset}  ${hex1}  ${hex2}  |${asciiParts.join("")}|`);
  }
  if (bytes.length > maxBytes) {
    lines.push(`... (${(bytes.length - maxBytes).toLocaleString()} more bytes not shown)`);
  }
  return lines.join("\n");
}

/**
 * Sanitizes and cleans messy Base64 inputs:
 * - Strips PEM / certificate banners
 * - Strips surrounding quotes
 * - Extracts Base64 from Data URI headers
 * - Strips all internal whitespace and linebreaks
 * - Normalizes URL-Safe Base64URL (- and _) to standard (+ and /)
 * - Restores missing padding (=)
 */
export function sanitizeBase64(input: string): {
  clean: string;
  mimeTypeFromUri?: string;
  fixes: string[];
} {
  const fixes: string[] = [];
  let s = input.trim();
  let mimeTypeFromUri: string | undefined = undefined;

  // 1. Strip PEM / Certificate banners
  if (/-----BEGIN[^-]+-----/.test(s)) {
    s = s.replace(/-----BEGIN[^-]+-----/g, "").replace(/-----END[^-]+-----/g, "");
    fixes.push("Stripped PEM / Certificate headers");
  }

  // 2. Strip surrounding quotes ("..." or '...')
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1);
    fixes.push("Stripped surrounding quotes");
  }

  // 3. Extract payload from Data URI header
  const dataUriMatch = s.match(/^data:(.*?);base64,(.+)$/is);
  if (dataUriMatch) {
    mimeTypeFromUri = dataUriMatch[1] || undefined;
    s = dataUriMatch[2];
    fixes.push(`Extracted payload from Data URI header (${mimeTypeFromUri || "auto"})`);
  }

  // 4. Strip internal whitespace, spaces, newlines, tabs
  const originalLen = s.length;
  s = s.replace(/[\r\n\s\t]/g, "");
  if (s.length !== originalLen) {
    fixes.push("Stripped internal whitespace and newlines");
  }

  // 5. Normalize URL-Safe Base64URL (- and _)
  if (s.includes("-") || s.includes("_")) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    fixes.push("Converted URL-Safe Base64URL characters (- and _) to standard (+ and /)");
  }

  // 6. Restore missing padding (=)
  if (s.length % 4 === 2) {
    s += "==";
    fixes.push("Restored missing double padding (==)");
  } else if (s.length % 4 === 3) {
    s += "=";
    fixes.push("Restored missing single padding (=)");
  }

  return { clean: s, mimeTypeFromUri, fixes };
}

/**
 * Converts a Base64 string into a Uint8Array with error checking.
 */
export function base64ToUint8Array(base64Str: string): {
  bytes: Uint8Array;
  mimeTypeFromUri?: string;
  fixes: string[];
} {
  const { clean, mimeTypeFromUri, fixes } = sanitizeBase64(base64Str);

  if (!clean) {
    return { bytes: new Uint8Array(0), mimeTypeFromUri, fixes };
  }

  // Validate length modulo 4
  if (clean.length % 4 === 1) {
    throw new Error(
      "Invalid Base64 length (modulo 4 equals 1). A single trailing character cannot be decoded into a byte (RFC 4648)."
    );
  }

  // Validate characters
  if (!/^[A-Za-z0-9+/=]+$/.test(clean)) {
    const invalidCharMatch = clean.match(/[^A-Za-z0-9+/=]/);
    const badChar = invalidCharMatch ? invalidCharMatch[0] : "unknown";
    throw new Error(
      `Invalid character '${badChar}' encountered. Standard Base64 only allows A-Z, a-z, 0-9, +, /, and =.`
    );
  }

  try {
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { bytes, mimeTypeFromUri, fixes };
  } catch (e: any) {
    throw new Error(`Failed to decode Base64 string: ${e.message}`);
  }
}

/**
 * Detects MIME type and file extension from binary magic bytes.
 */
export function detectMimeType(bytes: Uint8Array): { mime: string; ext: string } | null {
  if (bytes.length >= 8) {
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return { mime: "image/png", ext: "png" };
    }
  }

  if (bytes.length >= 3) {
    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { mime: "image/jpeg", ext: "jpg" };
    }
  }

  if (bytes.length >= 6) {
    // GIF: GIF87a or GIF89a
    if (
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38 &&
      (bytes[4] === 0x37 || bytes[4] === 0x39) &&
      bytes[5] === 0x61
    ) {
      return { mime: "image/gif", ext: "gif" };
    }
  }

  if (bytes.length >= 12) {
    // WebP: RIFF....WEBP
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return { mime: "image/webp", ext: "webp" };
    }

    // WAV Audio: RIFF....WAVE
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x41 &&
      bytes[10] === 0x56 &&
      bytes[11] === 0x45
    ) {
      return { mime: "audio/wav", ext: "wav" };
    }
  }

  if (bytes.length >= 4) {
    // PDF: %PDF
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return { mime: "application/pdf", ext: "pdf" };
    }

    // ZIP: PK\x03\x04
    if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
      return { mime: "application/zip", ext: "zip" };
    }

    // OGG Audio: OggS
    if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
      return { mime: "audio/ogg", ext: "ogg" };
    }
  }

  if (bytes.length >= 3) {
    // MP3 with ID3 header: ID3
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      return { mime: "audio/mp3", ext: "mp3" };
    }
  }

  if (bytes.length >= 2) {
    // BMP: BM
    if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
      return { mime: "image/bmp", ext: "bmp" };
    }

    // MP3 audio sync frame
    if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
      return { mime: "audio/mp3", ext: "mp3" };
    }
  }

  // Check for SVG
  try {
    const head = new TextDecoder("utf-8", { fatal: false }).decode(
      bytes.subarray(0, Math.min(bytes.length, 256))
    );
    if (head.includes("<svg") || (head.includes("<?xml") && head.includes("<svg"))) {
      return { mime: "image/svg+xml", ext: "svg" };
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Encodes text into Base64 with full UTF-8 support and options.
 */
export function encodeTextToBase64(
  text: string,
  options: Base64EncodeOptions = {}
): Base64EncodeResult {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  return encodeBytesToBase64(bytes, options);
}

/**
 * Encodes a Uint8Array into Base64 with options.
 */
export function encodeBytesToBase64(
  bytes: Uint8Array,
  options: Base64EncodeOptions = {}
): Base64EncodeResult {
  let base64 = uint8ArrayToBase64(bytes);

  // URL-safe substitution
  if (options.urlSafe) {
    base64 = base64.replace(/\+/g, "-").replace(/\//g, "_");
    if (options.padding === false) {
      base64 = base64.replace(/=+$/, "");
    }
  }

  const rawBase64 = base64;

  // Line breaks
  if (options.lineBreaks && options.lineBreaks > 0) {
    const regex = new RegExp(`.{1,${options.lineBreaks}}`, "g");
    const chunks = base64.match(regex);
    if (chunks) {
      base64 = chunks.join("\n");
    }
  }

  const mime = options.mimeType || "text/plain;charset=utf-8";
  const dataUri = `data:${mime};base64,${rawBase64}`;
  const finalOutput = options.dataUriPrefix ? dataUri : base64;

  const rawBytesCount = bytes.length;
  const encodedBytesCount = new TextEncoder().encode(finalOutput).length;
  const expansionPercent =
    rawBytesCount > 0
      ? Math.round(((encodedBytesCount - rawBytesCount) / rawBytesCount) * 100)
      : 0;

  return {
    encodedText: finalOutput,
    dataUri,
    rawBytesCount,
    encodedBytesCount,
    expansionPercent,
    mimeType: mime,
  };
}

/**
 * Decodes Base64 string into plain text, JSON, or binary data.
 */
export function decodeBase64(
  input: string,
  options: Base64DecodeOptions = {}
): Base64DecodeResult {
  if (!input || !input.trim()) {
    return {
      isValid: true,
      decodedText: "",
      isBinary: false,
      isJson: false,
      mimeType: "text/plain;charset=utf-8",
      rawBytesCount: 0,
      decodedBytesCount: 0,
      fixesApplied: [],
    };
  }

  try {
    const { bytes, mimeTypeFromUri, fixes } = base64ToUint8Array(input);
    const magic = detectMimeType(bytes);
    const mimeType = mimeTypeFromUri || (magic ? magic.mime : "text/plain;charset=utf-8");

    let isBinary = false;
    let decodedText: string | undefined = undefined;
    let isJson = false;
    let formattedJson: string | undefined = undefined;

    if (
      magic &&
      (magic.mime.startsWith("image/") ||
        magic.mime.startsWith("audio/") ||
        magic.mime === "application/pdf" ||
        magic.mime === "application/zip")
    ) {
      isBinary = true;
    } else {
      // Decode text using selected charset
      const charset = options.charset || "utf-8";
      try {
        decodedText = new TextDecoder(charset, { fatal: true }).decode(bytes);

        // Check for non-printable binary characters
        let controlChars = 0;
        for (let i = 0; i < Math.min(decodedText.length, 250); i++) {
          const code = decodedText.charCodeAt(i);
          if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
            controlChars++;
          }
        }
        if (controlChars > 3) {
          isBinary = true;
          decodedText = undefined;
        } else {
          // Check if valid JSON
          try {
            const parsed = JSON.parse(decodedText);
            if (typeof parsed === "object" && parsed !== null) {
              isJson = true;
              formattedJson = JSON.stringify(parsed, null, 2);
            }
          } catch {
            isJson = false;
          }
        }
      } catch {
        isBinary = true;
      }
    }

    // Build data URL for preview or download
    const b64 = uint8ArrayToBase64(bytes);
    const dataUrl = `data:${mimeType};base64,${b64}`;
    const hexDump = generateHexDump(bytes);

    return {
      isValid: true,
      decodedText: isBinary ? undefined : decodedText,
      isBinary,
      isJson,
      formattedJson,
      mimeType,
      dataUrl,
      rawBytesCount: input.length,
      decodedBytesCount: bytes.length,
      uint8Array: bytes,
      hexDump,
      fixesApplied: fixes,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: err.message || "Invalid Base64 sequence",
      isBinary: false,
      isJson: false,
      mimeType: "text/plain",
      rawBytesCount: input.length,
      decodedBytesCount: 0,
      fixesApplied: [],
    };
  }
}

/**
 * Human-readable byte formatting helper.
 */
export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

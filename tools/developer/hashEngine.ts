/**
 * Universal Cryptographic Hash and Checksum Engine.
 * Supports MD5 (RFC 1321), SHA-1, SHA-256, SHA-384, SHA-512 (FIPS 180-4),
 * CRC-32 (IEEE 802.3), HMAC keyed authentication, file hashing, and integrity verification.
 */

export type HashAlgorithm = "md5" | "sha1" | "sha256" | "sha384" | "sha512" | "crc32";
export type DigestFormat = "hex-lower" | "hex-upper" | "base64" | "base64url";
export type InputEncoding = "utf8" | "hex" | "base64";

export interface HashResult {
  algorithm: HashAlgorithm;
  name: string;
  bitLength: number;
  digestBytes: Uint8Array;
  hexLower: string;
  hexUpper: string;
  base64: string;
  base64url: string;
}

export interface AllHashesResult {
  md5: HashResult;
  sha1: HashResult;
  sha256: HashResult;
  sha384: HashResult;
  sha512: HashResult;
  crc32: HashResult;
  isHmac: boolean;
  inputByteLength: number;
}

export interface VerificationResult {
  match: boolean;
  detectedAlgorithm?: HashAlgorithm;
  computedHash?: string;
  expectedHash: string;
  message: string;
}

// --- 1. MD5 (RFC 1321) Pure TypeScript Implementation ---

function md5Cycle(x: Int32Array, k: number[]): void {
  let a = x[0],
    b = x[1],
    c = x[2],
    d = x[3];

  const cmn = (q: number, a: number, b: number, x: number, s: number, t: number) => {
    a = (a + q + x + t) | 0;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  };
  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn((b & c) | (~b & d), a, b, x, s, t);
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn((b & d) | (c & ~d), a, b, x, s, t);
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn(b ^ c ^ d, a, b, x, s, t);
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn(c ^ (b | ~d), a, b, x, s, t);

  // Round 1
  a = ff(a, b, c, d, k[0], 7, -680876936);
  d = ff(d, a, b, c, k[1], 12, -389564586);
  c = ff(c, d, a, b, k[2], 17, 606105819);
  b = ff(b, c, d, a, k[3], 22, -1044525330);
  a = ff(a, b, c, d, k[4], 7, -176418897);
  d = ff(d, a, b, c, k[5], 12, 1200080426);
  c = ff(c, d, a, b, k[6], 17, -1473231341);
  b = ff(b, c, d, a, k[7], 22, -45705983);
  a = ff(a, b, c, d, k[8], 7, 1770035416);
  d = ff(d, a, b, c, k[9], 12, -1958414417);
  c = ff(c, d, a, b, k[10], 17, -42063);
  b = ff(b, c, d, a, k[11], 22, -1990404162);
  a = ff(a, b, c, d, k[12], 7, 1804603682);
  d = ff(d, a, b, c, k[13], 12, -40341101);
  c = ff(c, d, a, b, k[14], 17, -1502002290);
  b = ff(b, c, d, a, k[15], 22, 1236535329);

  // Round 2
  a = gg(a, b, c, d, k[1], 5, -165796510);
  d = gg(d, a, b, c, k[6], 9, -1069501632);
  c = gg(c, d, a, b, k[11], 14, 643717713);
  b = gg(b, c, d, a, k[0], 20, -373897302);
  a = gg(a, b, c, d, k[5], 5, -701558691);
  d = gg(d, a, b, c, k[10], 9, 38016083);
  c = gg(c, d, a, b, k[15], 14, -660478335);
  b = gg(b, c, d, a, k[4], 20, -405537848);
  a = gg(a, b, c, d, k[9], 5, 568446438);
  d = gg(d, a, b, c, k[14], 9, -1019803690);
  c = gg(c, d, a, b, k[3], 14, -187363961);
  b = gg(b, c, d, a, k[8], 20, 1163531501);
  a = gg(a, b, c, d, k[13], 5, -1444681467);
  d = gg(d, a, b, c, k[2], 9, -51403784);
  c = gg(c, d, a, b, k[7], 14, 1735328473);
  b = gg(b, c, d, a, k[12], 20, -1926607734);

  // Round 3
  a = hh(a, b, c, d, k[5], 4, -378558);
  d = hh(d, a, b, c, k[8], 11, -2022574463);
  c = hh(c, d, a, b, k[11], 16, 1839030562);
  b = hh(b, c, d, a, k[14], 23, -35309556);
  a = hh(a, b, c, d, k[1], 4, -1530992060);
  d = hh(d, a, b, c, k[4], 11, 1272893353);
  c = hh(c, d, a, b, k[7], 16, -155497632);
  b = hh(b, c, d, a, k[10], 23, -1094730640);
  a = hh(a, b, c, d, k[13], 4, 681279174);
  d = hh(d, a, b, c, k[0], 11, -358537222);
  c = hh(c, d, a, b, k[3], 16, -722521979);
  b = hh(b, c, d, a, k[6], 23, 76029189);
  a = hh(a, b, c, d, k[9], 4, -640364487);
  d = hh(d, a, b, c, k[12], 11, -421815835);
  c = hh(c, d, a, b, k[15], 16, 530742520);
  b = hh(b, c, d, a, k[2], 23, -995338651);

  // Round 4
  a = ii(a, b, c, d, k[0], 6, -198630844);
  d = ii(d, a, b, c, k[7], 10, 1126891415);
  c = ii(c, d, a, b, k[14], 15, -1416354905);
  b = ii(b, c, d, a, k[5], 21, -57434055);
  a = ii(a, b, c, d, k[12], 6, 1700485571);
  d = ii(d, a, b, c, k[3], 10, -1894986606);
  c = ii(c, d, a, b, k[10], 15, -1051523);
  b = ii(b, c, d, a, k[1], 21, -2054922799);
  a = ii(a, b, c, d, k[8], 6, 1873313359);
  d = ii(d, a, b, c, k[15], 10, -30611744);
  c = ii(c, d, a, b, k[6], 15, -1560198380);
  b = ii(b, c, d, a, k[13], 21, 1309151649);
  a = ii(a, b, c, d, k[4], 6, -145523070);
  d = ii(d, a, b, c, k[11], 10, -1120210379);
  c = ii(c, d, a, b, k[2], 15, 718787259);
  b = ii(b, c, d, a, k[9], 21, -343485551);

  x[0] = (x[0] + a) | 0;
  x[1] = (x[1] + b) | 0;
  x[2] = (x[2] + c) | 0;
  x[3] = (x[3] + d) | 0;
}

export function computeMD5Bytes(bytes: Uint8Array): Uint8Array {
  const n = bytes.length;
  const paddedLen = (((n + 8) >>> 6) + 1) << 6;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[n] = 0x80;

  // 64-bit length in bits little endian
  const nBits = n * 8;
  padded[paddedLen - 8] = nBits & 0xff;
  padded[paddedLen - 7] = (nBits >>> 8) & 0xff;
  padded[paddedLen - 6] = (nBits >>> 16) & 0xff;
  padded[paddedLen - 5] = (nBits >>> 24) & 0xff;
  // High 32 bits remain 0 for lengths supported in memory

  const state = new Int32Array([0x67452301, -0x10325477, -0x67452302, 0x10325476]);
  const k = new Array(16);

  for (let i = 0; i < paddedLen; i += 64) {
    for (let j = 0; j < 16; j++) {
      const off = i + (j << 2);
      k[j] = padded[off] | (padded[off + 1] << 8) | (padded[off + 2] << 16) | (padded[off + 3] << 24);
    }
    md5Cycle(state, k);
  }

  const out = new Uint8Array(16);
  for (let i = 0; i < 4; i++) {
    const val = state[i];
    out[i * 4] = val & 0xff;
    out[i * 4 + 1] = (val >>> 8) & 0xff;
    out[i * 4 + 2] = (val >>> 16) & 0xff;
    out[i * 4 + 3] = (val >>> 24) & 0xff;
  }
  return out;
}

// --- 2. CRC-32 (IEEE 802.3) Implementation ---

const CRC32_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function computeCRC32Bytes(bytes: Uint8Array): Uint8Array {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  const result = (crc ^ 0xffffffff) >>> 0;
  const out = new Uint8Array(4);
  out[0] = (result >>> 24) & 0xff;
  out[1] = (result >>> 16) & 0xff;
  out[2] = (result >>> 8) & 0xff;
  out[3] = result & 0xff;
  return out;
}

// --- 3. Format Converters ---

export function bytesToHex(bytes: Uint8Array, upper = false): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return upper ? hex.toUpperCase() : hex.toLowerCase();
}

export function bytesToBase64(bytes: Uint8Array, urlSafe = false): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  let b64 = btoa(bin);
  if (urlSafe) {
    b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return b64;
}

export function buildHashResult(algo: HashAlgorithm, bytes: Uint8Array, nameOverride?: string): HashResult {
  const bitLengths: Record<HashAlgorithm, number> = {
    md5: 128,
    sha1: 160,
    sha256: 256,
    sha384: 384,
    sha512: 512,
    crc32: 32,
  };

  const defaultNames: Record<HashAlgorithm, string> = {
    md5: "MD5",
    sha1: "SHA-1",
    sha256: "SHA-256",
    sha384: "SHA-384",
    sha512: "SHA-512",
    crc32: "CRC-32",
  };

  return {
    algorithm: algo,
    name: nameOverride || defaultNames[algo],
    bitLength: bitLengths[algo],
    digestBytes: bytes,
    hexLower: bytesToHex(bytes, false),
    hexUpper: bytesToHex(bytes, true),
    base64: bytesToBase64(bytes, false),
    base64url: bytesToBase64(bytes, true),
  };
}

// --- 4. Input Parser ---

export function parseInputBytes(input: string, encoding: InputEncoding = "utf8"): Uint8Array {
  if (!input) return new Uint8Array(0);

  if (encoding === "hex") {
    const clean = input.replace(/[^0-9a-fA-F]/g, "");
    const len = Math.floor(clean.length / 2);
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  if (encoding === "base64") {
    try {
      const clean = input.trim().replace(/-/g, "+").replace(/_/g, "/");
      const bin = atob(clean);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      return bytes;
    } catch {
      // Fallback to UTF-8 if base64 decoding fails
      return new TextEncoder().encode(input);
    }
  }

  // Default UTF-8
  return new TextEncoder().encode(input);
}

// --- 5. HMAC Computation ---

export function computeHmacMD5(keyBytes: Uint8Array, dataBytes: Uint8Array): Uint8Array {
  const blockSize = 64;
  let k = new Uint8Array(blockSize);
  if (keyBytes.length > blockSize) {
    const h = computeMD5Bytes(keyBytes);
    k.set(h);
  } else {
    k.set(keyBytes);
  }

  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    ipad[i] = k[i] ^ 0x36;
    opad[i] = k[i] ^ 0x5c;
  }

  const inner = new Uint8Array(blockSize + dataBytes.length);
  inner.set(ipad);
  inner.set(dataBytes, blockSize);
  const innerHash = computeMD5Bytes(inner);

  const outer = new Uint8Array(blockSize + 16);
  outer.set(opad);
  outer.set(innerHash, blockSize);
  return computeMD5Bytes(outer);
}

export async function computeWebCryptoHmac(
  algorithmName: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512",
  keyBytes: Uint8Array,
  dataBytes: Uint8Array
): Promise<Uint8Array> {
  const safeKey = keyBytes.length === 0 ? new Uint8Array(1) : keyBytes;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    safeKey as unknown as BufferSource,
    { name: "HMAC", hash: algorithmName },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, dataBytes as unknown as BufferSource);
  return new Uint8Array(sig);
}

// --- 6. Unified Hashes Calculation ---

export async function computeAllHashes(
  input: Uint8Array | string,
  options: {
    encoding?: InputEncoding;
    hmacKey?: string;
  } = {}
): Promise<AllHashesResult> {
  const dataBytes = typeof input === "string" ? parseInputBytes(input, options.encoding || "utf8") : input;

  const isHmac = !!options.hmacKey && options.hmacKey.trim().length > 0;
  const keyBytes = isHmac ? new TextEncoder().encode(options.hmacKey) : new Uint8Array(0);

  if (isHmac) {
    // Keyed HMAC computation
    const [md5Bytes, sha1Buf, sha256Buf, sha384Buf, sha512Buf] = await Promise.all([
      computeHmacMD5(keyBytes, dataBytes),
      computeWebCryptoHmac("SHA-1", keyBytes, dataBytes),
      computeWebCryptoHmac("SHA-256", keyBytes, dataBytes),
      computeWebCryptoHmac("SHA-384", keyBytes, dataBytes),
      computeWebCryptoHmac("SHA-512", keyBytes, dataBytes),
    ]);

    // CRC-32 does not have an HMAC spec; compute CRC32 of key + data
    const combined = new Uint8Array(keyBytes.length + dataBytes.length);
    combined.set(keyBytes);
    combined.set(dataBytes, keyBytes.length);
    const crcBytes = computeCRC32Bytes(combined);

    return {
      md5: buildHashResult("md5", md5Bytes, "HMAC-MD5"),
      sha1: buildHashResult("sha1", sha1Buf, "HMAC-SHA1"),
      sha256: buildHashResult("sha256", sha256Buf, "HMAC-SHA256"),
      sha384: buildHashResult("sha384", sha384Buf, "HMAC-SHA384"),
      sha512: buildHashResult("sha512", sha512Buf, "HMAC-SHA512"),
      crc32: buildHashResult("crc32", crcBytes, "CRC-32 (Keyed)"),
      isHmac: true,
      inputByteLength: dataBytes.length,
    };
  }

  // Standard Non-Keyed Digests
  const md5Bytes = computeMD5Bytes(dataBytes);
  const crcBytes = computeCRC32Bytes(dataBytes);

  const [sha1Buf, sha256Buf, sha384Buf, sha512Buf] = await Promise.all([
    crypto.subtle.digest("SHA-1", dataBytes as unknown as BufferSource),
    crypto.subtle.digest("SHA-256", dataBytes as unknown as BufferSource),
    crypto.subtle.digest("SHA-384", dataBytes as unknown as BufferSource),
    crypto.subtle.digest("SHA-512", dataBytes as unknown as BufferSource),
  ]);

  return {
    md5: buildHashResult("md5", md5Bytes),
    sha1: buildHashResult("sha1", new Uint8Array(sha1Buf)),
    sha256: buildHashResult("sha256", new Uint8Array(sha256Buf)),
    sha384: buildHashResult("sha384", new Uint8Array(sha384Buf)),
    sha512: buildHashResult("sha512", new Uint8Array(sha512Buf)),
    crc32: buildHashResult("crc32", crcBytes),
    isHmac: false,
    inputByteLength: dataBytes.length,
  };
}

// --- 7. Auto-detect Algorithm & Verify ---

export function detectHashAlgorithm(hashStr: string): HashAlgorithm | null {
  const clean = hashStr.trim().replace(/^0x/i, "").toLowerCase();
  const len = clean.length;

  if (!/^[0-9a-f]+$/i.test(clean)) return null;

  if (len === 8) return "crc32";
  if (len === 32) return "md5";
  if (len === 40) return "sha1";
  if (len === 64) return "sha256";
  if (len === 96) return "sha384";
  if (len === 128) return "sha512";

  return null;
}

export function verifyHash(
  computedHashes: AllHashesResult,
  expectedHashInput: string
): VerificationResult {
  if (!expectedHashInput || !expectedHashInput.trim()) {
    return {
      match: false,
      expectedHash: "",
      message: "Please enter an expected hash or checksum to compare.",
    };
  }

  const cleanExpected = expectedHashInput.trim().replace(/^0x/i, "").toLowerCase();
  const detected = detectHashAlgorithm(cleanExpected);

  if (!detected) {
    // Check all computed hashes for a match anyway (in case base64 or non-standard format was pasted)
    for (const algo of ["sha256", "md5", "sha1", "sha512", "sha384", "crc32"] as HashAlgorithm[]) {
      const h = computedHashes[algo];
      if (
        h.hexLower === cleanExpected ||
        h.hexUpper.toLowerCase() === cleanExpected ||
        h.base64 === expectedHashInput.trim() ||
        h.base64url === expectedHashInput.trim()
      ) {
        return {
          match: true,
          detectedAlgorithm: algo,
          computedHash: h.hexLower,
          expectedHash: cleanExpected,
          message: `Verification Passed: Matched ${h.name} hash perfectly.`,
        };
      }
    }

    return {
      match: false,
      expectedHash: cleanExpected,
      message: `Invalid hash format: Expected ${cleanExpected.length} hex characters does not correspond to standard MD5, SHA-1, SHA-256, SHA-384, SHA-512, or CRC-32 lengths.`,
    };
  }

  const computedTarget = computedHashes[detected];
  const isMatch = computedTarget.hexLower === cleanExpected;

  if (isMatch) {
    return {
      match: true,
      detectedAlgorithm: detected,
      computedHash: computedTarget.hexLower,
      expectedHash: cleanExpected,
      message: `Verification Successful: Integrity verified! Computed ${computedTarget.name} matches expected hash exactly.`,
    };
  }

  return {
    match: false,
    detectedAlgorithm: detected,
    computedHash: computedTarget.hexLower,
    expectedHash: cleanExpected,
    message: `Verification Failed: Computed ${computedTarget.name} does NOT match the expected hash. The data may be corrupted or tampered with.`,
  };
}

// --- 8. File Formatted Checksum Export ---

export function generateChecksumFile(filename: string, hash: string): string {
  const baseName = filename.replace(/[/\\]/g, "_") || "file";
  return `${hash.toLowerCase()}  ${baseName}\n`;
}

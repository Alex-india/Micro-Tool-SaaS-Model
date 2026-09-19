export interface JWTStandardClaims {
  sub?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: any;
}

export interface ClaimTimestampInfo {
  timestamp: number;
  utc: string;
  local: string;
  relative: string;
  isPast: boolean;
}

export interface JWTDecoded {
  isValid: boolean;
  error?: string;
  header: Record<string, any> | null;
  payload: JWTStandardClaims | null;
  signature: string;
  cleanToken: string;
  algorithm: string;
  tokenType: string;
  parts: {
    rawHeader: string;
    rawPayload: string;
    rawSignature: string;
  };
  isExpired: boolean | null;
  expiresInText: string;
  issuedAtInfo: ClaimTimestampInfo | null;
  expiresAtInfo: ClaimTimestampInfo | null;
  notBeforeInfo: ClaimTimestampInfo | null;
}

/**
 * Decodes a base64url string to UTF-8 text.
 */
function base64UrlDecode(str: string): string {
  let clean = str.replace(/-/g, "+").replace(/_/g, "/");
  while (clean.length % 4 !== 0) {
    clean += "=";
  }
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/**
 * Encodes an object or string into a base64url string.
 */
export function base64UrlEncode(input: any): string {
  const json = typeof input === "string" ? input : JSON.stringify(input);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Formats a Unix timestamp into human-readable UTC, local, and relative time descriptions.
 */
export function formatClaimTimestamp(timestamp: number): ClaimTimestampInfo {
  // If timestamp is in milliseconds (length >= 13), convert to seconds
  const tsSec = timestamp > 1e11 ? Math.floor(timestamp / 1000) : timestamp;
  const date = new Date(tsSec * 1000);
  const nowSec = Math.floor(Date.now() / 1000);
  const diffSec = tsSec - nowSec;
  const isPast = diffSec < 0;
  const absDiff = Math.abs(diffSec);

  let relative = "";
  if (absDiff < 60) {
    relative = isPast ? `${absDiff} seconds ago` : `in ${absDiff} seconds`;
  } else if (absDiff < 3600) {
    const min = Math.floor(absDiff / 60);
    relative = isPast ? `${min} minute${min === 1 ? "" : "s"} ago` : `in ${min} minute${min === 1 ? "" : "s"}`;
  } else if (absDiff < 86400) {
    const hours = Math.floor(absDiff / 3600);
    relative = isPast ? `${hours} hour${hours === 1 ? "" : "s"} ago` : `in ${hours} hour${hours === 1 ? "" : "s"}`;
  } else {
    const days = Math.floor(absDiff / 86400);
    relative = isPast ? `${days} day${days === 1 ? "" : "s"} ago` : `in ${days} day${days === 1 ? "" : "s"}`;
  }

  return {
    timestamp: tsSec,
    utc: date.toUTCString(),
    local: date.toLocaleString(),
    relative,
    isPast,
  };
}

/**
 * Decodes and inspects a JSON Web Token (JWT).
 * Strips Bearer prefixes, quotes, and newlines automatically.
 */
export function decodeJWT(token: string): JWTDecoded {
  if (!token || !token.trim()) {
    return {
      isValid: false,
      header: null,
      payload: null,
      signature: "",
      cleanToken: "",
      algorithm: "",
      tokenType: "",
      parts: { rawHeader: "", rawPayload: "", rawSignature: "" },
      isExpired: null,
      expiresInText: "",
      issuedAtInfo: null,
      expiresAtInfo: null,
      notBeforeInfo: null,
    };
  }

  // 1. Sanitize: Strip Bearer prefix, quotes, and whitespace
  const clean = token
    .trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/["']/g, "")
    .replace(/[\r\n\s\t]/g, "");

  const parts = clean.split(".");

  if (parts.length === 5) {
    return {
      isValid: false,
      header: null,
      payload: null,
      signature: "",
      cleanToken: clean,
      algorithm: "",
      tokenType: "",
      parts: { rawHeader: "", rawPayload: "", rawSignature: "" },
      isExpired: null,
      expiresInText: "",
      issuedAtInfo: null,
      expiresAtInfo: null,
      notBeforeInfo: null,
      error:
        "Encrypted JWT (JWE) detected (5 parts: header.encryptedKey.iv.ciphertext.tag). JWE payloads are encrypted and cannot be viewed without the private decryption key.",
    };
  }

  if (parts.length < 2 || parts.length > 3) {
    return {
      isValid: false,
      header: null,
      payload: null,
      signature: "",
      cleanToken: clean,
      algorithm: "",
      tokenType: "",
      parts: { rawHeader: "", rawPayload: "", rawSignature: "" },
      isExpired: null,
      expiresInText: "",
      issuedAtInfo: null,
      expiresAtInfo: null,
      notBeforeInfo: null,
      error: `Invalid JWT format. Expected 3 dot-separated segments (header.payload.signature), but found ${parts.length}.`,
    };
  }

  const rawHeader = parts[0];
  const rawPayload = parts[1];
  const rawSignature = parts[2] || "";

  try {
    // 2. Decode Header
    let header: Record<string, any>;
    try {
      const headerStr = base64UrlDecode(rawHeader);
      header = JSON.parse(headerStr);
    } catch (e: any) {
      throw new Error(`Invalid Header segment: ${e.message}`);
    }

    // 3. Decode Payload
    let payload: JWTStandardClaims;
    try {
      const payloadStr = base64UrlDecode(rawPayload);
      payload = JSON.parse(payloadStr);
    } catch (e: any) {
      throw new Error(`Invalid Payload segment: ${e.message}`);
    }

    // 4. Claims Analysis
    let isExpired: boolean | null = null;
    let expiresInText = "";
    let expiresAtInfo: ClaimTimestampInfo | null = null;
    let issuedAtInfo: ClaimTimestampInfo | null = null;
    let notBeforeInfo: ClaimTimestampInfo | null = null;

    if (payload.exp && typeof payload.exp === "number") {
      expiresAtInfo = formatClaimTimestamp(payload.exp);
      isExpired = expiresAtInfo.isPast;
      expiresInText = isExpired
        ? `Expired (${expiresAtInfo.relative})`
        : `Active (${expiresAtInfo.relative})`;
    }

    if (payload.iat && typeof payload.iat === "number") {
      issuedAtInfo = formatClaimTimestamp(payload.iat);
    }

    if (payload.nbf && typeof payload.nbf === "number") {
      notBeforeInfo = formatClaimTimestamp(payload.nbf);
    }

    return {
      isValid: true,
      header,
      payload,
      signature: rawSignature,
      cleanToken: clean,
      algorithm: header.alg || "Unknown",
      tokenType: header.typ || "JWT",
      parts: {
        rawHeader,
        rawPayload,
        rawSignature,
      },
      isExpired,
      expiresInText,
      issuedAtInfo,
      expiresAtInfo,
      notBeforeInfo,
    };
  } catch (err: any) {
    return {
      isValid: false,
      header: null,
      payload: null,
      signature: rawSignature,
      cleanToken: clean,
      algorithm: "",
      tokenType: "",
      parts: { rawHeader, rawPayload, rawSignature },
      isExpired: null,
      expiresInText: "",
      issuedAtInfo: null,
      expiresAtInfo: null,
      notBeforeInfo: null,
      error: err.message || "Failed to decode JWT token.",
    };
  }
}

/**
 * Verifies the signature of an HMAC-signed JWT (HS256, HS384, HS512) using native Web Crypto.
 */
export async function verifyHMACSignature(
  token: string,
  secret: string,
  isBase64Secret = false
): Promise<{ isValid: boolean; error?: string }> {
  if (!token || !secret) {
    return { isValid: false, error: "Token and secret are required" };
  }

  const clean = token
    .trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/["']/g, "")
    .replace(/[\r\n\s\t]/g, "");

  const parts = clean.split(".");
  if (parts.length !== 3) {
    return { isValid: false, error: "Invalid token segments" };
  }

  try {
    const headerStr = base64UrlDecode(parts[0]);
    const header = JSON.parse(headerStr);
    const alg = header.alg?.toUpperCase();

    if (!alg || !alg.startsWith("HS")) {
      return {
        isValid: false,
        error: `Algorithm ${alg || "unknown"} is not an HMAC algorithm (only HS256, HS384, HS512 supported for secret key verification).`,
      };
    }

    const hashAlgo =
      alg === "HS384" ? "SHA-384" : alg === "HS512" ? "SHA-512" : "SHA-256";

    let keyBytes: Uint8Array;
    if (isBase64Secret) {
      let cleanSecret = secret.replace(/-/g, "+").replace(/_/g, "/");
      while (cleanSecret.length % 4 !== 0) cleanSecret += "=";
      const bin = atob(cleanSecret);
      keyBytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) keyBytes[i] = bin.charCodeAt(i);
    } else {
      keyBytes = new TextEncoder().encode(secret);
    }

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes as unknown as BufferSource,
      { name: "HMAC", hash: hashAlgo },
      false,
      ["verify"]
    );

    // Decode signature bytes from base64url
    let sigBase64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
    while (sigBase64.length % 4 !== 0) sigBase64 += "=";
    const sigBin = atob(sigBase64);
    const sigBytes = new Uint8Array(sigBin.length);
    for (let i = 0; i < sigBin.length; i++) sigBytes[i] = sigBin.charCodeAt(i);

    const dataBytes = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      sigBytes as unknown as BufferSource,
      dataBytes as unknown as BufferSource
    );
    return { isValid };
  } catch (err: any) {
    return { isValid: false, error: err.message || "Verification failed" };
  }
}

/**
 * Signs a JWT Header and Payload with an HMAC secret using Web Crypto.
 */
export async function signJWT(
  header: Record<string, any>,
  payload: Record<string, any>,
  secret: string,
  isBase64Secret = false
): Promise<string> {
  const headerB64 = base64UrlEncode(header);
  const payloadB64 = base64UrlEncode(payload);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

  const alg = (header.alg || "HS256").toUpperCase();
  const hashAlgo =
    alg === "HS384" ? "SHA-384" : alg === "HS512" ? "SHA-512" : "SHA-256";

  let keyBytes: Uint8Array;
  if (isBase64Secret) {
    let cleanSecret = secret.replace(/-/g, "+").replace(/_/g, "/");
    while (cleanSecret.length % 4 !== 0) cleanSecret += "=";
    const bin = atob(cleanSecret);
    keyBytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) keyBytes[i] = bin.charCodeAt(i);
  } else {
    keyBytes = new TextEncoder().encode(secret);
  }

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes as unknown as BufferSource,
    { name: "HMAC", hash: hashAlgo },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign("HMAC", cryptoKey, data as unknown as BufferSource);
  const sigBytes = new Uint8Array(sigBuf);
  let sigBin = "";
  for (let i = 0; i < sigBytes.length; i++) sigBin += String.fromCharCode(sigBytes[i]);
  const sigB64 = btoa(sigBin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${headerB64}.${payloadB64}.${sigB64}`;
}

/**
 * Universal UUID & GUID Generation and Inspection Engine (RFC 4122 & RFC 9562).
 * Supports UUID v4 (Cryptographic Random), UUID v7 (Time-Ordered Epoch),
 * UUID v1 (Gregorian Time-based), Nil, Max, inspection, and multiple output formats.
 */

export type UUIDVersion = "v4" | "v7" | "v1" | "nil" | "max";
export type UUIDFormat = "standard" | "no-hyphens" | "braces" | "parentheses" | "urn" | "base64" | "json" | "sql";

export interface UUIDFormatOptions {
  format?: UUIDFormat;
  uppercase?: boolean;
  prefix?: string;
  suffix?: string;
}

export interface UUIDInspectionResult {
  isValid: boolean;
  error?: string;
  canonical?: string;
  version?: number;
  versionName?: string;
  versionDescription?: string;
  variant?: string;
  timestampMs?: number | null;
  timestampUtc?: string | null;
  timestampLocal?: string | null;
  isTimeOrdered?: boolean;
  hexBytes?: string;
}

/**
 * Converts a 16-byte Uint8Array to a canonical hyphenated hex UUID string.
 */
function bytesToCanonical(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Generates a single UUID of the specified version.
 */
export function generateUUID(version: UUIDVersion = "v4", options: UUIDFormatOptions = {}): string {
  let canonical = "";

  if (version === "nil") {
    canonical = "00000000-0000-0000-0000-000000000000";
  } else if (version === "max") {
    canonical = "ffffffff-ffff-ffff-ffff-ffffffffffff";
  } else if (version === "v7") {
    // RFC 9562: 48 bits millisecond timestamp + 4 bits version 7 + 12 bits random + 2 bits variant + 62 bits random
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    const now = Date.now();
    bytes[0] = Math.floor(now / 0x10000000000) & 0xff;
    bytes[1] = Math.floor(now / 0x100000000) & 0xff;
    bytes[2] = Math.floor(now / 0x1000000) & 0xff;
    bytes[3] = Math.floor(now / 0x10000) & 0xff;
    bytes[4] = Math.floor(now / 0x100) & 0xff;
    bytes[5] = now & 0xff;

    // Version 7: 0111
    bytes[6] = (bytes[6] & 0x0f) | 0x70;
    // Variant 10 (RFC 4122)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    canonical = bytesToCanonical(bytes);
  } else if (version === "v1") {
    // RFC 4122: 60 bits 100ns Gregorian timestamp + 4 bits version 1 + 14 bits clock sequence + 48 bits node
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    const gregorianOffset = 122192928000000000n;
    const nowNs = BigInt(Date.now()) * 10000n + gregorianOffset;

    const timeLow = Number(nowNs & 0xffffffffn);
    const timeMid = Number((nowNs >> 32n) & 0xffffn);
    const timeHi = Number((nowNs >> 48n) & 0x0fffn);

    bytes[0] = (timeLow >> 24) & 0xff;
    bytes[1] = (timeLow >> 16) & 0xff;
    bytes[2] = (timeLow >> 8) & 0xff;
    bytes[3] = timeLow & 0xff;

    bytes[4] = (timeMid >> 8) & 0xff;
    bytes[5] = timeMid & 0xff;

    // Version 1: 0001
    bytes[6] = (timeHi >> 8) | 0x10;
    bytes[7] = timeHi & 0xff;

    // Variant 10 (RFC 4122)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    canonical = bytesToCanonical(bytes);
  } else {
    // UUID v4 (Default): Cryptographically secure random
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      canonical = crypto.randomUUID();
    } else {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant RFC 4122
      canonical = bytesToCanonical(bytes);
    }
  }

  return formatUUIDString(canonical, options);
}

/**
 * Generates bulk UUIDs with specified quantity and formatting.
 */
export function generateBulkUUIDs(
  count = 5,
  version: UUIDVersion = "v4",
  options: UUIDFormatOptions = {}
): string[] {
  const safeCount = Math.max(1, Math.min(count, 500));
  const list: string[] = [];
  for (let i = 0; i < safeCount; i++) {
    list.push(generateUUID(version, options));
  }
  return list;
}

/**
 * Formats a canonical UUID string according to user preferences.
 */
export function formatUUIDString(canonical: string, options: UUIDFormatOptions = {}): string {
  let formatted = canonical.toLowerCase();

  // Strip hyphens if no-hyphens format
  if (options.format === "no-hyphens") {
    formatted = formatted.replace(/-/g, "");
  } else if (options.format === "braces") {
    formatted = `{${formatted}}`;
  } else if (options.format === "parentheses") {
    formatted = `(${formatted})`;
  } else if (options.format === "urn") {
    formatted = `urn:uuid:${formatted}`;
  } else if (options.format === "base64") {
    const rawHex = formatted.replace(/[^0-9a-f]/gi, "");
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      bytes[i] = parseInt(rawHex.substr(i * 2, 2), 16);
    }
    let bin = "";
    for (let i = 0; i < 16; i++) bin += String.fromCharCode(bytes[i]);
    formatted = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  if (options.uppercase && options.format !== "urn" && options.format !== "base64") {
    formatted = formatted.toUpperCase();
  }

  if (options.prefix) {
    formatted = options.prefix + formatted;
  }
  if (options.suffix) {
    formatted = formatted + options.suffix;
  }

  return formatted;
}

/**
 * Inspects and validates a UUID string, extracting version, variant, and embedded timestamps.
 */
export function inspectUUID(uuidStr: string): UUIDInspectionResult {
  if (!uuidStr || !uuidStr.trim()) {
    return { isValid: false, error: "Empty UUID string." };
  }

  const clean = uuidStr
    .trim()
    .toLowerCase()
    .replace(/[{}\(\)]/g, "")
    .replace(/^urn:uuid:/, "");

  const unhyphenated = clean.replace(/-/g, "");

  if (!/^[0-9a-f]{32}$/.test(unhyphenated)) {
    return {
      isValid: false,
      error: "Invalid UUID format. A valid UUID must consist of 32 hexadecimal characters.",
    };
  }

  const canonical = `${unhyphenated.slice(0, 8)}-${unhyphenated.slice(8, 12)}-${unhyphenated.slice(
    12,
    16
  )}-${unhyphenated.slice(16, 20)}-${unhyphenated.slice(20)}`;

  // Check Nil or Max
  if (unhyphenated === "0".repeat(32)) {
    return {
      isValid: true,
      canonical,
      version: 0,
      versionName: "Nil UUID",
      versionDescription: "Special UUID where all 128 bits are set to zero (RFC 4122).",
      variant: "RFC 4122 (Leach-Salz)",
      timestampMs: null,
      timestampUtc: null,
      timestampLocal: null,
      isTimeOrdered: false,
      hexBytes: unhyphenated,
    };
  }

  if (unhyphenated === "f".repeat(32)) {
    return {
      isValid: true,
      canonical,
      version: 15,
      versionName: "Max UUID",
      versionDescription: "Special UUID where all 128 bits are set to one (RFC 9562).",
      variant: "RFC 9562 / RFC 4122",
      timestampMs: null,
      timestampUtc: null,
      timestampLocal: null,
      isTimeOrdered: false,
      hexBytes: unhyphenated,
    };
  }

  const verDigit = parseInt(unhyphenated[12], 16);
  const varDigit = parseInt(unhyphenated[16], 16);

  let variant = "Unknown";
  if ((varDigit & 0x8) === 0) variant = "NCS Backward Compatibility";
  else if ((varDigit & 0xc) === 0x8) variant = "RFC 4122 / RFC 9562 (Standard)";
  else if ((varDigit & 0xe) === 0xc) variant = "Microsoft GUID Compatibility";
  else variant = "Reserved for Future Definition";

  let versionName = `UUID v${verDigit}`;
  let versionDescription = "Standard RFC 4122 UUID";
  let timestampMs: number | null = null;
  let timestampUtc: string | null = null;
  let timestampLocal: string | null = null;
  let isTimeOrdered = false;

  if (verDigit === 7) {
    versionName = "UUID v7 (RFC 9562)";
    versionDescription =
      "Modern Unix Epoch time-ordered UUID. Encodes a 48-bit millisecond timestamp followed by random bits for index-friendly database primary keys.";
    isTimeOrdered = true;
    const timeHex = unhyphenated.slice(0, 12);
    timestampMs = parseInt(timeHex, 16);
    const date = new Date(timestampMs);
    timestampUtc = date.toUTCString();
    timestampLocal = date.toLocaleString();
  } else if (verDigit === 4) {
    versionName = "UUID v4 (Random)";
    versionDescription =
      "122 bits of cryptographically secure pseudorandom data. Collision probability is negligible (~1 in 5.3 x 10^36).";
  } else if (verDigit === 1) {
    versionName = "UUID v1 (Time-based)";
    versionDescription =
      "Gregorian timestamp (100ns intervals since Oct 15, 1582) combined with clock sequence and MAC/node identifier.";
    isTimeOrdered = true;
    const timeLow = unhyphenated.slice(0, 8);
    const timeMid = unhyphenated.slice(8, 12);
    const timeHi = unhyphenated.slice(13, 16);
    const timeHex = timeHi + timeMid + timeLow;
    const time100ns = BigInt("0x" + timeHex);
    const gregorianOffset = 122192928000000000n;
    timestampMs = Number((time100ns - gregorianOffset) / 10000n);
    const date = new Date(timestampMs);
    timestampUtc = date.toUTCString();
    timestampLocal = date.toLocaleString();
  } else if (verDigit === 5) {
    versionName = "UUID v5 (Name-based SHA-1)";
    versionDescription = "Deterministic UUID created from namespace and name using SHA-1 hashing.";
  } else if (verDigit === 3) {
    versionName = "UUID v3 (Name-based MD5)";
    versionDescription = "Deterministic UUID created from namespace and name using MD5 hashing.";
  }

  return {
    isValid: true,
    canonical,
    version: verDigit,
    versionName,
    versionDescription,
    variant,
    timestampMs,
    timestampUtc,
    timestampLocal,
    isTimeOrdered,
    hexBytes: unhyphenated,
  };
}

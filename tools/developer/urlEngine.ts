/**
 * Universal RFC 3986 URL Encoding, Decoding, and Parameter Parsing Engine.
 * Supports Component Encoding, Full URI Encoding, Form-URL-Encoded (+ for spaces),
 * Strict Percent-Encoding, Multi-Byte Tolerant Decoding, Recursive / Multi-Round Decoding,
 * HTML Entity Stripping, UTM Tracking Parameter Stripping, and Deep Query Parameter Inspection.
 */

export type URLEncodeMode = "component" | "full-uri" | "form-urlencoded" | "strict-rfc3986";

export interface URLQueryParam {
  key: string;
  value: string;
}

export interface ParsedURLStructure {
  isValidURL: boolean;
  protocol?: string;
  host?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  hash?: string;
  search?: string;
  params: URLQueryParam[];
  origin?: string;
  hasTrackingParams?: boolean;
  nestedUrls?: { key: string; url: string }[];
}

export interface URLEncodeResult {
  output: string;
  charCount: number;
  byteCount: number;
  encodedCharCount: number;
}

export interface DecodeURLOptions {
  decodePlusAsSpace?: boolean;
  recursive?: boolean;
  stripHtmlEntities?: boolean;
}

export interface URLDecodeResult {
  isValid: boolean;
  output: string;
  warning?: string;
  charCount: number;
  byteCount: number;
  decodedCharCount: number;
  roundsDecoded: number;
  isMultiRound: boolean;
}

const TRACKING_PARAM_REGEX = /^(utm_|fbclid$|gclid$|gbraid$|wbraid$|msclkid$|mc_cid$|mc_eid$|igshid$|_hsenc$|_hsmi$)/i;

export function isTrackingParam(key: string): boolean {
  return TRACKING_PARAM_REGEX.test(key.trim());
}

/**
 * Replaces common HTML entities found in URLs (e.g. copied from HTML source code or RSS feeds).
 */
export function cleanHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/gi, "&")
    .replace(/&#38;/g, "&")
    .replace(/&#x26;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

/**
 * Encodes a string according to the specified encoding mode.
 */
export function encodeURLString(
  input: string,
  mode: URLEncodeMode = "component"
): URLEncodeResult {
  if (!input) {
    return { output: "", charCount: 0, byteCount: 0, encodedCharCount: 0 };
  }

  let output = "";

  switch (mode) {
    case "full-uri":
      // Preserves valid URL delimiters: :, /, ?, #, [, ], @, !, $, &, ', (, ), *, +, ,, ;, =
      try {
        output = encodeURI(input);
      } catch {
        output = encodeURIComponent(input);
      }
      break;

    case "form-urlencoded":
      // application/x-www-form-urlencoded: spaces encoded as '+', percent-encodes other characters
      output = encodeURIComponent(input).replace(/%20/g, "+");
      break;

    case "strict-rfc3986":
      // Strictly percent-encodes all characters except unreserved: A-Z a-z 0-9 - _ . ~
      output = encodeURIComponent(input).replace(/[!'()*]/g, (c) => {
        return "%" + c.charCodeAt(0).toString(16).toUpperCase();
      });
      break;

    case "component":
    default:
      // Standard query component encoding
      output = encodeURIComponent(input);
      break;
  }

  const byteCount = typeof Blob !== "undefined" ? new Blob([output]).size : Buffer.byteLength(output, "utf8");
  const encodedCharCount = (output.match(/%[0-9a-fA-F]{2}/g) || []).length;

  return {
    output,
    charCount: output.length,
    byteCount,
    encodedCharCount,
  };
}

/**
 * Byte-stream tolerant percent decoder that handles multi-byte UTF-8 sequences (Asian glyphs, emojis, accents)
 * without crashing on malformed % tokens.
 */
export function tolerantPercentDecode(text: string): { output: string; decodedCount: number; hasWarning: boolean } {
  let output = "";
  let i = 0;
  let decodedCount = 0;
  let hasWarning = false;
  const textDecoder = new TextDecoder("utf-8", { fatal: false });

  while (i < text.length) {
    if (text[i] === "%") {
      const bytes: number[] = [];
      let j = i;
      while (j + 2 < text.length && text[j] === "%") {
        const hex = text.slice(j + 1, j + 3);
        if (/^[0-9a-fA-F]{2}$/.test(hex)) {
          bytes.push(parseInt(hex, 16));
          j += 3;
        } else {
          break;
        }
      }

      if (bytes.length > 0) {
        const decodedChunk = textDecoder.decode(new Uint8Array(bytes));
        output += decodedChunk;
        decodedCount += bytes.length;
        i = j;
      } else {
        hasWarning = true;
        output += text[i];
        i++;
      }
    } else {
      output += text[i];
      i++;
    }
  }

  return { output, decodedCount, hasWarning };
}

/**
 * Universal URL decoding supporting standard percent decoding, '+' as space conversion,
 * recursive multi-round decoding, and HTML entity stripping.
 */
export function decodeURLString(
  input: string,
  options: DecodeURLOptions = { decodePlusAsSpace: true, recursive: false, stripHtmlEntities: false }
): URLDecodeResult {
  if (!input) {
    return {
      isValid: true,
      output: "",
      charCount: 0,
      byteCount: 0,
      decodedCharCount: 0,
      roundsDecoded: 0,
      isMultiRound: false,
    };
  }

  let textToDecode = input;
  if (options.stripHtmlEntities) {
    textToDecode = cleanHtmlEntities(textToDecode);
  }
  if (options.decodePlusAsSpace) {
    textToDecode = textToDecode.replace(/\+/g, " ");
  }

  let current = textToDecode;
  let totalDecoded = 0;
  let rounds = 0;
  let hasWarning = false;

  const maxRounds = options.recursive ? 5 : 1;

  for (let r = 0; r < maxRounds; r++) {
    if (!/%[0-9a-fA-F]{2}/.test(current)) {
      break;
    }
    const step = tolerantPercentDecode(current);
    if (step.output === current) {
      break;
    }
    current = step.output;
    totalDecoded += step.decodedCount;
    rounds++;
    if (step.hasWarning) hasWarning = true;
  }

  const byteCount = typeof Blob !== "undefined" ? new Blob([current]).size : Buffer.byteLength(current, "utf8");

  return {
    isValid: !hasWarning,
    output: current,
    warning: hasWarning
      ? "Malformed percent-encoded sequence detected (e.g. '%' not followed by valid hex). Safely decoded readable portions."
      : undefined,
    charCount: current.length,
    byteCount,
    decodedCharCount: totalDecoded,
    roundsDecoded: rounds || 1,
    isMultiRound: rounds > 1,
  };
}

/**
 * Helper to extract nested URLs inside query parameters.
 */
function findNestedUrls(params: URLQueryParam[]): { key: string; url: string }[] {
  const list: { key: string; url: string }[] = [];
  params.forEach(({ key, value }) => {
    const trimmed = value.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      list.push({ key, url: trimmed });
    } else if (
      trimmed.startsWith("http%3A%2F%2F") ||
      trimmed.startsWith("https%3A%2F%2F") ||
      trimmed.startsWith("http%253A") ||
      trimmed.startsWith("https%253A")
    ) {
      const decoded = tolerantPercentDecode(trimmed).output;
      list.push({ key, url: decoded });
    }
  });
  return list;
}

/**
 * Parses full URL or query string into its constituent structure and query parameters.
 */
export function parseURLComponents(urlStr: string): ParsedURLStructure {
  const trimmed = urlStr.trim();
  if (!trimmed) {
    return { isValidURL: false, params: [] };
  }

  try {
    const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed);
    const fullUrl = hasProtocol ? trimmed : `https://${trimmed}`;
    const parsed = new URL(fullUrl);

    const params: URLQueryParam[] = [];
    let hasTrackingParams = false;

    parsed.searchParams.forEach((value, key) => {
      params.push({ key, value });
      if (isTrackingParam(key)) {
        hasTrackingParams = true;
      }
    });

    return {
      isValidURL: true,
      protocol: parsed.protocol,
      host: parsed.host,
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? "443" : "80"),
      pathname: parsed.pathname,
      hash: parsed.hash,
      search: parsed.search,
      params,
      origin: parsed.origin,
      hasTrackingParams,
      nestedUrls: findNestedUrls(params),
    };
  } catch {
    if (trimmed.includes("=") || trimmed.startsWith("?")) {
      try {
        const qs = trimmed.startsWith("?") ? trimmed.slice(1) : trimmed;
        const searchParams = new URLSearchParams(qs);
        const params: URLQueryParam[] = [];
        let hasTrackingParams = false;

        searchParams.forEach((value, key) => {
          params.push({ key, value });
          if (isTrackingParam(key)) {
            hasTrackingParams = true;
          }
        });

        if (params.length > 0) {
          return {
            isValidURL: false,
            search: trimmed.startsWith("?") ? trimmed : `?${trimmed}`,
            params,
            hasTrackingParams,
            nestedUrls: findNestedUrls(params),
          };
        }
      } catch {}
    }

    return { isValidURL: false, params: [] };
  }
}

/**
 * Strips UTM and analytics tracking parameters from a URL or query string.
 */
export function stripTrackingParameters(urlStr: string): string {
  const parsed = parseURLComponents(urlStr);
  if (!parsed.params || parsed.params.length === 0) return urlStr;

  const filtered = parsed.params.filter((p) => !isTrackingParam(p.key));
  return buildURLFromComponents(
    parsed.origin || "",
    parsed.pathname || "/",
    filtered,
    parsed.hash || ""
  );
}

/**
 * Exports query parameters array as formatted JSON string.
 */
export function queryParamsToJSON(params: URLQueryParam[]): string {
  const obj: Record<string, string | string[]> = {};
  params.forEach(({ key, value }) => {
    const k = key.trim();
    if (!k) return;
    if (obj[k] !== undefined) {
      if (Array.isArray(obj[k])) {
        (obj[k] as string[]).push(value);
      } else {
        obj[k] = [obj[k] as string, value];
      }
    } else {
      obj[k] = value;
    }
  });
  return JSON.stringify(obj, null, 2);
}

/**
 * Reconstructs a full URL string from updated components and query parameters.
 */
export function buildURLFromComponents(
  origin: string,
  pathname: string,
  params: URLQueryParam[],
  hash: string = ""
): string {
  try {
    const base = origin ? origin : "https://example.com";
    const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
    const url = new URL(path, base);

    params.forEach(({ key, value }) => {
      if (key.trim()) {
        url.searchParams.append(key.trim(), value);
      }
    });

    if (hash) {
      url.hash = hash.startsWith("#") ? hash : `#${hash}`;
    }

    return origin ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    const query = params
      .filter((p) => p.key.trim())
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join("&");
    const qs = query ? `?${query}` : "";
    const h = hash ? (hash.startsWith("#") ? hash : `#${hash}`) : "";
    return `${origin}${pathname}${qs}${h}`;
  }
}

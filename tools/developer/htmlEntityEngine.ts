/**
 * Professional HTML Entity Encoding, Decoding, and Security Engine.
 * Supports Named HTML5 entities, Decimal numeric entities, Hexadecimal numeric entities,
 * granular escape scopes, tolerant decoding, XSS vector analysis, and a curated entity reference.
 */

export type HTMLEntityFormat = "named" | "decimal" | "hex";
export type HTMLEscapeScope = "special" | "extended" | "all";

export interface HTMLEntityEncodeOptions {
  format?: HTMLEntityFormat;
  scope?: HTMLEscapeScope;
  encodeQuotes?: boolean;
}

export interface HTMLEntityDecodeOptions {
  strictSemicolons?: boolean;
  recursive?: boolean;
  stripTags?: boolean;
  convertNbspToSpace?: boolean;
}

export interface HTMLEncodeResult {
  output: string;
  charCount: number;
  byteCount: number;
  entitiesGenerated: number;
  xssNeutralized: boolean;
  detectedXssVectors: string[];
}

export interface HTMLDecodeResult {
  output: string;
  charCount: number;
  byteCount: number;
  entitiesDecoded: number;
  namedCount: number;
  decimalCount: number;
  hexCount: number;
  roundsDecoded: number;
  isMultiRound: boolean;
  detectedXssVectors: string[];
}

export interface HTMLEntityReference {
  char: string;
  name: string;
  dec: string;
  hex: string;
  desc: string;
  category: "special" | "typography" | "currency" | "math" | "latin" | "greek";
}

// Full bidirectional named entity dictionary
export const NAMED_ENTITY_MAP: Record<string, string> = {
  // XML / HTML Basic Delimiters
  "&": "amp",
  "<": "lt",
  ">": "gt",
  '"': "quot",
  "'": "apos",

  // Whitespace & Format
  "\u00A0": "nbsp",
  "\u2002": "ensp",
  "\u2003": "emsp",
  "\u2009": "thinsp",
  "\u200C": "zwnj",
  "\u200D": "zwj",

  // Typography & Punctuation
  "©": "copy",
  "®": "reg",
  "™": "trade",
  "—": "mdash",
  "–": "ndash",
  "…": "hellip",
  "‘": "lsquo",
  "’": "rsquo",
  "“": "ldquo",
  "”": "rdquo",
  "‚": "sbquo",
  "„": "bdquo",
  "«": "laquo",
  "»": "raquo",
  "•": "bull",
  "¶": "para",
  "§": "sect",
  "†": "dagger",
  "‡": "Dagger",
  "‰": "permil",
  "′": "prime",
  "″": "Prime",

  // Currency
  "€": "euro",
  "£": "pound",
  "¥": "yen",
  "¢": "cent",
  "¤": "curren",

  // Math & Logic
  "±": "plusmn",
  "×": "times",
  "÷": "divide",
  "≠": "ne",
  "≤": "le",
  "≥": "ge",
  "≈": "asymp",
  "≡": "equiv",
  "∞": "infin",
  "√": "radic",
  "∑": "sum",
  "∏": "prod",
  "∂": "part",
  "∫": "int",
  "°": "deg",
  "µ": "micro",
  "·": "middot",
  "ƒ": "fnof",
  "∀": "forall",
  "∃": "exist",
  "∅": "empty",
  "∈": "isin",
  "∉": "notin",
  "⊂": "sub",
  "⊃": "sup",
  "∠": "ang",
  "∧": "and",
  "∨": "or",
  "∩": "cap",
  "∪": "cup",

  // Latin Accents (Lowercase)
  "à": "agrave",
  "á": "aacute",
  "â": "acirc",
  "ã": "atilde",
  "ä": "auml",
  "å": "aring",
  "æ": "aelig",
  "ç": "ccedil",
  "è": "egrave",
  "é": "eacute",
  "ê": "ecirc",
  "ë": "euml",
  "ì": "igrave",
  "í": "iacute",
  "î": "icirc",
  "ï": "iuml",
  "ñ": "ntilde",
  "ò": "ograve",
  "ó": "oacute",
  "ô": "ocirc",
  "õ": "otilde",
  "ö": "ouml",
  "ø": "oslash",
  "ù": "ugrave",
  "ú": "uacute",
  "û": "ucirc",
  "ü": "uuml",
  "ý": "yacute",
  "ÿ": "yuml",
  "þ": "thorn",
  "ß": "szlig",

  // Latin Accents (Uppercase)
  "À": "Agrave",
  "Á": "Aacute",
  "Â": "Acirc",
  "Ã": "Atilde",
  "Ä": "Auml",
  "Å": "Aring",
  "Æ": "AElig",
  "Ç": "Ccedil",
  "È": "Egrave",
  "É": "Eacute",
  "Ê": "Ecirc",
  "Ë": "Euml",
  "Ì": "Igrave",
  "Í": "Iacute",
  "Î": "Icirc",
  "Ï": "Iuml",
  "Ñ": "Ntilde",
  "Ò": "Ograve",
  "Ó": "Oacute",
  "Ô": "Ocirc",
  "Õ": "Otilde",
  "Ö": "Ouml",
  "Ø": "Oslash",
  "Ù": "Ugrave",
  "Ú": "Uacute",
  "Û": "Ucirc",
  "Ü": "Uuml",
  "Ý": "Yacute",
  "Þ": "THORN",

  // Greek Alphabet
  "α": "alpha",
  "β": "beta",
  "γ": "gamma",
  "δ": "delta",
  "ε": "epsilon",
  "ζ": "zeta",
  "η": "eta",
  "θ": "theta",
  "ι": "iota",
  "κ": "kappa",
  "λ": "lambda",
  "μ": "mu",
  "ν": "nu",
  "ξ": "xi",
  "ο": "omicron",
  "π": "pi",
  "ρ": "rho",
  "σ": "sigma",
  "τ": "tau",
  "υ": "upsilon",
  "φ": "phi",
  "χ": "chi",
  "ψ": "psi",
  "ω": "omega",
  "Α": "Alpha",
  "Β": "Beta",
  "Γ": "Gamma",
  "Δ": "Delta",
  "Ε": "Epsilon",
  "Ζ": "Zeta",
  "Η": "Eta",
  "Θ": "Theta",
  "Ι": "Iota",
  "Κ": "Kappa",
  "Λ": "Lambda",
  "Μ": "Mu",
  "Ν": "Nu",
  "Ξ": "Xi",
  "Ο": "Omicron",
  "Π": "Pi",
  "Ρ": "Rho",
  "Σ": "Sigma",
  "Τ": "Tau",
  "Υ": "Upsilon",
  "Φ": "Phi",
  "Χ": "Chi",
  "Ψ": "Psi",
  "Ω": "Omega",
};

// Inverted lookup map for decoding
export const REVERSE_NAMED_ENTITY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(NAMED_ENTITY_MAP).map(([char, name]) => [name, char])
);

// Curated entity reference table for developer cheatsheet
export const HTML_ENTITY_CATALOG: HTMLEntityReference[] = [
  // Special
  { char: "<", name: "&lt;", dec: "&#60;", hex: "&#x3C;", desc: "Less-than sign", category: "special" },
  { char: ">", name: "&gt;", dec: "&#62;", hex: "&#x3E;", desc: "Greater-than sign", category: "special" },
  { char: "&", name: "&amp;", dec: "&#38;", hex: "&#x26;", desc: "Ampersand delimiter", category: "special" },
  { char: '"', name: "&quot;", dec: "&#34;", hex: "&#x22;", desc: "Double quotation mark", category: "special" },
  { char: "'", name: "&apos;", dec: "&#39;", hex: "&#x27;", desc: "Apostrophe / single quote", category: "special" },
  { char: "`", name: "&#96;", dec: "&#96;", hex: "&#x60;", desc: "Grave accent / backtick", category: "special" },

  // Typography
  { char: "©", name: "&copy;", dec: "&#169;", hex: "&#xA9;", desc: "Copyright symbol", category: "typography" },
  { char: "®", name: "&reg;", dec: "&#174;", hex: "&#xAE;", desc: "Registered trademark", category: "typography" },
  { char: "™", name: "&trade;", dec: "&#8482;", hex: "&#x2122;", desc: "Trademark symbol", category: "typography" },
  { char: "—", name: "&mdash;", dec: "&#8212;", hex: "&#x2014;", desc: "Em dash", category: "typography" },
  { char: "–", name: "&ndash;", dec: "&#8211;", hex: "&#x2013;", desc: "En dash", category: "typography" },
  { char: "…", name: "&hellip;", dec: "&#8230;", hex: "&#x2026;", desc: "Horizontal ellipsis", category: "typography" },
  { char: "“", name: "&ldquo;", dec: "&#8220;", hex: "&#x201C;", desc: "Left double quotation", category: "typography" },
  { char: "”", name: "&rdquo;", dec: "&#8221;", hex: "&#x201D;", desc: "Right double quotation", category: "typography" },
  { char: "‘", name: "&lsquo;", dec: "&#8216;", hex: "&#x2018;", desc: "Left single quotation", category: "typography" },
  { char: "’", name: "&rsquo;", dec: "&#8217;", hex: "&#x2019;", desc: "Right single quotation", category: "typography" },
  { char: "•", name: "&bull;", dec: "&#8226;", hex: "&#x2022;", desc: "Bullet list symbol", category: "typography" },
  { char: "§", name: "&sect;", dec: "&#167;", hex: "&#xA7;", desc: "Section sign", category: "typography" },
  { char: "¶", name: "&para;", dec: "&#182;", hex: "&#xB6;", desc: "Pilcrow / paragraph sign", category: "typography" },

  // Currency
  { char: "€", name: "&euro;", dec: "&#8364;", hex: "&#x20AC;", desc: "Euro sign", category: "currency" },
  { char: "£", name: "&pound;", dec: "&#163;", hex: "&#xA3;", desc: "Pound sterling", category: "currency" },
  { char: "¥", name: "&yen;", dec: "&#165;", hex: "&#xA5;", desc: "Yen / Yuan sign", category: "currency" },
  { char: "¢", name: "&cent;", dec: "&#162;", hex: "&#xA2;", desc: "Cent sign", category: "currency" },
  { char: "¤", name: "&curren;", dec: "&#164;", hex: "&#xA4;", desc: "Generic currency sign", category: "currency" },

  // Math
  { char: "±", name: "&plusmn;", dec: "&#177;", hex: "&#xB1;", desc: "Plus-minus sign", category: "math" },
  { char: "×", name: "&times;", dec: "&#215;", hex: "&#xD7;", desc: "Multiplication sign", category: "math" },
  { char: "÷", name: "&divide;", dec: "&#247;", hex: "&#xF7;", desc: "Division sign", category: "math" },
  { char: "≠", name: "&ne;", dec: "&#8800;", hex: "&#x2260;", desc: "Not equal to", category: "math" },
  { char: "≤", name: "&le;", dec: "&#8804;", hex: "&#x2264;", desc: "Less-than or equal to", category: "math" },
  { char: "≥", name: "&ge;", dec: "&#8805;", hex: "&#x2265;", desc: "Greater-than or equal to", category: "math" },
  { char: "∞", name: "&infin;", dec: "&#8734;", hex: "&#x221E;", desc: "Infinity sign", category: "math" },
  { char: "√", name: "&radic;", dec: "&#8730;", hex: "&#x221A;", desc: "Square root", category: "math" },
  { char: "∑", name: "&sum;", dec: "&#8721;", hex: "&#x2211;", desc: "N-ary summation", category: "math" },
  { char: "∏", name: "&prod;", dec: "&#8719;", hex: "&#x220F;", desc: "N-ary product", category: "math" },
  { char: "°", name: "&deg;", dec: "&#176;", hex: "&#xB0;", desc: "Degree sign", category: "math" },

  // Latin
  { char: "é", name: "&eacute;", dec: "&#233;", hex: "&#xE9;", desc: "Latin e with acute", category: "latin" },
  { char: "è", name: "&egrave;", dec: "&#232;", hex: "&#xE8;", desc: "Latin e with grave", category: "latin" },
  { char: "à", name: "&agrave;", dec: "&#224;", hex: "&#xE0;", desc: "Latin a with grave", category: "latin" },
  { char: "ç", name: "&ccedil;", dec: "&#231;", hex: "&#xE7;", desc: "Latin c with cedilla", category: "latin" },
  { char: "ñ", name: "&ntilde;", dec: "&#241;", hex: "&#xF1;", desc: "Latin n with tilde", category: "latin" },
  { char: "ü", name: "&uuml;", dec: "&#252;", hex: "&#FC;", desc: "Latin u with diaeresis", category: "latin" },
  { char: "ß", name: "&szlig;", dec: "&#223;", hex: "&#xDF;", desc: "Latin sharp s", category: "latin" },

  // Greek
  { char: "π", name: "&pi;", dec: "&#960;", hex: "&#x3C0;", desc: "Greek small letter pi", category: "greek" },
  { char: "α", name: "&alpha;", dec: "&#945;", hex: "&#x3B1;", desc: "Greek small letter alpha", category: "greek" },
  { char: "β", name: "&beta;", dec: "&#946;", hex: "&#x3B2;", desc: "Greek small letter beta", category: "greek" },
  { char: "λ", name: "&lambda;", dec: "&#955;", hex: "&#x3BB;", desc: "Greek small letter lambda", category: "greek" },
  { char: "ω", name: "&omega;", dec: "&#969;", hex: "&#x3C9;", desc: "Greek small letter omega", category: "greek" },
  { char: "Ω", name: "&Omega;", dec: "&#937;", hex: "&#x3A9;", desc: "Greek capital letter Omega", category: "greek" },
];

const XSS_PATTERNS = [
  { name: "<script> tag", regex: /<\s*script\b[^>]*>/i },
  { name: "Inline event handler in HTML tag", regex: /<[^>]*\bon\w+\s*=/i },
  { name: "javascript: URL attribute in HTML tag", regex: /<[^>]*\b(?:href|src)\s*=\s*['"]?\s*javascript:/i },
  { name: "<iframe> tag injection", regex: /<\s*iframe\b[^>]*>/i },
  { name: "<object> or <embed> tag", regex: /<\s*(?:object|embed)\b[^>]*>/i },
  { name: "<svg> event injection", regex: /<\s*svg\b[^>]*\bon\w+/i },
];

export function detectXSSVectors(text: string): string[] {
  const detected: string[] = [];
  for (const { name, regex } of XSS_PATTERNS) {
    if (regex.test(text)) {
      detected.push(name);
    }
  }
  return detected;
}

/**
 * Encodes a string into HTML entities according to specified format and scope.
 */
export function encodeHTMLEntities(
  input: string,
  options: HTMLEntityEncodeOptions = {}
): HTMLEncodeResult {
  const { format = "named", scope = "special", encodeQuotes = true } = options;

  if (!input) {
    return {
      output: "",
      charCount: 0,
      byteCount: 0,
      entitiesGenerated: 0,
      xssNeutralized: false,
      detectedXssVectors: [],
    };
  }

  const detectedBefore = detectXSSVectors(input);
  let entitiesCount = 0;

  // Single-character entity formatter
  const formatChar = (ch: string, codePoint: number): string => {
    entitiesCount++;
    if (format === "named") {
      if (NAMED_ENTITY_MAP[ch]) {
        return `&${NAMED_ENTITY_MAP[ch]};`;
      }
      return `&#${codePoint};`;
    } else if (format === "hex") {
      return `&#x${codePoint.toString(16).toUpperCase()};`;
    } else {
      return `&#${codePoint};`;
    }
  };

  let result = "";

  for (const ch of input) {
    const codePoint = ch.codePointAt(0) || ch.charCodeAt(0);

    // Filter by quotes option
    if (!encodeQuotes && (ch === '"' || ch === "'")) {
      result += ch;
      continue;
    }

    if (scope === "special") {
      // Basic HTML special chars: <, >, &, ", ', `
      if (ch === "<" || ch === ">" || ch === "&" || ch === '"' || ch === "'" || ch === "`") {
        result += formatChar(ch, codePoint);
      } else {
        result += ch;
      }
    } else if (scope === "extended") {
      // Special characters + all characters outside ASCII printable range (32-126)
      if (
        ch === "<" ||
        ch === ">" ||
        ch === "&" ||
        ch === '"' ||
        ch === "'" ||
        ch === "`" ||
        codePoint > 126 ||
        codePoint < 32
      ) {
        if (ch === "\n" || ch === "\r" || ch === "\t") {
          result += ch; // preserve standard whitespace
        } else {
          result += formatChar(ch, codePoint);
        }
      } else {
        result += ch;
      }
    } else if (scope === "all") {
      // Escape every character
      if (ch === "\n" || ch === "\r" || ch === "\t") {
        result += ch;
      } else {
        result += formatChar(ch, codePoint);
      }
    }
  }

  const detectedAfter = detectXSSVectors(result);
  const xssNeutralized = detectedBefore.length > 0 && detectedAfter.length === 0;
  const byteCount = typeof Blob !== "undefined" ? new Blob([result]).size : Buffer.byteLength(result, "utf8");

  return {
    output: result,
    charCount: result.length,
    byteCount,
    entitiesGenerated: entitiesCount,
    xssNeutralized,
    detectedXssVectors: detectedBefore,
  };
}

/**
 * Strips HTML tags and preserves readable spacing.
 */
export function stripHTMLTags(html: string): string {
  return html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<(?:br|\/p|\/div|\/li|\/tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

/**
 * Cleanly indents and formats raw HTML tags for readable inspection.
 */
export function formatHTMLMarkup(html: string): string {
  if (!html.trim()) return "";
  let indent = 0;
  const lines = html
    .replace(/>\s*</g, ">\n<")
    .split("\n")
    .map((rawLine) => {
      const line = rawLine.trim();
      if (!line) return "";
      if (line.match(/^<\/\w/)) {
        indent = Math.max(0, indent - 1);
      }
      const padded = "  ".repeat(indent) + line;
      // Opening tag that is not self-closing or void element
      if (
        line.match(/^<[a-zA-Z0-9]+[^>]*[^\/]>/) &&
        !line.match(/^<(?:input|link|meta|img|br|hr|wbr|area|base|col|embed|param|source|track)\b/i) &&
        !line.match(/<\/[a-zA-Z0-9]+>$/)
      ) {
        indent++;
      }
      return padded;
    })
    .filter(Boolean);

  return lines.join("\n");
}

/**
 * Universal tolerant HTML entity decoder.
 * Handles Named entities, Decimal numeric entities, Hexadecimal numeric entities,
 * 4-byte Unicode emojis, recursive multi-round decoding, tag stripping, and &nbsp; normalization.
 */
export function decodeHTMLEntities(
  input: string,
  options: HTMLEntityDecodeOptions = {}
): HTMLDecodeResult {
  const {
    recursive = false,
    stripTags = false,
    convertNbspToSpace = true,
  } = options;

  if (!input) {
    return {
      output: "",
      charCount: 0,
      byteCount: 0,
      entitiesDecoded: 0,
      namedCount: 0,
      decimalCount: 0,
      hexCount: 0,
      roundsDecoded: 0,
      isMultiRound: false,
      detectedXssVectors: [],
    };
  }

  let totalNamed = 0;
  let totalDecimal = 0;
  let totalHex = 0;
  let totalDecoded = 0;
  let rounds = 0;
  let current = input;

  const maxRounds = recursive ? 5 : 1;
  const entityRegex = /&(?:#x([0-9a-fA-F]+);?|#([0-9]+);?|([a-zA-Z0-9]+);|([a-zA-Z]+)(?![a-zA-Z0-9]))/g;

  for (let r = 0; r < maxRounds; r++) {
    if (!current.includes("&")) break;

    let roundMatches = 0;
    const next = current.replace(entityRegex, (match, hex, dec, nameWithSemi, nameWithoutSemi) => {
      try {
        if (hex) {
          const cp = parseInt(hex, 16);
          if (!isNaN(cp) && cp >= 0 && cp <= 0x10ffff) {
            roundMatches++;
            totalHex++;
            return String.fromCodePoint(cp);
          }
        } else if (dec) {
          const cp = parseInt(dec, 10);
          if (!isNaN(cp) && cp >= 0 && cp <= 0x10ffff) {
            roundMatches++;
            totalDecimal++;
            return String.fromCodePoint(cp);
          }
        } else {
          const entityName = nameWithSemi || nameWithoutSemi;
          if (entityName) {
            let ch = REVERSE_NAMED_ENTITY_MAP[entityName];
            if (!ch) {
              ch = REVERSE_NAMED_ENTITY_MAP[entityName.toLowerCase()];
            }
            if (ch) {
              roundMatches++;
              totalNamed++;
              if (convertNbspToSpace && ch === "\u00A0") {
                return " ";
              }
              return ch;
            }
          }
        }
      } catch {
        return match;
      }
      return match;
    });

    if (roundMatches === 0 || next === current) {
      break;
    }
    current = next;
    totalDecoded += roundMatches;
    rounds++;
  }

  if (convertNbspToSpace) {
    current = current.replace(/\u00A0/g, " ");
  }

  if (stripTags) {
    current = stripHTMLTags(current);
  }

  const detectedXssVectors = detectXSSVectors(current);
  const byteCount = typeof Blob !== "undefined" ? new Blob([current]).size : Buffer.byteLength(current, "utf8");

  return {
    output: current,
    charCount: current.length,
    byteCount,
    entitiesDecoded: totalDecoded,
    namedCount: totalNamed,
    decimalCount: totalDecimal,
    hexCount: totalHex,
    roundsDecoded: rounds || 1,
    isMultiRound: rounds > 1,
    detectedXssVectors,
  };
}

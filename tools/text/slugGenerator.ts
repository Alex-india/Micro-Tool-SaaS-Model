export interface SlugOptions {
  separator: string;
  casing: "lower" | "upper" | "title" | "preserve";
  removeStopWords: boolean;
  removeNumbers: boolean;
  transliterate: boolean;
  maxLength: number;
  prefix: string;
  suffix: string;
}

export const DEFAULT_SLUG_OPTIONS: SlugOptions = {
  separator: "-",
  casing: "lower",
  removeStopWords: false,
  removeNumbers: false,
  transliterate: true,
  maxLength: 80,
  prefix: "",
  suffix: "",
};

export const COMMON_STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
  "can", "could", "did", "do", "does", "doing", "down", "during",
  "each", "few", "for", "from", "further",
  "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
  "i", "if", "in", "into", "is", "it", "its", "itself",
  "just", "me", "more", "most", "my", "myself",
  "no", "nor", "not", "now", "of", "off", "on", "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own",
  "same", "she", "should", "so", "some", "such",
  "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too",
  "under", "until", "up", "very",
  "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with",
  "you", "your", "yours", "yourself", "yourselves"
]);

// Accented characters transliteration map
const TRANSLITERATION_MAP: Record<string, string> = {
  à: "a", á: "a", â: "a", ã: "a", ä: "a", å: "a", æ: "ae", ā: "a",
  ç: "c", ć: "c", č: "c",
  è: "e", é: "e", ê: "e", ë: "e", ē: "e", ė: "e", ę: "e",
  ì: "i", í: "i", î: "i", ï: "i", ī: "i",
  ñ: "n", ń: "n",
  ò: "o", ó: "o", ô: "o", õ: "o", ö: "o", ø: "o", ō: "o", œ: "oe",
  ù: "u", ú: "u", û: "u", ü: "u", ū: "u",
  ý: "y", ÿ: "y",
  ž: "z", ź: "z", ż: "z",
  ß: "ss",
  À: "A", Á: "A", Â: "A", Ã: "A", Ä: "A", Å: "A", Æ: "AE",
  Ç: "C", Ć: "C", Č: "C",
  È: "E", É: "E", Ê: "E", Ë: "E",
  Ì: "I", Í: "I", Î: "I", Ï: "I",
  Ñ: "N",
  Ò: "O", Ó: "O", Ô: "O", Õ: "O", Ö: "O", Ø: "O",
  Ù: "U", Ú: "U", Û: "U", Ü: "U",
  Ý: "Y", Ž: "Z",
  "&": "and", "@": "at", "%": "percent"
};

export function generateSlug(text: string, options: Partial<SlugOptions> = {}): string {
  if (!text || !text.trim()) return "";

  const opts: SlugOptions = { ...DEFAULT_SLUG_OPTIONS, ...options };
  let processed = text.trim();

  // 1. Transliteration of accents and special symbols
  if (opts.transliterate) {
    for (const [char, replacement] of Object.entries(TRANSLITERATION_MAP)) {
      processed = processed.split(char).join(replacement);
    }
    // Decompose Unicode accents
    processed = processed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // 2. Remove punctuation and invalid chars (keep letters, digits, whitespace)
  processed = processed.replace(/[^\w\s-]/g, " ");

  // 3. Remove Numbers if option enabled
  if (opts.removeNumbers) {
    processed = processed.replace(/\d+/g, " ");
  }

  // 4. Tokenize words
  let words = processed.split(/\s+/).filter(Boolean);

  // 5. Remove Stop Words if enabled
  if (opts.removeStopWords) {
    const filtered = words.filter((w) => !COMMON_STOP_WORDS.has(w.toLowerCase()));
    if (filtered.length > 0) {
      words = filtered;
    }
  }

  if (words.length === 0) return "";

  // 6. Apply Casing
  words = words.map((word) => {
    switch (opts.casing) {
      case "lower":
        return word.toLowerCase();
      case "upper":
        return word.toUpperCase();
      case "title":
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      case "preserve":
      default:
        return word;
    }
  });

  // 7. Join with Separator
  let slug = words.join(opts.separator);

  // 8. Max Length truncation (preserving full words)
  if (opts.maxLength > 0 && slug.length > opts.maxLength) {
    const truncated = slug.slice(0, opts.maxLength);
    const lastSepIndex = opts.separator ? truncated.lastIndexOf(opts.separator) : -1;
    if (lastSepIndex > 0) {
      slug = truncated.slice(0, lastSepIndex);
    } else {
      slug = truncated;
    }
  }

  // 9. Clean multiple consecutive separators & trim edges
  if (opts.separator) {
    const escapedSep = opts.separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    slug = slug.replace(new RegExp(`${escapedSep}+`, "g"), opts.separator);
    slug = slug.replace(new RegExp(`^${escapedSep}+|${escapedSep}+$`, "g"), "");
  }

  // 10. Prepend Prefix & Append Suffix
  if (opts.prefix) {
    const p = opts.prefix.endsWith("/") || opts.prefix.endsWith("-") ? opts.prefix : `${opts.prefix}/`;
    slug = `${p}${slug}`;
  }
  if (opts.suffix) {
    slug = `${slug}${opts.suffix}`;
  }

  return slug;
}

export function analyzeSlugSEO(slug: string) {
  const clean = slug.replace(/https?:\/\/[^/]+\//, "");
  const length = clean.length;
  const wordCount = clean.split(/[-_./~]/).filter(Boolean).length;

  let lengthStatus: "optimal" | "warning" | "bad" = "optimal";
  let lengthMessage = "Optimal length for search engines";

  if (length === 0) {
    lengthStatus = "warning";
    lengthMessage = "Slug is empty";
  } else if (length < 10) {
    lengthStatus = "optimal";
    lengthMessage = "Short & punchy slug";
  } else if (length <= 60) {
    lengthStatus = "optimal";
    lengthMessage = "Ideal SEO slug length (under 60 chars)";
  } else if (length <= 80) {
    lengthStatus = "warning";
    lengthMessage = "Slightly long, consider trimming stop words";
  } else {
    lengthStatus = "bad";
    lengthMessage = "Too long! URLs over 80 chars may get truncated in SERPs";
  }

  return {
    length,
    wordCount,
    lengthStatus,
    lengthMessage,
    hasNumbers: /\d/.test(clean),
    hasSpecialChars: /[^\w\-./~]/.test(clean),
  };
}

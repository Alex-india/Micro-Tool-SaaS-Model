export interface PasswordConfig {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
  excludeCustom?: string;
  isPronounceable?: boolean;
  count?: number;
}

export const SIMILAR_CHARACTERS = "il1Lo0OI|`'\";:.,";

export interface PasswordResult {
  password: string;
  passwordsList: string[];
  entropy: number;
  strength: "Weak" | "Fair" | "Strong" | "Very Strong";
  crackTimeText: string;
  isValid: boolean;
  errorMessage?: string;
}

const CONSONANTS = "bcdfghjklmnpqrstvwxyz";
const VOWELS = "aeiou";

function generatePronounceableWord(length: number, config: PasswordConfig): string {
  let word = "";
  let useConsonant = true;
  const customExclude = new Set((config.excludeCustom || "").split(""));
  const similarSet = config.excludeAmbiguous ? new Set(SIMILAR_CHARACTERS.split("")) : new Set();

  const filterChars = (chars: string) =>
    chars.split("").filter((c) => !customExclude.has(c) && !similarSet.has(c)).join("") || chars;

  const validConsonants = filterChars(CONSONANTS);
  const validVowels = filterChars(VOWELS);

  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    const pool = useConsonant ? validConsonants : validVowels;
    let char = pool[randomValues[i] % pool.length];
    if (config.includeUppercase && (i === 0 || i % 4 === 0)) {
      char = char.toUpperCase();
    }
    word += char;
    useConsonant = !useConsonant;
  }

  // Inject numbers and symbols if requested
  if (config.includeNumbers && length > 3) {
    const num = Math.floor(10 + Math.random() * 90);
    word = word.slice(0, Math.max(1, length - 2)) + num;
  }

  if (config.includeSymbols && length > 4) {
    const syms = "!@#$%^&*";
    const sym = syms[Math.floor(Math.random() * syms.length)];
    word = word.slice(0, Math.max(1, length - 1)) + sym;
  }

  return word.slice(0, length);
}

export function generatePassword(config: PasswordConfig): PasswordResult {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeAmbiguous = false,
    excludeCustom = "",
    isPronounceable = false,
    count = 1,
  } = config;

  // Guard: if standard mode and no character set is selected
  if (!isPronounceable && !includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
    return {
      password: "",
      passwordsList: [],
      entropy: 0,
      strength: "Weak",
      crackTimeText: "--",
      isValid: false,
      errorMessage: "Please select at least one character type (Uppercase, Lowercase, Numbers, or Symbols).",
    };
  }

  // Pronounceable Mode
  if (isPronounceable) {
    const passwordsList: string[] = [];
    const totalCount = Math.min(50, Math.max(1, count));
    for (let i = 0; i < totalCount; i++) {
      passwordsList.push(generatePronounceableWord(length, config));
    }

    const entropy = Math.round(length * 3.8 + (includeNumbers ? 6 : 0) + (includeSymbols ? 5 : 0));
    let strength: "Weak" | "Fair" | "Strong" | "Very Strong" = "Fair";
    let crackTimeText = "A few days";

    if (entropy >= 70) {
      strength = "Very Strong";
      crackTimeText = "~1.2 million years";
    } else if (entropy >= 50) {
      strength = "Strong";
      crackTimeText = "~5,000 years";
    }

    return {
      password: passwordsList[0] || "",
      passwordsList,
      entropy,
      strength,
      crackTimeText,
      isValid: true,
    };
  }

  // Standard Mode
  let upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let lower = "abcdefghijklmnopqrstuvwxyz";
  let numbers = "0123456789";
  let symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  if (excludeAmbiguous) {
    const ambiguousRegex = new RegExp(`[${SIMILAR_CHARACTERS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}]`, "g");
    upper = upper.replace(ambiguousRegex, "");
    lower = lower.replace(ambiguousRegex, "");
    numbers = numbers.replace(ambiguousRegex, "");
    symbols = symbols.replace(ambiguousRegex, "");
  }

  if (excludeCustom && excludeCustom.trim()) {
    const customChars = new Set(excludeCustom.split(""));
    upper = upper.split("").filter((c) => !customChars.has(c)).join("");
    lower = lower.split("").filter((c) => !customChars.has(c)).join("");
    numbers = numbers.split("").filter((c) => !customChars.has(c)).join("");
    symbols = symbols.split("").filter((c) => !customChars.has(c)).join("");
  }

  let charset = "";
  if (includeUppercase) charset += upper;
  if (includeLowercase) charset += lower;
  if (includeNumbers) charset += numbers;
  if (includeSymbols) charset += symbols;

  if (!charset) {
    return {
      password: "",
      passwordsList: [],
      entropy: 0,
      strength: "Weak",
      crackTimeText: "--",
      isValid: false,
      errorMessage: "All available characters were excluded. Please relax custom exclusion filters.",
    };
  }

  const passwordsList: string[] = [];
  const totalCount = Math.min(50, Math.max(1, count));

  for (let c = 0; c < totalCount; c++) {
    let pwd = "";
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      pwd += charset[randomValues[i] % charset.length];
    }
    passwordsList.push(pwd);
  }

  const primaryPassword = passwordsList[0] || "";

  // Calculate Entropy
  const charsetSize = charset.length;
  const entropy = Math.round(length * (Math.log2(charsetSize) || 1));

  let strength: "Weak" | "Fair" | "Strong" | "Very Strong" = "Weak";
  let crackTimeText = "Instantly";

  if (entropy < 40) {
    strength = "Weak";
    crackTimeText = "A few seconds";
  } else if (entropy < 60) {
    strength = "Fair";
    crackTimeText = "A few days";
  } else if (entropy < 80) {
    strength = "Strong";
    crackTimeText = "~2,500 years";
  } else {
    strength = "Very Strong";
    crackTimeText = "~3.4 trillion years";
  }

  return {
    password: primaryPassword,
    passwordsList,
    entropy,
    strength,
    crackTimeText,
    isValid: true,
  };
}

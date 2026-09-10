export interface PasswordConfig {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
  count?: number;
}

export interface PasswordResult {
  password: string;
  passwordsList: string[];
  entropy: number;
  strength: "Weak" | "Fair" | "Strong" | "Very Strong";
  crackTimeText: string;
}

export function generatePassword(config: PasswordConfig): PasswordResult {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeAmbiguous = false,
    count = 1,
  } = config;

  let upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let lower = "abcdefghijklmnopqrstuvwxyz";
  let numbers = "0123456789";
  let symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  if (excludeAmbiguous) {
    upper = upper.replace(/[OI]/g, "");
    lower = lower.replace(/[l]/g, "");
    numbers = numbers.replace(/[01]/g, "");
  }

  let charset = "";
  if (includeUppercase) charset += upper;
  if (includeLowercase) charset += lower;
  if (includeNumbers) charset += numbers;
  if (includeSymbols) charset += symbols;

  if (!charset) charset = lower + numbers;

  const passwordsList: string[] = [];

  for (let c = 0; c < Math.min(100, Math.max(1, count)); c++) {
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
  };
}

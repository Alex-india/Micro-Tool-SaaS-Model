import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const AMBIGUOUS = "iIlL1oO0sS5zZ2`'\"~,;:.<>{}[]()/\\";

const PASSPHRASE_WORDS = [
  "apple", "beacon", "castle", "desert", "eagle", "forest", "galaxy", "harbor", "island",
  "jungle", "knight", "lagoon", "meadow", "nebula", "ocean", "palace", "quartz", "river",
  "shadow", "timber", "umbrella", "valley", "whisper", "zenith", "crystal", "breeze", "thunder",
  "planet", "silver", "golden", "aurora", "comet", "falcon", "glacier", "horizon", "ignite",
  "journey", "kinetic", "lunar", "mystic", "nomad", "orbit", "phoenix", "radiant", "stellar",
  "twilight", "utopia", "vortex", "wildlife", "zigzag", "amber", "blizzard", "canyon", "driftwood",
  "emerald", "flame", "granite", "haven", "infinity", "jupiter", "karma", "lantern", "miracle",
];

function calculateCrackTime(entropy: number): string {
  if (entropy < 28) return "Instant (< 1 millisecond)";
  if (entropy < 36) return "A few seconds";
  if (entropy < 60) return "A few days to months";
  if (entropy < 80) return "Hundreds to thousands of years";
  if (entropy < 100) return "Millions of years";
  return "Trillions of centuries";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type: "password" | "passphrase" = body.type || "password";

    if (type === "passphrase") {
      const wordCount: number = Math.max(3, Math.min(12, body.wordCount || 4));
      const separator: string = body.separator !== undefined ? body.separator : "-";
      const capitalize: boolean = body.capitalize !== false;
      const includeNumber: boolean = body.includeNumber !== false;

      const words: string[] = [];
      for (let i = 0; i < wordCount; i++) {
        const randomIdx = crypto.randomInt(0, PASSPHRASE_WORDS.length);
        let word = PASSPHRASE_WORDS[randomIdx];
        if (capitalize) word = word.charAt(0).toUpperCase() + word.slice(1);
        words.push(word);
      }

      let phrase = words.join(separator);
      if (includeNumber) {
        phrase += separator + crypto.randomInt(10, 99);
      }

      const entropy = Math.round(wordCount * 13.5 + (includeNumber ? 6.6 : 0));

      return NextResponse.json({
        success: true,
        data: {
          type: "passphrase",
          password: phrase,
          entropy,
          crackTime: calculateCrackTime(entropy),
          strength: entropy >= 70 ? "Very Strong" : "Strong",
        },
      });
    }

    // Standard Password Generator
    const length: number = Math.max(4, Math.min(256, body.length || 16));
    const includeUppercase: boolean = body.includeUppercase !== false;
    const includeLowercase: boolean = body.includeLowercase !== false;
    const includeNumbers: boolean = body.includeNumbers !== false;
    const includeSymbols: boolean = body.includeSymbols !== false;
    const excludeAmbiguous: boolean = body.excludeAmbiguous === true;
    const excludeCustom: string = body.excludeCustom || "";
    const count: number = Math.max(1, Math.min(100, body.count || 1));

    let pool = "";
    if (includeUppercase) pool += UPPERCASE;
    if (includeLowercase) pool += LOWERCASE;
    if (includeNumbers) pool += NUMBERS;
    if (includeSymbols) pool += SYMBOLS;

    if (excludeAmbiguous) {
      pool = pool
        .split("")
        .filter((c) => !AMBIGUOUS.includes(c))
        .join("");
    }

    if (excludeCustom) {
      pool = pool
        .split("")
        .filter((c) => !excludeCustom.includes(c))
        .join("");
    }

    if (!pool) {
      return NextResponse.json(
        { success: false, error: "Please select at least one character type" },
        { status: 400 }
      );
    }

    const passwordsList: string[] = [];
    for (let c = 0; c < count; c++) {
      let pwd = "";
      for (let i = 0; i < length; i++) {
        const randIndex = crypto.randomInt(0, pool.length);
        pwd += pool[randIndex];
      }
      passwordsList.push(pwd);
    }

    const poolSize = pool.length;
    const entropy = Math.round(length * Math.log2(poolSize));
    let strength = "Very Weak";
    if (entropy >= 80) strength = "Very Strong";
    else if (entropy >= 60) strength = "Strong";
    else if (entropy >= 40) strength = "Moderate";
    else if (entropy >= 28) strength = "Weak";

    return NextResponse.json({
      success: true,
      data: {
        type: "password",
        password: passwordsList[0],
        passwordsList,
        count: passwordsList.length,
        entropy,
        crackTime: calculateCrackTime(entropy),
        strength,
        charsetSize: poolSize,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate password" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

// Character flip mapping for upside down text
const FLIP_MAP: Record<string, string> = {
  a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ",
  j: "ɾ", k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ",
  s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z",
  A: "∀", B: "𐐒", C: "Ɔ", D: "p", E: "Ǝ", F: "Ⅎ", G: "⅁", H: "H", I: "I",
  J: "ſ", K: "ʞ", L: "˥", M: "W", N: "N", O: "O", P: "Ԁ", Q: "Ò", R: "ɹ",
  S: "S", t: "┴", U: "∩", V: "Λ", W: "M", X: "X", Y: "⅄", Z: "Z",
  "0": "0", "1": "Ɩ", "2": "ᄅ", "3": "Ɛ", "4": "ㄣ", "5": "ϛ", "6": "9", "7": "ㄥ", "8": "8", "9": "6",
  "?": "¿", "!": "¡", ".": "˙", ",": "'", "'": ",", "\"": "„", "<": ">", ">": "<",
  "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "_": "‾"
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body.text || "";
    const operation: string = body.operation || "upper";
    const options: any = body.options || {};

    let result = text;
    let stats: Record<string, any> = {};

    switch (operation) {
      // 1. Case Conversions
      case "upper":
        result = text.toUpperCase();
        break;

      case "lower":
        result = text.toLowerCase();
        break;

      case "title":
        result = text.replace(
          /\w\S*/g,
          (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
        );
        break;

      case "sentence":
        result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
        break;

      case "camel":
        result = text
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase()
          )
          .replace(/[\s-_]+/g, "");
        break;

      case "pascal":
        result = text
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
          .replace(/[\s-_]+/g, "");
        break;

      case "snake":
        result = text
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, "_")
          .replace(/[^\w_]/g, "");
        break;

      case "kebab":
      case "slug":
        result = text
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");
        break;

      case "constant":
        result = text
          .trim()
          .toUpperCase()
          .replace(/[\s-]+/g, "_")
          .replace(/[^\w_]/g, "");
        break;

      case "dot":
        result = text
          .trim()
          .toLowerCase()
          .replace(/[\s-_]+/g, ".")
          .replace(/[^\w.]/g, "");
        break;

      case "path":
        result = text
          .trim()
          .toLowerCase()
          .replace(/[\s-_]+/g, "/")
          .replace(/[^\w\/]/g, "");
        break;

      case "alternating":
        result = text
          .split("")
          .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
          .join("");
        break;

      case "inverse":
        result = text
          .split("")
          .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
          .join("");
        break;

      // 2. Line Sorting & Manipulation
      case "sort-asc": {
        const lines = text.split("\n");
        result = lines.sort().join("\n");
        stats = { totalLines: lines.length };
        break;
      }

      case "sort-desc": {
        const lines = text.split("\n");
        result = lines.sort().reverse().join("\n");
        stats = { totalLines: lines.length };
        break;
      }

      case "sort-natural": {
        const lines = text.split("\n");
        result = lines
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
          .join("\n");
        stats = { totalLines: lines.length };
        break;
      }

      case "sort-numeric": {
        const lines = text.split("\n");
        result = lines
          .sort((a, b) => {
            const numA = parseFloat(a.match(/-?\d+(\.\d+)?/)?.[0] || "0");
            const numB = parseFloat(b.match(/-?\d+(\.\d+)?/)?.[0] || "0");
            return numA - numB;
          })
          .join("\n");
        stats = { totalLines: lines.length };
        break;
      }

      case "sort-length-asc": {
        const lines = text.split("\n");
        result = lines.sort((a, b) => a.length - b.length).join("\n");
        stats = { totalLines: lines.length };
        break;
      }

      case "sort-length-desc": {
        const lines = text.split("\n");
        result = lines.sort((a, b) => b.length - a.length).join("\n");
        stats = { totalLines: lines.length };
        break;
      }

      case "sort-shuffle": {
        const lines = text.split("\n");
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        result = lines.join("\n");
        stats = { totalLines: lines.length };
        break;
      }

      // 3. Remove Duplicates
      case "remove-duplicates": {
        const caseSensitive = options.caseSensitive !== false;
        const trimLines = options.trimLines === true;
        const removeEmpty = options.removeEmpty === true;

        const lines = text.split("\n");
        const seen = new Set<string>();
        const unique: string[] = [];

        for (const line of lines) {
          let processed = trimLines ? line.trim() : line;
          if (removeEmpty && !processed) continue;

          const key = caseSensitive ? processed : processed.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(processed);
          }
        }

        result = unique.join("\n");
        stats = {
          originalLines: lines.length,
          uniqueLines: unique.length,
          duplicatesRemoved: lines.length - unique.length,
        };
        break;
      }

      // 4. Text Reversals
      case "reverse-chars":
        result = text.split("").reverse().join("");
        break;

      case "reverse-words":
        result = text
          .split("\n")
          .map((line) => line.split(/\s+/).reverse().join(" "))
          .join("\n");
        break;

      case "reverse-lines":
        result = text.split("\n").reverse().join("\n");
        break;

      case "flip-text": {
        result = text
          .split("")
          .map((c) => FLIP_MAP[c] || c)
          .reverse()
          .join("");
        break;
      }

      // 5. Cleansers
      case "remove-extra-spaces":
        result = text.replace(/[ \t]+/g, " ").trim();
        break;

      case "remove-line-breaks":
        result = text.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ").trim();
        break;

      case "strip-empty-lines":
        result = text
          .split("\n")
          .filter((l) => l.trim().length > 0)
          .join("\n");
        break;

      case "add-line-numbers":
        result = text
          .split("\n")
          .map((l, i) => `${(i + 1).toString().padStart(3, " ")}. ${l}`)
          .join("\n");
        break;

      case "find-replace": {
        const findStr = options.find || "";
        const replaceStr = options.replace || "";
        if (findStr) {
          const flags = options.caseSensitive ? "g" : "gi";
          const regex = new RegExp(findStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
          result = text.replace(regex, replaceStr);
        }
        break;
      }

      default:
        result = text;
    }

    return NextResponse.json({
      success: true,
      data: {
        result,
        operation,
        stats,
        length: result.length,
        lines: result ? result.split("\n").length : 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Text transformation failed" },
      { status: 500 }
    );
  }
}

/**
 * Comprehensive Regular Expression Testing and Evaluation Engine.
 * Supports JavaScript regex evaluation, flag management, highlight segmentation,
 * capture group extraction, replacement previews, common pattern library, and multi-language code generation.
 */

export interface RegexCaptureGroup {
  number: number;
  name?: string;
  value: string;
}

export interface RegexMatchItem {
  matchNumber: number;
  fullMatch: string;
  startIndex: number;
  endIndex: number;
  groups: RegexCaptureGroup[];
}

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
  matchNumber?: number;
  matchIndex?: number;
}

export interface RegexEvaluationResult {
  isValid: boolean;
  error?: string;
  pattern: string;
  flags: string;
  matches: RegexMatchItem[];
  totalMatches: number;
  highlightSegments: HighlightSegment[];
  replacementResult?: string;
  executionTimeMs: number;
}

export interface CommonPattern {
  id: string;
  name: string;
  description: string;
  pattern: string;
  flags: string;
  sampleText: string;
}

export const COMMON_PATTERNS: CommonPattern[] = [
  {
    id: "email",
    name: "Email Address",
    description: "Matches standard RFC 5322 compliant email addresses.",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    flags: "g",
    sampleText: "Contact us at support@toolverse.app, alex.rivera@company.co.uk or test_user12@sub.domain.org for inquiries.",
  },
  {
    id: "url",
    name: "HTTP / HTTPS URL",
    description: "Matches web URLs with protocol, domain, port, and path.",
    pattern: "https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)",
    flags: "g",
    sampleText: "Check out https://toolverse.app/developer/regex-tester and http://localhost:3000/api/v1/users?page=2&limit=50 for details.",
  },
  {
    id: "ipv4",
    name: "IPv4 Address",
    description: "Matches valid IPv4 addresses in dotted decimal notation (0.0.0.0 to 255.255.255.255).",
    pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b",
    flags: "g",
    sampleText: "Server connections received from 192.168.1.1, 10.0.0.254, and external gateway 172.217.16.206. Invalid: 999.999.1.1",
  },
  {
    id: "hexcolor",
    name: "Hex Color Code",
    description: "Matches 3, 6, or 8-digit CSS hex color codes (including alpha channel).",
    pattern: "#(?:[a-fA-F0-9]{8}|[a-fA-F0-9]{6}|[a-fA-F0-9]{3})\\b",
    flags: "g",
    sampleText: "Theme colors: Primary #3b82f6, accent #10b981, background #0f172a, transparent overlay #00000080, short #fff.",
  },
  {
    id: "iso_date",
    name: "ISO 8601 Date (YYYY-MM-DD)",
    description: "Matches YYYY-MM-DD calendar dates with month and day boundary checking.",
    pattern: "\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b",
    flags: "g",
    sampleText: "Project milestones: Kickoff 2024-01-15, Beta release 2024-06-30, and Production launch 2024-12-01.",
  },
  {
    id: "uuid",
    name: "UUID / GUID",
    description: "Matches 8-4-4-4-12 hexadecimal UUID strings (v1 through v7).",
    pattern: "\\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-7][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\\b",
    flags: "g",
    sampleText: "Generated records: id=f47ac10b-58cc-4372-a567-0e02b2c3d479 and session=018e6e58-6c00-72cb-881c-0b8982a74c3e.",
  },
  {
    id: "phone",
    name: "Phone Number (US / Intl)",
    description: "Matches US and international phone number formats.",
    pattern: "(?:\\+?\\d{1,3}[-.\s]?)?\\(?\\d{3}\\)?[-.\s]?\\d{3}[-.\s]?\\d{4}",
    flags: "g",
    sampleText: "Call us at +1 (555) 234-5678, 555-876-5432, or international office +44 20 7946 0919.",
  },
  {
    id: "html_tag",
    name: "HTML / XML Tags",
    description: "Matches HTML element opening and closing tags with attributes.",
    pattern: "<\\/?([a-zA-Z0-9]+)(?:\\s+[^>]*)?>",
    flags: "g",
    sampleText: '<div class="card"><h1 id="title">ToolVerse</h1><p>Fast offline tools.</p><br/></div>',
  },
  {
    id: "slug",
    name: "URL Slug",
    description: "Matches lowercase alphanumeric strings separated by hyphens.",
    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
    flags: "",
    sampleText: "unix-timestamp-converter",
  },
];

/**
 * Validates and tests a regular expression against test input text.
 * Generates match metadata, highlight slices, and replacement preview.
 */
export function evaluateRegex(
  pattern: string,
  flags: string,
  testText: string,
  replacementText: string = ""
): RegexEvaluationResult {
  const startTime = performance.now();

  if (!pattern) {
    return {
      isValid: true,
      pattern: "",
      flags,
      matches: [],
      totalMatches: 0,
      highlightSegments: testText ? [{ text: testText, isMatch: false }] : [],
      replacementResult: testText,
      executionTimeMs: 0,
    };
  }

  // Validate flags (g, i, m, s, u, y)
  const validFlags = flags.replace(/[^gimsuy]/g, "");
  const uniqueFlags = Array.from(new Set(validFlags)).join("");

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, uniqueFlags);
  } catch (err: any) {
    return {
      isValid: false,
      error: err.message || "Invalid regular expression pattern.",
      pattern,
      flags: uniqueFlags,
      matches: [],
      totalMatches: 0,
      highlightSegments: testText ? [{ text: testText, isMatch: false }] : [],
      executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
    };
  }

  if (!testText) {
    return {
      isValid: true,
      pattern,
      flags: uniqueFlags,
      matches: [],
      totalMatches: 0,
      highlightSegments: [],
      replacementResult: "",
      executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
    };
  }

  const matches: RegexMatchItem[] = [];
  const maxMatchesLimit = 1000;

  try {
    if (uniqueFlags.includes("g")) {
      let match: RegExpExecArray | null;
      let loopCount = 0;

      while ((match = regex.exec(testText)) !== null) {
        loopCount++;
        if (loopCount > maxMatchesLimit) break;

        const fullMatch = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + fullMatch.length;

        const groups: RegexCaptureGroup[] = [];
        if (match.length > 1) {
          for (let i = 1; i < match.length; i++) {
            groups.push({
              number: i,
              value: match[i] ?? "",
            });
          }
        }
        if (match.groups) {
          Object.entries(match.groups).forEach(([name, value], idx) => {
            if (groups[idx]) {
              groups[idx].name = name;
            } else {
              groups.push({ number: idx + 1, name, value: value ?? "" });
            }
          });
        }

        matches.push({
          matchNumber: matches.length + 1,
          fullMatch,
          startIndex,
          endIndex,
          groups,
        });

        // Zero-width match safeguard (e.g. pattern /(?:)/ or /^/)
        if (fullMatch.length === 0) {
          regex.lastIndex++;
        }
      }
    } else {
      // Single match (no 'g' flag)
      const match = regex.exec(testText);
      if (match) {
        const fullMatch = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + fullMatch.length;

        const groups: RegexCaptureGroup[] = [];
        if (match.length > 1) {
          for (let i = 1; i < match.length; i++) {
            groups.push({
              number: i,
              value: match[i] ?? "",
            });
          }
        }
        if (match.groups) {
          Object.entries(match.groups).forEach(([name, value], idx) => {
            if (groups[idx]) {
              groups[idx].name = name;
            } else {
              groups.push({ number: idx + 1, name, value: value ?? "" });
            }
          });
        }

        matches.push({
          matchNumber: 1,
          fullMatch,
          startIndex,
          endIndex,
          groups,
        });
      }
    }
  } catch (executionError: any) {
    return {
      isValid: false,
      error: `Execution error: ${executionError.message}`,
      pattern,
      flags: uniqueFlags,
      matches: [],
      totalMatches: 0,
      highlightSegments: [{ text: testText, isMatch: false }],
      executionTimeMs: Number((performance.now() - startTime).toFixed(2)),
    };
  }

  // Build Highlight Segments
  const highlightSegments: HighlightSegment[] = [];
  let currentIdx = 0;

  for (const m of matches) {
    if (m.startIndex > currentIdx) {
      highlightSegments.push({
        text: testText.slice(currentIdx, m.startIndex),
        isMatch: false,
      });
    }

    if (m.endIndex > m.startIndex) {
      highlightSegments.push({
        text: testText.slice(m.startIndex, m.endIndex),
        isMatch: true,
        matchNumber: m.matchNumber,
        matchIndex: m.startIndex,
      });
    }

    currentIdx = Math.max(currentIdx, m.endIndex);
  }

  if (currentIdx < testText.length) {
    highlightSegments.push({
      text: testText.slice(currentIdx),
      isMatch: false,
    });
  }

  // Compute Replacement Preview if replacementText provided or pattern exists
  let replacementResult: string | undefined = undefined;
  try {
    const replaceRegex = new RegExp(pattern, uniqueFlags);
    replacementResult = testText.replace(replaceRegex, replacementText);
  } catch {
    replacementResult = testText;
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

  return {
    isValid: true,
    pattern,
    flags: uniqueFlags,
    matches,
    totalMatches: matches.length,
    highlightSegments,
    replacementResult,
    executionTimeMs,
  };
}

/**
 * Generates copy-paste code snippets in 6 languages.
 */
export function generateRegexCodeSnippets(
  pattern: string,
  flags: string,
  testText: string = "sample text"
): Record<string, string> {
  const safePattern = pattern.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const safeText = testText.slice(0, 50).replace(/"/g, '\\"');

  return {
    javascript: `// JavaScript / TypeScript (Node.js & Browser)\nconst regex = new RegExp("${safePattern}", "${flags}");\nconst text = "${safeText}";\n\n// 1. Test for match\nconst isMatch = regex.test(text);\nconsole.log("Match:", isMatch);\n\n// 2. Extract all matches\nconst matches = [...text.matchAll(regex)];\nmatches.forEach(m => console.log(m[0]));`,

    python: `# Python 3\nimport re\n\npattern = r"${pattern}"\ntext = "${safeText}"\n\n# Flags\nflags = 0\n${flags.includes("i") ? "flags |= re.IGNORECASE\n" : ""}${flags.includes("m") ? "flags |= re.MULTILINE\n" : ""}${flags.includes("s") ? "flags |= re.DOTALL\n" : ""}\n# 1. Search or match\nmatches = re.findall(pattern, text, flags=flags)\nprint("Found matches:", matches)`,

    go: `// Go (Golang)\npackage main\n\nimport (\n\t"fmt"\n\t"regexp"\n)\n\nfunc main() {\n\tre := regexp.MustCompile(\`${pattern}\`)\n\ttext := "${safeText}"\n\n\tmatches := re.FindAllString(text, -1)\n\tfmt.Println("Matches:", matches)\n}`,

    java: `// Java\nimport java.util.regex.*;\n\npublic class RegexDemo {\n    public static void main(String[] args) {\n        Pattern pattern = Pattern.compile("${safePattern}");\n        Matcher matcher = pattern.matcher("${safeText}");\n\n        while (matcher.find()) {\n            System.out.println("Match: " + matcher.group());\n        }\n    }\n}`,

    csharp: `// C# (.NET)\nusing System;\nusing System.Text.RegularExpressions;\n\nclass Program {\n    static void Main() {\n        string pattern = @"${pattern}";\n        string text = "${safeText}";\n\n        MatchCollection matches = Regex.Matches(text, pattern);\n        foreach (Match match in matches) {\n            Console.WriteLine(match.Value);\n        }\n    }\n}`,

    php: `<?php\n// PHP\n$pattern = '/${pattern}/${flags}';\n$text = '${safeText}';\n\nif (preg_match_all($pattern, $text, $matches)) {\n    print_r($matches[0]);\n}`,
  };
}

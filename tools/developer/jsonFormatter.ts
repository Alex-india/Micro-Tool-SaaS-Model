export interface JSONFormatterResult {
  isValid: boolean;
  formattedText: string;
  minifiedText: string;
  error?: string;
  lineError?: number;
  columnError?: number;
  errorSnippet?: string;
  itemCount?: number;
  depth?: number;
  nodeCount?: number;
  rawSize: number;
  formattedSize: number;
  minifiedSize: number;
  savingsPercent?: number;
  parsedData?: any;
}

export interface JSONFormatterOptions {
  indent?: number | "tab";
  sortKeys?: boolean;
}

export interface JSONValidationIssue {
  type: "error" | "warning";
  code:
    | "NO_COMMENTS"
    | "DOUBLE_QUOTES_REQUIRED"
    | "NO_TRAILING_COMMA"
    | "PYTHON_LITERAL"
    | "UNQUOTED_KEY"
    | "DUPLICATE_KEY"
    | "PRECISION_LOSS"
    | "UNCLOSED_STRING"
    | "MISMATCHED_BRACKET"
    | "SYNTAX_ERROR";
  message: string;
  line: number;
  column: number;
  snippet: string;
  suggestion?: string;
}

export interface DuplicateKeyInfo {
  key: string;
  firstLine: number;
  firstCol: number;
  duplicateLine: number;
  duplicateCol: number;
}

export interface JSONValidationReport {
  isValid: boolean;
  issues: JSONValidationIssue[];
  duplicateKeys: DuplicateKeyInfo[];
  hasPrecisionLoss: boolean;
  precisionLossNumbers: string[];
  stats: {
    lineCount: number;
    charCount: number;
    byteSize: number;
    rootType: string;
    itemCount: number;
    depth: number;
    nodeCount: number;
  };
  canAutoRepair: boolean;
  parsedData?: any;
}

export interface JSONSchemaIssue {
  path: string;
  keyword: string;
  message: string;
}

export interface JSONSchemaValidationResult {
  isValid: boolean;
  errors: JSONSchemaIssue[];
}

interface Token {
  type: "STRING" | "SINGLE_QUOTE_STRING" | "COMMENT" | "PUNCT" | "WORD";
  value: string;
  line: number;
  column: number;
  unclosed?: boolean;
}

/**
 * Tokenizes JSON text while respecting strings, escapes, comments, and identifiers.
 * Guarantees that characters inside strings (like // in URLs or single quotes in text)
 * are NEVER mistakenly treated as comments or syntax delimiters.
 */
export function tokenizeJSON(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  while (i < input.length) {
    const char = input[i];

    // Newlines
    if (char === "\n") {
      line++;
      col = 1;
      i++;
      continue;
    }

    // Whitespace
    if (char === " " || char === "\t" || char === "\r") {
      col++;
      i++;
      continue;
    }

    const startLine = line;
    const startCol = col;

    // Single-line comment: // ...
    if (char === "/" && input[i + 1] === "/") {
      let val = "";
      while (i < input.length && input[i] !== "\n") {
        val += input[i];
        i++;
        col++;
      }
      tokens.push({ type: "COMMENT", value: val, line: startLine, column: startCol });
      continue;
    }

    // Multi-line comment: /* ... */
    if (char === "/" && input[i + 1] === "*") {
      let val = "/*";
      i += 2;
      col += 2;
      while (i < input.length && !(input[i] === "*" && input[i + 1] === "/")) {
        if (input[i] === "\n") {
          line++;
          col = 1;
        } else {
          col++;
        }
        val += input[i];
        i++;
      }
      if (i < input.length) {
        val += "*/";
        i += 2;
        col += 2;
      }
      tokens.push({ type: "COMMENT", value: val, line: startLine, column: startCol });
      continue;
    }

    // Double-quoted string: "..."
    if (char === '"') {
      let val = '"';
      i++;
      col++;
      let escaped = false;
      let closed = false;
      while (i < input.length) {
        const c = input[i];
        val += c;
        if (c === "\n") {
          line++;
          col = 1;
        } else {
          col++;
        }
        i++;

        if (escaped) {
          escaped = false;
        } else if (c === "\\") {
          escaped = true;
        } else if (c === '"') {
          closed = true;
          break;
        }
      }
      tokens.push({
        type: "STRING",
        value: val,
        line: startLine,
        column: startCol,
        unclosed: !closed,
      });
      continue;
    }

    // Single-quoted string: '...'
    if (char === "'") {
      let val = "'";
      i++;
      col++;
      let escaped = false;
      let closed = false;
      while (i < input.length) {
        const c = input[i];
        val += c;
        if (c === "\n") {
          line++;
          col = 1;
        } else {
          col++;
        }
        i++;

        if (escaped) {
          escaped = false;
        } else if (c === "\\") {
          escaped = true;
        } else if (c === "'") {
          closed = true;
          break;
        }
      }
      tokens.push({
        type: "SINGLE_QUOTE_STRING",
        value: val,
        line: startLine,
        column: startCol,
        unclosed: !closed,
      });
      continue;
    }

    // Structural punctuation
    if ("{}[],:".includes(char)) {
      tokens.push({ type: "PUNCT", value: char, line: startLine, column: startCol });
      i++;
      col++;
      continue;
    }

    // Numbers & Words (identifiers, unquoted keys, Python literals, booleans, null)
    let val = "";
    while (i < input.length && !'{}[],:"\' \t\r\n'.includes(input[i])) {
      val += input[i];
      i++;
      col++;
    }

    tokens.push({ type: "WORD", value: val, line: startLine, column: startCol });
  }

  return tokens;
}

/**
 * Extracts line number, column number, and snippet from a JSON.parse error message.
 */
function extractErrorPosition(
  errMsg: string,
  input: string
): { line: number; column: number; snippet: string } {
  let line = 1;
  let column = 1;
  let found = false;

  // 1. Check for "(line X column Y)"
  const lineColMatch = errMsg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (lineColMatch) {
    line = parseInt(lineColMatch[1], 10);
    column = parseInt(lineColMatch[2], 10);
    found = true;
  }

  // 2. Check for "at position X"
  if (!found) {
    const posMatch = errMsg.match(/position\s+(\d+)/i);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      if (!isNaN(pos) && pos >= 0 && pos <= input.length) {
        const textUpToPos = input.substring(0, pos);
        const lines = textUpToPos.split("\n");
        line = lines.length;
        column = lines[lines.length - 1].length + 1;
        found = true;
      }
    }
  }

  // 3. Check for V8 snippet: "..." is not valid JSON
  if (!found) {
    const quoteMatch = errMsg.match(/"([^"]+)"\s+is not valid JSON/);
    if (quoteMatch) {
      const rawSnippet = quoteMatch[1].replace(/^\.{3}/, "").replace(/\.{3}$/, "").trim();
      if (rawSnippet) {
        const idx = input.indexOf(rawSnippet);
        if (idx !== -1) {
          const textUpTo = input.substring(0, idx);
          const lines = textUpTo.split("\n");
          line = lines.length;
          column = lines[lines.length - 1].length + 1;
          found = true;
        }
      }
    }
  }

  const allLines = input.split("\n");
  const targetLineIdx = Math.max(0, Math.min(line - 1, allLines.length - 1));
  const snippet = (allLines[targetLineIdx] || "").trim();

  return { line, column, snippet };
}

/**
 * Recursively sorts object keys alphabetically.
 */
export function sortJSONKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortJSONKeys);
  } else if (obj !== null && typeof obj === "object") {
    return Object.keys(obj)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc: any, key: string) => {
        acc[key] = sortJSONKeys(obj[key]);
        return acc;
      }, {});
  }
  return obj;
}

/**
 * Calculates maximum nesting depth of a JSON object/array.
 */
export function getJSONDepth(obj: any): number {
  if (obj === null || typeof obj !== "object") return 0;
  let maxChildDepth = 0;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      maxChildDepth = Math.max(maxChildDepth, getJSONDepth(item));
    }
  } else {
    for (const key of Object.keys(obj)) {
      maxChildDepth = Math.max(maxChildDepth, getJSONDepth(obj[key]));
    }
  }
  return 1 + maxChildDepth;
}

/**
 * Counts total primitive nodes/elements inside a JSON object or array.
 */
export function countJSONNodes(obj: any): number {
  if (obj === null || typeof obj !== "object") return 1;
  let count = 1;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      count += countJSONNodes(item);
    }
  } else {
    for (const key of Object.keys(obj)) {
      count += countJSONNodes(obj[key]);
    }
  }
  return count;
}

/**
 * Automatically repairs messy or broken JSON strings using token-level transformation:
 * - Safely removes comments outside of string literals
 * - Converts single-quoted strings to standard double quotes
 * - Quotes unquoted object keys
 * - Replaces Python True, False, None with valid lowercase JSON equivalents
 * - Removes trailing commas before } or ]
 * - Auto-closes unclosed brackets and braces
 */
export function repairJSONString(raw: string): string {
  if (!raw || !raw.trim()) return raw;

  // If already strictly valid JSON, return beautifully formatted
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // Needs repair
  }

  const tokens = tokenizeJSON(raw);
  let out = "";
  const openStack: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];

    // 1. Strip comments
    if (tk.type === "COMMENT") {
      continue;
    }

    // Track open brackets/braces
    if (tk.type === "PUNCT") {
      if (tk.value === "{" || tk.value === "[") {
        openStack.push(tk.value);
      } else if (tk.value === "}" && openStack[openStack.length - 1] === "{") {
        openStack.pop();
      } else if (tk.value === "]" && openStack[openStack.length - 1] === "[") {
        openStack.pop();
      }

      // 2. Trailing comma removal: comma followed by } or ]
      if (tk.value === ",") {
        let nextIdx = i + 1;
        while (nextIdx < tokens.length && tokens[nextIdx].type === "COMMENT") {
          nextIdx++;
        }
        if (
          nextIdx < tokens.length &&
          (tokens[nextIdx].value === "}" || tokens[nextIdx].value === "]")
        ) {
          continue;
        }
      }

      out += tk.value;
      out += getSpacing(tokens, i);
      continue;
    }

    // 3. Single-quote string -> double-quoted string
    if (tk.type === "SINGLE_QUOTE_STRING") {
      const inner = tk.value.slice(1, tk.unclosed ? undefined : -1);
      const converted = inner.replace(/\\'/g, "'").replace(/"/g, '\\"');
      out += `"${converted}"`;
      out += getSpacing(tokens, i);
      continue;
    }

    // 4. Double-quoted string (ensure closed)
    if (tk.type === "STRING") {
      let strVal = tk.value;
      if (tk.unclosed) {
        strVal += '"';
      }
      out += strVal;
      out += getSpacing(tokens, i);
      continue;
    }

    // 5. Unquoted keys and Python literals
    if (tk.type === "WORD") {
      let nextIdx = i + 1;
      while (nextIdx < tokens.length && tokens[nextIdx].type === "COMMENT") {
        nextIdx++;
      }

      // If word is followed by a colon, it's an unquoted key!
      if (
        nextIdx < tokens.length &&
        tokens[nextIdx].type === "PUNCT" &&
        tokens[nextIdx].value === ":"
      ) {
        out += `"${tk.value}"`;
        out += getSpacing(tokens, i);
        continue;
      }

      // Python literals
      if (tk.value === "True") {
        out += "true";
      } else if (tk.value === "False") {
        out += "false";
      } else if (tk.value === "None" || tk.value === "undefined") {
        out += "null";
      } else {
        out += tk.value;
      }
      out += getSpacing(tokens, i);
      continue;
    }

    out += tk.value;
    out += getSpacing(tokens, i);
  }

  // Auto-close any unclosed brackets or braces
  while (openStack.length > 0) {
    const unclosed = openStack.pop();
    out += unclosed === "{" ? "\n}" : "\n]";
  }

  // Verify repaired output
  try {
    const parsed = JSON.parse(out);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // Secondary fallback: regex repair
    let fallback = raw;
    fallback = fallback.replace(/\/\/.*$/gm, "");
    fallback = fallback.replace(/\/\*[\s\S]*?\*\//g, "");
    fallback = fallback.replace(/,\s*([}\]])/g, "$1");
    fallback = fallback.replace(/:\s*True\b/g, ": true");
    fallback = fallback.replace(/:\s*False\b/g, ": false");
    fallback = fallback.replace(/:\s*None\b/g, ": null");
    try {
      const fallbackParsed = JSON.parse(fallback);
      return JSON.stringify(fallbackParsed, null, 2);
    } catch {
      return out;
    }
  }
}

function getSpacing(tokens: Token[], i: number): string {
  if (i + 1 >= tokens.length) return "";
  const curr = tokens[i];
  const next = tokens[i + 1];
  if (curr.line !== next.line) {
    return "\n" + " ".repeat(Math.max(0, next.column - 1));
  }
  const spaceCount = Math.max(0, next.column - (curr.column + curr.value.length));
  return " ".repeat(spaceCount);
}

/**
 * Generates syntax-highlighted HTML spans for formatted JSON strings.
 */
export function highlightJSONToHTML(jsonString: string): string {
  if (!jsonString) return "";
  const escaped = jsonString
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "text-amber-400 font-mono"; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "text-sky-400 font-semibold font-mono"; // key
        } else {
          cls = "text-emerald-400 font-mono"; // string
        }
      } else if (/true|false/.test(match)) {
        cls = "text-purple-400 font-medium font-mono"; // boolean
      } else if (/null/.test(match)) {
        cls = "text-rose-400 font-medium font-mono"; // null
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

/**
 * Main JSON processing engine for formatting and minification.
 */
export function processJSON(
  input: string,
  optionsOrIndent: JSONFormatterOptions | number = 2
): JSONFormatterResult {
  const options: JSONFormatterOptions =
    typeof optionsOrIndent === "number"
      ? { indent: optionsOrIndent }
      : optionsOrIndent;

  const rawSize = new Blob([input || ""]).size;

  if (!input || !input.trim()) {
    return {
      isValid: true,
      formattedText: "",
      minifiedText: "",
      rawSize: 0,
      formattedSize: 0,
      minifiedSize: 0,
      savingsPercent: 0,
      itemCount: 0,
      depth: 0,
      nodeCount: 0,
    };
  }

  try {
    let parsed = JSON.parse(input);

    if (options.sortKeys) {
      parsed = sortJSONKeys(parsed);
    }

    const indentValue =
      options.indent === "tab"
        ? "\t"
        : typeof options.indent === "number"
        ? options.indent
        : 2;

    const formattedText = JSON.stringify(parsed, null, indentValue);
    const minifiedText = JSON.stringify(parsed);

    const formattedSize = new Blob([formattedText]).size;
    const minifiedSize = new Blob([minifiedText]).size;
    const savingsPercent =
      formattedSize > 0
        ? Math.max(0, Math.round(((formattedSize - minifiedSize) / formattedSize) * 100))
        : 0;

    let itemCount = 0;
    if (Array.isArray(parsed)) {
      itemCount = parsed.length;
    } else if (typeof parsed === "object" && parsed !== null) {
      itemCount = Object.keys(parsed).length;
    }

    const depth = getJSONDepth(parsed);
    const nodeCount = countJSONNodes(parsed);

    return {
      isValid: true,
      formattedText,
      minifiedText,
      rawSize,
      formattedSize,
      minifiedSize,
      savingsPercent,
      itemCount,
      depth,
      nodeCount,
      parsedData: parsed,
    };
  } catch (err: any) {
    const errorMsg = err?.message || "Invalid JSON syntax";
    const { line, column, snippet } = extractErrorPosition(errorMsg, input);

    return {
      isValid: false,
      formattedText: input,
      minifiedText: "",
      error: errorMsg,
      lineError: line,
      columnError: column,
      errorSnippet: snippet,
      rawSize,
      formattedSize: rawSize,
      minifiedSize: 0,
    };
  }
}

/**
 * Deep validation and linting for JSON with syntax, semantic, and RFC 8259 diagnostics.
 * Powered by full token analysis to ensure zero false positives with string contents.
 */
export function validateJSON(input: string): JSONValidationReport {
  const issues: JSONValidationIssue[] = [];
  const duplicateKeys: DuplicateKeyInfo[] = [];
  const precisionLossNumbers: string[] = [];

  if (!input || !input.trim()) {
    return {
      isValid: true,
      issues: [],
      duplicateKeys: [],
      hasPrecisionLoss: false,
      precisionLossNumbers: [],
      stats: {
        lineCount: 0,
        charCount: 0,
        byteSize: 0,
        rootType: "empty",
        itemCount: 0,
        depth: 0,
        nodeCount: 0,
      },
      canAutoRepair: false,
    };
  }

  const lines = input.split("\n");
  const charCount = input.length;
  const byteSize = new Blob([input]).size;

  // 1. Try native JSON.parse
  let nativeParsed: any = null;
  let nativeError: any = null;
  try {
    nativeParsed = JSON.parse(input);
  } catch (err: any) {
    nativeError = err;
  }

  // 2. Token analysis
  const tokens = tokenizeJSON(input);

  // 3. Check for Comments (RFC 8259 violation)
  for (const tk of tokens) {
    if (tk.type === "COMMENT") {
      issues.push({
        type: "error",
        code: "NO_COMMENTS",
        message: "Comments are forbidden in RFC 8259 standard JSON.",
        line: tk.line,
        column: tk.column,
        snippet: (lines[tk.line - 1] || "").trim(),
        suggestion: "Remove comment",
      });
      if (issues.filter((i) => i.code === "NO_COMMENTS").length >= 10) break;
    }
  }

  // 4. Check for Single Quotes
  for (const tk of tokens) {
    if (tk.type === "SINGLE_QUOTE_STRING") {
      const inner = tk.value.slice(1, tk.unclosed ? undefined : -1);
      issues.push({
        type: "error",
        code: "DOUBLE_QUOTES_REQUIRED",
        message: `Single quotes used: ${tk.value}. JSON strings and keys must use standard double quotes (").`,
        line: tk.line,
        column: tk.column,
        snippet: (lines[tk.line - 1] || "").trim(),
        suggestion: `Use "${inner}"`,
      });
      if (issues.filter((i) => i.code === "DOUBLE_QUOTES_REQUIRED").length >= 10) break;
    }
  }

  // 5. Check for Trailing Commas before } or ]
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.type === "PUNCT" && tk.value === ",") {
      let nextIdx = i + 1;
      while (nextIdx < tokens.length && tokens[nextIdx].type === "COMMENT") nextIdx++;
      if (
        nextIdx < tokens.length &&
        (tokens[nextIdx].value === "}" || tokens[nextIdx].value === "]")
      ) {
        issues.push({
          type: "error",
          code: "NO_TRAILING_COMMA",
          message: `Trailing comma before '${tokens[nextIdx].value}' is forbidden in RFC 8259 standard JSON.`,
          line: tk.line,
          column: tk.column,
          snippet: (lines[tk.line - 1] || "").trim(),
          suggestion: "Remove the trailing comma",
        });
      }
    }
  }

  // 6. Check for Python literals (True, False, None) and unquoted keys
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.type === "WORD") {
      if (["True", "False", "None"].includes(tk.value)) {
        const replacement =
          tk.value === "True" ? "true" : tk.value === "False" ? "false" : "null";
        issues.push({
          type: "error",
          code: "PYTHON_LITERAL",
          message: `Python literal '${tk.value}' detected. Standard JSON requires lowercase '${replacement}'.`,
          line: tk.line,
          column: tk.column,
          snippet: (lines[tk.line - 1] || "").trim(),
          suggestion: `Replace with ${replacement}`,
        });
      } else {
        // Check if unquoted key (word followed by :)
        let nextIdx = i + 1;
        while (nextIdx < tokens.length && tokens[nextIdx].type === "COMMENT") nextIdx++;
        if (
          nextIdx < tokens.length &&
          tokens[nextIdx].type === "PUNCT" &&
          tokens[nextIdx].value === ":"
        ) {
          issues.push({
            type: "error",
            code: "UNQUOTED_KEY",
            message: `Key '${tk.value}' is unquoted. JSON object keys must be enclosed in double quotes.`,
            line: tk.line,
            column: tk.column,
            snippet: (lines[tk.line - 1] || "").trim(),
            suggestion: `Change to "${tk.value}"`,
          });
        }
      }
    }
  }

  // 7. Check for Duplicate Keys within the same object scope
  const objectStack: Array<{
    type: "object" | "array";
    keys: Map<string, { line: number; column: number }>;
  }> = [];

  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.type === "PUNCT") {
      if (tk.value === "{") {
        objectStack.push({ type: "object", keys: new Map() });
      } else if (tk.value === "}") {
        if (objectStack.length > 0 && objectStack[objectStack.length - 1].type === "object") {
          objectStack.pop();
        }
      } else if (tk.value === "[") {
        objectStack.push({ type: "array", keys: new Map() });
      } else if (tk.value === "]") {
        if (objectStack.length > 0 && objectStack[objectStack.length - 1].type === "array") {
          objectStack.pop();
        }
      }
    } else if (
      tk.type === "STRING" ||
      tk.type === "SINGLE_QUOTE_STRING" ||
      tk.type === "WORD"
    ) {
      let nextIdx = i + 1;
      while (nextIdx < tokens.length && tokens[nextIdx].type === "COMMENT") nextIdx++;
      if (
        nextIdx < tokens.length &&
        tokens[nextIdx].type === "PUNCT" &&
        tokens[nextIdx].value === ":"
      ) {
        const currentScope =
          objectStack.length > 0 ? objectStack[objectStack.length - 1] : null;
        if (currentScope && currentScope.type === "object") {
          let keyName = tk.value;
          if (tk.type === "STRING" || tk.type === "SINGLE_QUOTE_STRING") {
            keyName = keyName.slice(1, tk.unclosed ? undefined : -1);
          }
          if (currentScope.keys.has(keyName)) {
            const first = currentScope.keys.get(keyName)!;
            duplicateKeys.push({
              key: keyName,
              firstLine: first.line,
              firstCol: first.column,
              duplicateLine: tk.line,
              duplicateCol: tk.column,
            });
            issues.push({
              type: "warning",
              code: "DUPLICATE_KEY",
              message: `Duplicate key "${keyName}" in object. RFC 8259 Section 4 specifies object keys should be unique.`,
              line: tk.line,
              column: tk.column,
              snippet: (lines[tk.line - 1] || "").trim(),
              suggestion: `Remove or rename duplicate key "${keyName}"`,
            });
          } else {
            currentScope.keys.set(keyName, { line: tk.line, column: tk.column });
          }
        }
      }
    }
  }

  // 8. Check for Large Number Precision Loss (> 2^53 - 1)
  for (const tk of tokens) {
    if (tk.type === "WORD" && /^\d{16,}$/.test(tk.value)) {
      try {
        if (BigInt(tk.value) > BigInt(Number.MAX_SAFE_INTEGER)) {
          precisionLossNumbers.push(tk.value);
          issues.push({
            type: "warning",
            code: "PRECISION_LOSS",
            message: `Number ${tk.value} exceeds IEEE-754 64-bit float precision (max: ${Number.MAX_SAFE_INTEGER}) and will lose precision in JavaScript parsers.`,
            line: tk.line,
            column: tk.column,
            snippet: (lines[tk.line - 1] || "").trim(),
            suggestion: `Wrap large ID as a string: "${tk.value}"`,
          });
        }
      } catch {
        // ignore
      }
    }
  }

  // 9. If native JSON.parse failed and no specific syntax error was caught above
  if (nativeError) {
    const errorCount = issues.filter((i) => i.type === "error").length;
    if (errorCount === 0) {
      const errMsg = nativeError.message || "Invalid JSON syntax";
      const { line, column, snippet } = extractErrorPosition(errMsg, input);
      issues.unshift({
        type: "error",
        code: "SYNTAX_ERROR",
        message: errMsg,
        line,
        column,
        snippet: snippet.trim(),
      });
    }
  }

  // Sort issues by line then column
  issues.sort((a, b) => a.line - b.line || a.column - b.column);

  const hasBlockingError =
    issues.some((i) => i.type === "error") || nativeError !== null;
  const isValid = !hasBlockingError;

  // Calculate structure stats
  let rootType = "object";
  let itemCount = 0;
  let depth = 0;
  let nodeCount = 0;

  if (isValid && nativeParsed !== null) {
    if (Array.isArray(nativeParsed)) {
      rootType = "array";
      itemCount = nativeParsed.length;
    } else if (typeof nativeParsed === "object") {
      rootType = "object";
      itemCount = Object.keys(nativeParsed).length;
    } else {
      rootType = typeof nativeParsed;
      itemCount = 1;
    }

    depth = getJSONDepth(nativeParsed);
    nodeCount = countJSONNodes(nativeParsed);
  }

  return {
    isValid,
    issues,
    duplicateKeys,
    hasPrecisionLoss: precisionLossNumbers.length > 0,
    precisionLossNumbers,
    stats: {
      lineCount: lines.length,
      charCount,
      byteSize,
      rootType,
      itemCount,
      depth,
      nodeCount,
    },
    canAutoRepair: !isValid,
    parsedData: isValid ? nativeParsed : undefined,
  };
}

/**
 * Lightweight JSON Schema Validator supporting standard Draft-07 keywords:
 * type, required, properties, items, enum, minLength, maxLength, minimum, maximum, pattern.
 */
export function validateJSONSchema(
  data: any,
  schema: any,
  path: string = "$"
): JSONSchemaValidationResult {
  const errors: JSONSchemaIssue[] = [];

  if (!schema || typeof schema !== "object") {
    return { isValid: true, errors: [] };
  }

  // 1. Type validation
  if (schema.type) {
    const allowedTypes: string[] = Array.isArray(schema.type)
      ? schema.type
      : [schema.type];
    const actualType = getDataType(data);
    const matches = allowedTypes.some((t) => {
      if (t === "integer") return typeof data === "number" && Number.isInteger(data);
      if (t === "number") return typeof data === "number";
      return actualType === t;
    });

    if (!matches) {
      errors.push({
        path,
        keyword: "type",
        message: `Expected type "${allowedTypes.join('" or "')}", but got "${actualType}"`,
      });
      return { isValid: false, errors };
    }
  }

  // 2. Enum check
  if (schema.enum && Array.isArray(schema.enum)) {
    const inEnum = schema.enum.some(
      (val: any) => JSON.stringify(val) === JSON.stringify(data)
    );
    if (!inEnum) {
      errors.push({
        path,
        keyword: "enum",
        message: `Value ${JSON.stringify(data)} does not match any allowed enum values [${schema.enum
          .map((v: any) => JSON.stringify(v))
          .join(", ")}]`,
      });
    }
  }

  // 3. String validation
  if (typeof data === "string") {
    if (typeof schema.minLength === "number" && data.length < schema.minLength) {
      errors.push({
        path,
        keyword: "minLength",
        message: `String length (${data.length}) is shorter than minimum allowed (${schema.minLength})`,
      });
    }
    if (typeof schema.maxLength === "number" && data.length > schema.maxLength) {
      errors.push({
        path,
        keyword: "maxLength",
        message: `String length (${data.length}) is longer than maximum allowed (${schema.maxLength})`,
      });
    }
    if (schema.pattern) {
      try {
        const re = new RegExp(schema.pattern);
        if (!re.test(data)) {
          errors.push({
            path,
            keyword: "pattern",
            message: `String does not match required pattern /${schema.pattern}/`,
          });
        }
      } catch {
        // ignore invalid regex
      }
    }
  }

  // 4. Number validation
  if (typeof data === "number") {
    if (typeof schema.minimum === "number" && data < schema.minimum) {
      errors.push({
        path,
        keyword: "minimum",
        message: `Value ${data} is less than minimum ${schema.minimum}`,
      });
    }
    if (typeof schema.maximum === "number" && data > schema.maximum) {
      errors.push({
        path,
        keyword: "maximum",
        message: `Value ${data} is greater than maximum ${schema.maximum}`,
      });
    }
  }

  // 5. Object validation
  if (data !== null && typeof data === "object" && !Array.isArray(data)) {
    if (Array.isArray(schema.required)) {
      for (const req of schema.required) {
        if (!(req in data)) {
          errors.push({
            path: `${path}.${req}`,
            keyword: "required",
            message: `Missing required property "${req}"`,
          });
        }
      }
    }

    if (schema.properties && typeof schema.properties === "object") {
      for (const key of Object.keys(schema.properties)) {
        if (key in data) {
          const subRes = validateJSONSchema(
            data[key],
            schema.properties[key],
            `${path}.${key}`
          );
          errors.push(...subRes.errors);
        }
      }
    }
  }

  // 6. Array validation
  if (Array.isArray(data) && schema.items && typeof schema.items === "object") {
    data.forEach((item, idx) => {
      const subRes = validateJSONSchema(item, schema.items, `${path}[${idx}]`);
      errors.push(...subRes.errors);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function getDataType(val: any): string {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  return typeof val;
}

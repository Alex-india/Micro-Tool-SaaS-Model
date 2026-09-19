/**
 * ToolVerse SQL Engine
 * Pure TypeScript SQL Tokenizer, Formatter, Minifier, Analyzer, and Code Generator.
 * Zero external dependencies.
 */

export type SqlDialect = 'standard' | 'postgres' | 'mysql' | 'sqlite' | 'tsql' | 'bigquery';
export type KeywordCasing = 'upper' | 'lower' | 'preserve';
export type IndentStyle = '2spaces' | '4spaces' | 'tab';
export type CommaPosition = 'trailing' | 'leading';

export interface SqlFormatOptions {
  dialect?: SqlDialect;
  keywordCase?: KeywordCasing;
  indent?: IndentStyle;
  commaPosition?: CommaPosition;
  linesBetweenQueries?: number;
}

export interface SqlAnalysisResult {
  isValidSyntax: boolean;
  syntaxErrors: string[];
  warnings: string[];
  statementTypes: string[];
  tableNames: string[];
  hasWhereClause: boolean;
  isDangerousQuery: boolean;
  subqueryCount: number;
  joinCount: number;
  cteCount: number;
  stats: {
    lineCountBefore: number;
    lineCountAfter: number;
    charCountBefore: number;
    charCountAfter: number;
    byteCountBefore: number;
    byteCountAfter: number;
  };
}

export interface SqlFormatResult {
  formattedSql: string;
  analysis: SqlAnalysisResult;
}

// ---------------- Token Types ----------------
export type TokenType =
  | 'STRING'
  | 'IDENTIFIER_QUOTED'
  | 'WORD'
  | 'NUMBER'
  | 'OPERATOR'
  | 'COMMENT_LINE'
  | 'COMMENT_BLOCK'
  | 'PUNCTUATION'
  | 'WHITESPACE';

export interface Token {
  type: TokenType;
  value: string;
  raw: string;
}

// ---------------- Keyword Sets ----------------
const MAJOR_KEYWORDS = new Set([
  'SELECT',
  'FROM',
  'WHERE',
  'GROUP BY',
  'ORDER BY',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'FETCH FIRST',
  'FETCH NEXT',
  'INSERT INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE FROM',
  'DELETE',
  'CREATE TABLE',
  'CREATE OR REPLACE TABLE',
  'CREATE VIEW',
  'CREATE OR REPLACE VIEW',
  'CREATE INDEX',
  'CREATE UNIQUE INDEX',
  'ALTER TABLE',
  'DROP TABLE',
  'DROP VIEW',
  'TRUNCATE TABLE',
  'TRUNCATE',
  'MERGE INTO',
  'RETURNING',
  'WITH',
  'WITH RECURSIVE',
]);

const SET_OPERATIONS = new Set([
  'UNION',
  'UNION ALL',
  'INTERSECT',
  'INTERSECT ALL',
  'EXCEPT',
  'EXCEPT ALL',
  'MINUS',
]);

const JOIN_KEYWORDS = new Set([
  'JOIN',
  'INNER JOIN',
  'LEFT JOIN',
  'LEFT OUTER JOIN',
  'RIGHT JOIN',
  'RIGHT OUTER JOIN',
  'FULL JOIN',
  'FULL OUTER JOIN',
  'CROSS JOIN',
  'NATURAL JOIN',
  'STRAIGHT_JOIN',
]);

const LOGICAL_KEYWORDS = new Set(['AND', 'OR']);

const SUBCLAUSE_KEYWORDS = new Set(['ON', 'USING']);

const CASE_KEYWORDS = new Set(['CASE', 'WHEN', 'THEN', 'ELSE', 'END']);

const ALL_KEYWORDS_LIST = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'ILIKE', 'IS', 'NULL',
  'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'FETCH FIRST', 'FETCH NEXT', 'ROWS ONLY',
  'AS', 'ASC', 'DESC', 'NULLS FIRST', 'NULLS LAST',
  'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'NATURAL JOIN',
  'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN', 'ON', 'USING',
  'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'DELETE',
  'CREATE TABLE', 'CREATE VIEW', 'CREATE INDEX', 'ALTER TABLE', 'DROP TABLE', 'TRUNCATE TABLE',
  'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'CHECK', 'DEFAULT', 'UNIQUE', 'CONSTRAINT',
  'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT', 'MINUS',
  'WITH', 'WITH RECURSIVE', 'RETURNING', 'MERGE INTO',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'OVER', 'PARTITION BY',
  'BETWEEN', 'EXISTS', 'ALL', 'ANY', 'SOME', 'DISTINCT', 'ALL',
  'TRUE', 'FALSE', 'AUTO_INCREMENT', 'CONFLICT', 'DO', 'NOTHING',
];

const BUILTIN_FUNCTIONS = new Set([
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NULLIF', 'CONCAT',
  'SUBSTRING', 'SUBSTR', 'TRIM', 'LTRIM', 'RTRIM', 'UPPER', 'LOWER', 'REPLACE',
  'LENGTH', 'LEN', 'ROUND', 'FLOOR', 'CEIL', 'CEILING', 'ABS', 'MOD', 'POWER', 'SQRT',
  'NOW', 'CURRENT_TIMESTAMP', 'CURRENT_DATE', 'CURRENT_TIME', 'DATE_ADD', 'DATE_SUB',
  'DATEDIFF', 'DATEADD', 'DATE_TRUNC', 'EXTRACT', 'TO_CHAR', 'TO_DATE', 'TO_TIMESTAMP',
  'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE',
  'CAST', 'CONVERT', 'ARRAY_AGG', 'STRING_AGG', 'GROUP_CONCAT', 'JSON_AGG', 'JSONB_AGG',
  'GREATEST', 'LEAST', 'IFNULL', 'NVL', 'ISNULL',
]);

// Map of multi-word phrase prefixes
const MULTI_WORD_PREFIXES = new Set([
  'GROUP', 'ORDER', 'FETCH', 'INSERT', 'DELETE', 'CREATE', 'ALTER', 'DROP',
  'TRUNCATE', 'MERGE', 'WITH', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS',
  'NATURAL', 'UNION', 'INTERSECT', 'EXCEPT', 'PRIMARY', 'FOREIGN',
]);

/**
 * Tokenize raw SQL string
 */
export function tokenizeSql(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = sql.length;

  while (i < len) {
    const ch = sql[i];
    const next = i + 1 < len ? sql[i + 1] : '';

    // 1. Whitespace
    if (/\s/.test(ch)) {
      let j = i;
      while (j < len && /\s/.test(sql[j])) j++;
      tokens.push({ type: 'WHITESPACE', value: ' ', raw: sql.substring(i, j) });
      i = j;
      continue;
    }

    // 2. Single-line comment (-- or #)
    if ((ch === '-' && next === '-') || ch === '#') {
      let j = i;
      while (j < len && sql[j] !== '\n') j++;
      tokens.push({
        type: 'COMMENT_LINE',
        value: sql.substring(i, j),
        raw: sql.substring(i, j),
      });
      i = j;
      continue;
    }

    // 3. Multi-line comment (/* ... */)
    if (ch === '/' && next === '*') {
      let j = i + 2;
      while (j < len && !(sql[j] === '*' && sql[j + 1] === '/')) j++;
      j = Math.min(len, j + 2);
      tokens.push({
        type: 'COMMENT_BLOCK',
        value: sql.substring(i, j),
        raw: sql.substring(i, j),
      });
      i = j;
      continue;
    }

    // 4. Quoted string ('...' or E'...' or N'...')
    if (
      ch === "'" ||
      ((ch === 'e' || ch === 'E' || ch === 'n' || ch === 'N') && next === "'")
    ) {
      const quoteStart = ch === "'" ? i : i + 1;
      let j = quoteStart + 1;
      while (j < len) {
        if (sql[j] === "'") {
          // Escaped quote ''
          if (j + 1 < len && sql[j + 1] === "'") {
            j += 2;
            continue;
          }
          break;
        } else if (sql[j] === '\\') {
          j += 2; // escape next char
          continue;
        }
        j++;
      }
      const rawStr = sql.substring(i, Math.min(len, j + 1));
      tokens.push({
        type: 'STRING',
        value: rawStr,
        raw: rawStr,
      });
      i = Math.min(len, j + 1);
      continue;
    }

    // 5. Quoted Identifiers: double quote "...", backtick `...`, bracket [...]
    if (ch === '"' || ch === '`') {
      const quote = ch;
      let j = i + 1;
      while (j < len && sql[j] !== quote) {
        if (sql[j] === '\\') j++;
        j++;
      }
      const rawId = sql.substring(i, Math.min(len, j + 1));
      tokens.push({
        type: 'IDENTIFIER_QUOTED',
        value: rawId,
        raw: rawId,
      });
      i = Math.min(len, j + 1);
      continue;
    }

    if (ch === '[') {
      // T-SQL bracket identifier e.g. [dbo].[table]
      let j = i + 1;
      while (j < len && sql[j] !== ']') j++;
      const rawId = sql.substring(i, Math.min(len, j + 1));
      tokens.push({
        type: 'IDENTIFIER_QUOTED',
        value: rawId,
        raw: rawId,
      });
      i = Math.min(len, j + 1);
      continue;
    }

    // 6. Numbers (integers, decimals, hex)
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(next))) {
      let j = i;
      while (j < len && /[\d.a-fA-FxX]/.test(sql[j])) j++;
      tokens.push({
        type: 'NUMBER',
        value: sql.substring(i, j),
        raw: sql.substring(i, j),
      });
      i = j;
      continue;
    }

    // 7. Multi-character Operators (::, ->, ->>, !=, <>, <=, >=, ||)
    const twoChars = ch + next;
    const threeChars = i + 2 < len ? twoChars + sql[i + 2] : '';
    if (threeChars === '->>' || threeChars === '#>>') {
      tokens.push({ type: 'OPERATOR', value: threeChars, raw: threeChars });
      i += 3;
      continue;
    }
    if (
      ['::', '->', '!=', '<>', '<=', '>=', '||', '#>', ':=', '..'].includes(
        twoChars
      )
    ) {
      tokens.push({ type: 'OPERATOR', value: twoChars, raw: twoChars });
      i += 2;
      continue;
    }

    // 8. Single-character Operators
    if ('=<>+-*/%&|^~'.includes(ch)) {
      tokens.push({ type: 'OPERATOR', value: ch, raw: ch });
      i++;
      continue;
    }

    // 9. Punctuation
    if ('(),;:.'.includes(ch)) {
      tokens.push({ type: 'PUNCTUATION', value: ch, raw: ch });
      i++;
      continue;
    }

    // 10. Words / Identifiers / Keywords
    if (/[a-zA-Z0-9_$@#]/.test(ch)) {
      let j = i;
      while (j < len && /[a-zA-Z0-9_$@#]/.test(sql[j])) j++;
      const word = sql.substring(i, j);
      tokens.push({
        type: 'WORD',
        value: word,
        raw: word,
      });
      i = j;
      continue;
    }

    // Catch-all
    tokens.push({ type: 'PUNCTUATION', value: ch, raw: ch });
    i++;
  }

  return tokens;
}

/**
 * Helper to adjust keyword casing
 */
function applyCasing(word: string, casing: KeywordCasing): string {
  if (casing === 'upper') return word.toUpperCase();
  if (casing === 'lower') return word.toLowerCase();
  return word;
}

/**
 * Minify SQL into single-line format
 */
export function minifySql(sql: string): string {
  if (!sql.trim()) return '';

  const tokens = tokenizeSql(sql);
  let minified = '';

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    // Strip comments completely in minified mode
    if (t.type === 'COMMENT_LINE' || t.type === 'COMMENT_BLOCK') {
      continue;
    }

    if (t.type === 'WHITESPACE') {
      // Only keep a space if needed between two alphanumeric/word tokens
      const prev = minified.slice(-1);
      const nextToken = tokens[i + 1];
      if (
        prev &&
        /[a-zA-Z0-9_$]/.test(prev) &&
        nextToken &&
        (nextToken.type === 'WORD' || nextToken.type === 'NUMBER')
      ) {
        minified += ' ';
      }
      continue;
    }

    if (t.type === 'PUNCTUATION') {
      if (t.value === ',') {
        minified += ', ';
      } else if (t.value === ';') {
        minified += ';';
      } else if (t.value === '.') {
        minified = minified.trimEnd() + '.';
      } else {
        minified += t.value;
      }
      continue;
    }

    if (t.type === 'OPERATOR') {
      // Keep standard spacing around arithmetic/comparison operators
      if (['=', '!=', '<>', '<=', '>=', '<', '>', '+', '-', '*', '/'].includes(t.value)) {
        if (!minified.endsWith(' ')) minified += ' ';
        minified += t.value + ' ';
      } else {
        minified += t.value;
      }
      continue;
    }

    // Word, String, Number, Identifier
    const prev = minified.slice(-1);
    if (prev && !/[\s(,.]/.test(prev) && t.value !== ')') {
      minified += ' ';
    }
    minified += t.raw;
  }

  return minified.replace(/\s+/g, ' ').replace(/\s*\.\s*/g, '.').trim();
}

/**
 * Format SQL with indents, casing, and clean line breaks
 */
export function formatSql(sql: string, options: SqlFormatOptions = {}): SqlFormatResult {
  const originalSql = sql;
  if (!sql.trim()) {
    return {
      formattedSql: '',
      analysis: analyzeSql('', ''),
    };
  }

  const casing = options.keywordCase || 'upper';
  const indentStr =
    options.indent === '4spaces' ? '    ' : options.indent === 'tab' ? '\t' : '  ';
  const commaLeading = options.commaPosition === 'leading';

  const tokens = tokenizeSql(sql);

  // Filter tokens: collapse multiple whitespaces, preserve comments
  const nonWsTokens: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'WHITESPACE') {
      if (
        nonWsTokens.length > 0 &&
        nonWsTokens[nonWsTokens.length - 1].type !== 'WHITESPACE'
      ) {
        nonWsTokens.push({ type: 'WHITESPACE', value: ' ', raw: ' ' });
      }
    } else {
      nonWsTokens.push(tokens[i]);
    }
  }

  let formatted = '';
  let indentLevel = 0;
  let inParenthesesDepth = 0;
  const parenStack: ('subquery' | 'values' | 'func' | 'generic')[] = [];
  let currentClause = '';

  const getIndent = (level: number) => indentStr.repeat(Math.max(0, level));

  let i = 0;
  while (i < nonWsTokens.length) {
    const t = nonWsTokens[i];

    // Handle Whitespace
    if (t.type === 'WHITESPACE') {
      i++;
      continue;
    }

    // Handle Comments
    if (t.type === 'COMMENT_LINE' || t.type === 'COMMENT_BLOCK') {
      if (formatted.length > 0 && !formatted.endsWith('\n')) {
        formatted += '\n';
      }
      formatted += getIndent(indentLevel) + t.raw.trim() + '\n' + getIndent(indentLevel);
      i++;
      continue;
    }

    // Lookahead to check multi-word keywords (e.g., "GROUP BY", "LEFT OUTER JOIN")
    const upperWord = t.value.toUpperCase();
    let phrase = upperWord;
    let tokensConsumed = 1;

    if (t.type === 'WORD' && MULTI_WORD_PREFIXES.has(upperWord)) {
      // Check 2-word phrase
      let nextWordIdx = -1;
      for (let j = i + 1; j < nonWsTokens.length; j++) {
        if (nonWsTokens[j].type !== 'WHITESPACE') {
          nextWordIdx = j;
          break;
        }
      }
      if (nextWordIdx !== -1 && nonWsTokens[nextWordIdx].type === 'WORD') {
        const word2 = nonWsTokens[nextWordIdx].value.toUpperCase();
        const twoWord = `${upperWord} ${word2}`;

        // Check 3-word phrase (e.g., "LEFT OUTER JOIN")
        let thirdWordIdx = -1;
        for (let k = nextWordIdx + 1; k < nonWsTokens.length; k++) {
          if (nonWsTokens[k].type !== 'WHITESPACE') {
            thirdWordIdx = k;
            break;
          }
        }
        let threeWord = '';
        if (thirdWordIdx !== -1 && nonWsTokens[thirdWordIdx].type === 'WORD') {
          threeWord = `${twoWord} ${nonWsTokens[thirdWordIdx].value.toUpperCase()}`;
        }

        if (threeWord && (MAJOR_KEYWORDS.has(threeWord) || JOIN_KEYWORDS.has(threeWord))) {
          phrase = threeWord;
          tokensConsumed = thirdWordIdx - i + 1;
        } else if (
          MAJOR_KEYWORDS.has(twoWord) ||
          JOIN_KEYWORDS.has(twoWord) ||
          twoWord === 'CREATE TABLE' ||
          twoWord === 'ALTER TABLE' ||
          twoWord === 'DROP TABLE' ||
          twoWord === 'PRIMARY KEY' ||
          twoWord === 'FOREIGN KEY'
        ) {
          phrase = twoWord;
          tokensConsumed = nextWordIdx - i + 1;
        }
      }
    }

    // 1. Major Clauses (SELECT, FROM, WHERE, GROUP BY, ORDER BY, etc.)
    if (MAJOR_KEYWORDS.has(phrase)) {
      currentClause = phrase;
      const casedKeyword = phrase
        .split(' ')
        .map((w) => applyCasing(w, casing))
        .join(' ');

      if (formatted.length > 0) {
        formatted = formatted.trimEnd() + '\n';
      }
      formatted += getIndent(indentLevel) + casedKeyword + '\n' + getIndent(indentLevel + 1);

      i += tokensConsumed;
      continue;
    }

    // 2. Set Operations (UNION, UNION ALL, INTERSECT, etc.)
    if (SET_OPERATIONS.has(phrase)) {
      currentClause = phrase;
      const casedKeyword = phrase
        .split(' ')
        .map((w) => applyCasing(w, casing))
        .join(' ');

      formatted = formatted.trimEnd() + '\n\n' + getIndent(indentLevel) + casedKeyword + '\n\n' + getIndent(indentLevel);
      i += tokensConsumed;
      continue;
    }

    // 3. JOIN Clauses (LEFT JOIN, INNER JOIN, etc.)
    if (JOIN_KEYWORDS.has(phrase)) {
      const casedKeyword = phrase
        .split(' ')
        .map((w) => applyCasing(w, casing))
        .join(' ');

      formatted = formatted.trimEnd() + '\n' + getIndent(indentLevel) + casedKeyword + ' ';
      i += tokensConsumed;
      continue;
    }

    // 4. Logical Operators (AND, OR) under WHERE / HAVING / ON
    if (LOGICAL_KEYWORDS.has(upperWord) && t.type === 'WORD' && inParenthesesDepth === 0) {
      const casedWord = applyCasing(upperWord, casing);
      formatted = formatted.trimEnd() + '\n' + getIndent(indentLevel + 1) + casedWord + ' ';
      i++;
      continue;
    }

    // 5. Subclause Keywords (ON, USING)
    if (SUBCLAUSE_KEYWORDS.has(upperWord) && t.type === 'WORD' && inParenthesesDepth === 0) {
      const casedWord = applyCasing(upperWord, casing);
      if (!formatted.endsWith(' ')) formatted += ' ';
      formatted += casedWord + ' ';
      i++;
      continue;
    }

    // 6. CASE expressions
    if (CASE_KEYWORDS.has(upperWord) && t.type === 'WORD') {
      const casedWord = applyCasing(upperWord, casing);
      if (upperWord === 'CASE') {
        formatted += casedWord + ' ';
      } else if (upperWord === 'WHEN') {
        formatted = formatted.trimEnd() + '\n' + getIndent(indentLevel + 2) + casedWord + ' ';
      } else if (upperWord === 'THEN') {
        formatted += ' ' + casedWord + ' ';
      } else if (upperWord === 'ELSE') {
        formatted = formatted.trimEnd() + '\n' + getIndent(indentLevel + 2) + casedWord + ' ';
      } else if (upperWord === 'END') {
        formatted = formatted.trimEnd() + '\n' + getIndent(indentLevel + 1) + casedWord;
      }
      i++;
      continue;
    }

    // 7. Parentheses (Subqueries, Functions, Lists)
    if (t.type === 'PUNCTUATION' && t.value === '(') {
      inParenthesesDepth++;

      // Check preceding token to decide if space is needed before '('
      let prevToken: Token | null = null;
      for (let p = i - 1; p >= 0; p--) {
        if (nonWsTokens[p].type !== 'WHITESPACE') {
          prevToken = nonWsTokens[p];
          break;
        }
      }

      const isFunc = prevToken && prevToken.type === 'WORD' && BUILTIN_FUNCTIONS.has(prevToken.value.toUpperCase());
      if (!isFunc && formatted.length > 0 && !formatted.endsWith(' ') && !formatted.endsWith('\n') && !formatted.endsWith('(')) {
        formatted += ' ';
      }

      // Peek if this is a subquery: (SELECT ... or (WITH ...
      let nextNonWs = '';
      for (let j = i + 1; j < nonWsTokens.length; j++) {
        if (nonWsTokens[j].type !== 'WHITESPACE') {
          nextNonWs = nonWsTokens[j].value.toUpperCase();
          break;
        }
      }

      if (nextNonWs === 'SELECT' || nextNonWs === 'WITH') {
        parenStack.push('subquery');
        indentLevel++;
        formatted += '(\n' + getIndent(indentLevel);
      } else {
        parenStack.push('generic');
        formatted += '(';
      }
      i++;
      continue;
    }

    if (t.type === 'PUNCTUATION' && t.value === ')') {
      inParenthesesDepth = Math.max(0, inParenthesesDepth - 1);
      const top = parenStack.pop();

      if (top === 'subquery') {
        indentLevel = Math.max(0, indentLevel - 1);
        formatted = formatted.trimEnd() + '\n' + getIndent(indentLevel) + ')';
      } else {
        formatted = formatted.trimEnd() + ')';
      }
      i++;
      continue;
    }

    // 8. Commas
    if (t.type === 'PUNCTUATION' && t.value === ',') {
      // Only break line if not in a shallow function call like COALESCE(a, b)
      if (inParenthesesDepth === 0 || parenStack[parenStack.length - 1] === 'subquery') {
        if (commaLeading) {
          formatted = formatted.trimEnd() + '\n' + getIndent(indentLevel + 1) + ', ';
        } else {
          formatted = formatted.trimEnd() + ',\n' + getIndent(indentLevel + 1);
        }
      } else {
        formatted = formatted.trimEnd() + ', ';
      }
      i++;
      continue;
    }

    // 9. Semicolon
    if (t.type === 'PUNCTUATION' && t.value === ';') {
      formatted = formatted.trimEnd() + ';\n\n';
      currentClause = '';
      i++;
      continue;
    }

    // 10. Operators
    if (t.type === 'OPERATOR') {
      if (['::', '->', '->>', '#>', '#>>'].includes(t.value)) {
        // Direct affix without spaces
        formatted = formatted.trimEnd() + t.value;
      } else {
        // Standard arithmetic and comparison operators
        if (!formatted.endsWith(' ') && !formatted.endsWith('\n')) formatted += ' ';
        formatted += t.value + ' ';
      }
      i++;
      continue;
    }

    // 11. Built-in Functions & Standard Words
    if (t.type === 'WORD') {
      let wordOut = t.raw;
      if (BUILTIN_FUNCTIONS.has(upperWord)) {
        wordOut = applyCasing(upperWord, casing);
      } else if (ALL_KEYWORDS_LIST.includes(upperWord)) {
        wordOut = applyCasing(upperWord, casing);
      }

      if (
        formatted.length > 0 &&
        !formatted.endsWith(' ') &&
        !formatted.endsWith('\n') &&
        !formatted.endsWith('(') &&
        !formatted.endsWith('.')
      ) {
        formatted += ' ';
      }
      formatted += wordOut;
      i++;
      continue;
    }

    // 12. String literals, Numbers, Quoted Identifiers, Period, etc.
    let val = t.raw;
    if (t.type === 'PUNCTUATION' && t.value === '.') {
      formatted = formatted.trimEnd() + '.';
    } else {
      if (
        formatted.length > 0 &&
        !formatted.endsWith(' ') &&
        !formatted.endsWith('\n') &&
        !formatted.endsWith('(') &&
        !formatted.endsWith('.')
      ) {
        formatted += ' ';
      }
      formatted += val;
    }

    i++;
  }

  // Clean trailing spaces and excessive newlines
  const finalFormatted = formatted
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();

  const analysis = analyzeSql(originalSql, finalFormatted);

  return {
    formattedSql: finalFormatted,
    analysis,
  };
}

/**
 * Static Analysis & Safety Scanner for SQL
 */
export function analyzeSql(rawSql: string, formattedSql: string): SqlAnalysisResult {
  const syntaxErrors: string[] = [];
  const warnings: string[] = [];
  const statementTypes: string[] = [];
  const tableNames = new Set<string>();

  let hasWhereClause = false;
  let isDangerousQuery = false;
  let subqueryCount = 0;
  let joinCount = 0;
  let cteCount = 0;

  if (!rawSql.trim()) {
    return {
      isValidSyntax: true,
      syntaxErrors: [],
      warnings: [],
      statementTypes: [],
      tableNames: [],
      hasWhereClause: false,
      isDangerousQuery: false,
      subqueryCount: 0,
      joinCount: 0,
      cteCount: 0,
      stats: {
        lineCountBefore: 0,
        lineCountAfter: 0,
        charCountBefore: 0,
        charCountAfter: 0,
        byteCountBefore: 0,
        byteCountAfter: 0,
      },
    };
  }

  // 1. Balance Checks (Quotes, Parentheses, Comments)
  let singleQuotes = 0;
  let doubleQuotes = 0;
  let backticks = 0;
  let parenDepth = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;

  for (let i = 0; i < rawSql.length; i++) {
    const ch = rawSql[i];
    const prev = i > 0 ? rawSql[i - 1] : '';

    if (ch === "'" && !inDouble && !inBacktick && prev !== '\\') {
      inSingle = !inSingle;
      singleQuotes++;
    } else if (ch === '"' && !inSingle && !inBacktick && prev !== '\\') {
      inDouble = !inDouble;
      doubleQuotes++;
    } else if (ch === '`' && !inSingle && !inDouble) {
      inBacktick = !inBacktick;
      backticks++;
    } else if (!inSingle && !inDouble && !inBacktick) {
      if (ch === '(') parenDepth++;
      else if (ch === ')') parenDepth--;
    }
  }

  if (inSingle) syntaxErrors.push('Unclosed single quote detected.');
  if (inDouble) syntaxErrors.push('Unclosed double quote detected.');
  if (inBacktick) syntaxErrors.push('Unclosed backtick identifier detected.');
  if (parenDepth !== 0) {
    syntaxErrors.push(
      parenDepth > 0
        ? `Unmatched opening parenthesis '(' (${parenDepth} unclosed).`
        : `Unexpected closing parenthesis ')' without matching opening.`
    );
  }

  // 2. Tokenize for Clause Inspection
  const tokens = tokenizeSql(rawSql);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type !== 'WORD') continue;
    const up = t.value.toUpperCase();

    // Statement types
    if (
      ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'WITH'].includes(
        up
      )
    ) {
      if (!statementTypes.includes(up)) statementTypes.push(up);
    }

    if (up === 'WHERE') hasWhereClause = true;
    if (up === 'JOIN') joinCount++;
    if (up === 'WITH') cteCount++;

    // Subquery detection: '(' followed by SELECT
    if (t.value === '(' && i + 1 < tokens.length) {
      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j].type === 'WHITESPACE') continue;
        if (tokens[j].value.toUpperCase() === 'SELECT') subqueryCount++;
        break;
      }
    }

    // Table extraction: look after FROM, JOIN, INTO, UPDATE, TABLE
    if (['FROM', 'JOIN', 'INTO', 'UPDATE', 'TABLE'].includes(up)) {
      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j].type === 'WHITESPACE') continue;
        if (tokens[j].type === 'WORD' || tokens[j].type === 'IDENTIFIER_QUOTED') {
          const tbl = tokens[j].value.replace(/[`"[\]]/g, '');
          if (tbl && !MAJOR_KEYWORDS.has(tbl.toUpperCase()) && !JOIN_KEYWORDS.has(tbl.toUpperCase())) {
            tableNames.add(tbl);
          }
        }
        break;
      }
    }
  }

  // 3. Safety Rules (Destructive operations without WHERE)
  const isUpdate = statementTypes.includes('UPDATE');
  const isDelete = statementTypes.includes('DELETE');
  const isDrop = statementTypes.includes('DROP') || statementTypes.includes('TRUNCATE');

  if (isUpdate && !hasWhereClause) {
    isDangerousQuery = true;
    warnings.push(
      '⚠️ CRITICAL: UPDATE statement has NO WHERE clause. Every row in the target table will be updated!'
    );
  }
  if (isDelete && !hasWhereClause) {
    isDangerousQuery = true;
    warnings.push(
      '⚠️ CRITICAL: DELETE statement has NO WHERE clause. All records in the target table will be purged!'
    );
  }
  if (isDrop) {
    isDangerousQuery = true;
    warnings.push('⚠️ CAUTION: Statement contains DROP or TRUNCATE command affecting database schema or data.');
  }

  // Stats calculation
  const lineCountBefore = rawSql.split('\n').length;
  const lineCountAfter = formattedSql ? formattedSql.split('\n').length : 0;
  const charCountBefore = rawSql.length;
  const charCountAfter = formattedSql.length;
  const byteCountBefore = new TextEncoder().encode(rawSql).length;
  const byteCountAfter = new TextEncoder().encode(formattedSql).length;

  return {
    isValidSyntax: syntaxErrors.length === 0,
    syntaxErrors,
    warnings,
    statementTypes,
    tableNames: Array.from(tableNames),
    hasWhereClause,
    isDangerousQuery,
    subqueryCount,
    joinCount,
    cteCount,
    stats: {
      lineCountBefore,
      lineCountAfter,
      charCountBefore,
      charCountAfter,
      byteCountBefore,
      byteCountAfter,
    },
  };
}

/**
 * Generate code snippet in target programming language
 */
export function generateSqlCodeSnippet(
  sql: string,
  lang: 'typescript' | 'prisma' | 'python' | 'go' | 'java' | 'php' | 'csharp' | 'cli'
): string {
  const cleanSql = sql.trim();
  const escapedDoubleQuote = cleanSql.replace(/"/g, '\\"');
  const escapedSingleQuote = cleanSql.replace(/'/g, "\\'");
  const escapedBacktick = cleanSql.replace(/`/g, '\\`').replace(/\${/g, '\\${');

  switch (lang) {
    case 'typescript':
      return `import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function executeQuery() {
  const client = await pool.connect();
  try {
    const query = \`
${cleanSql}
\`;
    const result = await client.query(query);
    console.log(\`Fetched \${result.rowCount} rows\`);
    return result.rows;
  } finally {
    client.release();
  }
}`;

    case 'prisma':
      return `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runRawSql() {
  const results = await prisma.$queryRaw\`
${escapedBacktick}
\`;
  return results;
}`;

    case 'python':
      return `import os
import psycopg2
from psycopg2.extras import RealDictCursor

def execute_query():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            query = """
${cleanSql}
"""
            cursor.execute(query)
            if cursor.description:
                rows = cursor.fetchall()
                print(f"Fetched {len(rows)} records")
                return rows
            conn.commit()
    finally:
        conn.close()`;

    case 'go':
      return `package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

func executeQuery(db *sql.DB) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := \`
${cleanSql}
\`
	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return fmt.Errorf("query execution failed: %w", err)
	}
	defer rows.Close()

	log.Println("Query executed successfully")
	return nil
}`;

    case 'java':
      return `import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class DatabaseService {
    public static void executeQuery() throws SQLException {
        String url = System.getenv("DATABASE_URL");
        String sql = """
${cleanSql}
        """;

        try (Connection conn = DriverManager.getConnection(url);
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            boolean isResultSet = stmt.execute();
            if (isResultSet) {
                try (ResultSet rs = stmt.getResultSet()) {
                    while (rs.next()) {
                        // Process results
                    }
                }
            }
        }
    }
}`;

    case 'php':
      return `<?php

$pdo = new PDO(
    getenv('DATABASE_DSN'),
    getenv('DB_USER'),
    getenv('DB_PASS'),
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$sql = <<<SQL
${cleanSql}
SQL;

$stmt = $pdo->prepare($sql);
$stmt->execute();
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Fetched " . count($results) . " rows\\n";
`;

    case 'csharp':
      return `using System;
using System.Data;
using Microsoft.Data.SqlClient;

public class SqlRunner
{
    public static async Task ExecuteAsync(string connectionString)
    {
        const string sql = @"
${cleanSql.replace(/"/g, '""')}
";
        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            // Process row
        }
    }
}`;

    case 'cli':
      return `# Run against PostgreSQL
psql "$DATABASE_URL" -c "${escapedDoubleQuote.replace(/\n/g, ' ')}"

# Run against MySQL
mysql -u "$DB_USER" -p"$DB_PASS" -D "$DB_NAME" -e "${escapedDoubleQuote.replace(/\n/g, ' ')}"`;

    default:
      return cleanSql;
  }
}

// ---------------- Preset Queries ----------------
export const SQL_PRESETS = [
  {
    id: 'analytics_cte',
    label: 'Analytic Query (CTE & Window Function)',
    description: 'WITH clauses, ROW_NUMBER() OVER partition, multi-table joins, and aggregate filtering',
    sql: `WITH user_orders AS (
  SELECT
    u.id AS user_id,
    u.email,
    u.country,
    COUNT(o.id) AS total_orders,
    SUM(o.amount) AS total_spend,
    ROW_NUMBER() OVER (PARTITION BY u.country ORDER BY SUM(o.amount) DESC) AS rank_in_country
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id
  WHERE u.created_at >= '2025-01-01' AND u.status = 'active'
  GROUP BY u.id, u.email, u.country
  HAVING COUNT(o.id) > 2
)
SELECT
  user_id,
  email,
  country,
  total_orders,
  total_spend,
  rank_in_country
FROM user_orders
WHERE rank_in_country <= 10
ORDER BY country ASC, total_spend DESC;`,
  },
  {
    id: 'ecommerce_join',
    label: 'E-Commerce Join & Summary',
    description: 'Multi-table INNER and LEFT JOINs with COALESCE and conditional expressions',
    sql: `SELECT
  c.customer_id,
  CONCAT(c.first_name, ' ', c.last_name) AS full_name,
  c.email,
  COUNT(o.order_id) AS orders_count,
  COALESCE(SUM(oi.quantity * oi.unit_price), 0.00) AS total_gross_value,
  MAX(o.order_date) AS last_order_date
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.status IN ('completed', 'shipped')
  AND o.order_date BETWEEN '2025-06-01' AND '2025-12-31'
GROUP BY c.customer_id, c.first_name, c.last_name, c.email
ORDER BY total_gross_value DESC
LIMIT 100;`,
  },
  {
    id: 'postgres_upsert',
    label: 'PostgreSQL Upsert & JSON',
    description: 'INSERT INTO ... ON CONFLICT DO UPDATE with JSONB operators and RETURNING',
    sql: `INSERT INTO user_profiles (user_id, metadata, settings, updated_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '{"theme": "dark", "notifications": true}'::jsonb,
  '{"locale": "en_US"}'::jsonb,
  NOW()
)
ON CONFLICT (user_id)
DO UPDATE SET
  metadata = user_profiles.metadata || EXCLUDED.metadata,
  settings = EXCLUDED.settings,
  updated_at = NOW()
RETURNING id, user_id, updated_at;`,
  },
  {
    id: 'schema_ddl',
    label: 'Database Table DDL Schema',
    description: 'CREATE TABLE with PRIMARY KEY, FOREIGN KEY, CHECK constraints, and defaults',
    sql: `CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_tier VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`,
  },
  {
    id: 'safe_update',
    label: 'Conditional UPDATE with CASE',
    description: 'UPDATE with CASE WHEN conditional pricing and WHERE guardrails',
    sql: `UPDATE products
SET
  stock_quantity = stock_quantity - 1,
  discount_rate = CASE
    WHEN stock_quantity > 100 THEN 0.15
    WHEN stock_quantity > 50 THEN 0.10
    ELSE 0.05
  END,
  last_updated = NOW()
WHERE category_id = 42 AND active = TRUE;`,
  },
  {
    id: 'messy_oneline',
    label: 'Messy One-Liner (Format Test)',
    description: 'Unformatted single-line SQL with mixed case and compact syntax for instant beautification',
    sql: `select u.id,u.name,count(o.id) as orders from users u left join orders o on u.id=o.user_id where u.active=1 and u.status in ('verified','premium') group by u.id,u.name having count(o.id)>5 order by orders desc limit 50;`,
  },
];

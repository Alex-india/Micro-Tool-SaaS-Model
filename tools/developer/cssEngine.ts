/**
 * ToolVerse CSS Engine
 * Pure TypeScript CSS Tokenizer, Formatter, Minifier, and Analyzer.
 * Zero external dependencies.
 */

export type IndentStyle = '2spaces' | '4spaces' | 'tab';
export type SelectorStyle = 'multiline' | 'singleline';
export type PropertySort = 'none' | 'alphabetical' | 'concentric';

export interface CssFormatOptions {
  indent?: IndentStyle;
  selectorStyle?: SelectorStyle;
  propertySort?: PropertySort;
  preserveComments?: boolean;
  emptyLinesBetweenBlocks?: number;
}

export interface CssMinifyOptions {
  preserveLicenseComments?: boolean;
  optimizeColors?: boolean;
  stripZeroUnits?: boolean;
}

export interface CssAnalysisResult {
  isValidSyntax: boolean;
  syntaxErrors: string[];
  warnings: string[];
  ruleCount: number;
  selectorCount: number;
  declarationCount: number;
  mediaQueryCount: number;
  keyframeCount: number;
  customVariableCount: number;
  stats: {
    lineCountBefore: number;
    lineCountAfter: number;
    charCountBefore: number;
    charCountAfter: number;
    byteCountBefore: number;
    byteCountAfter: number;
    compressionRatio: number; // percentage reduction
  };
}

export interface CssFormatResult {
  formattedCss: string;
  analysis: CssAnalysisResult;
}

// ---------------- Token Types ----------------
export type TokenType =
  | 'COMMENT'
  | 'STRING'
  | 'URL'
  | 'AT_RULE'
  | 'SELECTOR'
  | 'PROPERTY'
  | 'VALUE'
  | 'BRACE_OPEN'
  | 'BRACE_CLOSE'
  | 'COLON'
  | 'SEMICOLON'
  | 'COMMA'
  | 'WHITESPACE';

export interface Token {
  type: TokenType;
  value: string;
  raw: string;
}

// Concentric property ordering lookup
const CONCENTRIC_ORDER = [
  // Positioning
  'position', 'top', 'right', 'bottom', 'left', 'z-index', 'inset',
  // Display & Layout
  'display', 'flex', 'flex-direction', 'flex-wrap', 'flex-flow', 'justify-content',
  'align-items', 'align-content', 'align-self', 'order', 'flex-grow', 'flex-shrink', 'flex-basis',
  'grid', 'grid-template-columns', 'grid-template-rows', 'grid-template-areas', 'grid-auto-columns',
  'grid-auto-rows', 'grid-auto-flow', 'grid-column', 'grid-row', 'grid-area', 'gap', 'row-gap', 'column-gap',
  'float', 'clear',
  // Box Model
  'box-sizing', 'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'margin-inline', 'margin-block',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'padding-inline', 'padding-block',
  'border', 'border-width', 'border-style', 'border-color',
  'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
  // Typography
  'font', 'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant', 'line-height',
  'color', 'text-align', 'text-decoration', 'text-transform', 'text-indent', 'letter-spacing', 'word-spacing',
  'white-space', 'word-break', 'overflow-wrap', 'text-overflow', 'vertical-align',
  // Visuals & Effects
  'background', 'background-color', 'background-image', 'background-repeat', 'background-position', 'background-size',
  'background-clip', 'background-origin', 'background-attachment',
  'opacity', 'visibility', 'box-shadow', 'backdrop-filter', 'filter', 'mix-blend-mode',
  'outline', 'outline-width', 'outline-style', 'outline-color', 'outline-offset',
  'overflow', 'overflow-x', 'overflow-y', 'clip', 'clip-path',
  // Interactivity & Animation
  'cursor', 'pointer-events', 'user-select', 'resize',
  'transition', 'transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay',
  'transform', 'transform-origin',
  'animation', 'animation-name', 'animation-duration', 'animation-timing-function', 'animation-delay',
  'animation-iteration-count', 'animation-direction', 'animation-fill-mode', 'animation-play-state',
];

const CONCENTRIC_MAP = new Map<string, number>();
CONCENTRIC_ORDER.forEach((prop, idx) => {
  CONCENTRIC_MAP.set(prop, idx);
});

/**
 * Tokenize CSS string
 */
export function tokenizeCss(css: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = css.length;

  while (i < len) {
    const ch = css[i];
    const next = i + 1 < len ? css[i + 1] : '';

    // 1. Whitespace
    if (/\s/.test(ch)) {
      let j = i;
      while (j < len && /\s/.test(css[j])) j++;
      tokens.push({ type: 'WHITESPACE', value: ' ', raw: css.substring(i, j) });
      i = j;
      continue;
    }

    // 2. Comments (/* ... */)
    if (ch === '/' && next === '*') {
      let j = i + 2;
      while (j < len && !(css[j] === '*' && css[j + 1] === '/')) j++;
      j = Math.min(len, j + 2);
      tokens.push({
        type: 'COMMENT',
        value: css.substring(i, j),
        raw: css.substring(i, j),
      });
      i = j;
      continue;
    }

    // 3. String literals ("..." or '...')
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < len && css[j] !== quote) {
        if (css[j] === '\\') j++;
        j++;
      }
      const str = css.substring(i, Math.min(len, j + 1));
      tokens.push({ type: 'STRING', value: str, raw: str });
      i = Math.min(len, j + 1);
      continue;
    }

    // 4. url(...) function
    if (
      (ch === 'u' || ch === 'U') &&
      css.substring(i, i + 4).toLowerCase() === 'url('
    ) {
      let j = i + 4;
      while (j < len && css[j] !== ')') {
        if (css[j] === '\\') j++;
        j++;
      }
      const urlStr = css.substring(i, Math.min(len, j + 1));
      tokens.push({ type: 'URL', value: urlStr, raw: urlStr });
      i = Math.min(len, j + 1);
      continue;
    }

    // 5. Braces & Punctuation
    if (ch === '{') {
      tokens.push({ type: 'BRACE_OPEN', value: '{', raw: '{' });
      i++;
      continue;
    }
    if (ch === '}') {
      tokens.push({ type: 'BRACE_CLOSE', value: '}', raw: '}' });
      i++;
      continue;
    }
    if (ch === ':') {
      tokens.push({ type: 'COLON', value: ':', raw: ':' });
      i++;
      continue;
    }
    if (ch === ';') {
      tokens.push({ type: 'SEMICOLON', value: ';', raw: ';' });
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',', raw: ',' });
      i++;
      continue;
    }

    // 6. Generic Text (Selector, Property, Value, At-rule)
    let j = i;
    while (j < len && !/[\s{}:;,'"/]/.test(css[j])) {
      j++;
    }
    const chunk = css.substring(i, j);
    tokens.push({
      type: chunk.startsWith('@') ? 'AT_RULE' : 'SELECTOR',
      value: chunk,
      raw: chunk,
    });
    i = j;
  }

  return tokens;
}

/**
 * Minify CSS into a compact single-line stylesheet
 */
export function minifyCss(css: string, options: CssMinifyOptions = {}): string {
  if (!css.trim()) return '';

  const preserveLicense = options.preserveLicenseComments ?? true;
  const optimizeColors = options.optimizeColors ?? true;
  const stripZeroUnits = options.stripZeroUnits ?? true;

  let min = css;

  // 1. Comments
  if (preserveLicense) {
    // Preserve comments starting with /*!
    min = min.replace(/\/\*(?!!)(?:(?!\*\/)[\s\S])*\*\/ */g, '');
  } else {
    min = min.replace(/\/\*[\s\S]*?\*\//g, '');
  }

  // 2. Collapse whitespace
  min = min.replace(/\s+/g, ' ');

  // 3. Remove spaces around symbols { } : ; , > ~ +
  min = min.replace(/\s*([{}();:,>+~])\s*/g, '$1');

  // Fix spacing around !important
  min = min.replace(/!\s*important/gi, '!important');

  // 4. Remove redundant trailing semicolon before closing brace
  min = min.replace(/;}/g, '}');

  // 5. Hex color optimization (#ffffff -> #fff, #000000 -> #000)
  if (optimizeColors) {
    min = min.replace(
      /#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3(?=[^0-9a-fA-F]|$)/g,
      '#$1$2$3'
    );
  }

  // 6. Zero unit stripping: 0px -> 0 (except inside keyframes percentage like 0% {)
  if (stripZeroUnits) {
    min = min.replace(/(?<=[:\s,])0(?:px|em|rem|pt|cm|mm|in|pc|vh|vw|vmin|vmax)(?=[;,\s}!])/g, '0');
  }

  return min.trim();
}

/**
 * Format & Beautify CSS
 */
export function formatCss(css: string, options: CssFormatOptions = {}): CssFormatResult {
  const originalCss = css;
  if (!css.trim()) {
    return {
      formattedCss: '',
      analysis: analyzeCss('', ''),
    };
  }

  const indentStr =
    options.indent === '4spaces' ? '    ' : options.indent === 'tab' ? '\t' : '  ';
  const multilineSelectors = options.selectorStyle === 'multiline';
  const propertySort = options.propertySort || 'none';
  const preserveComments = options.preserveComments ?? true;

  // Tokenize
  const rawTokens = tokenizeCss(css);

  // We will build a structured representation:
  // Tree of blocks and declarations
  let formatted = '';
  let indentLevel = 0;
  let buffer = '';

  const getIndent = (lvl: number) => indentStr.repeat(Math.max(0, lvl));

  // Declaration tracking for property sorting within current rule block
  interface Decl {
    prop: string;
    val: string;
  }
  let currentBlockDecls: Decl[] = [];

  const flushDecls = (lvl: number): string => {
    if (currentBlockDecls.length === 0) return '';
    let decls = [...currentBlockDecls];

    if (propertySort === 'alphabetical') {
      decls.sort((a, b) => a.prop.localeCompare(b.prop));
    } else if (propertySort === 'concentric') {
      decls.sort((a, b) => {
        const orderA = CONCENTRIC_MAP.get(a.prop) ?? 999;
        const orderB = CONCENTRIC_MAP.get(b.prop) ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.prop.localeCompare(b.prop);
      });
    }

    let out = '';
    for (const d of decls) {
      out += `${getIndent(lvl)}${d.prop}: ${d.val};\n`;
    }
    currentBlockDecls = [];
    return out;
  };

  const formatSelector = (sel: string, lvl: number): string => {
    const trimmed = sel.trim().replace(/\s+/g, ' ');
    if (multilineSelectors && trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s, idx, arr) => `${getIndent(lvl)}${s}${idx < arr.length - 1 ? ',' : ''}`)
        .join('\n');
    }
    return `${getIndent(lvl)}${trimmed}`;
  };

  let i = 0;
  while (i < rawTokens.length) {
    const t = rawTokens[i];

    // Comments
    if (t.type === 'COMMENT') {
      if (preserveComments) {
        if (buffer.trim()) {
          // If comment appears inside a declaration
          buffer += ' ' + t.raw + ' ';
        } else {
          formatted += `${getIndent(indentLevel)}${t.raw}\n`;
        }
      }
      i++;
      continue;
    }

    // Opening Brace {
    if (t.type === 'BRACE_OPEN') {
      // Flush any pending declarations from parent before opening nested block
      if (currentBlockDecls.length > 0) {
        formatted += flushDecls(indentLevel);
      }

      const selectorHeader = formatSelector(buffer, indentLevel);
      formatted += `${selectorHeader} {\n`;
      buffer = '';
      indentLevel++;
      i++;
      continue;
    }

    // Closing Brace }
    if (t.type === 'BRACE_CLOSE') {
      // Handle trailing declaration without semicolon (e.g., color: red})
      if (buffer.includes(':')) {
        const colonIdx = buffer.indexOf(':');
        const prop = buffer.substring(0, colonIdx).trim();
        const val = buffer.substring(colonIdx + 1).trim();
        if (prop && val) {
          currentBlockDecls.push({ prop, val });
        }
      }
      buffer = '';

      // Flush declarations with current indent
      formatted += flushDecls(indentLevel);

      indentLevel = Math.max(0, indentLevel - 1);
      formatted += `${getIndent(indentLevel)}}\n\n`;
      i++;
      continue;
    }

    // Semicolon ;
    if (t.type === 'SEMICOLON') {
      // Buffer contains "prop: val"
      if (buffer.includes(':')) {
        const colonIdx = buffer.indexOf(':');
        const prop = buffer.substring(0, colonIdx).trim();
        const val = buffer.substring(colonIdx + 1).trim();
        if (prop && val) {
          currentBlockDecls.push({ prop, val });
        } else {
          // Malformed or standalone
          formatted += `${getIndent(indentLevel)}${buffer.trim()};\n`;
        }
      } else if (buffer.trim()) {
        // e.g. @import or @charset
        formatted += `${getIndent(indentLevel)}${buffer.trim()};\n`;
      }
      buffer = '';
      i++;
      continue;
    }

    // Whitespace
    if (t.type === 'WHITESPACE') {
      if (buffer.length > 0 && !buffer.endsWith(' ') && !buffer.endsWith(':') && !buffer.endsWith('(')) {
        buffer += ' ';
      }
      i++;
      continue;
    }

    // Colon
    if (t.type === 'COLON') {
      buffer += ': ';
      i++;
      continue;
    }

    // Comma
    if (t.type === 'COMMA') {
      buffer += ', ';
      i++;
      continue;
    }

    // Standard tokens (selector, property, value, string, url, number, etc.)
    buffer += t.raw;
    i++;
  }

  // Final cleanup of extra newlines
  const finalFormatted = formatted.replace(/\n{3,}/g, '\n\n').trim();
  const analysis = analyzeCss(originalCss, finalFormatted);

  return {
    formattedCss: finalFormatted,
    analysis,
  };
}

/**
 * Static Analysis & Metrics for CSS
 */
export function analyzeCss(rawCss: string, formattedCss: string): CssAnalysisResult {
  const syntaxErrors: string[] = [];
  const warnings: string[] = [];

  if (!rawCss.trim()) {
    return {
      isValidSyntax: true,
      syntaxErrors: [],
      warnings: [],
      ruleCount: 0,
      selectorCount: 0,
      declarationCount: 0,
      mediaQueryCount: 0,
      keyframeCount: 0,
      customVariableCount: 0,
      stats: {
        lineCountBefore: 0,
        lineCountAfter: 0,
        charCountBefore: 0,
        charCountAfter: 0,
        byteCountBefore: 0,
        byteCountAfter: 0,
        compressionRatio: 0,
      },
    };
  }

  // 1. Balance Check ({ vs }, strings, comments)
  let braceDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inComment = false;

  for (let i = 0; i < rawCss.length; i++) {
    const ch = rawCss[i];
    const next = i + 1 < rawCss.length ? rawCss[i + 1] : '';

    if (!inSingleQuote && !inDoubleQuote) {
      if (!inComment && ch === '/' && next === '*') {
        inComment = true;
        i++;
        continue;
      }
      if (inComment && ch === '*' && next === '/') {
        inComment = false;
        i++;
        continue;
      }
    }

    if (inComment) continue;

    if (ch === "'" && !inDoubleQuote && rawCss[i - 1] !== '\\') {
      inSingleQuote = !inSingleQuote;
    } else if (ch === '"' && !inSingleQuote && rawCss[i - 1] !== '\\') {
      inDoubleQuote = !inDoubleQuote;
    } else if (!inSingleQuote && !inDoubleQuote) {
      if (ch === '{') braceDepth++;
      else if (ch === '}') braceDepth--;
    }
  }

  if (inComment) syntaxErrors.push('Unclosed comment /* detected.');
  if (inSingleQuote) syntaxErrors.push('Unclosed single quote string detected.');
  if (inDoubleQuote) syntaxErrors.push('Unclosed double quote string detected.');
  if (braceDepth !== 0) {
    syntaxErrors.push(
      braceDepth > 0
        ? `Unmatched opening brace '{' (${braceDepth} unclosed).`
        : `Unexpected closing brace '}' without matching opening brace.`
    );
  }

  // 2. Metrics (Rules, Selectors, Declarations, Media, Keyframes, Custom Variables)
  const mediaQueryCount = (rawCss.match(/@media[^{]*\{/gi) || []).length;
  const keyframeCount = (rawCss.match(/@keyframes[^{]*\{/gi) || []).length;
  const customVariableCount = (rawCss.match(/--[a-zA-Z0-9_-]+(?=\s*:)/g) || []).length;

  // Declaration count: estimate by semicolons inside braces
  const declarationCount = (rawCss.match(/[a-zA-Z0-9_-]+\s*:[^;{}]+;/g) || []).length;

  // Rule count: count of { minus at-rules that contain blocks
  const totalOpenBraces = (rawCss.match(/\{/g) || []).length;
  const ruleCount = Math.max(0, totalOpenBraces - mediaQueryCount);

  // Selector count: commas + opening braces outside media
  const selectorCount = Math.max(ruleCount, (rawCss.match(/,/g) || []).length + ruleCount);

  // Stats calculation
  const lineCountBefore = rawCss.split('\n').length;
  const lineCountAfter = formattedCss ? formattedCss.split('\n').length : 0;
  const charCountBefore = rawCss.length;
  const charCountAfter = formattedCss.length;
  const byteCountBefore = new TextEncoder().encode(rawCss).length;
  const byteCountAfter = new TextEncoder().encode(formattedCss).length;

  const compressionRatio =
    byteCountBefore > 0
      ? Math.max(0, Math.round(((byteCountBefore - byteCountAfter) / byteCountBefore) * 100))
      : 0;

  return {
    isValidSyntax: syntaxErrors.length === 0,
    syntaxErrors,
    warnings,
    ruleCount,
    selectorCount,
    declarationCount,
    mediaQueryCount,
    keyframeCount,
    customVariableCount,
    stats: {
      lineCountBefore,
      lineCountAfter,
      charCountBefore,
      charCountAfter,
      byteCountBefore,
      byteCountAfter,
      compressionRatio,
    },
  };
}

// ---------------- Presets ----------------
export const CSS_PRESETS = [
  {
    id: 'glassmorphic_card',
    label: 'Glassmorphism Card & Variables',
    description: 'Modern frosted glass card with CSS custom properties, backdrop-filter, and smooth hover state',
    css: `:root {
  --card-bg: rgba(255, 255, 255, 0.08);
  --card-border: rgba(255, 255, 255, 0.15);
  --card-blur: 16px;
  --accent-color: #6366f1;
  --text-primary: #f8fafc;
}

.glass-card {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  max-width: 380px;
  padding: 24px;
  margin: 0 auto;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  backdrop-filter: blur(var(--card-blur));
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px 0 rgba(99, 102, 241, 0.25);
  border-color: var(--accent-color);
}

.glass-card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.glass-card-text {
  font-size: 0.875rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
}`,
  },
  {
    id: 'animated_button',
    label: 'Animated Button & Keyframes',
    description: 'Glow button with pulse keyframe animation and ripple pseudo-elements',
    css: `@keyframes pulseGlow {
  0% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.6);
  }
  70% {
    box-shadow: 0 0 0 14px rgba(99, 102, 241, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}

.btn-glow {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 28px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  outline: none;
  overflow: hidden;
  transition: all 0.25s ease-in-out;
  animation: pulseGlow 2s infinite;
}

.btn-glow:hover {
  transform: scale(1.04);
  background: linear-gradient(135deg, #4f46e5 0%, #9333ea 100%);
}

.btn-glow:active {
  transform: scale(0.98);
}`,
  },
  {
    id: 'responsive_grid',
    label: 'Responsive Grid & Media Queries',
    description: 'CSS Grid with dynamic auto-fit minmax and mobile-first media query breakpoints',
    css: `.grid-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

@media (min-width: 640px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (min-width: 1024px) {
  .grid-container {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }
}

.grid-item {
  padding: 20px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  color: #f1f5f9;
}`,
  },
  {
    id: 'messy_oneline',
    label: 'Messy One-Liner (Format Test)',
    description: 'Compressed unformatted CSS with mixed casing, missing spaces, and comments for instant beautification',
    css: `/* Header & Navigation */.navbar{position:fixed;top:0;left:0;width:100%;height:64px;background:#0f172a;display:flex;align-items:center;justify-content:space-between;padding:0 24px;box-sizing:border-box;z-index:100}.navbar-brand{font-size:20px;font-weight:700;color:#38bdf8;text-decoration:none}.nav-links{display:flex;gap:16px;list-style:none;margin:0;padding:0}.nav-item a{color:#94a3b8;font-size:14px;transition:color .2s ease}.nav-item a:hover{color:#ffffff}@media(max-width:768px){.nav-links{display:none}}`,
  },
];

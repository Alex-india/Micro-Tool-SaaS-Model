export interface JSONFormatterResult {
  isValid: boolean;
  formattedText: string;
  minifiedText: string;
  error?: string;
  lineError?: number;
  itemCount?: number;
  depth?: number;
}

export function processJSON(input: string, indentSpaces: number = 2): JSONFormatterResult {
  if (!input || !input.trim()) {
    return {
      isValid: true,
      formattedText: "",
      minifiedText: "",
    };
  }

  try {
    const parsed = JSON.parse(input);
    const formattedText = JSON.stringify(parsed, null, indentSpaces);
    const minifiedText = JSON.stringify(parsed);

    // Calculate depth and key count
    let itemCount = 0;
    if (Array.isArray(parsed)) {
      itemCount = parsed.length;
    } else if (typeof parsed === "object" && parsed !== null) {
      itemCount = Object.keys(parsed).length;
    }

    return {
      isValid: true,
      formattedText,
      minifiedText,
      itemCount,
    };
  } catch (err: any) {
    const errorMsg = err?.message || "Invalid JSON syntax";
    let lineError = 1;
    const match = errorMsg.match(/position (\d+)/i) || errorMsg.match(/line (\d+)/i);
    if (match && match[1]) {
      const pos = parseInt(match[1], 10);
      if (!isNaN(pos)) {
        lineError = input.substring(0, pos).split("\n").length;
      }
    }

    return {
      isValid: false,
      formattedText: input,
      minifiedText: "",
      error: errorMsg,
      lineError,
    };
  }
}

export interface CSVtoJSONOptions {
  delimiter: "," | ";" | "\t" | "|";
  hasHeader: boolean;
}

export function convertCSVtoJSON(csvText: string, options: CSVtoJSONOptions): string {
  if (!csvText || !csvText.trim()) return "";

  const lines = csvText
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return "[]";

  const { delimiter = ",", hasHeader = true } = options;

  const parseLine = (line: string) => {
    return line.split(delimiter).map((col) => col.trim().replace(/^"|"$/g, ""));
  };

  if (hasHeader) {
    const headers = parseLine(lines[0]);
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      const row = parseLine(lines[i]);
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        const val = row[idx] !== undefined ? row[idx] : "";
        // try number parsing
        obj[h || `col_${idx + 1}`] = !isNaN(Number(val)) && val !== "" ? Number(val) : val;
      });
      result.push(obj);
    }
    return JSON.stringify(result, null, 2);
  } else {
    const result = lines.map((line) => parseLine(line));
    return JSON.stringify(result, null, 2);
  }
}

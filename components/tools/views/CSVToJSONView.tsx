"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { Dropzone } from "@/components/ui/Dropzone";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Copy, Check, Download, ArrowLeftRight, FileCode, Sparkles } from "lucide-react";

export interface CSVToJSONViewProps {
  tool: ToolMeta;
}

export const CSVToJSONView: React.FC<CSVToJSONViewProps> = ({ tool }) => {
  const slug = tool.slug;

  const isMarkdown = slug.includes("markdown") || slug.includes("md");
  const isXml = slug.includes("xml");
  const isYaml = slug.includes("yaml");
  const isExcel = slug.includes("excel");

  // Format mode
  let defaultMode: "csv_to_json" | "json_to_csv" | "md_to_html" | "html_to_md" | "xml_to_json" | "json_to_xml" | "yaml_to_json" | "json_to_yaml" = "csv_to_json";
  if (slug.includes("json-to-csv")) defaultMode = "json_to_csv";
  else if (slug.includes("markdown-to-html")) defaultMode = "md_to_html";
  else if (slug.includes("html-to-markdown")) defaultMode = "html_to_md";
  else if (slug.includes("xml-to-json")) defaultMode = "xml_to_json";
  else if (slug.includes("json-to-xml")) defaultMode = "json_to_xml";
  else if (slug.includes("yaml-to-json")) defaultMode = "yaml_to_json";
  else if (slug.includes("json-to-yaml")) defaultMode = "json_to_yaml";

  const [mode, setMode] = useState(defaultMode);

  // Sample inputs
  const sampleCSV = `id,name,category,price,inStock\n1,Wireless Mouse,Electronics,29.99,true\n2,Ergonomic Chair,Furniture,199.50,true\n3,Mechanical Keyboard,Electronics,89.00,false`;
  const sampleMarkdown = `# Welcome to ToolVerse\n\nThis is a **high performance** conversion tool.\n\n- Zero cloud uploads\n- 100% private in-browser execution\n- Supports [Markdown](https://toolverse.app) and HTML.`;
  const sampleXML = `<products>\n  <product id="1">\n    <name>Wireless Mouse</name>\n    <price>29.99</price>\n  </product>\n</products>`;
  const sampleYAML = `app:\n  name: ToolVerse\n  version: 2.0.0\n  features:\n    - finance\n    - developer\n    - privacy`;

  const initialInput = isMarkdown ? sampleMarkdown : isXml ? sampleXML : isYaml ? sampleYAML : sampleCSV;
  const [inputText, setInputText] = useState<string>("");
  const [delimiter, setDelimiter] = useState<"," | ";" | "\t" | "|">(",");
  const [hasHeader, setHasHeader] = useState<boolean>(true);
  const [indent, setIndent] = useState<number>(2);
  const [copied, setCopied] = useState(false);

  // Simple Markdown to HTML parser
  const parseMarkdownToHTML = (md: string) => {
    let html = md
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*)\*/gim, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
      .replace(/^\- (.*$)/gim, "<li>$1</li>")
      .replace(/\n\n/gim, "<p></p>");
    return html;
  };

  // Simple HTML to Markdown parser
  const parseHTMLToMarkdown = (html: string) => {
    let md = html
      .replace(/<h1>(.*?)<\/h1>/gim, "# $1\n\n")
      .replace(/<h2>(.*?)<\/h2>/gim, "## $1\n\n")
      .replace(/<h3>(.*?)<\/h3>/gim, "### $1\n\n")
      .replace(/<strong>(.*?)<\/strong>/gim, "**$1**")
      .replace(/<b>(.*?)<\/b>/gim, "**$1**")
      .replace(/<em>(.*?)<\/em>/gim, "*$1*")
      .replace(/<i>(.*?)<\/i>/gim, "*$1*")
      .replace(/<a href="([^"]*)">(.*?)<\/a>/gim, "[$2]($1)")
      .replace(/<li>(.*?)<\/li>/gim, "- $1\n")
      .replace(/<p>(.*?)<\/p>/gim, "$1\n\n");
    return md.trim();
  };

  // Simple YAML to JSON
  const parseYAMLtoJSON = (yaml: string) => {
    const lines = yaml.split("\n");
    const obj: any = {};
    lines.forEach((line) => {
      const match = line.match(/^(\s*)([^:]+):\s*(.*)$/);
      if (match) {
        const key = match[2].trim();
        let val: any = match[3].trim();
        if (val === "true") val = true;
        else if (val === "false") val = false;
        else if (!isNaN(Number(val)) && val !== "") val = Number(val);
        obj[key] = val;
      }
    });
    return JSON.stringify(obj, null, indent);
  };

  // Simple JSON to YAML
  const parseJSONtoYAML = (jsonStr: string) => {
    const parsed = JSON.parse(jsonStr);
    let yaml = "";
    const convert = (o: any, ind = 0) => {
      const space = " ".repeat(ind);
      if (Array.isArray(o)) {
        o.forEach((item) => {
          if (typeof item === "object" && item !== null) {
            yaml += `${space}-\n`;
            convert(item, ind + 2);
          } else {
            yaml += `${space}- ${item}\n`;
          }
        });
      } else if (typeof o === "object" && o !== null) {
        Object.entries(o).forEach(([k, v]) => {
          if (typeof v === "object" && v !== null) {
            yaml += `${space}${k}:\n`;
            convert(v, ind + 2);
          } else {
            yaml += `${space}${k}: ${v}\n`;
          }
        });
      }
    };
    convert(parsed);
    return yaml;
  };

  // Computed Conversion
  const outputResult = useMemo(() => {
    try {
      if (!inputText.trim()) return "";

      if (mode === "md_to_html") {
        return parseMarkdownToHTML(inputText);
      } else if (mode === "html_to_md") {
        return parseHTMLToMarkdown(inputText);
      } else if (mode === "yaml_to_json") {
        return parseYAMLtoJSON(inputText);
      } else if (mode === "json_to_yaml") {
        return parseJSONtoYAML(inputText);
      } else if (mode === "xml_to_json") {
        // XML to JSON simulation
        const lines = inputText.match(/<([^>]+)>(.*?)<\/\1>/g) || [];
        const res: any = {};
        lines.forEach((l) => {
          const m = l.match(/<([^>]+)>(.*?)<\/\1>/);
          if (m) res[m[1]] = m[2];
        });
        return JSON.stringify(Object.keys(res).length > 0 ? res : { root: "Parsed XML Node", content: inputText }, null, indent);
      } else if (mode === "json_to_xml") {
        const obj = JSON.parse(inputText);
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
        const toXml = (o: any, ind = 2) => {
          const space = " ".repeat(ind);
          if (Array.isArray(o)) {
            o.forEach((item) => {
              xml += `${space}<item>\n`;
              toXml(item, ind + 2);
              xml += `${space}</item>\n`;
            });
          } else if (typeof o === "object" && o !== null) {
            Object.entries(o).forEach(([k, v]) => {
              if (typeof v === "object" && v !== null) {
                xml += `${space}<${k}>\n`;
                toXml(v, ind + 2);
                xml += `${space}</${k}>\n`;
              } else {
                xml += `${space}<${k}>${v}</${k}>\n`;
              }
            });
          } else {
            xml += `${space}${o}\n`;
          }
        };
        toXml(obj);
        xml += "</root>";
        return xml;
      } else if (mode === "csv_to_json") {
        const lines = inputText.trim().split(/\r?\n/);
        if (lines.length === 0) return "[]";

        const parseLine = (line: string) => {
          return line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));
        };

        if (hasHeader && lines.length > 1) {
          const headers = parseLine(lines[0]);
          const records = lines.slice(1).map((line) => {
            const values = parseLine(line);
            const obj: Record<string, any> = {};
            headers.forEach((h, i) => {
              const v = values[i] !== undefined ? values[i] : "";
              if (v === "true") obj[h] = true;
              else if (v === "false") obj[h] = false;
              else if (!isNaN(Number(v)) && v !== "") obj[h] = Number(v);
              else obj[h] = v;
            });
            return obj;
          });
          return JSON.stringify(records, null, indent);
        } else {
          const rows = lines.map((l) => parseLine(l));
          return JSON.stringify(rows, null, indent);
        }
      } else {
        // JSON to CSV
        const parsed = JSON.parse(inputText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof parsed[0] === "object" && parsed[0] !== null) {
            const headers = Object.keys(parsed[0]);
            const headerRow = headers.join(delimiter);
            const dataRows = parsed.map((item) =>
              headers.map((h) => (item[h] !== undefined ? String(item[h]) : "")).join(delimiter)
            );
            return [headerRow, ...dataRows].join("\n");
          } else {
            return parsed.map((row) => (Array.isArray(row) ? row.join(delimiter) : String(row))).join("\n");
          }
        }
        return "Input JSON must be an array of objects";
      }
    } catch (e: any) {
      return `Conversion Error: ${e.message}`;
    }
  }, [inputText, mode, delimiter, hasHeader, indent]);

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          setInputText(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let ext = "txt";
    let mime = "text/plain";
    if (mode.includes("json")) {
      ext = "json";
      mime = "application/json";
    } else if (mode.includes("csv")) {
      ext = "csv";
      mime = "text/csv";
    } else if (mode.includes("html")) {
      ext = "html";
      mime = "text/html";
    } else if (mode.includes("yaml")) {
      ext = "yaml";
      mime = "text/yaml";
    }

    const blob = new Blob([outputResult], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `toolverse-converted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="flex flex-col gap-6">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary">Conversion Mode:</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary font-semibold outline-none focus:border-accent"
            >
              <option value="csv_to_json">CSV to JSON</option>
              <option value="json_to_csv">JSON to CSV</option>
              <option value="md_to_html">Markdown to HTML</option>
              <option value="html_to_md">HTML to Markdown</option>
              <option value="xml_to_json">XML to JSON</option>
              <option value="json_to_xml">JSON to XML</option>
              <option value="yaml_to_json">YAML to JSON</option>
              <option value="json_to_yaml">JSON to YAML</option>
            </select>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {mode.includes("csv") && (
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">Delimiter:</span>
                <select
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value as any)}
                  className="bg-surface-raised border border-border rounded px-2 py-1 text-text-primary outline-none"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value={"\t"}>Tab (\t)</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>
            )}

            {mode.includes("json") && (
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">Indent:</span>
                <select
                  value={indent}
                  onChange={(e) => setIndent(parseInt(e.target.value, 10))}
                  className="bg-surface-raised border border-border rounded px-2 py-1 text-text-primary outline-none"
                >
                  <option value={2}>2 Spaces</option>
                  <option value={4}>4 Spaces</option>
                  <option value={0}>Minified</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Dual Input/Output Editors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Input Panel */}
          <div className="flex flex-col gap-3 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Input Source</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setInputText(initialInput)}
                  className="text-xs text-text-tertiary hover:text-accent font-medium transition-colors"
                >
                  Load Sample
                </button>
                <span className="text-xs font-mono text-text-tertiary">
                  {inputText.length.toLocaleString()} characters
                </span>
              </div>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={14}
              className="w-full bg-surface-raised border border-border rounded-lg p-3.5 font-mono text-xs text-text-primary outline-none focus:border-accent"
              placeholder="Paste content here or drop file below..."
            />
            <Dropzone
              accept="*/*"
              maxFiles={1}
              onDrop={handleFileUpload}
              helperText="Upload any CSV, JSON, XML, YAML, or Markdown document to convert"
            />
          </div>

          {/* Output Panel */}
          <div className="flex flex-col gap-3 bg-surface border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Converted Output</span>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleCopy} leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}>
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="primary" size="sm" onClick={handleDownload} leftIcon={<Download className="w-4 h-4" />}>
                  Download
                </Button>
              </div>
            </div>
            <textarea
              readOnly
              value={outputResult}
              rows={14}
              className="w-full bg-surface-raised border border-border rounded-lg p-3.5 font-mono text-xs text-emerald-400 outline-none"
              placeholder="Converted output will appear here instantly..."
            />
            <div className="p-3 bg-surface-raised border border-border rounded-lg flex items-center justify-between text-xs text-text-secondary">
              <span>Conversion status: <strong>Instant Client-Side</strong></span>
              <span className="text-emerald-400 font-mono">100% Private</span>
            </div>
          </div>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};

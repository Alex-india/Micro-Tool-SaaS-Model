const fs = require('fs');

const content = fs.readFileSync('./lib/constants.ts', 'utf-8');
const toolBlocks = content.split(/{\s*slug:/g).slice(1);
const tools = [];
for (const b of toolBlocks) {
  const slugMatch = b.match(/^\s*"([^"]+)"/);
  const catMatch = b.match(/category:\s*"([^"]+)"/);
  const nameMatch = b.match(/name:\s*"([^"]+)"/);
  if (slugMatch && catMatch) {
    tools.push({
      slug: slugMatch[1],
      category: catMatch[1],
      name: nameMatch ? nameMatch[1] : slugMatch[1]
    });
  }
}

function getActualRenderedView(tool) {
  switch (tool.category) {
    case "privacy":
      if (tool.slug === "qr-code-generator" || tool.slug.includes("qr")) {
        return "QRCodeGeneratorView";
      }
      if (tool.slug.includes("hash") || tool.slug.includes("sha") || tool.slug.includes("md5")) {
        return "DeveloperStudioView";
      }
      return "PasswordGeneratorView";

    case "finance":
      if (tool.slug === "currency-converter") {
        return "CurrencyConverterView";
      }
      if (
        tool.slug === "profit-margin-calculator" ||
        tool.slug === "markup-calculator" ||
        tool.slug === "break-even-calculator" ||
        tool.slug === "roi-calculator"
      ) {
        return "BusinessCalculatorView";
      }
      if (tool.slug === "sip-calculator" || tool.slug.includes("sip")) {
        return "SIPCalculatorView";
      }
      if (tool.slug === "emi-calculator" || tool.slug.includes("loan") || tool.slug.includes("emi")) {
        return "EMICalculatorView";
      }
      if (tool.slug === "gst-calculator") {
        return "GSTCalculatorView";
      }
      if (
        tool.slug.includes("tax") ||
        tool.slug.includes("salary") ||
        tool.slug.includes("ctc") ||
        tool.slug.includes("income")
      ) {
        return "TaxAndSalaryCalculatorView";
      }
      return "InvestmentCalculatorView";

    case "developer":
      if (
        tool.slug === "json-formatter" ||
        tool.slug === "json-validator" ||
        tool.slug === "json-minifier"
      ) {
        return "JSONFormatterView";
      }
      if (tool.slug === "jwt-decoder") {
        return "JWTDecoderView";
      }
      return "DeveloperStudioView";

    case "pdf":
      return "PDFStudioView";

    case "image":
      return "ImageStudioView";

    case "video":
    case "creator":
      return "SocialMediaStudioView";

    case "text":
      if (
        tool.slug === "word-counter" ||
        tool.slug === "character-counter" ||
        tool.slug === "sentence-counter" ||
        tool.slug === "reading-time-calculator"
      ) {
        return "WordCounterView";
      }
      return "TextStudioView";

    case "web":
      return "WebSEOStudioView";

    case "student":
      return "StudentStudioView";

    case "business":
      if (
        tool.slug === "invoice-generator" ||
        tool.slug === "quotation-generator" ||
        tool.slug === "receipt-generator" ||
        tool.slug === "purchase-order-generator" ||
        tool.slug === "delivery-challan-generator"
      ) {
        return "InvoiceGeneratorView";
      }
      return "BusinessCalculatorView";

    case "converters":
      return "CSVToJSONView";

    case "calculators":
      return "EverydayCalculatorView";

    default:
      return "EverydayCalculatorView";
  }
}

const breakdown = {};
for (const t of tools) {
  const v = getActualRenderedView(t);
  breakdown[v] = (breakdown[v] || 0) + 1;
}

console.log('Total tools mapped:', tools.length);
console.log('\nUpdated View Distribution:');
for (const [v, c] of Object.entries(breakdown)) {
  console.log(`  ${v}: ${c}`);
}

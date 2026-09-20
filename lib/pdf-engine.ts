"use client";

import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import JSZip from "jszip";

/**
 * Loads pdfjs-dist dynamically in client-side environment
 */
export async function getPdfJs(): Promise<any> {
  if (typeof window === "undefined") return null;
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  // Load through CDN script tag to avoid webpack canvas bundling collisions
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src*="pdf.js"], script[src*="pdf.min.js"]');
    if (existingScript && (window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib && !lib.GlobalWorkerOptions.workerSrc) {
        lib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
      resolve(lib);
    };
    script.onerror = () => {
      // Fallback import
      import("pdfjs-dist")
        .then((mod) => resolve(mod))
        .catch(reject);
    };
    document.head.appendChild(script);
  });
}

/**
 * Renders all pages of a PDF to image data URLs and Blobs
 */
export async function renderPdfToImages(
  pdfBytes: ArrayBuffer,
  format: "image/jpeg" | "image/png" = "image/jpeg",
  dpiScale: number = 1.5
): Promise<{ pageNumber: number; dataUrl: string; blob: Blob; width: number; height: number }[]> {
  const pdfjs = await getPdfJs();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBytes) });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;
  const results: { pageNumber: number; dataUrl: string; blob: Blob; width: number; height: number }[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: dpiScale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) continue;

    // Fill white background for clean rendering
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
    }).promise;

    const dataUrl = canvas.toDataURL(format, format === "image/jpeg" ? 0.92 : undefined);

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b || new Blob([], { type: format })),
        format,
        format === "image/jpeg" ? 0.92 : undefined
      );
    });

    results.push({
      pageNumber: i,
      dataUrl,
      blob,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return results;
}

/**
 * Creates a downloadable ZIP from a list of files
 */
export async function createZipBundle(
  files: { filename: string; data: Blob | Uint8Array | string }[]
): Promise<Blob> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.filename, file.data);
  }
  return await zip.generateAsync({ type: "blob" });
}

/**
 * Merges multiple PDF ArrayBuffers into one
 */
export async function mergePdfDocuments(
  pdfBuffers: ArrayBuffer[],
  title: string = "Merged Document"
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  mergedPdf.setTitle(title);

  for (const buffer of pdfBuffers) {
    const donor = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pageIndices = donor.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(donor, pageIndices);
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Extracts specific pages from a PDF
 */
export async function extractPdfPages(
  sourceBytes: ArrayBuffer,
  pageIndicesToKeep: number[],
  title: string = "Extracted Document"
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  newPdf.setTitle(title);

  const total = sourcePdf.getPageCount();
  const validIndices = pageIndicesToKeep.filter((idx) => idx >= 0 && idx < total);

  if (validIndices.length === 0) {
    validIndices.push(0);
  }

  const copiedPages = await newPdf.copyPages(sourcePdf, validIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

/**
 * Reorders pages of a PDF based on an array of page indices
 */
export async function reorderPdfPages(
  sourceBytes: ArrayBuffer,
  newOrderIndices: number[],
  title: string = "Reordered Document"
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  newPdf.setTitle(title);

  const copiedPages = await newPdf.copyPages(sourcePdf, newOrderIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

/**
 * Rotates pages of a PDF
 */
export async function rotatePdfPages(
  sourceBytes: ArrayBuffer,
  rotationAngle: number,
  targetPages: "all" | number[] = "all"
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page, idx) => {
    if (targetPages === "all" || targetPages.includes(idx)) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + rotationAngle) % 360));
    }
  });

  return await pdfDoc.save();
}

/**
 * Crops margins of PDF pages
 */
export async function cropPdfPages(
  sourceBytes: ArrayBuffer,
  margins: { top: number; bottom: number; left: number; right: number }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const cropLeft = (margins.left / 100) * width;
    const cropRight = (margins.right / 100) * width;
    const cropTop = (margins.top / 100) * height;
    const cropBottom = (margins.bottom / 100) * height;

    const newX = cropLeft;
    const newY = cropBottom;
    const newWidth = Math.max(50, width - cropLeft - cropRight);
    const newHeight = Math.max(50, height - cropTop - cropBottom);

    page.setCropBox(newX, newY, newWidth, newHeight);
  });

  return await pdfDoc.save();
}

/**
 * Applies text or image watermark to PDF pages
 */
export async function watermarkPdfDocument(
  sourceBytes: ArrayBuffer,
  options: {
    text?: string;
    opacity?: number;
    rotationAngle?: number;
    fontSize?: number;
    color?: string;
    imageFile?: File;
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const opacity = (options.opacity ?? 30) / 100;
  const rotation = options.rotationAngle ?? 45;

  if (options.imageFile) {
    const imgBytes = await options.imageFile.arrayBuffer();
    const isPng = options.imageFile.type.includes("png") || options.imageFile.name.toLowerCase().endsWith(".png");
    const embeddedImg = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      const scale = Math.min((width * 0.4) / embeddedImg.width, (height * 0.4) / embeddedImg.height);
      const imgW = embeddedImg.width * scale;
      const imgH = embeddedImg.height * scale;

      page.drawImage(embeddedImg, {
        x: (width - imgW) / 2,
        y: (height - imgH) / 2,
        width: imgW,
        height: imgH,
        opacity,
        rotate: degrees(rotation),
      });
    });
  } else {
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const text = options.text || "CONFIDENTIAL";

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      const calculatedFontSize = options.fontSize || Math.min(width, height) / 9;
      const textWidth = font.widthOfTextAtSize(text, calculatedFontSize);

      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: height / 2,
        size: calculatedFontSize,
        font,
        color: rgb(0.6, 0.6, 0.6),
        opacity,
        rotate: degrees(rotation),
      });
    });
  }

  return await pdfDoc.save();
}

/**
 * Compiles image files into a PDF document
 */
export async function convertImagesToPdf(
  imageFiles: File[],
  options: {
    pageSize?: "fit" | "a4" | "letter";
    margin?: number;
    orientation?: "auto" | "portrait" | "landscape";
    title?: string;
  } = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(options.title || "Image Compilation");

  for (const file of imageFiles) {
    const buffer = await file.arrayBuffer();
    const isPng = file.type.includes("png") || file.name.toLowerCase().endsWith(".png");
    let embeddedImg;

    if (isPng) {
      embeddedImg = await pdfDoc.embedPng(buffer);
    } else {
      embeddedImg = await pdfDoc.embedJpg(buffer);
    }

    const imgW = embeddedImg.width;
    const imgH = embeddedImg.height;

    let pageWidth = imgW;
    let pageHeight = imgH;

    if (options.pageSize === "a4") {
      pageWidth = 595.28;
      pageHeight = 841.89;
    } else if (options.pageSize === "letter") {
      pageWidth = 612.0;
      pageHeight = 792.0;
    }

    if (options.orientation === "landscape" && pageHeight > pageWidth) {
      const temp = pageWidth;
      pageWidth = pageHeight;
      pageHeight = temp;
    } else if (options.orientation === "portrait" && pageWidth > pageHeight) {
      const temp = pageWidth;
      pageWidth = pageHeight;
      pageHeight = temp;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const margin = options.margin ?? 0;
    const availW = pageWidth - margin * 2;
    const availH = pageHeight - margin * 2;

    const scale = Math.min(availW / imgW, availH / imgH, 1);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const x = margin + (availW - drawW) / 2;
    const y = margin + (availH - drawH) / 2;

    page.drawImage(embeddedImg, {
      x,
      y,
      width: drawW,
      height: drawH,
    });
  }

  return await pdfDoc.save();
}

/**
 * Compresses PDF by re-rasterizing pages with optimized canvas scale & JPEG compression
 */
export async function compressPdfDocument(
  sourceBytes: ArrayBuffer,
  level: "low" | "medium" | "high" = "medium"
): Promise<{ compressedBytes: Uint8Array; originalSize: number; newSize: number }> {
  const originalSize = sourceBytes.byteLength;

  let dpiScale = 1.2;
  let quality = 0.75;

  if (level === "high") {
    dpiScale = 0.95;
    quality = 0.6;
  } else if (level === "low") {
    dpiScale = 1.4;
    quality = 0.85;
  }

  const images = await renderPdfToImages(sourceBytes, "image/jpeg", dpiScale);
  const pdfDoc = await PDFDocument.create();

  for (const imgData of images) {
    const imgBytes = await imgData.blob.arrayBuffer();
    const embeddedImg = await pdfDoc.embedJpg(imgBytes);
    const page = pdfDoc.addPage([imgData.width, imgData.height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: imgData.width,
      height: imgData.height,
    });
  }

  const compressedBytes = await pdfDoc.save();
  return {
    compressedBytes,
    originalSize,
    newSize: compressedBytes.byteLength,
  };
}

/**
 * Extracts text content from a PDF document
 */
export async function extractTextFromPdf(pdfBytes: ArrayBuffer): Promise<string> {
  const pdfjs = await getPdfJs();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBytes) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  let fullText = "";

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageStrings = textContent.items
      .map((item: any) => item.str || "")
      .filter((s: string) => s.length > 0);

    fullText += `--- Page ${i} ---\n\n` + pageStrings.join(" ") + "\n\n";
  }

  return fullText.trim();
}

/**
 * Extracts raw text content from an uploaded .docx ArrayBuffer using JSZip & DOMParser
 */
export async function extractTextFromDocxBlob(buffer: ArrayBuffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const docXml = await zip.file("word/document.xml")?.async("string");
    if (!docXml) return "";

    if (typeof window === "undefined") return "";
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, "text/xml");
    const paragraphs = xmlDoc.getElementsByTagName("w:p");
    let fullText = "";

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const texts = p.getElementsByTagName("w:t");
      let line = "";
      for (let j = 0; j < texts.length; j++) {
        line += texts[j].textContent || "";
      }
      if (line.trim()) {
        fullText += line + "\n\n";
      }
    }
    return fullText.trim();
  } catch (err) {
    console.warn("Failed to extract docx text via JSZip:", err);
    return "";
  }
}


/**
 * Generates a standard editable .docx document from text using JSZip
 */
export async function generateDocxFromText(
  text: string,
  title: string = "Converted Document"
): Promise<Blob> {
  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  const paragraphs = text.split("\n\n");
  let documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r>
    </w:p>`;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    documentXml += `
    <w:p>
      <w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(trimmed)}</w:t></w:r>
    </w:p>`;
  }

  documentXml += `
  </w:body>
</w:document>`;

  zip.file("word/document.xml", documentXml);

  return await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

/**
 * Generates a standard .pptx PowerPoint presentation from text/slides using JSZip
 */
export async function generatePptxFromSlides(
  slides: { title: string; content: string }[]
): Promise<Blob> {
  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("\n  ")}
</Types>`
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  let presRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${slides.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join("\n  ")}
</Relationships>`;
  zip.file("ppt/_rels/presentation.xml.rels", presRels);

  let presXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    ${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>`).join("\n    ")}
  </p:sldIdLst>
</p:presentation>`;
  zip.file("ppt/presentation.xml", presXml);

  slides.forEach((slide, i) => {
    let slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="457200" y="457200"/><a:ext cx="8229600" cy="1143000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:p><a:r><a:rPr lang="en-US" sz="3200" b="1"/><a:t>${escapeXml(slide.title)}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="457200" y="1800000"/><a:ext cx="8229600" cy="4500000"/></a:xfrm></p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:p><a:r><a:rPr lang="en-US" sz="1800"/><a:t>${escapeXml(slide.content)}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;
    zip.file(`ppt/slides/slide${i + 1}.xml`, slideXml);
  });

  return await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
}

/**
 * Converts formatted text or doc text into a multi-page PDF document
 */
export async function convertTextOrDocToPdf(
  text: string,
  title: string = "Document"
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(title);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const lineHeight = 18;
  const maxLineWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Title
  page.drawText(title, {
    x: margin,
    y: y,
    size: 20,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 35;

  const lines = text.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      y -= lineHeight * 0.8;
      continue;
    }

    const words = line.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, 11);

      if (testWidth > maxLineWidth) {
        if (y < margin + 30) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(currentLine, {
          x: margin,
          y,
          size: 11,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (y < margin + 30) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(currentLine, {
        x: margin,
        y,
        size: 11,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= lineHeight;
    }
  }

  return await pdfDoc.save();
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

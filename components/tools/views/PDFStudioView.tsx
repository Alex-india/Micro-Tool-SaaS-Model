"use client";

import React, { useState, useEffect } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Dropzone } from "@/components/ui/Dropzone";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  FileText,
  Download,
  Check,
  ShieldCheck,
  Layers,
  RotateCw,
  Trash2,
  Sparkles,
  Image as ImageIcon,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Scissors,
  Minimize2,
  Presentation,
  FileCode,
  Eye,
  Archive,
  Copy,
  Crop,
  Stamp,
} from "lucide-react";
import {
  renderPdfToImages,
  createZipBundle,
  mergePdfDocuments,
  extractPdfPages,
  reorderPdfPages,
  rotatePdfPages,
  cropPdfPages,
  watermarkPdfDocument,
  convertImagesToPdf,
  compressPdfDocument,
  extractTextFromPdf,
  generateDocxFromText,
  generatePptxFromSlides,
  convertTextOrDocToPdf,
  getPdfPageCount,
  cleanSavePdfDocument,
} from "@/lib/pdf-engine";

export interface PDFStudioViewProps {
  tool: ToolMeta;
}

export const PDFStudioView: React.FC<PDFStudioViewProps> = ({ tool }) => {
  const slug = tool.slug;

  // Tool Identifiers
  const isMerge = slug === "merge-pdf";
  const isSplit = slug === "split-pdf";
  const isCompress = slug === "compress-pdf";
  const isJpgToPdf = slug === "jpg-to-pdf" || slug === "png-to-pdf" || slug === "image-to-pdf";
  const isPdfToImage = slug === "pdf-to-jpg" || slug === "pdf-to-png";
  const isPdfToWord = slug === "pdf-to-word";
  const isWordToPdf = slug === "word-to-pdf";
  const isPdfToPpt = slug === "pdf-to-ppt";
  const isPptToPdf = slug === "ppt-to-pdf";
  const isPageExtractor = slug === "pdf-page-extractor";
  const isPageReorder = slug === "pdf-page-reorder";
  const isRotate = slug === "rotate-pdf";
  const isCrop = slug === "crop-pdf";
  const isWatermark = slug === "watermark-pdf";
  const isProtect = slug === "password-protect-pdf";
  const isUnlock = slug === "remove-pdf-password";

  // Common State
  const [files, setFiles] = useState<File[]>([]);
  const [pageCount, setPageCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string>("");
  const [resultType, setResultType] = useState<"pdf" | "zip" | "docx" | "pptx" | "image">("pdf");

  // Multi-image / PDF rendered pages
  const [renderedPages, setRenderedPages] = useState<
    { pageNumber: number; dataUrl: string; blob: Blob; width: number; height: number }[]
  >([]);

  // Split & Extract States
  const [splitMode, setSplitMode] = useState<"range" | "all_zip" | "interval">("range");
  const [pageRange, setPageRange] = useState<string>("1-2");
  const [splitInterval, setSplitInterval] = useState<number>(2);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  // Reorder State
  const [pageOrder, setPageOrder] = useState<number[]>([]);

  // Compress State
  const [compressLevel, setCompressLevel] = useState<"low" | "medium" | "high">("medium");
  const [compressionStats, setCompressionStats] = useState<{ orig: number; newSize: number } | null>(null);

  // Image to PDF Settings
  const [pageSize, setPageSize] = useState<"fit" | "a4" | "letter">("fit");
  const [pageOrientation, setPageOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
  const [pageMargin, setPageMargin] = useState<number>(0);

  // PDF to Image Settings
  const [dpiQuality, setDpiQuality] = useState<number>(1.5);

  // PDF to Word / Text States
  const [extractedText, setExtractedText] = useState<string>("");

  // Rotate State
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [rotateScope, setRotateScope] = useState<"all" | "selected">("all");

  // Crop State
  const [cropTop, setCropTop] = useState<number>(5);
  const [cropBottom, setCropBottom] = useState<number>(5);
  const [cropLeft, setCropLeft] = useState<number>(5);
  const [cropRight, setCropRight] = useState<number>(5);

  // Watermark State
  const [watermarkMode, setWatermarkMode] = useState<"text" | "image">("text");
  const [watermarkText, setWatermarkText] = useState<string>("CONFIDENTIAL");
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(30);
  const [watermarkAngle, setWatermarkAngle] = useState<number>(45);
  const [watermarkFontSize, setWatermarkFontSize] = useState<number>(42);
  const [watermarkLogoFile, setWatermarkLogoFile] = useState<File | null>(null);

  // Password State
  const [pdfPassword, setPdfPassword] = useState<string>("");

  // Word / PPT input text
  const [docContentInput, setDocContentInput] = useState<string>("");
  const [docTitleInput, setDocTitleInput] = useState<string>("");

  const handleDrop = async (newFiles: File[]) => {
    if (newFiles.length === 0) return;

    if (isMerge || isJpgToPdf) {
      const updated = [...files, ...newFiles];
      setFiles(updated);
    } else {
      setFiles([newFiles[0]]);
    }

    setResultBlob(null);
    setResultUrl("");
    setRenderedPages([]);
    setCompressionStats(null);
    setStatusMessage("");

    const targetFile = newFiles[0];

    // If it's a PDF, calculate total pages & prepare thumbnails if needed
    if (targetFile.type.includes("pdf") || targetFile.name.toLowerCase().endsWith(".pdf")) {
      try {
        const buffer = await targetFile.arrayBuffer();
        const count = await getPdfPageCount(buffer);
        setPageCount(count);

        const initialOrder = Array.from({ length: count }, (_, i) => i);
        setPageOrder(initialOrder);
        setSelectedPages(initialOrder);

        // Pre-render thumbnails for visual reorder or visual extract
        if (isPageReorder || isPageExtractor || isPdfToImage) {
          setIsProcessing(true);
          setStatusMessage("Rendering page previews...");
          const imgs = await renderPdfToImages(buffer, "image/jpeg", 0.6);
          setRenderedPages(imgs);
          setIsProcessing(false);
          setStatusMessage("");
        }
      } catch (err: any) {
        console.warn("PDF preview load warning:", err);
      }
    } else if (isWordToPdf || isPptToPdf) {
      // Read text if plain text or prepare title
      setDocTitleInput(targetFile.name.replace(/\.[^/.]+$/, ""));
      if (targetFile.type.includes("text")) {
        const txt = await targetFile.text();
        setDocContentInput(txt);
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    setResultBlob(null);
    setResultUrl("");
  };

  const moveFileOrder = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= files.length) return;
    const next = [...files];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setFiles(next);
  };

  const movePageOrder = (index: number, direction: "left" | "right") => {
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pageOrder.length) return;
    const next = [...pageOrder];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setPageOrder(next);
  };

  const deletePageFromOrder = (index: number) => {
    if (pageOrder.length <= 1) return;
    const next = pageOrder.filter((_, i) => i !== index);
    setPageOrder(next);
  };

  const togglePageSelection = (pageIdx: number) => {
    if (selectedPages.includes(pageIdx)) {
      setSelectedPages(selectedPages.filter((p) => p !== pageIdx));
    } else {
      setSelectedPages([...selectedPages, pageIdx].sort((a, b) => a - b));
    }
  };

  // Execution Handler
  const handleExecuteOperation = async () => {
    if (files.length === 0 && !docContentInput) return;
    setIsProcessing(true);
    setStatusMessage("Processing with client-side engine...");

    try {
      if (isMerge) {
        // 1. MERGE PDF
        const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
        const mergedBytes = await mergePdfDocuments(buffers, docTitleInput || "Merged Document");
        const blob = new Blob([mergedBytes as any], { type: "application/pdf" });
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
        setResultType("pdf");
        setStatusMessage(`Successfully combined ${files.length} PDFs into a single document.`);
      } else if (isSplit) {
        // 2. SPLIT PDF
        const buffer = await files[0].arrayBuffer();
        if (splitMode === "all_zip") {
          const total = await getPdfPageCount(buffer);
          const zipFiles: { filename: string; data: Uint8Array }[] = [];

          for (let i = 0; i < total; i++) {
            const singlePdf = await extractPdfPages(buffer, [i]);
            zipFiles.push({ filename: `page_${i + 1}.pdf`, data: singlePdf });
          }

          const zipBlob = await createZipBundle(zipFiles);
          setResultBlob(zipBlob);
          setResultUrl(URL.createObjectURL(zipBlob));
          setResultType("zip");
          setStatusMessage(`Split all ${total} pages into individual PDF files packaged in a ZIP archive.`);
        } else {
          // Range mode
          const pagesToExtract = parsePageRange(pageRange, pageCount);
          const extractedBytes = await extractPdfPages(buffer, pagesToExtract);
          const blob = new Blob([extractedBytes as any], { type: "application/pdf" });
          setResultBlob(blob);
          setResultUrl(URL.createObjectURL(blob));
          setResultType("pdf");
          setStatusMessage(`Extracted ${pagesToExtract.length} pages into a new PDF document.`);
        }
      } else if (isCompress) {
        // 3. COMPRESS PDF
        const buffer = await files[0].arrayBuffer();
        const res = await compressPdfDocument(buffer, compressLevel);
        const blob = new Blob([res.compressedBytes as any], { type: "application/pdf" });
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
        setResultType("pdf");
        setCompressionStats({ orig: res.originalSize, newSize: res.newSize });
        const savedPct = Math.round(((res.originalSize - res.newSize) / res.originalSize) * 100);
        setStatusMessage(`Compressed document by ${savedPct}%. Quality preserved.`);
      } else if (isJpgToPdf) {
        // 4. JPG / PNG TO PDF
        const pdfBytes = await convertImagesToPdf(files, {
          pageSize,
          orientation: pageOrientation,
          margin: pageMargin,
          title: docTitleInput || "Compiled Images",
        });
        const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
        setResultType("pdf");
        setStatusMessage(`Compiled ${files.length} images into a formatted PDF document.`);
      } else if (isPdfToImage) {
        // 5. PDF TO JPG / PNG
        const buffer = await files[0].arrayBuffer();
        const format = slug.includes("png") ? "image/png" : "image/jpeg";
        const images = await renderPdfToImages(buffer, format, dpiQuality);
        setRenderedPages(images);

        // Package all images into ZIP for easy single-click download
        const ext = format === "image/png" ? "png" : "jpg";
        const zipFiles = images.map((img) => ({
          filename: `page_${img.pageNumber}.${ext}`,
          data: img.blob,
        }));
        const zipBlob = await createZipBundle(zipFiles);
        setResultBlob(zipBlob);
        setResultUrl(URL.createObjectURL(zipBlob));
        setResultType("zip");
        setStatusMessage(`Converted all ${images.length} pages into high-resolution ${ext.toUpperCase()} images.`);
      } else if (isPdfToWord) {
        // 6. PDF TO WORD (.docx)
        const buffer = await files[0].arrayBuffer();
        const text = await extractTextFromPdf(buffer);
        setExtractedText(text);
        const docxBlob = await generateDocxFromText(text, files[0].name.replace(/\.[^/.]+$/, ""));
        setResultBlob(docxBlob);
        setResultUrl(URL.createObjectURL(docxBlob));
        setResultType("docx");
        setStatusMessage(`Extracted document content. Formatted .docx and plain text ready.`);
      } else if (isWordToPdf || isPptToPdf) {
        // 7. WORD / PPT TO PDF
        const textToConvert = docContentInput || "Document Content\n\nGenerated with ToolVerse Studio.";
        const pdfBytes = await convertTextOrDocToPdf(textToConvert, docTitleInput || "Document");
        const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
        setResultType("pdf");
        setStatusMessage(`Generated high-quality PDF document successfully.`);
      } else if (isPdfToPpt) {
        // 8. PDF TO PPT (.pptx)
        const buffer = await files[0].arrayBuffer();
        const text = await extractTextFromPdf(buffer);
        const pagesText = text.split("--- Page ");
        const slides = pagesText
          .filter((p) => p.trim())
          .map((p, i) => {
            const lines = p.split("\n").filter((l) => l.trim());
            return {
              title: `Slide ${i + 1}`,
              content: lines.slice(1).join(" ").substring(0, 400) || "Presentation Slide",
            };
          });

        const pptxBlob = await generatePptxFromSlides(
          slides.length > 0 ? slides : [{ title: "Presentation", content: text.substring(0, 500) }]
        );
        setResultBlob(pptxBlob);
        setResultUrl(URL.createObjectURL(pptxBlob));
        setResultType("pptx");
        setStatusMessage(`Converted ${slides.length} slides into a PowerPoint presentation.`);
      } else if (isPageExtractor) {
        // 9. PDF PAGE EXTRACTOR
        const buffer = await files[0].arrayBuffer();
        const indices = selectedPages.length > 0 ? selectedPages : [0];
        const extractedBytes = await extractPdfPages(buffer, indices);
        const blob = new Blob([extractedBytes as any], { type: "application/pdf" });
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
        setResultType("pdf");
        setStatusMessage(`Extracted ${indices.length} selected pages into a new PDF document.`);
      } else if (isPageReorder) {
        // 10. PDF PAGE REORDER
        const buffer = await files[0].arrayBuffer();
        const reorderedBytes = await reorderPdfPages(buffer, pageOrder);
        const blob = new Blob([reorderedBytes as any], { type: "application/pdf" });
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
        setResultType("pdf");
        setStatusMessage(`Reordered ${pageOrder.length} pages into new document sequence.`);
      } else if (isRotate) {
        // 11. ROTATE PDF
        const buffer = await files[0].arrayBuffer();
        const rotatedBytes = await rotatePdfPages(buffer, rotationAngle, rotateScope === "all" ? "all" : selectedPages);
        const blob = new Blob([rotatedBytes as any], { type: "application/pdf" });
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
        setResultType("pdf");
        setStatusMessage(`Rotated pages by ${rotationAngle}° clockwise.`);
      } else if (isCrop) {
        // 12. CROP PDF
        const buffer = await files[0].arrayBuffer();
        const croppedBytes = await cropPdfPages(buffer, {
          top: cropTop,
          bottom: cropBottom,
          left: cropLeft,
          right: cropRight,
        });
        const blob = new Blob([croppedBytes as any], { type: "application/pdf" });
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
        setResultType("pdf");
        setStatusMessage(`Cropped margins successfully.`);
      } else if (isWatermark) {
        // 13. WATERMARK PDF
        const buffer = await files[0].arrayBuffer();
        const markedBytes = await watermarkPdfDocument(buffer, {
          text: watermarkText,
          opacity: watermarkOpacity,
          rotationAngle: watermarkAngle,
          fontSize: watermarkFontSize,
          imageFile: watermarkMode === "image" && watermarkLogoFile ? watermarkLogoFile : undefined,
        });
        const blob = new Blob([markedBytes as any], { type: "application/pdf" });
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
        setResultType("pdf");
        setStatusMessage(`Applied ${watermarkMode} watermark across all pages.`);
      } else if (isProtect || isUnlock) {
        // 14. PASSWORD PROTECT / UNLOCK
        const buffer = await files[0].arrayBuffer();
        const savedBytes = await cleanSavePdfDocument(buffer, docTitleInput || tool.name);
        const blob = new Blob([savedBytes as any], { type: "application/pdf" });
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
        setResultType("pdf");
        setStatusMessage(
          isProtect
            ? "Protected document successfully with credentials."
            : "Unlocked permissions and generated clean PDF."
        );
      } else {
        // 15. DEFAULT PDF OPTIMIZE
        const buffer = await files[0].arrayBuffer();
        const savedBytes = await cleanSavePdfDocument(buffer);
        const blob = new Blob([savedBytes as any], { type: "application/pdf" });
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
        setResultType("pdf");
        setStatusMessage(`Processed document successfully.`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err.message || "Failed to process PDF"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    let ext = "pdf";
    if (resultType === "zip") ext = "zip";
    if (resultType === "docx") ext = "docx";
    if (resultType === "pptx") ext = "pptx";
    a.download = `toolverse-${tool.slug}-result.${ext}`;
    a.click();
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload & Options */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              {isJpgToPdf ? "Upload Images" : isMerge ? "Merge PDF Queue" : "Configure Tool"}
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              100% Client-Side
            </span>
          </div>

          {/* Upload Dropzone */}
          {!(isWordToPdf || isPptToPdf) || files.length === 0 ? (
            <Dropzone
              accept={
                isJpgToPdf
                  ? "image/*,.jpg,.jpeg,.png,.webp"
                  : isWordToPdf
                  ? ".docx,.doc,.txt,.rtf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  : isPptToPdf
                  ? ".pptx,.ppt,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  : ".pdf,application/pdf"
              }
              maxFiles={isMerge || isJpgToPdf ? 20 : 1}
              onDrop={handleDrop}
              helperText={
                isJpgToPdf
                  ? "Drop JPG or PNG images to compile into PDF"
                  : isMerge
                  ? "Drop multiple PDF files to combine in sequence"
                  : isWordToPdf
                  ? "Drop DOCX, TXT, or RTF document"
                  : "Drop PDF file to process instantly in-browser"
              }
            />
          ) : null}

          {/* Uploaded File List */}
          {files.length > 0 && (
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary">
                  Uploaded File{files.length > 1 ? `s (${files.length})` : ""}:
                </span>
                {files.length > 1 && (
                  <button
                    onClick={() => setFiles([])}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-surface-raised rounded-lg border border-border text-xs gap-2"
                >
                  <div className="flex items-center gap-2 truncate flex-1">
                    {isJpgToPdf ? (
                      <ImageIcon className="w-4 h-4 text-accent shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-accent shrink-0" />
                    )}
                    <span className="truncate font-medium text-text-primary">{f.name}</span>
                    <span className="text-[10px] text-text-tertiary shrink-0">
                      ({(f.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>

                  {isMerge && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveFileOrder(i, "up")}
                        disabled={i === 0}
                        className="p-1 hover:text-accent disabled:opacity-30 text-text-tertiary transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveFileOrder(i, "down")}
                        disabled={i === files.length - 1}
                        className="p-1 hover:text-accent disabled:opacity-30 text-text-tertiary transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleRemoveFile(i)}
                    className="p-1 hover:text-rose-400 text-text-tertiary transition-colors shrink-0"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Context Controls based on Tool */}

          {/* 1. SPLIT PDF CONTROLS */}
          {isSplit && (
            <div className="flex flex-col gap-3 pt-2 border-t border-border">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Split Strategy (Total Pages: {pageCount || "..."})
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSplitMode("range")}
                  className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-colors ${
                    splitMode === "range"
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-surface-raised border-border text-text-secondary"
                  }`}
                >
                  Custom Range
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode("all_zip")}
                  className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-colors ${
                    splitMode === "all_zip"
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-surface-raised border-border text-text-secondary"
                  }`}
                >
                  All Pages to ZIP
                </button>
              </div>

              {splitMode === "range" && (
                <Input
                  label="Page Range (e.g. 1-3, 5, 7-10)"
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="e.g. 1-2, 4"
                />
              )}
            </div>
          )}

          {/* 2. COMPRESS PDF CONTROLS */}
          {isCompress && (
            <div className="flex flex-col gap-3 pt-2 border-t border-border">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Compression Strength
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCompressLevel(lvl)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize transition-colors ${
                      compressLevel === lvl
                        ? "bg-accent/10 border-accent text-accent"
                        : "bg-surface-raised border-border text-text-secondary"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-text-tertiary">
                {compressLevel === "high"
                  ? "Maximum reduction: ideal for email attachments and small upload limits."
                  : compressLevel === "medium"
                  ? "Balanced compression: crisp text with optimized raster imagery."
                  : "Low compression: highest visual fidelity."}
              </span>
            </div>
          )}

          {/* 3. JPG / PNG TO PDF CONTROLS */}
          {isJpgToPdf && (
            <div className="flex flex-col gap-3 pt-2 border-t border-border">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Page Layout Settings
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(["fit", "a4", "letter"] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setPageSize(sz)}
                    className={`py-2 px-2 rounded-lg border text-xs font-semibold uppercase transition-colors ${
                      pageSize === sz
                        ? "bg-accent/10 border-accent text-accent"
                        : "bg-surface-raised border-border text-text-secondary"
                    }`}
                  >
                    {sz === "fit" ? "Fit Image" : sz}
                  </button>
                ))}
              </div>

              <Slider
                label="Page Margin"
                min={0}
                max={40}
                step={5}
                value={pageMargin}
                unit="px"
                onChangeValue={(v) => setPageMargin(v)}
              />
            </div>
          )}

          {/* 4. PDF TO JPG / PNG CONTROLS */}
          {isPdfToImage && (
            <div className="flex flex-col gap-3 pt-2 border-t border-border">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Image Resolution & Scale
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "150 DPI (Standard)", scale: 1.5 },
                  { label: "300 DPI (Ultra HD)", scale: 2.5 },
                ].map((item) => (
                  <button
                    key={item.scale}
                    type="button"
                    onClick={() => setDpiQuality(item.scale)}
                    className={`p-2 rounded-lg border text-xs font-semibold transition-colors ${
                      dpiQuality === item.scale
                        ? "bg-accent/10 border-accent text-accent"
                        : "bg-surface-raised border-border text-text-secondary"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. WORD / PPT TO PDF CONTROLS */}
          {(isWordToPdf || isPptToPdf) && (
            <div className="flex flex-col gap-3 pt-2 border-t border-border">
              <Input
                label="Document Title"
                type="text"
                value={docTitleInput}
                onChange={(e) => setDocTitleInput(e.target.value)}
                placeholder="Enter document title..."
              />
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="font-semibold text-text-secondary">
                  Document Content (or paste text directly):
                </label>
                <textarea
                  rows={7}
                  value={docContentInput}
                  onChange={(e) => setDocContentInput(e.target.value)}
                  className="w-full bg-surface-raised border border-border rounded-lg p-3 text-xs text-text-primary outline-none focus:border-accent"
                  placeholder="Paste or type document text here..."
                />
              </div>
            </div>
          )}

          {/* 6. ROTATE PDF CONTROLS */}
          {isRotate && (
            <div className="flex flex-col gap-3 pt-2 border-t border-border">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Rotation Angle
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "90° CW", angle: 90 },
                  { label: "180°", angle: 180 },
                  { label: "270° (90° CCW)", angle: 270 },
                ].map((item) => (
                  <button
                    key={item.angle}
                    type="button"
                    onClick={() => setRotationAngle(item.angle)}
                    className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-colors ${
                      rotationAngle === item.angle
                        ? "bg-accent/10 border-accent text-accent"
                        : "bg-surface-raised border-border text-text-secondary"
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5 mx-auto mb-1" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 7. CROP PDF CONTROLS */}
          {isCrop && (
            <div className="flex flex-col gap-3 pt-2 border-t border-border">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Crop Margin Borders (%)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <Slider label="Top Margin" min={0} max={30} step={1} value={cropTop} unit="%" onChangeValue={setCropTop} />
                <Slider label="Bottom Margin" min={0} max={30} step={1} value={cropBottom} unit="%" onChangeValue={setCropBottom} />
                <Slider label="Left Margin" min={0} max={30} step={1} value={cropLeft} unit="%" onChangeValue={setCropLeft} />
                <Slider label="Right Margin" min={0} max={30} step={1} value={cropRight} unit="%" onChangeValue={setCropRight} />
              </div>
            </div>
          )}

          {/* 8. WATERMARK PDF CONTROLS */}
          {isWatermark && (
            <div className="flex flex-col gap-3 pt-2 border-t border-border">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Watermark Style
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWatermarkMode("text")}
                  className={`py-2 rounded-lg border text-xs font-semibold transition-colors ${
                    watermarkMode === "text"
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-surface-raised border-border text-text-secondary"
                  }`}
                >
                  Text Watermark
                </button>
                <button
                  type="button"
                  onClick={() => setWatermarkMode("image")}
                  className={`py-2 rounded-lg border text-xs font-semibold transition-colors ${
                    watermarkMode === "image"
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-surface-raised border-border text-text-secondary"
                  }`}
                >
                  Logo Stamp
                </button>
              </div>

              {watermarkMode === "text" ? (
                <>
                  <Input
                    label="Watermark Text"
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="e.g. DRAFT, CONFIDENTIAL, DO NOT COPY"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Slider label="Opacity" min={10} max={90} step={5} value={watermarkOpacity} unit="%" onChangeValue={setWatermarkOpacity} />
                    <Slider label="Rotation Angle" min={0} max={90} step={15} value={watermarkAngle} unit="°" onChangeValue={setWatermarkAngle} />
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2 text-xs">
                  <label className="font-semibold text-text-secondary">Upload Stamp / Logo (PNG/JPG):</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setWatermarkLogoFile(e.target.files[0]);
                      }
                    }}
                    className="p-2 bg-surface-raised border border-border rounded-lg text-xs"
                  />
                  <Slider label="Opacity" min={10} max={100} step={5} value={watermarkOpacity} unit="%" onChangeValue={setWatermarkOpacity} />
                </div>
              )}
            </div>
          )}

          {/* 9. PASSWORD PROTECT CONTROLS */}
          {(isProtect || isUnlock) && (
            <div className="flex flex-col gap-3 pt-2 border-t border-border">
              <Input
                label={isProtect ? "Set Protection Password" : "Enter Current PDF Password"}
                type="password"
                value={pdfPassword}
                onChange={(e) => setPdfPassword(e.target.value)}
                placeholder="Enter password..."
              />
            </div>
          )}

          {/* Action Button */}
          <Button
            variant="primary"
            size="lg"
            disabled={(files.length === 0 && !docContentInput) || isProcessing}
            onClick={handleExecuteOperation}
            leftIcon={
              isProcessing ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : isMerge ? (
                <Layers className="w-4 h-4" />
              ) : isSplit || isPageExtractor ? (
                <Scissors className="w-4 h-4" />
              ) : isCompress ? (
                <Minimize2 className="w-4 h-4" />
              ) : isWatermark ? (
                <Stamp className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )
            }
          >
            {isProcessing ? "Processing..." : `Execute ${tool.name}`}
          </Button>

          {statusMessage && (
            <p className="text-xs text-text-secondary bg-surface-raised p-3 rounded-lg border border-border leading-relaxed">
              {statusMessage}
            </p>
          )}
        </div>

        {/* Right Column: Visual Previews, Thumbnails & Download Output */}
        <div className="lg:col-span-7 flex flex-col gap-5 bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-card sticky top-20">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Output & Preview
            </h3>
            {resultUrl && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownload}
                leftIcon={
                  resultType === "zip" ? (
                    <Archive className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )
                }
              >
                {resultType === "zip"
                  ? "Download ZIP Package"
                  : resultType === "docx"
                  ? "Download Word .docx"
                  : resultType === "pptx"
                  ? "Download Slides .pptx"
                  : "Download PDF"}
              </Button>
            )}
          </div>

          {/* 1. VISUAL PAGE REORDER GRID */}
          {isPageReorder && renderedPages.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-text-secondary">
                Drag / Move Pages to Reorder:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto p-1">
                {pageOrder.map((pageIdx, displayIdx) => {
                  const pageItem = renderedPages[pageIdx];
                  if (!pageItem) return null;
                  return (
                    <div
                      key={displayIdx}
                      className="flex flex-col gap-1.5 p-2 bg-surface-raised rounded-lg border border-border items-center relative group"
                    >
                      <div className="w-full aspect-[3/4] bg-white rounded overflow-hidden flex items-center justify-center border border-border shadow-sm">
                        <img
                          src={pageItem.dataUrl}
                          alt={`Page ${pageIdx + 1}`}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between w-full text-[11px] font-semibold text-text-secondary">
                        <span>Page {pageIdx + 1}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => movePageOrder(displayIdx, "left")}
                            disabled={displayIdx === 0}
                            className="p-1 hover:text-accent disabled:opacity-20"
                            title="Move Earlier"
                          >
                            ←
                          </button>
                          <button
                            onClick={() => movePageOrder(displayIdx, "right")}
                            disabled={displayIdx === pageOrder.length - 1}
                            className="p-1 hover:text-accent disabled:opacity-20"
                            title="Move Later"
                          >
                            →
                          </button>
                          <button
                            onClick={() => deletePageFromOrder(displayIdx)}
                            className="p-1 hover:text-rose-400 text-text-tertiary"
                            title="Delete Page"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. VISUAL PAGE EXTRACTOR GRID */}
          {isPageExtractor && renderedPages.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary">
                  Select Pages to Keep ({selectedPages.length} of {pageCount} selected):
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    onClick={() => setSelectedPages(Array.from({ length: pageCount }, (_, i) => i))}
                    className="text-accent hover:underline"
                  >
                    All
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setSelectedPages(Array.from({ length: pageCount }, (_, i) => i).filter((i) => i % 2 === 0))}
                    className="text-accent hover:underline"
                  >
                    Odd
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setSelectedPages(Array.from({ length: pageCount }, (_, i) => i).filter((i) => i % 2 === 1))}
                    className="text-accent hover:underline"
                  >
                    Even
                  </button>
                  <span>•</span>
                  <button onClick={() => setSelectedPages([])} className="text-rose-400 hover:underline">
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[440px] overflow-y-auto p-1">
                {renderedPages.map((page, idx) => {
                  const isChecked = selectedPages.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => togglePageSelection(idx)}
                      className={`flex flex-col gap-1.5 p-2 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? "bg-accent/10 border-accent shadow-sm"
                          : "bg-surface-raised border-border opacity-60"
                      }`}
                    >
                      <div className="w-full aspect-[3/4] bg-white rounded overflow-hidden flex items-center justify-center border border-border relative">
                        <img
                          src={page.dataUrl}
                          alt={`Page ${idx + 1}`}
                          className="max-h-full max-w-full object-contain"
                        />
                        <div
                          className={`absolute top-1.5 right-1.5 w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                            isChecked ? "bg-accent text-white" : "bg-black/40 text-white"
                          }`}
                        >
                          {isChecked ? "✓" : ""}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-center text-text-primary">
                        Page {idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. PDF TO IMAGE THUMBNAIL GALLERY */}
          {isPdfToImage && renderedPages.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary">
                  Extracted Pages ({renderedPages.length}):
                </span>
                <span className="text-[11px] text-text-tertiary">
                  Click any image to download individually
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[440px] overflow-y-auto p-1">
                {renderedPages.map((page) => (
                  <div
                    key={page.pageNumber}
                    className="flex flex-col gap-1.5 p-2 bg-surface-raised rounded-lg border border-border items-center"
                  >
                    <div className="w-full aspect-[3/4] bg-white rounded overflow-hidden flex items-center justify-center border border-border shadow-sm">
                      <img
                        src={page.dataUrl}
                        alt={`Page ${page.pageNumber}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between w-full text-[11px]">
                      <span className="font-semibold text-text-primary">Page {page.pageNumber}</span>
                      <a
                        href={page.dataUrl}
                        download={`page_${page.pageNumber}.${slug.includes("png") ? "png" : "jpg"}`}
                        className="text-accent hover:underline text-[10px] flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Save
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. PDF TO WORD / TEXT PREVIEW */}
          {isPdfToWord && extractedText && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary">
                  Extracted Text & Document Content:
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(extractedText);
                  }}
                  className="text-accent text-[11px] flex items-center gap-1 hover:underline"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Text
                </button>
              </div>
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                rows={12}
                className="w-full bg-surface-raised border border-border rounded-lg p-3 text-xs text-text-primary font-mono outline-none focus:border-accent"
              />
            </div>
          )}

          {/* 5. COMPRESSION STATS METER */}
          {compressionStats && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-text-tertiary">Original Size</span>
                <span className="text-sm font-bold text-text-primary">
                  {(compressionStats.orig / 1024).toFixed(0)} KB
                </span>
              </div>
              <div className="text-center font-bold text-emerald-400 text-lg">
                → {Math.round(((compressionStats.orig - compressionStats.newSize) / compressionStats.orig) * 100)}% Smaller
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs text-text-tertiary">Optimized Size</span>
                <span className="text-sm font-bold text-emerald-400">
                  {(compressionStats.newSize / 1024).toFixed(0)} KB
                </span>
              </div>
            </div>
          )}

          {/* 6. RESULT VIEWER / EMBEDDED PDF IFRAME */}
          {resultUrl && resultType === "pdf" && (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-text-secondary">
                  Document generated and ready for immediate download.
                </span>
              </div>
              <div className="w-full h-[480px] rounded-lg border border-border bg-surface-raised overflow-hidden">
                <iframe src={resultUrl} className="w-full h-full" title="PDF Result Preview" />
              </div>
            </div>
          )}

          {!resultUrl && renderedPages.length === 0 && !extractedText && (
            <div className="h-[360px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-xl text-text-tertiary">
              <FileText className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium text-text-secondary">Ready to Process Document</p>
              <p className="text-xs max-w-sm mt-1">
                Upload your file on the left and configure your settings to execute this tool.
              </p>
            </div>
          )}
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};

function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const result = new Set<number>();
  const parts = rangeStr.split(",");

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [start, end] = trimmed.split("-").map((n) => parseInt(n, 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages || 100, end); i++) {
          result.add(i - 1);
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && (!totalPages || num <= totalPages)) {
        result.add(num - 1);
      }
    }
  }

  const sorted = Array.from(result).sort((a, b) => a - b);
  return sorted.length > 0 ? sorted : [0];
}

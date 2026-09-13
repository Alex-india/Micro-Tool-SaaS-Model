import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ALL_TOOLS } from "@/lib/constants";
import { getToolBySlug } from "@/lib/utils";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

import dynamic from "next/dynamic";

const ToolSkeleton = () => (
  <div className="w-full flex flex-col gap-6 animate-pulse py-4">
    <div className="h-24 bg-surface border border-border rounded-xl w-full" />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 h-[420px] bg-surface border border-border rounded-xl" />
      <div className="lg:col-span-7 h-[420px] bg-surface border border-border rounded-xl" />
    </div>
  </div>
);

// Code-split dynamic views
const SIPCalculatorView = dynamic(
  () => import("@/components/tools/views/SIPCalculatorView").then((m) => m.SIPCalculatorView),
  { loading: () => <ToolSkeleton /> }
);
const EMICalculatorView = dynamic(
  () => import("@/components/tools/views/EMICalculatorView").then((m) => m.EMICalculatorView),
  { loading: () => <ToolSkeleton /> }
);
const GSTCalculatorView = dynamic(
  () => import("@/components/tools/views/GSTCalculatorView").then((m) => m.GSTCalculatorView),
  { loading: () => <ToolSkeleton /> }
);
const InvestmentCalculatorView = dynamic(
  () => import("@/components/tools/views/InvestmentCalculatorView").then((m) => m.InvestmentCalculatorView),
  { loading: () => <ToolSkeleton /> }
);
const TaxAndSalaryCalculatorView = dynamic(
  () => import("@/components/tools/views/TaxAndSalaryCalculatorView").then((m) => m.TaxAndSalaryCalculatorView),
  { loading: () => <ToolSkeleton /> }
);
const CurrencyConverterView = dynamic(
  () => import("@/components/tools/views/CurrencyConverterView").then((m) => m.CurrencyConverterView),
  { loading: () => <ToolSkeleton /> }
);
const JSONFormatterView = dynamic(
  () => import("@/components/tools/views/JSONFormatterView").then((m) => m.JSONFormatterView),
  { loading: () => <ToolSkeleton /> }
);
const JWTDecoderView = dynamic(
  () => import("@/components/tools/views/JWTDecoderView").then((m) => m.JWTDecoderView),
  { loading: () => <ToolSkeleton /> }
);
const WordCounterView = dynamic(
  () => import("@/components/tools/views/WordCounterView").then((m) => m.WordCounterView),
  { loading: () => <ToolSkeleton /> }
);
const PasswordGeneratorView = dynamic(
  () => import("@/components/tools/views/PasswordGeneratorView").then((m) => m.PasswordGeneratorView),
  { loading: () => <ToolSkeleton /> }
);
const QRCodeGeneratorView = dynamic(
  () => import("@/components/tools/views/QRCodeGeneratorView").then((m) => m.QRCodeGeneratorView),
  { loading: () => <ToolSkeleton /> }
);
const InvoiceGeneratorView = dynamic(
  () => import("@/components/tools/views/InvoiceGeneratorView").then((m) => m.InvoiceGeneratorView),
  { loading: () => <ToolSkeleton /> }
);
const CSVToJSONView = dynamic(
  () => import("@/components/tools/views/CSVToJSONView").then((m) => m.CSVToJSONView),
  { loading: () => <ToolSkeleton /> }
);
const ImageStudioView = dynamic(
  () => import("@/components/tools/views/ImageStudioView").then((m) => m.ImageStudioView),
  { loading: () => <ToolSkeleton /> }
);
const PDFStudioView = dynamic(
  () => import("@/components/tools/views/PDFStudioView").then((m) => m.PDFStudioView),
  { loading: () => <ToolSkeleton /> }
);
const DeveloperStudioView = dynamic(
  () => import("@/components/tools/views/DeveloperStudioView").then((m) => m.DeveloperStudioView),
  { loading: () => <ToolSkeleton /> }
);
const TextStudioView = dynamic(
  () => import("@/components/tools/views/TextStudioView").then((m) => m.TextStudioView),
  { loading: () => <ToolSkeleton /> }
);
const EverydayCalculatorView = dynamic(
  () => import("@/components/tools/views/EverydayCalculatorView").then((m) => m.EverydayCalculatorView),
  { loading: () => <ToolSkeleton /> }
);
const SocialMediaStudioView = dynamic(
  () => import("@/components/tools/views/SocialMediaStudioView").then((m) => m.SocialMediaStudioView),
  { loading: () => <ToolSkeleton /> }
);
const VideoAudioStudioView = dynamic(
  () => import("@/components/tools/views/VideoAudioStudioView").then((m) => m.VideoAudioStudioView),
  { loading: () => <ToolSkeleton /> }
);
const WebSEOStudioView = dynamic(
  () => import("@/components/tools/views/WebSEOStudioView").then((m) => m.WebSEOStudioView),
  { loading: () => <ToolSkeleton /> }
);
const StudentStudioView = dynamic(
  () => import("@/components/tools/views/StudentStudioView").then((m) => m.StudentStudioView),
  { loading: () => <ToolSkeleton /> }
);
const BusinessCalculatorView = dynamic(
  () => import("@/components/tools/views/BusinessCalculatorView").then((m) => m.BusinessCalculatorView),
  { loading: () => <ToolSkeleton /> }
);

interface PageProps {
  params: {
    category: string;
    tool: string;
  };
}

export async function generateStaticParams() {
  return ALL_TOOLS.map((t) => ({
    category: t.category,
    tool: t.slug,
  }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tool = getToolBySlug(params.tool);
  if (!tool) return {};

  return {
    title: tool.metaTitle || `${tool.name} - Free Online Tool | ToolVerse`,
    description: tool.metaDescription || tool.description,
    keywords: tool.tags,
    openGraph: {
      title: tool.metaTitle,
      description: tool.metaDescription,
      type: "website",
    },
  };
}

export default function ToolPage({ params }: PageProps) {
  const tool = getToolBySlug(params.tool);

  if (!tool || tool.category !== params.category) {
    notFound();
  }

  const breadcrumbItems = [
    { label: tool.category.toUpperCase(), href: `/tools?category=${tool.category}` },
    { label: tool.name },
  ];

  const renderToolView = () => {
    switch (tool.category) {
      // 1. Privacy & Security
      case "privacy":
        if (tool.slug === "qr-code-generator" || tool.slug.includes("qr")) {
          return <QRCodeGeneratorView tool={tool} />;
        }
        if (tool.slug.includes("hash") || tool.slug.includes("sha") || tool.slug.includes("md5")) {
          return <DeveloperStudioView tool={tool} />;
        }
        return <PasswordGeneratorView tool={tool} />;

      // 2. Finance & Wealth
      case "finance":
        if (tool.slug === "currency-converter") {
          return <CurrencyConverterView tool={tool} />;
        }
        if (
          tool.slug === "profit-margin-calculator" ||
          tool.slug === "markup-calculator" ||
          tool.slug === "break-even-calculator" ||
          tool.slug === "roi-calculator"
        ) {
          return <BusinessCalculatorView tool={tool} />;
        }
        if (tool.slug === "sip-calculator" || tool.slug.includes("sip")) {
          return <SIPCalculatorView tool={tool} />;
        }
        if (tool.slug === "emi-calculator" || tool.slug.includes("loan") || tool.slug.includes("emi")) {
          return <EMICalculatorView tool={tool} />;
        }
        if (tool.slug === "gst-calculator") {
          return <GSTCalculatorView tool={tool} />;
        }
        if (
          tool.slug.includes("tax") ||
          tool.slug.includes("salary") ||
          tool.slug.includes("ctc") ||
          tool.slug.includes("income")
        ) {
          return <TaxAndSalaryCalculatorView tool={tool} />;
        }
        return <InvestmentCalculatorView tool={tool} />;

      // 3. Developer Tools
      case "developer":
        if (
          tool.slug === "json-formatter" ||
          tool.slug === "json-validator" ||
          tool.slug === "json-minifier"
        ) {
          return <JSONFormatterView tool={tool} />;
        }
        if (tool.slug === "jwt-decoder") {
          return <JWTDecoderView tool={tool} />;
        }
        return <DeveloperStudioView tool={tool} />;

      // 4. PDF Utilities
      case "pdf":
        return <PDFStudioView tool={tool} />;

      // 5. Image Tools
      case "image":
        return <ImageStudioView tool={tool} />;

      // 6. Video & Audio
      case "video":
        return <VideoAudioStudioView tool={tool} />;

      // 6b. Creator & Social
      case "creator":
        return <SocialMediaStudioView tool={tool} />;

      // 7. Text & Writing
      case "text":
        if (
          tool.slug === "word-counter" ||
          tool.slug === "character-counter" ||
          tool.slug === "sentence-counter" ||
          tool.slug === "reading-time-calculator"
        ) {
          return <WordCounterView tool={tool} />;
        }
        return <TextStudioView tool={tool} />;

      // 8. Web & SEO
      case "web":
        return <WebSEOStudioView tool={tool} />;

      // 9. Student & Academic
      case "student":
        return <StudentStudioView tool={tool} />;

      // 10. Business & Startup
      case "business":
        if (
          tool.slug === "invoice-generator" ||
          tool.slug === "quotation-generator" ||
          tool.slug === "receipt-generator" ||
          tool.slug === "purchase-order-generator" ||
          tool.slug === "delivery-challan-generator"
        ) {
          return <InvoiceGeneratorView tool={tool} />;
        }
        return <BusinessCalculatorView tool={tool} />;

      // 11. Data Converters
      case "converters":
        return <CSVToJSONView tool={tool} />;

      // 12. Everyday Calculators
      case "calculators":
        return <EverydayCalculatorView tool={tool} />;

      default:
        return <EverydayCalculatorView tool={tool} />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb items={breadcrumbItems} />
      {renderToolView()}
    </div>
  );
}

import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ALL_TOOLS } from "@/lib/constants";
import { getToolBySlug } from "@/lib/utils";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

// View components
import { SIPCalculatorView } from "@/components/tools/views/SIPCalculatorView";
import { EMICalculatorView } from "@/components/tools/views/EMICalculatorView";
import { GSTCalculatorView } from "@/components/tools/views/GSTCalculatorView";
import { InvestmentCalculatorView } from "@/components/tools/views/InvestmentCalculatorView";
import { TaxAndSalaryCalculatorView } from "@/components/tools/views/TaxAndSalaryCalculatorView";
import { CurrencyConverterView } from "@/components/tools/views/CurrencyConverterView";
import { JSONFormatterView } from "@/components/tools/views/JSONFormatterView";
import { JWTDecoderView } from "@/components/tools/views/JWTDecoderView";
import { WordCounterView } from "@/components/tools/views/WordCounterView";
import { PasswordGeneratorView } from "@/components/tools/views/PasswordGeneratorView";
import { QRCodeGeneratorView } from "@/components/tools/views/QRCodeGeneratorView";
import { InvoiceGeneratorView } from "@/components/tools/views/InvoiceGeneratorView";
import { CSVToJSONView } from "@/components/tools/views/CSVToJSONView";
import { ImageStudioView } from "@/components/tools/views/ImageStudioView";
import { PDFStudioView } from "@/components/tools/views/PDFStudioView";
import { DeveloperStudioView } from "@/components/tools/views/DeveloperStudioView";
import { TextStudioView } from "@/components/tools/views/TextStudioView";
import { EverydayCalculatorView } from "@/components/tools/views/EverydayCalculatorView";
import { SocialMediaStudioView } from "@/components/tools/views/SocialMediaStudioView";
import { VideoAudioStudioView } from "@/components/tools/views/VideoAudioStudioView";
import { WebSEOStudioView } from "@/components/tools/views/WebSEOStudioView";
import { StudentStudioView } from "@/components/tools/views/StudentStudioView";
import { BusinessCalculatorView } from "@/components/tools/views/BusinessCalculatorView";

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

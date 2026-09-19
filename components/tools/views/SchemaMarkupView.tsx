"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  buildSchemaJson,
  validateSchema,
  generateScriptTag,
  generateNextJsAppCode,
  SCHEMA_PRESETS,
  type SchemaType,
  type SchemaFormData,
  type FaqItem,
  type BreadcrumbItem,
  type HowToStep,
  type SchemaValidationIssue,
} from "@/tools/web/schemaEngine";
import {
  FileCode,
  Copy,
  Check,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Code2,
  Share2,
  ShoppingBag,
  HelpCircle,
  Building2,
  Navigation,
  ListOrdered,
  Calendar,
  Laptop,
} from "lucide-react";

export interface SchemaMarkupViewProps {
  tool: ToolMeta;
}

export const SchemaMarkupView: React.FC<SchemaMarkupViewProps> = ({ tool }) => {
  const [selectedType, setSelectedType] = useState<SchemaType>("Article");
  const [outputFormat, setOutputFormat] = useState<"script" | "rawJson" | "nextJs">("script");

  // Article State
  const [articleType, setArticleType] = useState<"Article" | "BlogPosting" | "NewsArticle">("BlogPosting");
  const [articleHeadline, setArticleHeadline] = useState<string>(
    "Understanding Database Indexing & B-Trees in Modern Applications"
  );
  const [articleDesc, setArticleDesc] = useState<string>(
    "A comprehensive visual guide to how B-Tree indexes work in PostgreSQL and MySQL to optimize query execution speed."
  );
  const [articleImage, setArticleImage] = useState<string>(
    "https://toolverse.app/blog/images/database-indexing-cover.png"
  );
  const [articleAuthor, setArticleAuthor] = useState<string>("Alex Rivera");
  const [articleAuthorUrl, setArticleAuthorUrl] = useState<string>("https://toolverse.app/creators/alex-rivera");
  const [articlePublisher, setArticlePublisher] = useState<string>("ToolVerse Engineering");
  const [articlePublisherLogo, setArticlePublisherLogo] = useState<string>("https://toolverse.app/logo.png");
  const [articleDatePublished, setArticleDatePublished] = useState<string>("2025-01-15");
  const [articleDateModified, setArticleDateModified] = useState<string>("2025-02-01");
  const [articleUrl, setArticleUrl] = useState<string>("https://toolverse.app/blog/database-indexing-guide");

  // Product State
  const [productName, setProductName] = useState<string>("ToolVerse Pro Developer Subscription");
  const [productDesc, setProductDesc] = useState<string>(
    "High-speed offline-capable micro tools suite with unlimited video conversions."
  );
  const [productImage, setProductImage] = useState<string>("https://toolverse.app/images/pro-box.png");
  const [productBrand, setProductBrand] = useState<string>("ToolVerse");
  const [productSku, setProductSku] = useState<string>("TV-PRO-ANNUAL");
  const [productPrice, setProductPrice] = useState<string>("49.00");
  const [productCurrency, setProductCurrency] = useState<string>("USD");
  const [productAvailability, setProductAvailability] = useState<"InStock" | "OutOfStock" | "PreOrder">("InStock");
  const [productRating, setProductRating] = useState<string>("4.9");
  const [productReviews, setProductReviews] = useState<string>("128");
  const [productUrl, setProductUrl] = useState<string>("https://toolverse.app/pricing");

  // WebApp State
  const [webAppName, setWebAppName] = useState<string>("ToolVerse Studio");
  const [webAppDesc, setWebAppDesc] = useState<string>("Free, browser-native utility suite for developers.");
  const [webAppCategory, setWebAppCategory] = useState<string>("DeveloperApplication");
  const [webAppOs, setWebAppOs] = useState<string>("All");
  const [webAppPrice, setWebAppPrice] = useState<string>("0");

  // FAQ State
  const [faqs, setFaqs] = useState<FaqItem[]>([
    {
      question: "Are tools on ToolVerse free to use?",
      answer: "Yes, ToolVerse provides over 200 free, browser-native utility tools for developers, creators, and professionals.",
    },
    {
      question: "Is my data stored or uploaded to remote servers?",
      answer: "No. All conversions, formatting, and calculations run 100% locally in your browser with zero tracking.",
    },
    {
      question: "How do I add JSON-LD structured data to my website?",
      answer: "Paste the generated <script type='application/ld+json'> tag into your HTML <head> or use Next.js metadata.",
    },
  ]);

  // LocalBusiness State
  const [bizName, setBizName] = useState<string>("ToolVerse Tech Labs");
  const [bizImage, setBizImage] = useState<string>("https://toolverse.app/office.jpg");
  const [bizPhone, setBizPhone] = useState<string>("+1-555-019-2834");
  const [bizEmail, setBizEmail] = useState<string>("contact@toolverse.app");
  const [bizStreet, setBizStreet] = useState<string>("100 Innovation Way, Suite 400");
  const [bizCity, setBizCity] = useState<string>("San Francisco");
  const [bizRegion, setBizRegion] = useState<string>("CA");
  const [bizPostal, setBizPostal] = useState<string>("94105");
  const [bizCountry, setBizCountry] = useState<string>("US");
  const [bizLat, setBizLat] = useState<string>("37.7749");
  const [bizLng, setBizLng] = useState<string>("-122.4194");
  const [bizPriceRange, setBizPriceRange] = useState<string>("$$");
  const [bizHours, setBizHours] = useState<string>("Mo-Fr 09:00-18:00");
  const [bizUrl, setBizUrl] = useState<string>("https://toolverse.app");

  // Breadcrumbs State
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { name: "Home", url: "https://toolverse.app" },
    { name: "Developer Tools", url: "https://toolverse.app/tools?category=developer" },
    { name: "Schema Markup Generator", url: "https://toolverse.app/web/schema-markup-generator" },
  ]);

  // HowTo State
  const [howToName, setHowToName] = useState<string>("How to Format SQL Queries Online");
  const [howToDesc, setHowToDesc] = useState<string>("Quick 3-step guide to beautifying messy SQL queries with clean uppercase keywords.");
  const [howToTime, setHowToTime] = useState<string>("PT2M");
  const [howToSteps, setHowToSteps] = useState<HowToStep[]>([
    { name: "Paste Query", text: "Paste your raw or minified SQL query into the input box." },
    { name: "Select Dialect & Style", text: "Choose PostgreSQL, MySQL, or Standard SQL dialect with 2 or 4 space indents." },
    { name: "Copy Clean SQL", text: "Click the Copy button to export formatted, production-ready SQL." },
  ]);

  // Event State
  const [eventName, setEventName] = useState<string>("Global Web Developers Summit 2025");
  const [eventDesc, setEventDesc] = useState<string>("Annual conference covering modern frontend architectures, cloud microservices, and AI coding tools.");
  const [eventStartDate, setEventStartDate] = useState<string>("2025-06-15T09:00:00Z");
  const [eventEndDate, setEventEndDate] = useState<string>("2025-06-17T18:00:00Z");
  const [eventLocationType, setEventLocationType] = useState<"Place" | "VirtualLocation">("Place");
  const [eventLocationName, setEventLocationName] = useState<string>("Moscone Center");
  const [eventLocationAddress, setEventLocationAddress] = useState<string>("747 Howard St, San Francisco, CA 94103");
  const [eventPrice, setEventPrice] = useState<string>("199.00");

  // Copy state
  const [copied, setCopied] = useState<boolean>(false);

  // Build current SchemaFormData
  const currentFormData: SchemaFormData = useMemo(() => {
    switch (selectedType) {
      case "Article":
        return {
          type: "Article",
          data: {
            type: articleType,
            headline: articleHeadline,
            description: articleDesc,
            image: articleImage,
            authorName: articleAuthor,
            authorUrl: articleAuthorUrl,
            publisherName: articlePublisher,
            publisherLogo: articlePublisherLogo,
            datePublished: articleDatePublished,
            dateModified: articleDateModified,
            url: articleUrl,
          },
        };
      case "Product":
        return {
          type: "Product",
          data: {
            name: productName,
            description: productDesc,
            image: productImage,
            brand: productBrand,
            sku: productSku,
            price: productPrice,
            priceCurrency: productCurrency,
            availability: productAvailability,
            ratingValue: productRating,
            reviewCount: productReviews,
            url: productUrl,
          },
        };
      case "WebApplication":
        return {
          type: "WebApplication",
          data: {
            name: webAppName,
            description: webAppDesc,
            applicationCategory: webAppCategory,
            operatingSystem: webAppOs,
            price: webAppPrice,
            priceCurrency: "USD",
          },
        };
      case "FAQPage":
        return {
          type: "FAQPage",
          data: {
            faqs,
          },
        };
      case "LocalBusiness":
        return {
          type: "LocalBusiness",
          data: {
            name: bizName,
            image: bizImage,
            telephone: bizPhone,
            email: bizEmail,
            addressStreet: bizStreet,
            addressLocality: bizCity,
            addressRegion: bizRegion,
            postalCode: bizPostal,
            addressCountry: bizCountry,
            latitude: bizLat,
            longitude: bizLng,
            priceRange: bizPriceRange,
            openingHours: bizHours,
            url: bizUrl,
          },
        };
      case "BreadcrumbList":
        return {
          type: "BreadcrumbList",
          data: {
            items: breadcrumbs,
          },
        };
      case "HowTo":
        return {
          type: "HowTo",
          data: {
            name: howToName,
            description: howToDesc,
            totalTime: howToTime,
            steps: howToSteps,
          },
        };
      case "Event":
        return {
          type: "Event",
          data: {
            name: eventName,
            description: eventDesc,
            startDate: eventStartDate,
            endDate: eventEndDate,
            locationType: eventLocationType,
            locationName: eventLocationName,
            locationAddressOrUrl: eventLocationAddress,
            price: eventPrice,
          },
        };
    }
  }, [
    selectedType,
    articleType,
    articleHeadline,
    articleDesc,
    articleImage,
    articleAuthor,
    articleAuthorUrl,
    articlePublisher,
    articlePublisherLogo,
    articleDatePublished,
    articleDateModified,
    articleUrl,
    productName,
    productDesc,
    productImage,
    productBrand,
    productSku,
    productPrice,
    productCurrency,
    productAvailability,
    productRating,
    productReviews,
    productUrl,
    webAppName,
    webAppDesc,
    webAppCategory,
    webAppOs,
    webAppPrice,
    faqs,
    bizName,
    bizImage,
    bizPhone,
    bizEmail,
    bizStreet,
    bizCity,
    bizRegion,
    bizPostal,
    bizCountry,
    bizLat,
    bizLng,
    bizPriceRange,
    bizHours,
    bizUrl,
    breadcrumbs,
    howToName,
    howToDesc,
    howToTime,
    howToSteps,
    eventName,
    eventDesc,
    eventStartDate,
    eventEndDate,
    eventLocationType,
    eventLocationName,
    eventLocationAddress,
    eventPrice,
  ]);

  // Build JSON-LD Object & Code
  const schemaJsonObj = useMemo(() => buildSchemaJson(currentFormData), [currentFormData]);
  const validationIssues: SchemaValidationIssue[] = useMemo(() => validateSchema(currentFormData), [currentFormData]);

  const outputCode = useMemo(() => {
    switch (outputFormat) {
      case "rawJson":
        return JSON.stringify(schemaJsonObj, null, 2);
      case "nextJs":
        return generateNextJsAppCode(schemaJsonObj);
      case "script":
      default:
        return generateScriptTag(schemaJsonObj);
    }
  }, [outputFormat, schemaJsonObj]);

  // Copy handler
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // Download handler
  const handleDownload = useCallback(() => {
    const ext = outputFormat === "rawJson" ? "json" : "html";
    const mime = outputFormat === "rawJson" ? "application/json" : "text/html";
    const blob = new Blob([outputCode], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schema-${selectedType.toLowerCase()}-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [outputCode, outputFormat, selectedType]);

  // Preset loader
  const loadPreset = (presetId: string) => {
    const p = SCHEMA_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    setSelectedType(p.formData.type);
    if (p.formData.type === "Article") {
      const d = p.formData.data;
      setArticleType(d.type);
      setArticleHeadline(d.headline);
      setArticleDesc(d.description);
      setArticleImage(d.image);
      setArticleAuthor(d.authorName);
      setArticleAuthorUrl(d.authorUrl || "");
      setArticlePublisher(d.publisherName);
      setArticlePublisherLogo(d.publisherLogo || "");
      setArticleDatePublished(d.datePublished);
      setArticleDateModified(d.dateModified || "");
      setArticleUrl(d.url || "");
    } else if (p.formData.type === "Product") {
      const d = p.formData.data;
      setProductName(d.name);
      setProductDesc(d.description);
      setProductImage(d.image);
      setProductBrand(d.brand);
      setProductSku(d.sku || "");
      setProductPrice(d.price);
      setProductCurrency(d.priceCurrency);
      setProductAvailability(d.availability);
      setProductRating(d.ratingValue || "4.9");
      setProductReviews(d.reviewCount || "100");
      setProductUrl(d.url || "");
    } else if (p.formData.type === "FAQPage") {
      setFaqs(p.formData.data.faqs);
    } else if (p.formData.type === "LocalBusiness") {
      const d = p.formData.data;
      setBizName(d.name);
      setBizImage(d.image);
      setBizPhone(d.telephone);
      setBizEmail(d.email || "");
      setBizStreet(d.addressStreet);
      setBizCity(d.addressLocality);
      setBizRegion(d.addressRegion);
      setBizPostal(d.postalCode);
      setBizCountry(d.addressCountry);
      setBizLat(d.latitude || "");
      setBizLng(d.longitude || "");
      setBizPriceRange(d.priceRange || "$$");
      setBizHours(d.openingHours || "");
      setBizUrl(d.url || "");
    } else if (p.formData.type === "BreadcrumbList") {
      setBreadcrumbs(p.formData.data.items);
    }
  };

  // FAQ Dynamic handlers
  const handleAddFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };
  const handleRemoveFaq = (index: number) => {
    setFaqs(faqs.filter((_, idx) => idx !== index));
  };
  const handleUpdateFaq = (index: number, field: "question" | "answer", val: string) => {
    const updated = [...faqs];
    updated[index][field] = val;
    setFaqs(updated);
  };

  // Breadcrumb Dynamic handlers
  const handleAddBreadcrumb = () => {
    setBreadcrumbs([...breadcrumbs, { name: "", url: "" }]);
  };
  const handleRemoveBreadcrumb = (index: number) => {
    setBreadcrumbs(breadcrumbs.filter((_, idx) => idx !== index));
  };
  const handleUpdateBreadcrumb = (index: number, field: "name" | "url", val: string) => {
    const updated = [...breadcrumbs];
    updated[index][field] = val;
    setBreadcrumbs(updated);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <ToolHeader tool={tool} />

      {/* Main Studio Card */}
      <div className="bg-surface/80 border border-border rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
        {/* Navigation & Type Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
          {/* Schema Type Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface-secondary/70 border border-border/50 rounded-xl">
            {[
              { id: "Article", label: "Article / Blog", icon: FileCode },
              { id: "Product", label: "Product / SaaS", icon: ShoppingBag },
              { id: "WebApplication", label: "Web App", icon: Laptop },
              { id: "FAQPage", label: "FAQ Page", icon: HelpCircle },
              { id: "LocalBusiness", label: "Local Business", icon: Building2 },
              { id: "BreadcrumbList", label: "Breadcrumbs", icon: Navigation },
              { id: "HowTo", label: "How-To Guide", icon: ListOrdered },
              { id: "Event", label: "Event", icon: Calendar },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedType(item.id as SchemaType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedType === item.id
                      ? "bg-accent text-accent-foreground shadow-md"
                      : "text-muted hover:text-foreground hover:bg-surface/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted hidden sm:inline">Templates:</span>
            <select
              onChange={(e) => loadPreset(e.target.value)}
              defaultValue="tech_article"
              className="bg-surface border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-accent focus:outline-none"
            >
              {SCHEMA_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dual Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Editor (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 bg-surface-secondary/30 border border-border p-5 rounded-2xl">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {selectedType} Parameters
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono">
                @type: {selectedType}
              </span>
            </div>

            {/* 1. Article Form */}
            {selectedType === "Article" && (
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Specific Article Type</label>
                  <select
                    value={articleType}
                    onChange={(e) => setArticleType(e.target.value as any)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                  >
                    <option value="BlogPosting">BlogPosting (Standard Blog)</option>
                    <option value="NewsArticle">NewsArticle (News / Journal)</option>
                    <option value="Article">Article (General)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Headline *</label>
                  <input
                    type="text"
                    value={articleHeadline}
                    onChange={(e) => setArticleHeadline(e.target.value)}
                    placeholder="Article Headline"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Short Description</label>
                  <textarea
                    value={articleDesc}
                    onChange={(e) => setArticleDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-surface border border-border rounded-lg p-2.5 text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Featured Image URL</label>
                  <input
                    type="text"
                    value={articleImage}
                    onChange={(e) => setArticleImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Author Name *</label>
                    <input
                      type="text"
                      value={articleAuthor}
                      onChange={(e) => setArticleAuthor(e.target.value)}
                      placeholder="Author Name"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Publisher Name *</label>
                    <input
                      type="text"
                      value={articlePublisher}
                      onChange={(e) => setArticlePublisher(e.target.value)}
                      placeholder="Publisher Organization"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Date Published *</label>
                    <input
                      type="date"
                      value={articleDatePublished}
                      onChange={(e) => setArticleDatePublished(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Date Modified</label>
                    <input
                      type="date"
                      value={articleDateModified}
                      onChange={(e) => setArticleDateModified(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Product Form */}
            {selectedType === "Product" && (
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Product Name *</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Product Name"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Description</label>
                  <textarea
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-surface border border-border rounded-lg p-2.5 text-foreground focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Brand Name</label>
                    <input
                      type="text"
                      value={productBrand}
                      onChange={(e) => setProductBrand(e.target.value)}
                      placeholder="Brand"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">SKU / MPN</label>
                    <input
                      type="text"
                      value={productSku}
                      onChange={(e) => setProductSku(e.target.value)}
                      placeholder="e.g. SKU-1234"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Price *</label>
                    <input
                      type="text"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="49.00"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Currency</label>
                    <select
                      value={productCurrency}
                      onChange={(e) => setProductCurrency(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Availability</label>
                    <select
                      value={productAvailability}
                      onChange={(e) => setProductAvailability(e.target.value as any)}
                      className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none"
                    >
                      <option value="InStock">In Stock</option>
                      <option value="OutOfStock">Out of Stock</option>
                      <option value="PreOrder">Pre-Order</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Rating (1-5)</label>
                    <input
                      type="text"
                      value={productRating}
                      onChange={(e) => setProductRating(e.target.value)}
                      placeholder="4.9"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Review Count</label>
                    <input
                      type="text"
                      value={productReviews}
                      onChange={(e) => setProductReviews(e.target.value)}
                      placeholder="128"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. WebApp Form */}
            {selectedType === "WebApplication" && (
              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">App Name *</label>
                  <input
                    type="text"
                    value={webAppName}
                    onChange={(e) => setWebAppName(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Application Category</label>
                  <select
                    value={webAppCategory}
                    onChange={(e) => setWebAppCategory(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                  >
                    <option value="DeveloperApplication">DeveloperApplication</option>
                    <option value="UtilitiesApplication">UtilitiesApplication</option>
                    <option value="BusinessApplication">BusinessApplication</option>
                    <option value="MultimediaApplication">MultimediaApplication</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Operating System</label>
                  <input
                    type="text"
                    value={webAppOs}
                    onChange={(e) => setWebAppOs(e.target.value)}
                    placeholder="All, Windows, macOS, Linux"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 4. FAQ Form */}
            {selectedType === "FAQPage" && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Dynamic Questions & Answers</span>
                  <button
                    onClick={handleAddFaq}
                    className="px-2.5 py-1 rounded-lg bg-accent text-accent-foreground font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Question
                  </button>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {faqs.map((faq, index) => (
                    <div key={index} className="p-3 bg-surface border border-border rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">Q#{index + 1}</span>
                        {faqs.length > 1 && (
                          <button
                            onClick={() => handleRemoveFaq(index)}
                            className="text-muted hover:text-destructive p-1"
                            title="Remove Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => handleUpdateFaq(index, "question", e.target.value)}
                        placeholder="Enter Question..."
                        className="w-full bg-surface-secondary border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none"
                      />
                      <textarea
                        value={faq.answer}
                        onChange={(e) => handleUpdateFaq(index, "answer", e.target.value)}
                        placeholder="Enter Answer..."
                        rows={2}
                        className="w-full bg-surface-secondary border border-border rounded p-2 text-foreground focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. LocalBusiness Form */}
            {selectedType === "LocalBusiness" && (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Business Name *</label>
                  <input
                    type="text"
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Telephone *</label>
                    <input
                      type="text"
                      value={bizPhone}
                      onChange={(e) => setBizPhone(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Street Address *</label>
                    <input
                      type="text"
                      value={bizStreet}
                      onChange={(e) => setBizStreet(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">City *</label>
                    <input
                      type="text"
                      value={bizCity}
                      onChange={(e) => setBizCity(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">State/Region</label>
                    <input
                      type="text"
                      value={bizRegion}
                      onChange={(e) => setBizRegion(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Postal Code</label>
                    <input
                      type="text"
                      value={bizPostal}
                      onChange={(e) => setBizPostal(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. Breadcrumbs Form */}
            {selectedType === "BreadcrumbList" && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Hierarchy Levels</span>
                  <button
                    onClick={handleAddBreadcrumb}
                    className="px-2.5 py-1 rounded-lg bg-accent text-accent-foreground font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Level
                  </button>
                </div>
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
                  {breadcrumbs.map((b, idx) => (
                    <div key={idx} className="p-3 bg-surface border border-border rounded-xl flex items-center gap-2">
                      <span className="font-bold text-muted w-6">#{idx + 1}</span>
                      <input
                        type="text"
                        value={b.name}
                        onChange={(e) => handleUpdateBreadcrumb(idx, "name", e.target.value)}
                        placeholder="Label"
                        className="w-1/3 bg-surface-secondary border border-border rounded px-2 py-1 text-foreground"
                      />
                      <input
                        type="text"
                        value={b.url}
                        onChange={(e) => handleUpdateBreadcrumb(idx, "url", e.target.value)}
                        placeholder="https://..."
                        className="flex-1 bg-surface-secondary border border-border rounded px-2 py-1 text-foreground"
                      />
                      {breadcrumbs.length > 1 && (
                        <button
                          onClick={() => handleRemoveBreadcrumb(idx)}
                          className="text-muted hover:text-destructive p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. HowTo & 8. Event fallback/simple forms */}
            {selectedType === "HowTo" && (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">How-To Title *</label>
                  <input
                    type="text"
                    value={howToName}
                    onChange={(e) => setHowToName(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Total Time</label>
                  <input
                    type="text"
                    value={howToTime}
                    onChange={(e) => setHowToTime(e.target.value)}
                    placeholder="PT2M (ISO 8601 duration)"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                  />
                </div>
              </div>
            )}

            {selectedType === "Event" && (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Event Title *</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Start Date *</label>
                    <input
                      type="text"
                      value={eventStartDate}
                      onChange={(e) => setEventStartDate(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">End Date *</label>
                    <input
                      type="text"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Code & Validation (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-secondary/50 border border-border p-3 rounded-xl">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setOutputFormat("script")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    outputFormat === "script" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  &lt;script&gt; Tag
                </button>
                <button
                  onClick={() => setOutputFormat("rawJson")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    outputFormat === "rawJson" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  Raw JSON-LD
                </button>
                <button
                  onClick={() => setOutputFormat("nextJs")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    outputFormat === "nextJs" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  Next.js App
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(outputCode)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface border border-border"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
                <a
                  href="https://search.google.com/test/rich-results"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-surface border border-border rounded-lg transition-colors"
                  title="Test in Google Rich Results"
                >
                  <span>Google Test</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Validation Feedback */}
            {validationIssues.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs text-amber-300">
                <span className="font-bold flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  Google Rich Snippets Recommendation
                </span>
                {validationIssues.map((v, idx) => (
                  <p key={idx}>• {v.message}</p>
                ))}
              </div>
            )}

            {/* Code Display Area */}
            <div className="relative rounded-2xl border border-border bg-[#0f172a] overflow-hidden shadow-inner">
              <pre className="p-5 font-mono text-xs leading-relaxed text-emerald-400/90 overflow-x-auto select-all max-h-[500px]">
                {outputCode}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Content */}
      <SEOContent tool={tool} />

      {/* Related Tools */}
      <RelatedTools slugs={tool.related} />
    </div>
  );
};

"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  DocumentType,
  TaxType,
  DiscountType,
  TemplateStyle,
  InvoiceDocument,
  InvoiceItem,
  calculateInvoiceDocument,
  formatInvoiceCurrency,
  createDefaultInvoice,
  getDocumentTypeInfo,
  SUPPORTED_CURRENCIES,
  INVOICE_PRESETS,
} from "@/tools/business/invoiceEngine";
import QRCode from "qrcode";
import {
  Printer,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  Building2,
  User,
  ShoppingBag,
  CreditCard,
  Palette,
  FileText,
  Image as ImageIcon,
  Sparkles,
  QrCode,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export interface InvoiceGeneratorViewProps {
  tool: ToolMeta;
}

const ACCENT_COLORS = [
  { name: "Indigo", value: "#4F46E5" },
  { name: "Emerald", value: "#059669" },
  { name: "Royal Blue", value: "#2563EB" },
  { name: "Crimson", value: "#DC2626" },
  { name: "Purple", value: "#7C3AED" },
  { name: "Amber", value: "#D97706" },
  { name: "Slate", value: "#334155" },
];

export const InvoiceGeneratorView: React.FC<InvoiceGeneratorViewProps> = ({ tool }) => {
  // Infer initial document type from slug
  const initialType: DocumentType = useMemo(() => {
    if (tool.slug.includes("quotation")) return "quotation";
    if (tool.slug.includes("receipt")) return "receipt";
    if (tool.slug.includes("purchase-order")) return "purchase_order";
    if (tool.slug.includes("delivery-challan")) return "delivery_challan";
    if (tool.slug.includes("proforma")) return "proforma";
    return "invoice";
  }, [tool.slug]);

  // Main Document State
  const [doc, setDoc] = useState<InvoiceDocument>(() => createDefaultInvoice(initialType));
  const [activeTab, setActiveTab] = useState<"doc" | "parties" | "items" | "payment" | "style">("items");
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Auto-save & LocalStorage recovery
  useEffect(() => {
    const saved = localStorage.getItem(`toolverse_doc_${tool.slug}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.documentNumber && Array.isArray(parsed.items)) {
          setDoc(parsed);
        }
      } catch (err) {
        console.error("Failed to restore saved invoice draft:", err);
      }
    }
  }, [tool.slug]);

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(`toolverse_doc_${tool.slug}`, JSON.stringify(doc));
      alert("Draft saved to browser storage!");
    } catch {
      alert("Could not save draft to local storage.");
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset all invoice fields to default template?")) {
      setDoc(createDefaultInvoice(initialType));
      localStorage.removeItem(`toolverse_doc_${tool.slug}`);
    }
  };

  // Generate real QR code when paymentLink or UPI or account changes
  useEffect(() => {
    if (!doc.paymentDetails.qrCodeEnabled) {
      setQrCodeUrl("");
      return;
    }

    const qrText =
      doc.paymentDetails.paymentLink ||
      (doc.paymentDetails.upiId
        ? `upi://pay?pa=${encodeURIComponent(doc.paymentDetails.upiId)}&pn=${encodeURIComponent(
            doc.sender.name || "Vendor"
          )}&cu=${doc.currency}`
        : doc.paymentDetails.accountNumber
        ? `Bank: ${doc.paymentDetails.bankName || ""}, A/C: ${doc.paymentDetails.accountNumber}`
        : "");

    if (!qrText) {
      setQrCodeUrl("");
      return;
    }

    QRCode.toDataURL(qrText, {
      width: 140,
      margin: 1,
      color: {
        dark: doc.accentColor || "#000000",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("Error generating QR:", err));
  }, [
    doc.paymentDetails.qrCodeEnabled,
    doc.paymentDetails.paymentLink,
    doc.paymentDetails.upiId,
    doc.paymentDetails.accountNumber,
    doc.paymentDetails.bankName,
    doc.sender.name,
    doc.currency,
    doc.accentColor,
  ]);

  // Live Calculations
  const calc = useMemo(() => calculateInvoiceDocument(doc), [doc]);
  const typeInfo = useMemo(() => getDocumentTypeInfo(doc.documentType), [doc.documentType]);

  // Item management
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: "",
      details: "",
      hsnSac: "",
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      amount: 0,
    };
    setDoc((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleRemoveItem = (id: string) => {
    if (doc.items.length <= 1) {
      alert("An invoice must contain at least one line item.");
      return;
    }
    setDoc((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const handleDuplicateItem = (item: InvoiceItem) => {
    const duplicated: InvoiceItem = {
      ...item,
      id: `item-${Date.now()}`,
      description: `${item.description} (Copy)`,
    };
    setDoc((prev) => ({
      ...prev,
      items: [...prev.items, duplicated],
    }));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setDoc((prev) => ({
      ...prev,
      items: prev.items.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        const q = Number(field === "quantity" ? value : it.quantity) || 0;
        const p = Number(field === "unitPrice" ? value : it.unitPrice) || 0;
        const d = Number(field === "discountPercent" ? value : it.discountPercent) || 0;
        const raw = q * p;
        updated.amount = d > 0 ? raw - (raw * d) / 100 : raw;
        return updated;
      }),
    }));
  };

  // Logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Logo image size should be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDoc((prev) => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // JSON Import & Export
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.documentNumber || "invoice"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed && parsed.documentNumber && Array.isArray(parsed.items)) {
          setDoc(parsed);
          alert("Invoice imported successfully!");
        } else {
          alert("Invalid invoice JSON structure.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // Copy Summary
  const handleCopySummary = () => {
    const text = `${typeInfo.title}\nNumber: ${doc.documentNumber}\nDate: ${doc.documentDate}\nClient: ${doc.client.name}\nTotal: ${formatInvoiceCurrency(calc.grandTotal, doc.currency)}\nTotal in Words: ${calc.totalInWords}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Native Print / Save as PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Print CSS Stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-document,
          #invoice-document * {
            visibility: visible;
          }
          #invoice-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          @page {
            margin: 10mm;
            size: A4 portrait;
          }
        }
      `}</style>

      <ToolHeader tool={tool} />

      {/* Studio Top Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-border p-4 rounded-xl shadow-sm">
        {/* Document Type Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-text-secondary">Doc Type:</span>
          {(
            [
              { type: "invoice", label: "Invoice" },
              { type: "quotation", label: "Quotation" },
              { type: "receipt", label: "Receipt" },
              { type: "proforma", label: "Proforma" },
              { type: "purchase_order", label: "Purchase Order" },
              { type: "delivery_challan", label: "Challan" },
            ] as const
          ).map((item) => {
            const isSelected = doc.documentType === item.type;
            return (
              <button
                key={item.type}
                onClick={() => {
                  const info = getDocumentTypeInfo(item.type);
                  setDoc((prev) => ({
                    ...prev,
                    documentType: item.type,
                    documentNumber: prev.documentNumber.includes("-")
                      ? `${info.prefix}${prev.documentNumber.split("-").slice(1).join("-")}`
                      : `${info.prefix}001`,
                  }));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-white shadow"
                    : "bg-surface-raised text-text-secondary hover:text-text-primary hover:bg-surface-border"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Currency & Accent Color */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-secondary">Currency:</span>
            <select
              value={doc.currency}
              onChange={(e) => setDoc((prev) => ({ ...prev, currency: e.target.value }))}
              className="bg-surface-raised border border-border rounded-lg px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} ({curr.symbol}) - {curr.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setDoc((prev) => ({ ...prev, accentColor: color.value }))}
                title={color.name}
                className={`w-5 h-5 rounded-full border transition-all ${
                  doc.accentColor === color.value ? "ring-2 ring-white ring-offset-2 scale-110" : "opacity-75 hover:opacity-100"
                }`}
                style={{ backgroundColor: color.value, borderColor: "rgba(255,255,255,0.2)" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Left Form, Right Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Editor Tabs */}
        <div className="xl:col-span-6 flex flex-col gap-4 bg-surface border border-border rounded-xl p-5 shadow-card">
          {/* Tabs Navigation */}
          <div className="flex items-center border-b border-border pb-2 gap-1 overflow-x-auto text-xs font-semibold">
            {[
              { id: "items", label: "Line Items", icon: ShoppingBag, count: doc.items.length },
              { id: "parties", label: "Parties & Client", icon: Building2 },
              { id: "doc", label: "Dates & Terms", icon: FileText },
              { id: "payment", label: "Bank & QR", icon: CreditCard },
              { id: "style", label: "Branding & Presets", icon: Palette },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-surface-raised border border-border text-[10px]">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: LINE ITEMS & CHARGES */}
          {activeTab === "items" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Line Items Table</span>
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Line Item
                </button>
              </div>

              {/* Items List */}
              <div className="flex flex-col gap-3">
                {doc.items.map((item, idx) => (
                  <div key={item.id} className="p-3 bg-surface-raised border border-border rounded-xl flex flex-col gap-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-text-secondary text-[11px]">#{idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDuplicateItem(item)}
                          className="px-2 py-0.5 text-[11px] text-text-secondary hover:text-text-primary rounded bg-surface hover:bg-border"
                          title="Duplicate Item"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-red-400 hover:text-red-500 rounded hover:bg-red-500/10"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-8">
                        <label className="text-[10px] text-text-muted mb-0.5 block">Item / Service Description *</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                          placeholder="e.g. Website UI Redesign & Prototyping"
                          className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="text-[10px] text-text-muted mb-0.5 block">HSN / SAC Code</label>
                        <input
                          type="text"
                          value={item.hsnSac || ""}
                          onChange={(e) => handleItemChange(item.id, "hsnSac", e.target.value)}
                          placeholder="e.g. 998314"
                          className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-3">
                        <label className="text-[10px] text-text-muted mb-0.5 block">Qty / Hours</label>
                        <input
                          type="number"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                          className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="text-[10px] text-text-muted mb-0.5 block">Unit Price ({calc.currencyConfig.symbol})</label>
                        <input
                          type="number"
                          step="any"
                          value={item.unitPrice === 0 ? "" : item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, "unitPrice", e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary text-right focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-text-muted mb-0.5 block">Disc %</label>
                        <input
                          type="number"
                          step="any"
                          value={item.discountPercent || ""}
                          onChange={(e) => handleItemChange(item.id, "discountPercent", Number(e.target.value))}
                          placeholder="0"
                          className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        />
                      </div>
                      <div className="col-span-3 flex flex-col justify-end">
                        <label className="text-[10px] text-text-muted mb-0.5 block text-right">Line Total</label>
                        <div className="bg-surface/50 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs text-right font-mono font-bold text-text-primary">
                          {formatInvoiceCurrency(item.amount, doc.currency)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Taxes, Discounts & Surcharges Panel */}
              <div className="p-4 bg-surface-raised border border-border rounded-xl flex flex-col gap-3">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Taxes & Adjustments</span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Tax System</label>
                    <select
                      value={doc.taxType}
                      onChange={(e) => setDoc((prev) => ({ ...prev, taxType: e.target.value as TaxType }))}
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="none">No Tax / Tax Exempt</option>
                      <option value="gst_intra">India GST: Intra-State (CGST + SGST)</option>
                      <option value="gst_inter">India GST: Inter-State (IGST)</option>
                      <option value="vat">VAT (Value Added Tax)</option>
                      <option value="sales_tax">Sales Tax</option>
                      <option value="flat">Custom Flat %</option>
                    </select>
                  </div>

                  {doc.taxType !== "none" && (
                    <div>
                      <label className="text-xs text-text-secondary mb-1 block">Tax Rate (%)</label>
                      <input
                        type="number"
                        step="any"
                        value={doc.taxRate}
                        onChange={(e) => setDoc((prev) => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Invoice Discount</label>
                    <div className="flex gap-1">
                      <select
                        value={doc.discountType}
                        onChange={(e) => setDoc((prev) => ({ ...prev, discountType: e.target.value as DiscountType }))}
                        className="bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary"
                      >
                        <option value="percentage">%</option>
                        <option value="fixed">{calc.currencyConfig.symbol}</option>
                      </select>
                      <input
                        type="number"
                        step="any"
                        value={doc.discountValue === 0 ? "" : doc.discountValue}
                        onChange={(e) => setDoc((prev) => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                        className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Shipping ({calc.currencyConfig.symbol})</label>
                    <input
                      type="number"
                      step="any"
                      value={doc.shippingCharge === 0 ? "" : doc.shippingCharge}
                      onChange={(e) => setDoc((prev) => ({ ...prev, shippingCharge: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Packaging ({calc.currencyConfig.symbol})</label>
                    <input
                      type="number"
                      step="any"
                      value={doc.packagingCharge === 0 ? "" : doc.packagingCharge}
                      onChange={(e) => setDoc((prev) => ({ ...prev, packagingCharge: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                  <input
                    type="checkbox"
                    id="roundOff"
                    checked={doc.enableRoundOff}
                    onChange={(e) => setDoc((prev) => ({ ...prev, enableRoundOff: e.target.checked }))}
                    className="rounded text-primary focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="roundOff" className="text-xs text-text-secondary cursor-pointer select-none">
                    Auto Round-Off Grand Total (to nearest whole integer)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PARTIES & CLIENT */}
          {activeTab === "parties" && (
            <div className="flex flex-col gap-5">
              {/* Sender Details */}
              <div className="flex flex-col gap-3 p-4 bg-surface-raised border border-border rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-text-primary border-b border-border pb-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>Your Business Information (Sender)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Business Name *</label>
                    <input
                      type="text"
                      value={doc.sender.name}
                      onChange={(e) => setDoc((prev) => ({ ...prev, sender: { ...prev.sender, name: e.target.value } }))}
                      placeholder="Company Name"
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Tax ID / GSTIN / VAT</label>
                    <input
                      type="text"
                      value={doc.sender.taxId || ""}
                      onChange={(e) => setDoc((prev) => ({ ...prev, sender: { ...prev.sender, taxId: e.target.value } }))}
                      placeholder="e.g. 29AAAAA0000A1Z5"
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Email Address</label>
                    <input
                      type="email"
                      value={doc.sender.email || ""}
                      onChange={(e) => setDoc((prev) => ({ ...prev, sender: { ...prev.sender, email: e.target.value } }))}
                      placeholder="billing@company.com"
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Phone Number</label>
                    <input
                      type="text"
                      value={doc.sender.phone || ""}
                      onChange={(e) => setDoc((prev) => ({ ...prev, sender: { ...prev.sender, phone: e.target.value } }))}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Address</label>
                  <input
                    type="text"
                    value={doc.sender.address || ""}
                    onChange={(e) => setDoc((prev) => ({ ...prev, sender: { ...prev.sender, address: e.target.value } }))}
                    placeholder="Street address, Suite / Floor"
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={doc.sender.city || ""}
                    onChange={(e) => setDoc((prev) => ({ ...prev, sender: { ...prev.sender, city: e.target.value } }))}
                    placeholder="City"
                    className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                  />
                  <input
                    type="text"
                    value={doc.sender.state || ""}
                    onChange={(e) => setDoc((prev) => ({ ...prev, sender: { ...prev.sender, state: e.target.value } }))}
                    placeholder="State / Region"
                    className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                  />
                  <input
                    type="text"
                    value={doc.sender.country || ""}
                    onChange={(e) => setDoc((prev) => ({ ...prev, sender: { ...prev.sender, country: e.target.value } }))}
                    placeholder="Country"
                    className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                  />
                </div>
              </div>

              {/* Client Details */}
              <div className="flex flex-col gap-3 p-4 bg-surface-raised border border-border rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-text-primary border-b border-border pb-2">
                  <User className="w-4 h-4 text-emerald-500" />
                  <span>Bill To (Client / Buyer)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Client Company / Name *</label>
                    <input
                      type="text"
                      value={doc.client.name}
                      onChange={(e) => setDoc((prev) => ({ ...prev, client: { ...prev.client, name: e.target.value } }))}
                      placeholder="Client Name"
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Client Tax ID / GSTIN</label>
                    <input
                      type="text"
                      value={doc.client.taxId || ""}
                      onChange={(e) => setDoc((prev) => ({ ...prev, client: { ...prev.client, taxId: e.target.value } }))}
                      placeholder="Optional"
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Contact Person</label>
                    <input
                      type="text"
                      value={doc.client.contactPerson || ""}
                      onChange={(e) => setDoc((prev) => ({ ...prev, client: { ...prev.client, contactPerson: e.target.value } }))}
                      placeholder="e.g. John Doe"
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Client Email</label>
                    <input
                      type="email"
                      value={doc.client.email || ""}
                      onChange={(e) => setDoc((prev) => ({ ...prev, client: { ...prev.client, email: e.target.value } }))}
                      placeholder="client@domain.com"
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Billing Address</label>
                  <input
                    type="text"
                    value={doc.client.address || ""}
                    onChange={(e) => setDoc((prev) => ({ ...prev, client: { ...prev.client, address: e.target.value } }))}
                    placeholder="Street, City, Postal Code"
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DATES & TERMS */}
          {activeTab === "doc" && (
            <div className="flex flex-col gap-4 p-4 bg-surface-raised border border-border rounded-xl">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Document Metadata</span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Document Number *</label>
                  <input
                    type="text"
                    value={doc.documentNumber}
                    onChange={(e) => setDoc((prev) => ({ ...prev, documentNumber: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">PO / Reference #</label>
                  <input
                    type="text"
                    value={doc.poNumber || ""}
                    onChange={(e) => setDoc((prev) => ({ ...prev, poNumber: e.target.value }))}
                    placeholder="e.g. PO-8921"
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Issue Date</label>
                  <input
                    type="date"
                    value={doc.documentDate}
                    onChange={(e) => setDoc((prev) => ({ ...prev, documentDate: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Due Date</label>
                  <input
                    type="date"
                    value={doc.dueDate}
                    onChange={(e) => setDoc((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1 block">Payment Terms</label>
                <select
                  value={doc.paymentTerms}
                  onChange={(e) => setDoc((prev) => ({ ...prev, paymentTerms: e.target.value }))}
                  className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 7">Net 7 Days</option>
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 45">Net 45 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                  <option value="Paid in Full">Paid in Full</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                <label className="text-xs text-text-secondary">Notes & Client Message</label>
                <textarea
                  rows={2}
                  value={doc.notes || ""}
                  onChange={(e) => setDoc((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Thank you for your business!"
                  className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-text-primary"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-text-secondary">Terms & Conditions</label>
                <textarea
                  rows={3}
                  value={doc.termsAndConditions || ""}
                  onChange={(e) => setDoc((prev) => ({ ...prev, termsAndConditions: e.target.value }))}
                  placeholder="1. Payment terms..."
                  className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-text-primary"
                />
              </div>
            </div>
          )}

          {/* TAB 4: BANK & PAYMENT */}
          {activeTab === "payment" && (
            <div className="flex flex-col gap-4 p-4 bg-surface-raised border border-border rounded-xl">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Settlement & Bank Details</span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Bank Name</label>
                  <input
                    type="text"
                    value={doc.paymentDetails.bankName || ""}
                    onChange={(e) =>
                      setDoc((prev) => ({
                        ...prev,
                        paymentDetails: { ...prev.paymentDetails, bankName: e.target.value },
                      }))
                    }
                    placeholder="e.g. JPMorgan Chase / HDFC Bank"
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Account Name</label>
                  <input
                    type="text"
                    value={doc.paymentDetails.accountName || ""}
                    onChange={(e) =>
                      setDoc((prev) => ({
                        ...prev,
                        paymentDetails: { ...prev.paymentDetails, accountName: e.target.value },
                      }))
                    }
                    placeholder="Account Holder Name"
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Account / IBAN Number</label>
                  <input
                    type="text"
                    value={doc.paymentDetails.accountNumber || ""}
                    onChange={(e) =>
                      setDoc((prev) => ({
                        ...prev,
                        paymentDetails: { ...prev.paymentDetails, accountNumber: e.target.value },
                      }))
                    }
                    placeholder="Account / IBAN Number"
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">IFSC / SWIFT / Routing Code</label>
                  <input
                    type="text"
                    value={doc.paymentDetails.ifscOrSwift || ""}
                    onChange={(e) =>
                      setDoc((prev) => ({
                        ...prev,
                        paymentDetails: { ...prev.paymentDetails, ifscOrSwift: e.target.value },
                      }))
                    }
                    placeholder="e.g. CHASUS33 / HDFC0000123"
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">UPI ID (For India / Instant Pay)</label>
                  <input
                    type="text"
                    value={doc.paymentDetails.upiId || ""}
                    onChange={(e) =>
                      setDoc((prev) => ({
                        ...prev,
                        paymentDetails: { ...prev.paymentDetails, upiId: e.target.value },
                      }))
                    }
                    placeholder="company@bank"
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Online Payment Link</label>
                  <input
                    type="url"
                    value={doc.paymentDetails.paymentLink || ""}
                    onChange={(e) =>
                      setDoc((prev) => ({
                        ...prev,
                        paymentDetails: { ...prev.paymentDetails, paymentLink: e.target.value },
                      }))
                    }
                    placeholder="https://pay.stripe.com/..."
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <input
                  type="checkbox"
                  id="qrToggle"
                  checked={doc.paymentDetails.qrCodeEnabled ?? true}
                  onChange={(e) =>
                    setDoc((prev) => ({
                      ...prev,
                      paymentDetails: { ...prev.paymentDetails, qrCodeEnabled: e.target.checked },
                    }))
                  }
                  className="rounded text-primary focus:ring-0 cursor-pointer"
                />
                <label htmlFor="qrToggle" className="text-xs text-text-secondary cursor-pointer select-none">
                  Display scannable Payment QR Code on invoice
                </label>
              </div>

              {/* Signatory Block */}
              <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
                <span className="text-xs font-semibold text-text-primary">Authorized Signatory</span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={doc.signatoryName || ""}
                    onChange={(e) => setDoc((prev) => ({ ...prev, signatoryName: e.target.value }))}
                    placeholder="Signatory Name"
                    className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                  />
                  <input
                    type="text"
                    value={doc.signatoryTitle || ""}
                    onChange={(e) => setDoc((prev) => ({ ...prev, signatoryTitle: e.target.value }))}
                    placeholder="Signatory Designation"
                    className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BRANDING & PRESETS */}
          {activeTab === "style" && (
            <div className="flex flex-col gap-5">
              {/* Logo Upload Card */}
              <div className="flex flex-col gap-3 p-4 bg-surface-raised border border-border rounded-xl">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Business Logo</span>
                <div className="flex items-center gap-4">
                  {doc.logoUrl ? (
                    <div className="relative border border-border p-2 rounded-lg bg-white">
                      <img src={doc.logoUrl} alt="Logo Preview" className="h-12 max-w-[120px] object-contain" />
                    </div>
                  ) : (
                    <div className="w-16 h-12 rounded-lg border border-dashed border-border flex items-center justify-center text-text-muted">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-surface border border-border hover:bg-surface-border rounded-lg text-xs font-medium text-text-primary"
                      >
                        {doc.logoUrl ? "Change Logo" : "Upload Logo"}
                      </button>
                      {doc.logoUrl && (
                        <button
                          onClick={() => setDoc((prev) => ({ ...prev, logoUrl: undefined }))}
                          className="px-2.5 py-1.5 text-xs text-red-400 hover:text-red-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <span className="text-[11px] text-text-muted">Supports PNG, JPG, SVG up to 2MB.</span>
                  </div>
                </div>
              </div>

              {/* Curated Presets */}
              <div className="flex flex-col gap-3 p-4 bg-surface-raised border border-border rounded-xl">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Load Production Presets</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INVOICE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setDoc(preset.document);
                      }}
                      className="text-left p-3 rounded-xl border border-border bg-surface hover:border-primary/50 transition-all flex flex-col gap-1 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                          {preset.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-raised border border-border text-text-secondary font-mono">
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted line-clamp-2">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Backup & Storage Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface-raised border border-border rounded-xl">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveDraft}
                    className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary-hover font-medium"
                  >
                    Save Draft Locally
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary bg-surface border border-border rounded-lg"
                  >
                    Reset Defaults
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={jsonInputRef}
                    onChange={handleImportJSON}
                    accept="application/json"
                    className="hidden"
                  />
                  <button
                    onClick={() => jsonInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-surface border border-border hover:bg-surface-border rounded-lg text-text-secondary"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import JSON
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-surface border border-border hover:bg-surface-border rounded-lg text-text-secondary"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export JSON
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live A4 Document Preview */}
        <div className="xl:col-span-6 flex flex-col gap-4 sticky top-20">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between gap-2 bg-surface border border-border p-3 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Live Document Preview</span>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: doc.accentColor }}
              >
                {typeInfo.badge}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-raised border border-border hover:bg-surface-border text-text-secondary transition-all"
                title="Copy Summary"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSummary ? "Copied" : "Copy Summary"}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white rounded-lg transition-all shadow-md hover:brightness-110"
                style={{ backgroundColor: doc.accentColor }}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          {/* DOCUMENT PAPER CANVAS */}
          <div
            id="invoice-document"
            className="bg-white text-slate-900 rounded-xl p-8 shadow-2xl border border-slate-200 font-sans text-xs flex flex-col gap-6"
            style={{ minHeight: "842px" }}
          >
            {/* Document Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div className="flex flex-col gap-2 max-w-[60%]">
                {doc.logoUrl ? (
                  <img
                    src={doc.logoUrl}
                    alt="Company Logo"
                    className="max-h-14 max-w-[180px] object-contain object-left mb-1"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-lg mb-1"
                    style={{ backgroundColor: doc.accentColor }}
                  >
                    {doc.sender.name ? doc.sender.name.charAt(0).toUpperCase() : "B"}
                  </div>
                )}
                <h2 className="text-xl font-black text-slate-900 leading-tight">
                  {doc.sender.name || "Your Company Name"}
                </h2>
                <div className="text-slate-500 text-[11px] leading-relaxed">
                  {doc.sender.address && <p>{doc.sender.address}</p>}
                  {(doc.sender.city || doc.sender.state || doc.sender.country) && (
                    <p>
                      {[doc.sender.city, doc.sender.state, doc.sender.postalCode, doc.sender.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                  {doc.sender.email && <p>Email: {doc.sender.email}</p>}
                  {doc.sender.phone && <p>Phone: {doc.sender.phone}</p>}
                  {doc.sender.taxId && <p className="font-semibold text-slate-700">Tax ID / GSTIN: {doc.sender.taxId}</p>}
                </div>
              </div>

              {/* Document Title & Number Badge */}
              <div className="flex flex-col items-end text-right">
                <span className="text-2xl font-black tracking-tight" style={{ color: doc.accentColor }}>
                  {typeInfo.title}
                </span>
                <span className="font-mono text-slate-800 font-bold text-sm mt-1">{doc.documentNumber}</span>

                <div className="mt-3 flex flex-col items-end gap-1 text-[11px] text-slate-600">
                  <div className="flex gap-2">
                    <span className="text-slate-400">Date:</span>
                    <span className="font-semibold">{doc.documentDate || "—"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400">Due Date:</span>
                    <span className="font-semibold">{doc.dueDate || "—"}</span>
                  </div>
                  {doc.paymentTerms && (
                    <div className="flex gap-2">
                      <span className="text-slate-400">Terms:</span>
                      <span className="font-semibold">{doc.paymentTerms}</span>
                    </div>
                  )}
                  {doc.poNumber && (
                    <div className="flex gap-2">
                      <span className="text-slate-400">PO Ref:</span>
                      <span className="font-semibold font-mono">{doc.poNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Billed To / Client Section */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">
                  BILLED TO
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{doc.client.name || "Client / Company Name"}</h3>
                {doc.client.contactPerson && <p className="text-slate-600 font-medium">{doc.client.contactPerson}</p>}
                {doc.client.address && <p className="text-slate-500 text-[11px] mt-0.5">{doc.client.address}</p>}
                {doc.client.email && <p className="text-slate-500 text-[11px]">Email: {doc.client.email}</p>}
                {doc.client.taxId && <p className="text-slate-700 font-mono text-[11px] mt-1">Tax ID: {doc.client.taxId}</p>}
              </div>

              {/* Payment Summary Box */}
              <div className="flex flex-col justify-between items-end border-l border-slate-200 pl-4 text-right">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">TOTAL AMOUNT DUE</span>
                <div className="text-2xl font-black font-mono mt-1" style={{ color: doc.accentColor }}>
                  {formatInvoiceCurrency(calc.grandTotal, doc.currency)}
                </div>
                <span className="text-[11px] text-slate-500">
                  Payment Due: {doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : "Upon Receipt"}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className="text-white text-[11px] font-bold uppercase"
                    style={{ backgroundColor: doc.accentColor }}
                  >
                    <th className="py-2.5 px-3 rounded-l-lg">Description</th>
                    <th className="py-2.5 px-2 text-center">HSN/SAC</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {doc.items.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <span className="font-semibold block text-slate-900">{it.description || "Line item"}</span>
                        {it.details && <span className="text-[11px] text-slate-500 block mt-0.5">{it.details}</span>}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-slate-500 text-[11px]">{it.hsnSac || "—"}</td>
                      <td className="py-3 px-2 text-center font-mono font-medium">{it.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono">{formatInvoiceCurrency(it.unitPrice, doc.currency)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatInvoiceCurrency(it.amount, doc.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Summary Section */}
            <div className="grid grid-cols-12 gap-6 pt-2 border-t border-slate-200">
              {/* Left Note & Bank Details */}
              <div className="col-span-7 flex flex-col gap-4">
                {/* Total in Words */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AMOUNT IN WORDS</span>
                  <p className="text-slate-800 font-semibold text-[11px] mt-0.5 italic">{calc.totalInWords}</p>
                </div>

                {/* Bank / QR Code Card */}
                {(doc.paymentDetails.bankName || doc.paymentDetails.accountNumber || doc.paymentDetails.upiId) && (
                  <div className="flex gap-4 p-3 rounded-lg border border-slate-200 bg-slate-50/80 items-center">
                    {qrCodeUrl && doc.paymentDetails.qrCodeEnabled && (
                      <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
                        <img src={qrCodeUrl} alt="Payment QR Code" className="w-20 h-20" />
                        <span className="block text-[8px] text-center font-bold text-slate-400 mt-0.5">SCAN TO PAY</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5 text-[11px] text-slate-600">
                      <span className="font-bold text-slate-900 text-xs">Bank / Payment Details:</span>
                      {doc.paymentDetails.bankName && <p>Bank: {doc.paymentDetails.bankName}</p>}
                      {doc.paymentDetails.accountName && <p>A/C Name: {doc.paymentDetails.accountName}</p>}
                      {doc.paymentDetails.accountNumber && (
                        <p className="font-mono font-semibold text-slate-900">
                          A/C No: {doc.paymentDetails.accountNumber}
                        </p>
                      )}
                      {doc.paymentDetails.ifscOrSwift && (
                        <p className="font-mono text-slate-700">IFSC/SWIFT: {doc.paymentDetails.ifscOrSwift}</p>
                      )}
                      {doc.paymentDetails.upiId && (
                        <p className="font-mono font-semibold text-indigo-700">UPI ID: {doc.paymentDetails.upiId}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Math Breakdown */}
              <div className="col-span-5 flex flex-col gap-2 text-slate-700 font-medium">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatInvoiceCurrency(calc.subtotal, doc.currency)}</span>
                </div>

                {calc.invoiceDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount {doc.discountType === "percentage" ? `(${doc.discountValue}%)` : ""}:</span>
                    <span className="font-mono">-{formatInvoiceCurrency(calc.invoiceDiscountAmount, doc.currency)}</span>
                  </div>
                )}

                {/* Tax Breakdown */}
                {calc.taxBreakdown.cgstAmount > 0 && (
                  <>
                    <div className="flex justify-between text-slate-500">
                      <span>CGST ({calc.taxBreakdown.cgstRate}%):</span>
                      <span className="font-mono">{formatInvoiceCurrency(calc.taxBreakdown.cgstAmount, doc.currency)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>SGST ({calc.taxBreakdown.sgstRate}%):</span>
                      <span className="font-mono">{formatInvoiceCurrency(calc.taxBreakdown.sgstAmount, doc.currency)}</span>
                    </div>
                  </>
                )}

                {calc.taxBreakdown.cgstAmount === 0 && calc.taxBreakdown.totalTax > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>{calc.taxBreakdown.summaryLabel}:</span>
                    <span className="font-mono">{formatInvoiceCurrency(calc.taxBreakdown.totalTax, doc.currency)}</span>
                  </div>
                )}

                {calc.shippingCharge > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Shipping & Handling:</span>
                    <span className="font-mono">{formatInvoiceCurrency(calc.shippingCharge, doc.currency)}</span>
                  </div>
                )}

                {calc.packagingCharge > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Packaging:</span>
                    <span className="font-mono">{formatInvoiceCurrency(calc.packagingCharge, doc.currency)}</span>
                  </div>
                )}

                {doc.enableRoundOff && calc.roundOffAdjustment !== 0 && (
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Round-Off:</span>
                    <span className="font-mono">{formatInvoiceCurrency(calc.roundOffAdjustment, doc.currency)}</span>
                  </div>
                )}

                {/* Grand Total */}
                <div
                  className="flex justify-between items-center text-sm font-black border-t-2 border-slate-900 pt-2.5 mt-1"
                  style={{ color: doc.accentColor }}
                >
                  <span className="text-slate-900">Total:</span>
                  <span className="text-xl font-mono">{formatInvoiceCurrency(calc.grandTotal, doc.currency)}</span>
                </div>
              </div>
            </div>

            {/* Notes & Terms Footer */}
            {(doc.notes || doc.termsAndConditions) && (
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2 text-[11px] text-slate-500">
                {doc.notes && (
                  <div>
                    <span className="font-bold text-slate-700 block">Note:</span>
                    <p className="whitespace-pre-line">{doc.notes}</p>
                  </div>
                )}
                {doc.termsAndConditions && (
                  <div>
                    <span className="font-bold text-slate-700 block">Terms & Conditions:</span>
                    <p className="whitespace-pre-line text-[10px] leading-relaxed">{doc.termsAndConditions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Authorized Signatory Footer */}
            {doc.signatoryName && (
              <div className="flex justify-end pt-6">
                <div className="flex flex-col items-center text-center w-52">
                  <div className="h-10 border-b border-slate-300 w-full mb-1 flex items-end justify-center">
                    <span className="text-xs font-serif italic text-slate-600">{doc.signatoryName}</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs">{doc.signatoryName}</span>
                  <span className="text-[10px] text-slate-400">{doc.signatoryTitle || "Authorized Signatory"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};

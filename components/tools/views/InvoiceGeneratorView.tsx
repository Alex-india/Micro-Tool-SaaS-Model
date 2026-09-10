"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { calculateInvoice, InvoiceItem } from "@/tools/business/invoice";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Download, Printer } from "lucide-react";

export interface InvoiceGeneratorViewProps {
  tool: ToolMeta;
}

export const InvoiceGeneratorView: React.FC<InvoiceGeneratorViewProps> = ({ tool }) => {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [senderName, setSenderName] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [senderGst, setSenderGst] = useState("");

  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, amount: 0 },
  ]);

  const [gstRate, setGstRate] = useState<string>("18");
  const [discountAmount, setDiscountAmount] = useState<string>("");

  const calc = useMemo(() => {
    return calculateInvoice({
      invoiceNumber,
      invoiceDate,
      dueDate,
      currency: "INR",
      senderName,
      senderEmail: "",
      senderAddress,
      senderGst,
      clientName,
      clientEmail: "",
      clientAddress,
      items,
      gstRate: parseFloat(gstRate) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
    });
  }, [invoiceNumber, invoiceDate, dueDate, senderName, senderAddress, senderGst, clientName, clientAddress, items, gstRate, discountAmount]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0, amount: 0 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, val: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: val };
          if (field === "quantity" || field === "unitPrice") {
            updated.amount = (updated.quantity || 0) * (updated.unitPrice || 0);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column Form Inputs */}
        <div className="lg:col-span-6 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          <h3 className="text-sm font-bold text-text-primary border-b border-border pb-2">Invoice Information</h3>

          <div className="grid grid-cols-3 gap-3">
            <Input label="Invoice #" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="e.g. INV-2025-001" />
            <Input label="Date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-text-primary">Your Business (Sender)</span>
              <Input label="Company Name" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Your Company / Freelancer Name" />
              <Input label="Address" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} placeholder="Address, City, Country" />
              <Input label="GSTIN / Tax ID" value={senderGst} onChange={(e) => setSenderGst(e.target.value)} placeholder="GSTIN or Tax ID (Optional)" />
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-text-primary">Bill To (Client)</span>
              <Input label="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client / Company Name" />
              <Input label="Client Address" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Client Address, City, Country" />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary">Line Items</span>
              <Button variant="ghost" size="sm" onClick={handleAddItem} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Item
              </Button>
            </div>

            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-surface-raised p-2 rounded-lg border border-border text-xs">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                  placeholder="Item description"
                  className="col-span-5 bg-surface border border-border rounded px-2 py-1.5 text-text-primary"
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, "quantity", Number(e.target.value))}
                  placeholder="Qty"
                  className="col-span-2 bg-surface border border-border rounded px-2 py-1.5 text-text-primary text-center"
                />
                <input
                  type="number"
                  value={item.unitPrice === 0 ? "" : item.unitPrice}
                  onChange={(e) => handleItemChange(item.id, "unitPrice", Number(e.target.value))}
                  placeholder="Rate (₹)"
                  className="col-span-3 bg-surface border border-border rounded px-2 py-1.5 text-text-primary text-right"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="col-span-2 text-red-400 hover:text-red-500 p-1 flex justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="GST Tax Rate (%)" type="number" step="any" value={gstRate} placeholder="18" onChange={(e) => setGstRate(e.target.value)} suffixSymbol="%" />
            <Input label="Discount (₹)" type="number" step="any" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} prefixSymbol="₹" placeholder="0" />
          </div>
        </div>

        {/* Right Column Live Preview Panel */}
        <div className="lg:col-span-6 flex flex-col gap-4 sticky top-20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary">Live PDF Preview</span>
            <Button variant="primary" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-3.5 h-3.5" />}>
              Print / Save PDF
            </Button>
          </div>

          <div className="bg-white text-slate-900 rounded-xl p-8 shadow-2xl border border-slate-200 font-sans text-xs flex flex-col gap-6">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{senderName || "Your Business Name"}</h2>
                <p className="text-slate-500 mt-1">{senderAddress}</p>
                {senderGst && <p className="text-slate-500 font-mono">GSTIN: {senderGst}</p>}
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-indigo-600 tracking-tight">INVOICE</span>
                <p className="font-mono text-slate-600 mt-1">{invoiceNumber}</p>
                <p className="text-slate-500">Date: {invoiceDate}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-700 block mb-1">BILLED TO:</span>
              <p className="font-semibold text-slate-900">{clientName || "Client Name"}</p>
              <p className="text-slate-500">{clientAddress}</p>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Rate</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-medium">{it.description}</td>
                    <td className="py-2.5 text-center font-mono">{it.quantity}</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                    <td className="py-2.5 text-right font-mono font-semibold">{formatCurrency(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col gap-1 items-end pt-4 border-t border-slate-200 text-slate-700">
              <div className="flex justify-between w-48 text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(calc.subtotal)}</span>
              </div>
              {calc.discountAmount > 0 && (
                <div className="flex justify-between w-48 text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatCurrency(calc.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between w-48 text-slate-500">
                <span>GST ({gstRate}%):</span>
                <span className="font-mono">{formatCurrency(calc.taxAmount)}</span>
              </div>
              <div className="flex justify-between w-48 text-base font-bold text-indigo-600 border-t border-slate-300 pt-2 mt-1">
                <span>Total Due:</span>
                <span className="font-mono">{formatCurrency(calc.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};

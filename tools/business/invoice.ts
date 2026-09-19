// ============================================================================
// ToolVerse Business Suite: Invoice & Document Engine
// Re-exports and backwards compatibility wrapper
// ============================================================================

export * from "./invoiceEngine";
export type { InvoiceItem, InvoiceDocument } from "./invoiceEngine";

import type { InvoiceItem, InvoiceDocument } from "./invoiceEngine";
import {
  calculateInvoiceDocument,
  createDefaultInvoice,
} from "./invoiceEngine";

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;

  senderName: string;
  senderEmail: string;
  senderAddress: string;
  senderGst?: string;

  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientGst?: string;

  items: InvoiceItem[];
  gstRate: number; // percentage
  discountAmount: number;
  notes?: string;
  paymentTerms?: string;
}

export interface LegacyInvoiceCalculation {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

export function calculateInvoice(data: InvoiceData): LegacyInvoiceCalculation {
  const doc: InvoiceDocument = {
    ...createDefaultInvoice("invoice"),
    documentNumber: data.invoiceNumber || "INV-001",
    documentDate: data.invoiceDate || "",
    dueDate: data.dueDate || "",
    currency: data.currency || "USD",
    sender: {
      name: data.senderName,
      email: data.senderEmail,
      address: data.senderAddress,
      taxId: data.senderGst,
    },
    client: {
      name: data.clientName,
      email: data.clientEmail,
      address: data.clientAddress,
      taxId: data.clientGst,
    },
    items: data.items.map((it) => ({
      ...it,
      amount: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    })),
    taxType: (data.gstRate || 0) > 0 ? "flat" : "none",
    taxRate: data.gstRate || 0,
    discountType: "fixed",
    discountValue: data.discountAmount || 0,
    shippingCharge: 0,
    packagingCharge: 0,
    enableRoundOff: false,
    paymentTerms: data.paymentTerms || "Due on Receipt",
    notes: data.notes,
  };

  const res = calculateInvoiceDocument(doc);

  return {
    subtotal: res.subtotal,
    taxAmount: res.taxBreakdown.totalTax,
    discountAmount: res.invoiceDiscountAmount,
    total: res.grandTotal,
  };
}

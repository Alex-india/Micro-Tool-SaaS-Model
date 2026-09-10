export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

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

export interface InvoiceCalculation {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

export function calculateInvoice(data: InvoiceData): InvoiceCalculation {
  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice || 0), 0);
  const taxable = Math.max(0, subtotal - (data.discountAmount || 0));
  const taxAmount = (taxable * (data.gstRate || 0)) / 100;
  const total = taxable + taxAmount;

  return {
    subtotal: Math.round(subtotal),
    taxAmount: Math.round(taxAmount),
    discountAmount: Math.round(data.discountAmount || 0),
    total: Math.round(total),
  };
}

// ============================================================================
// ToolVerse Business Suite: Professional Invoice & Document Engine
// Supports Invoices, Quotations, Receipts, Proforma, POs, and Delivery Challans
// Complies with Indian GST (CGST/SGST/IGST), VAT, Sales Tax, and Multi-Currency
// ============================================================================

export type DocumentType =
  | "invoice"
  | "quotation"
  | "receipt"
  | "proforma"
  | "purchase_order"
  | "delivery_challan";

export type TaxType =
  | "none"
  | "gst_intra" // CGST (50%) + SGST (50%)
  | "gst_inter" // IGST (100%)
  | "vat"
  | "sales_tax"
  | "flat";

export type DiscountType = "percentage" | "fixed";

export type TemplateStyle = "modern" | "classic" | "minimalist";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  unitSingular: string;
  unitPlural: string;
  subUnitSingular: string;
  subUnitPlural: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    decimals: 2,
    unitSingular: "Dollar",
    unitPlural: "Dollars",
    subUnitSingular: "Cent",
    subUnitPlural: "Cents",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    decimals: 2,
    unitSingular: "Euro",
    unitPlural: "Euros",
    subUnitSingular: "Cent",
    subUnitPlural: "Cents",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    decimals: 2,
    unitSingular: "Pound",
    unitPlural: "Pounds",
    subUnitSingular: "Pence",
    subUnitPlural: "Pence",
  },
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    decimals: 2,
    unitSingular: "Rupee",
    unitPlural: "Rupees",
    subUnitSingular: "Paisa",
    subUnitPlural: "Paise",
  },
  CAD: {
    code: "CAD",
    symbol: "CA$",
    name: "Canadian Dollar",
    decimals: 2,
    unitSingular: "Dollar",
    unitPlural: "Dollars",
    subUnitSingular: "Cent",
    subUnitPlural: "Cents",
  },
  AUD: {
    code: "AUD",
    symbol: "AU$",
    name: "Australian Dollar",
    decimals: 2,
    unitSingular: "Dollar",
    unitPlural: "Dollars",
    subUnitSingular: "Cent",
    subUnitPlural: "Cents",
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    decimals: 0,
    unitSingular: "Yen",
    unitPlural: "Yen",
    subUnitSingular: "Sen",
    subUnitPlural: "Sen",
  },
  SGD: {
    code: "SGD",
    symbol: "SG$",
    name: "Singapore Dollar",
    decimals: 2,
    unitSingular: "Dollar",
    unitPlural: "Dollars",
    subUnitSingular: "Cent",
    subUnitPlural: "Cents",
  },
  AED: {
    code: "AED",
    symbol: "AED",
    name: "UAE Dirham",
    decimals: 2,
    unitSingular: "Dirham",
    unitPlural: "Dirhams",
    subUnitSingular: "Fils",
    subUnitPlural: "Fils",
  },
  CHF: {
    code: "CHF",
    symbol: "CHF",
    name: "Swiss Franc",
    decimals: 2,
    unitSingular: "Franc",
    unitPlural: "Francs",
    subUnitSingular: "Rappen",
    subUnitPlural: "Rappen",
  },
};

export interface InvoiceItem {
  id: string;
  description: string;
  details?: string;
  hsnSac?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  amount: number;
}

export interface BusinessParty {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string; // GSTIN, VAT ID, EIN, etc.
  panNumber?: string;
  website?: string;
}

export interface PaymentDetails {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscOrSwift?: string;
  branchName?: string;
  upiId?: string;
  paymentLink?: string;
  qrCodeEnabled?: boolean;
}

export interface InvoiceDocument {
  documentType: DocumentType;
  documentNumber: string;
  documentDate: string;
  dueDate: string;
  poNumber?: string;
  paymentTerms: string; // "Due on Receipt", "Net 15", "Net 30", etc.

  currency: string;
  accentColor: string;
  templateStyle: TemplateStyle;
  logoUrl?: string;
  logoSize?: "sm" | "md" | "lg";

  sender: BusinessParty;
  client: BusinessParty;
  shippingAddress?: string;
  useSeparateShipping: boolean;

  items: InvoiceItem[];

  taxType: TaxType;
  taxRate: number; // e.g., 18 for 18% GST or 20 for 20% VAT
  taxLabel?: string;

  discountType: DiscountType;
  discountValue: number;

  shippingCharge: number;
  packagingCharge: number;
  enableRoundOff: boolean;

  paymentDetails: PaymentDetails;
  notes?: string;
  termsAndConditions?: string;

  signatoryName?: string;
  signatoryTitle?: string;
  signatureImage?: string;
}

export interface TaxBreakdown {
  taxType: TaxType;
  rate: number;
  totalTax: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  vatRate: number;
  vatAmount: number;
  salesTaxRate: number;
  salesTaxAmount: number;
  summaryLabel: string;
}

export interface InvoiceCalculation {
  subtotal: number;
  itemDiscountsTotal: number;
  invoiceDiscountAmount: number;
  taxableAmount: number;
  taxBreakdown: TaxBreakdown;
  shippingCharge: number;
  packagingCharge: number;
  rawTotal: number;
  roundOffAdjustment: number;
  grandTotal: number;
  totalInWords: string;
  currencyConfig: CurrencyConfig;
}

// ---------------------------------------------------------------------------
// Currency Formatter
// ---------------------------------------------------------------------------
export function formatInvoiceCurrency(
  amount: number,
  currencyCode: string = "USD"
): string {
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  const validAmount = isNaN(amount) ? 0 : amount;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(validAmount);
  } catch {
    return `${config.symbol}${validAmount.toFixed(config.decimals)}`;
  }
}

// ---------------------------------------------------------------------------
// Number to Words Converter (English)
// ---------------------------------------------------------------------------
const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertThreeDigit(num: number): string {
  let str = "";
  if (num >= 100) {
    str += ONES[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }
  if (num >= 20) {
    str += TENS[Math.floor(num / 10)] + " ";
    num %= 10;
  }
  if (num > 0) {
    str += ONES[num] + " ";
  }
  return str.trim();
}

export function convertNumberToWords(
  amount: number,
  currencyCode: string = "USD"
): string {
  if (isNaN(amount) || amount === 0) return "Zero";

  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const integerPart = Math.floor(absAmount);
  const decimalMultiplier = Math.pow(10, config.decimals);
  const decimalPart = Math.round((absAmount - integerPart) * decimalMultiplier);

  let integerWords = "";

  if (integerPart === 0) {
    integerWords = "Zero";
  } else {
    // For INR, Indian numbering system (Lakhs, Crores) is widely preferred
    if (currencyCode === "INR") {
      integerWords = convertIndianNumbering(integerPart);
    } else {
      integerWords = convertWesternNumbering(integerPart);
    }
  }

  const unitWord = integerPart === 1 ? config.unitSingular : config.unitPlural;
  let result = `${integerWords} ${unitWord}`;

  if (decimalPart > 0 && config.decimals > 0) {
    const decimalWords = convertThreeDigit(decimalPart);
    const subUnitWord =
      decimalPart === 1 ? config.subUnitSingular : config.subUnitPlural;
    result += ` and ${decimalWords} ${subUnitWord}`;
  }

  result += " Only";
  return isNegative ? `Minus ${result}` : result;
}

function convertWesternNumbering(num: number): string {
  if (num === 0) return "Zero";

  const scales = ["", "Thousand", "Million", "Billion", "Trillion"];
  let words = "";
  let scaleIndex = 0;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      const chunkWords = convertThreeDigit(chunk);
      const scaleName = scales[scaleIndex] ? ` ${scales[scaleIndex]}` : "";
      words = `${chunkWords}${scaleName} ${words}`;
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return words.trim();
}

function convertIndianNumbering(num: number): string {
  if (num === 0) return "Zero";

  const crores = Math.floor(num / 10000000);
  num %= 10000000;
  const lakhs = Math.floor(num / 100000);
  num %= 100000;
  const thousands = Math.floor(num / 1000);
  num %= 1000;
  const hundreds = num;

  let str = "";
  if (crores > 0) {
    str += `${convertThreeDigit(crores)} Crore `;
  }
  if (lakhs > 0) {
    str += `${convertThreeDigit(lakhs)} Lakh `;
  }
  if (thousands > 0) {
    str += `${convertThreeDigit(thousands)} Thousand `;
  }
  if (hundreds > 0) {
    str += convertThreeDigit(hundreds);
  }

  return str.trim();
}

// ---------------------------------------------------------------------------
// Precision Arithmetic Helper
// ---------------------------------------------------------------------------
function roundTo(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

// ---------------------------------------------------------------------------
// Invoice Calculation Engine
// ---------------------------------------------------------------------------
export function calculateInvoiceDocument(
  doc: InvoiceDocument
): InvoiceCalculation {
  const currencyConfig =
    SUPPORTED_CURRENCIES[doc.currency] || SUPPORTED_CURRENCIES.USD;
  const decimals = currencyConfig.decimals;

  // 1. Calculate items subtotal and per-item discounts
  let subtotal = 0;
  let itemDiscountsTotal = 0;

  for (const item of doc.items) {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const rawLine = roundTo(qty * price, decimals);

    let lineDiscount = 0;
    if (item.discountPercent && item.discountPercent > 0) {
      lineDiscount = roundTo((rawLine * item.discountPercent) / 100, decimals);
    }

    subtotal = roundTo(subtotal + rawLine, decimals);
    itemDiscountsTotal = roundTo(itemDiscountsTotal + lineDiscount, decimals);
  }

  // Net subtotal after item-level discounts
  const subtotalAfterItemDiscount = Math.max(
    0,
    roundTo(subtotal - itemDiscountsTotal, decimals)
  );

  // 2. Invoice-Level Discount
  let invoiceDiscountAmount = 0;
  if (doc.discountValue && doc.discountValue > 0) {
    if (doc.discountType === "percentage") {
      invoiceDiscountAmount = roundTo(
        (subtotalAfterItemDiscount * doc.discountValue) / 100,
        decimals
      );
    } else {
      invoiceDiscountAmount = roundTo(doc.discountValue, decimals);
    }
  }
  invoiceDiscountAmount = Math.min(invoiceDiscountAmount, subtotalAfterItemDiscount);

  const taxableAmount = Math.max(
    0,
    roundTo(subtotalAfterItemDiscount - invoiceDiscountAmount, decimals)
  );

  // 3. Tax Breakdown
  const taxRate = Math.max(0, Number(doc.taxRate) || 0);
  const taxBreakdown: TaxBreakdown = {
    taxType: doc.taxType,
    rate: taxRate,
    totalTax: 0,
    cgstRate: 0,
    cgstAmount: 0,
    sgstRate: 0,
    sgstAmount: 0,
    igstRate: 0,
    igstAmount: 0,
    vatRate: 0,
    vatAmount: 0,
    salesTaxRate: 0,
    salesTaxAmount: 0,
    summaryLabel: "Tax",
  };

  if (doc.taxType === "gst_intra") {
    // 50% CGST + 50% SGST
    const halfRate = roundTo(taxRate / 2, 2);
    const cgst = roundTo((taxableAmount * halfRate) / 100, decimals);
    const sgst = roundTo((taxableAmount * halfRate) / 100, decimals);
    taxBreakdown.cgstRate = halfRate;
    taxBreakdown.cgstAmount = cgst;
    taxBreakdown.sgstRate = halfRate;
    taxBreakdown.sgstAmount = sgst;
    taxBreakdown.totalTax = roundTo(cgst + sgst, decimals);
    taxBreakdown.summaryLabel = `GST (${taxRate}% - CGST+SGST)`;
  } else if (doc.taxType === "gst_inter") {
    // 100% IGST
    const igst = roundTo((taxableAmount * taxRate) / 100, decimals);
    taxBreakdown.igstRate = taxRate;
    taxBreakdown.igstAmount = igst;
    taxBreakdown.totalTax = igst;
    taxBreakdown.summaryLabel = `IGST (${taxRate}%)`;
  } else if (doc.taxType === "vat") {
    const vat = roundTo((taxableAmount * taxRate) / 100, decimals);
    taxBreakdown.vatRate = taxRate;
    taxBreakdown.vatAmount = vat;
    taxBreakdown.totalTax = vat;
    taxBreakdown.summaryLabel = `VAT (${taxRate}%)`;
  } else if (doc.taxType === "sales_tax") {
    const salesTax = roundTo((taxableAmount * taxRate) / 100, decimals);
    taxBreakdown.salesTaxRate = taxRate;
    taxBreakdown.salesTaxAmount = salesTax;
    taxBreakdown.totalTax = salesTax;
    taxBreakdown.summaryLabel = `Sales Tax (${taxRate}%)`;
  } else if (doc.taxType === "flat") {
    const flatTax = roundTo((taxableAmount * taxRate) / 100, decimals);
    taxBreakdown.totalTax = flatTax;
    taxBreakdown.summaryLabel = `${doc.taxLabel || "Tax"} (${taxRate}%)`;
  } else {
    // None
    taxBreakdown.totalTax = 0;
    taxBreakdown.summaryLabel = "No Tax";
  }

  // 4. Additional Charges
  const shippingCharge = Math.max(0, roundTo(Number(doc.shippingCharge) || 0, decimals));
  const packagingCharge = Math.max(0, roundTo(Number(doc.packagingCharge) || 0, decimals));

  // 5. Total and Round-off
  const rawTotal = roundTo(
    taxableAmount + taxBreakdown.totalTax + shippingCharge + packagingCharge,
    decimals
  );

  let grandTotal = rawTotal;
  let roundOffAdjustment = 0;

  if (doc.enableRoundOff) {
    const rounded = Math.round(rawTotal);
    roundOffAdjustment = roundTo(rounded - rawTotal, decimals);
    grandTotal = rounded;
  }

  const totalInWords = convertNumberToWords(grandTotal, doc.currency);

  return {
    subtotal,
    itemDiscountsTotal,
    invoiceDiscountAmount,
    taxableAmount,
    taxBreakdown,
    shippingCharge,
    packagingCharge,
    rawTotal,
    roundOffAdjustment,
    grandTotal,
    totalInWords,
    currencyConfig,
  };
}

// ---------------------------------------------------------------------------
// Document Type Titles & Numbering Prefixes
// ---------------------------------------------------------------------------
export function getDocumentTypeInfo(type: DocumentType): {
  title: string;
  prefix: string;
  badge: string;
} {
  switch (type) {
    case "quotation":
      return { title: "PRICE QUOTATION", prefix: "QTN-", badge: "Quotation" };
    case "receipt":
      return { title: "PAYMENT RECEIPT", prefix: "REC-", badge: "Receipt" };
    case "proforma":
      return { title: "PROFORMA INVOICE", prefix: "PI-", badge: "Proforma" };
    case "purchase_order":
      return { title: "PURCHASE ORDER", prefix: "PO-", badge: "Purchase Order" };
    case "delivery_challan":
      return { title: "DELIVERY CHALLAN", prefix: "DC-", badge: "Delivery Challan" };
    case "invoice":
    default:
      return { title: "TAX INVOICE", prefix: "INV-", badge: "Invoice" };
  }
}

// ---------------------------------------------------------------------------
// Default Factory
// ---------------------------------------------------------------------------
export function createDefaultInvoice(type: DocumentType = "invoice"): InvoiceDocument {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];
  const due = new Date();
  due.setDate(today.getDate() + 15);
  const dueStr = due.toISOString().split("T")[0];
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const { prefix } = getDocumentTypeInfo(type);

  return {
    documentType: type,
    documentNumber: `${prefix}${today.getFullYear()}-${randNum}`,
    documentDate: dateStr,
    dueDate: dueStr,
    paymentTerms: "Net 15",

    currency: "USD",
    accentColor: "#4F46E5", // Indigo Modern
    templateStyle: "modern",
    logoSize: "md",

    sender: {
      name: "Acme Digital Studio Inc.",
      contactPerson: "Alex Morgan",
      email: "billing@acmedigital.io",
      phone: "+1 (555) 234-5678",
      address: "100 Innovation Boulevard, Suite 400",
      city: "San Francisco",
      state: "California",
      postalCode: "94105",
      country: "United States",
      taxId: "EIN-82-9482910",
      website: "https://acmedigital.io",
    },

    client: {
      name: "Nexus Technologies LLC",
      contactPerson: "Sarah Jenkins",
      email: "accounts@nexustech.com",
      phone: "+1 (555) 987-6543",
      address: "742 Evergreen Terrace, Floor 2",
      city: "Austin",
      state: "Texas",
      postalCode: "78701",
      country: "United States",
      taxId: "TAX-US-99210",
    },

    useSeparateShipping: false,

    items: [
      {
        id: "item-1",
        description: "Full-Stack Web Application Development",
        details: "Milestone 1: Next.js frontend and PostgreSQL microservices architecture",
        hsnSac: "998314",
        quantity: 40,
        unitPrice: 85,
        discountPercent: 0,
        amount: 3400,
      },
      {
        id: "item-2",
        description: "UI/UX System Design & Interactive Prototyping",
        details: "Figma design tokens, dark mode guidelines, and design system component specs",
        hsnSac: "998311",
        quantity: 15,
        unitPrice: 95,
        discountPercent: 0,
        amount: 1425,
      },
      {
        id: "item-3",
        description: "Cloud Infrastructure Setup & CI/CD Pipeline",
        details: "AWS ECS container deployment, Docker images, and automated GitHub Actions",
        hsnSac: "998313",
        quantity: 8,
        unitPrice: 110,
        discountPercent: 0,
        amount: 880,
      },
    ],

    taxType: "sales_tax",
    taxRate: 8.25,
    taxLabel: "Sales Tax",

    discountType: "percentage",
    discountValue: 5,

    shippingCharge: 0,
    packagingCharge: 0,
    enableRoundOff: true,

    paymentDetails: {
      bankName: "Silicon Valley National Bank",
      accountName: "Acme Digital Studio Inc.",
      accountNumber: "987456123001",
      ifscOrSwift: "SVNBUS33XXX",
      branchName: "Downtown Financial District",
      upiId: "acmedigital@svb",
      paymentLink: "https://pay.stripe.com/acme/inv-default",
      qrCodeEnabled: true,
    },

    notes:
      "Thank you for choosing Acme Digital Studio. We appreciate your business and look forward to our continued partnership!",
    termsAndConditions:
      "1. Payment is due within 15 days of invoice date.\n2. Invoices unpaid after 30 days are subject to a 1.5% monthly late finance fee.\n3. All intellectual property transfers upon full settlement of invoice total.",

    signatoryName: "Alex Morgan",
    signatoryTitle: "Managing Director & CEO",
  };
}

// ---------------------------------------------------------------------------
// Curated Presets
// ---------------------------------------------------------------------------
export const INVOICE_PRESETS: {
  id: string;
  name: string;
  badge: string;
  description: string;
  document: InvoiceDocument;
}[] = [
  {
    id: "freelancer-usd",
    name: "Freelancer / Consultant",
    badge: "USD • Net 15",
    description: "Design & software consulting invoice with hourly rates and milestone breakdowns.",
    document: createDefaultInvoice("invoice"),
  },
  {
    id: "india-gst-agency",
    name: "Indian Tech Agency (GST)",
    badge: "INR • CGST + SGST",
    description: "GST-compliant commercial invoice with HSN/SAC codes, CGST/SGST breakdown, and UPI QR code.",
    document: {
      ...createDefaultInvoice("invoice"),
      currency: "INR",
      accentColor: "#059669", // Emerald Tech
      documentNumber: "INV-2026-GST-084",
      paymentTerms: "Due on Receipt",
      sender: {
        name: "Vanguard Tech Solutions Pvt Ltd",
        contactPerson: "Rohan Sharma",
        email: "finance@vanguardtech.in",
        phone: "+91 98200 12345",
        address: "Plot 42, Electronics City Phase 1",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560100",
        country: "India",
        taxId: "29AAAAA0000A1Z5", // Karnataka GSTIN
        panNumber: "AAAAA0000A",
        website: "https://vanguardtech.in",
      },
      client: {
        name: "Infosysian Global Media Ltd",
        contactPerson: "Priya Nair",
        email: "accounts@infosysian.in",
        phone: "+91 98450 67890",
        address: "Tower B, Cyber Gateway, Hitec City",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560066",
        country: "India",
        taxId: "29BBBBB1111B1Z2",
      },
      items: [
        {
          id: "item-in-1",
          description: "Enterprise SaaS Web Application Engineering",
          details: "Micro-frontend architecture and GraphQL federation APIs",
          hsnSac: "998314",
          quantity: 1,
          unitPrice: 150000,
          discountPercent: 0,
          amount: 150000,
        },
        {
          id: "item-in-2",
          description: "Monthly Managed DevOps & SRE Retainer",
          details: "Kubernetes 24/7 uptime monitoring, Helm charts, and backup verification",
          hsnSac: "998315",
          quantity: 1,
          unitPrice: 45000,
          discountPercent: 0,
          amount: 45000,
        },
      ],
      taxType: "gst_intra",
      taxRate: 18,
      taxLabel: "GST (18%)",
      discountType: "fixed",
      discountValue: 5000,
      shippingCharge: 0,
      packagingCharge: 0,
      enableRoundOff: true,
      paymentDetails: {
        bankName: "HDFC Bank Ltd",
        accountName: "Vanguard Tech Solutions Pvt Ltd",
        accountNumber: "50200012345678",
        ifscOrSwift: "HDFC0000123",
        branchName: "Koramangala 4th Block, Bengaluru",
        upiId: "vanguardtech@hdfcbank",
        paymentLink: "upi://pay?pa=vanguardtech@hdfcbank&pn=Vanguard%20Tech&cu=INR",
        qrCodeEnabled: true,
      },
      notes: "Goods & Services once supplied cannot be refunded. Late payments attract 18% annual interest.",
      termsAndConditions: "1. All disputes subject to Bengaluru jurisdiction.\n2. GST Input Tax Credit available on invoice verification.",
      signatoryName: "Rohan Sharma",
      signatoryTitle: "Authorized Signatory",
    },
  },
  {
    id: "euro-wholesale",
    name: "E-Commerce Wholesale",
    badge: "EUR • VAT 20%",
    description: "Wholesale retail order with shipping fees, quantity tier discounts, and European VAT.",
    document: {
      ...createDefaultInvoice("invoice"),
      currency: "EUR",
      accentColor: "#2563EB", // Royal Blue
      documentNumber: "INV-EU-2026-904",
      paymentTerms: "Net 30",
      sender: {
        name: "Continental Hardware Supply BV",
        contactPerson: "Klaus Weber",
        email: "orders@continentalhardware.nl",
        phone: "+31 20 555 1234",
        address: "Herengracht 450",
        city: "Amsterdam",
        state: "North Holland",
        postalCode: "1017 BZ",
        country: "Netherlands",
        taxId: "NL882910291B01",
        website: "https://continentalhardware.nl",
      },
      client: {
        name: "Berlin Tech Works GmbH",
        contactPerson: "Greta Bauer",
        email: "einkauf@berlintechworks.de",
        phone: "+49 30 1234 5678",
        address: "Friedrichstraße 180",
        city: "Berlin",
        state: "Berlin",
        postalCode: "10117",
        country: "Germany",
        taxId: "DE123456789",
      },
      items: [
        {
          id: "item-eu-1",
          description: "Industrial IoT Edge Gateway Controllers (Model X-500)",
          details: "Quad-core ARM Cortex, dual Gigabit Ethernet, DIN rail mounting",
          hsnSac: "847150",
          quantity: 25,
          unitPrice: 180,
          discountPercent: 5,
          amount: 4275,
        },
        {
          id: "item-eu-2",
          description: "RS-485 to Ethernet Modbus Converters",
          details: "Optically isolated industrial communication converters",
          hsnSac: "851762",
          quantity: 50,
          unitPrice: 42,
          discountPercent: 10,
          amount: 1890,
        },
      ],
      taxType: "vat",
      taxRate: 20,
      taxLabel: "VAT (20%)",
      discountType: "percentage",
      discountValue: 3,
      shippingCharge: 145,
      packagingCharge: 35,
      enableRoundOff: false,
      paymentDetails: {
        bankName: "ING Bank NV",
        accountName: "Continental Hardware Supply BV",
        accountNumber: "NL91 INGB 0417 1643 00",
        ifscOrSwift: "INGBNL2A",
        branchName: "Amsterdam Central",
        paymentLink: "https://pay.continentalhardware.nl/order-904",
        qrCodeEnabled: true,
      },
      notes: "Certified CE and RoHS compliant equipment. Includes 24-month manufacturer warranty.",
      termsAndConditions: "1. Retention of title until invoice is paid in full.\n2. Governing law: Netherlands.",
      signatoryName: "Klaus Weber",
      signatoryTitle: "Head of Commercial Sales",
    },
  },
  {
    id: "quotation-preset",
    name: "Formal Price Quotation",
    badge: "Quotation • Net 30",
    description: "Client estimate and pricing proposal valid for 30 days.",
    document: {
      ...createDefaultInvoice("quotation"),
      documentType: "quotation",
      documentNumber: "QTN-2026-441",
      currency: "USD",
      accentColor: "#7C3AED", // Purple Executive
      paymentTerms: "Estimate Valid 30 Days",
      notes: "This quotation is valid for 30 calendar days from issue date. Scope expansions billed at standard hourly rates.",
      termsAndConditions: "1. 50% deposit required upon quotation approval.\n2. Remaining 50% upon final acceptance & sign-off.",
    },
  },
  {
    id: "payment-receipt-preset",
    name: "Official Payment Receipt",
    badge: "Receipt • Paid in Full",
    description: "Formal proof of transaction and settlement receipt for customer accounting.",
    document: {
      ...createDefaultInvoice("receipt"),
      documentType: "receipt",
      documentNumber: "REC-2026-782",
      currency: "USD",
      accentColor: "#059669", // Emerald
      paymentTerms: "Paid in Full",
      notes: "Payment received with thanks. Transaction confirmed via Stripe Settlement ID #ch_3Ok8v02eZvKYlo2C0.",
      termsAndConditions: "Receipt valid for income tax deduction and financial audits. Keep for your records.",
    },
  },
];

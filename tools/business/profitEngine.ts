// ============================================================================
// ToolVerse Business Suite: Professional Profit & Margin Intelligence Engine
// Comprehensive P&L Waterfall, Unit Economics Solver, and E-Commerce Order Margin
// ============================================================================

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", decimals: 2 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", decimals: 2 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", decimals: 2 },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", decimals: 2 },
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar", decimals: 2 },
  AUD: { code: "AUD", symbol: "AU$", name: "Australian Dollar", decimals: 2 },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", decimals: 0 },
  SGD: { code: "SGD", symbol: "SG$", name: "Singapore Dollar", decimals: 2 },
  AED: { code: "AED", symbol: "AED", name: "UAE Dirham", decimals: 2 },
  CHF: { code: "CHF", symbol: "CHF", name: "Swiss Franc", decimals: 2 },
};

export function formatProfitCurrency(
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
// 1. P&L Profit Waterfall
// ---------------------------------------------------------------------------
export interface ProfitWaterfallInput {
  revenue: number;
  cogs: number;
  operatingExpenses: {
    salesMarketing: number;
    researchDev: number;
    generalAdmin: number;
    rentUtilities: number;
    otherOpex: number;
  };
  depreciationAmortization: number;
  interestExpense: number;
  taxRatePercent: number;
}

export interface WaterfallStage {
  id: string;
  name: string;
  amount: number;
  change: number; // positive or negative value
  percentageOfRevenue: number;
  type: "positive" | "negative" | "subtotal" | "final";
  description: string;
}

export interface ProfitHealth {
  status: "excellent" | "healthy" | "caution" | "critical";
  headline: string;
  insights: string[];
}

export interface ProfitWaterfallResult {
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  totalOpex: number;
  ebitda: number;
  ebitdaMarginPercent: number;
  depreciationAmortization: number;
  operatingProfit: number; // EBIT
  operatingMarginPercent: number;
  interestExpense: number;
  preTaxIncome: number; // EBT
  incomeTax: number;
  effectiveTaxRatePercent: number;
  netProfit: number;
  netMarginPercent: number;
  costToIncomeRatio: number;
  waterfallStages: WaterfallStage[];
  health: ProfitHealth;
}

export function calculateProfitWaterfall(
  input: ProfitWaterfallInput
): ProfitWaterfallResult {
  const revenue = Math.max(0, Number(input.revenue) || 0);
  const cogs = Math.max(0, Number(input.cogs) || 0);

  const opex = input.operatingExpenses || {
    salesMarketing: 0,
    researchDev: 0,
    generalAdmin: 0,
    rentUtilities: 0,
    otherOpex: 0,
  };

  const totalOpex =
    Math.max(0, Number(opex.salesMarketing) || 0) +
    Math.max(0, Number(opex.researchDev) || 0) +
    Math.max(0, Number(opex.generalAdmin) || 0) +
    Math.max(0, Number(opex.rentUtilities) || 0) +
    Math.max(0, Number(opex.otherOpex) || 0);

  const depreciationAmortization = Math.max(
    0,
    Number(input.depreciationAmortization) || 0
  );
  const interestExpense = Math.max(0, Number(input.interestExpense) || 0);
  const taxRate = Math.max(0, Math.min(100, Number(input.taxRatePercent) || 0));

  // 1. Gross Profit
  const grossProfit = revenue - cogs;
  const grossMarginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  // 2. EBITDA
  const ebitda = grossProfit - totalOpex;
  const ebitdaMarginPercent = revenue > 0 ? (ebitda / revenue) * 100 : 0;

  // 3. Operating Profit (EBIT)
  const operatingProfit = ebitda - depreciationAmortization;
  const operatingMarginPercent =
    revenue > 0 ? (operatingProfit / revenue) * 100 : 0;

  // 4. Pre-Tax Income (EBT)
  const preTaxIncome = operatingProfit - interestExpense;

  // 5. Taxes (only paid on positive profit)
  const incomeTax =
    preTaxIncome > 0 ? (preTaxIncome * taxRate) / 100 : 0;
  const effectiveTaxRatePercent =
    preTaxIncome > 0 ? (incomeTax / preTaxIncome) * 100 : 0;

  // 6. Net Profit
  const netProfit = preTaxIncome - incomeTax;
  const netMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const totalCosts = cogs + totalOpex + depreciationAmortization + interestExpense + incomeTax;
  const costToIncomeRatio = revenue > 0 ? (totalCosts / revenue) * 100 : 0;

  // Waterfall Stages for Visual Step-down
  const waterfallStages: WaterfallStage[] = [
    {
      id: "rev",
      name: "Gross Revenue",
      amount: revenue,
      change: revenue,
      percentageOfRevenue: 100,
      type: "positive",
      description: "Total top-line business sales generated",
    },
    {
      id: "cogs",
      name: "Cost of Goods Sold (COGS)",
      amount: cogs,
      change: -cogs,
      percentageOfRevenue: revenue > 0 ? (cogs / revenue) * 100 : 0,
      type: "negative",
      description: "Direct manufacturing, procurement & materials cost",
    },
    {
      id: "gp",
      name: "Gross Profit",
      amount: grossProfit,
      change: grossProfit,
      percentageOfRevenue: grossMarginPercent,
      type: "subtotal",
      description: "Revenue remaining after direct production expenses",
    },
    {
      id: "opex",
      name: "Operating Expenses (OPEX)",
      amount: totalOpex,
      change: -totalOpex,
      percentageOfRevenue: revenue > 0 ? (totalOpex / revenue) * 100 : 0,
      type: "negative",
      description: "Payroll, marketing, R&D, administrative overhead and rent",
    },
    {
      id: "ebitda",
      name: "EBITDA",
      amount: ebitda,
      change: ebitda,
      percentageOfRevenue: ebitdaMarginPercent,
      type: "subtotal",
      description: "Operating cash flow before D&A, interest, and taxes",
    },
    {
      id: "da",
      name: "Depreciation & Amortization",
      amount: depreciationAmortization,
      change: -depreciationAmortization,
      percentageOfRevenue:
        revenue > 0 ? (depreciationAmortization / revenue) * 100 : 0,
      type: "negative",
      description: "Non-cash asset depreciation and intangible amortization",
    },
    {
      id: "ebit",
      name: "Operating Profit (EBIT)",
      amount: operatingProfit,
      change: operatingProfit,
      percentageOfRevenue: operatingMarginPercent,
      type: "subtotal",
      description: "Core operating earnings before financing and tax",
    },
    {
      id: "interest",
      name: "Interest & Financing Costs",
      amount: interestExpense,
      change: -interestExpense,
      percentageOfRevenue:
        revenue > 0 ? (interestExpense / revenue) * 100 : 0,
      type: "negative",
      description: "Debt servicing, loans, and banking interest expenses",
    },
    {
      id: "tax",
      name: "Income Tax",
      amount: incomeTax,
      change: -incomeTax,
      percentageOfRevenue: revenue > 0 ? (incomeTax / revenue) * 100 : 0,
      type: "negative",
      description: `Corporate income tax (${taxRate}% statutory rate)`,
    },
    {
      id: "net",
      name: "Net Profit (Bottom Line)",
      amount: netProfit,
      change: netProfit,
      percentageOfRevenue: netMarginPercent,
      type: "final",
      description: "Final retained earnings available to business owners",
    },
  ];

  // Health Assessment
  let status: ProfitHealth["status"] = "healthy";
  let headline = "Solid Financial Health";
  const insights: string[] = [];

  if (revenue === 0) {
    status = "caution";
    headline = "Zero Revenue";
    insights.push("Enter your gross business revenue to evaluate profitability.");
  } else if (netProfit < 0) {
    status = "critical";
    headline = "Operating at a Net Loss";
    insights.push(
      `Your business is currently losing money with a negative net margin of ${netMarginPercent.toFixed(1)}%.`
    );
    if (grossProfit < 0) {
      insights.push("Critical: Cost of Goods Sold exceeds Revenue. Your unit economics are upside down.");
    } else if (totalOpex > grossProfit) {
      insights.push(
        `Operating overhead (${formatProfitCurrency(totalOpex)}) exceeds your Gross Profit (${formatProfitCurrency(grossProfit)}). Focus on reducing SG&A or scaling sales.`
      );
    }
  } else if (netMarginPercent >= 20) {
    status = "excellent";
    headline = "Outstanding High-Margin Business";
    insights.push(
      `Exceptional bottom-line net margin of ${netMarginPercent.toFixed(1)}%, placing you in the top tier of profitable enterprises.`
    );
    insights.push(`Gross Margin of ${grossMarginPercent.toFixed(1)}% provides robust pricing power.`);
  } else if (netMarginPercent >= 10) {
    status = "healthy";
    headline = "Healthy & Sustainable Profitability";
    insights.push(
      `Strong net margin of ${netMarginPercent.toFixed(1)}% aligns well with industry benchmark standards.`
    );
  } else {
    status = "caution";
    headline = "Slim Profit Margins";
    insights.push(
      `Net margin of ${netMarginPercent.toFixed(1)}% is thin. A small increase in COGS or inflation could push the business into a deficit.`
    );
    insights.push("Consider auditing discretionary OPEX or implementing a modest price increase.");
  }

  return {
    revenue,
    cogs,
    grossProfit,
    grossMarginPercent,
    totalOpex,
    ebitda,
    ebitdaMarginPercent,
    depreciationAmortization,
    operatingProfit,
    operatingMarginPercent,
    interestExpense,
    preTaxIncome,
    incomeTax,
    effectiveTaxRatePercent,
    netProfit,
    netMarginPercent,
    costToIncomeRatio,
    waterfallStages,
    health: {
      status,
      headline,
      insights,
    },
  };
}

// ---------------------------------------------------------------------------
// 2. Unit Economics & Margin / Markup Solver
// ---------------------------------------------------------------------------
export type UnitEconomicsMode = "forward" | "target_margin" | "target_markup";

export interface UnitEconomicsInput {
  mode: UnitEconomicsMode;
  costPrice: number;
  sellingPrice?: number;
  targetMarginPercent?: number;
  targetMarkupPercent?: number;
}

export interface VolumeTier {
  units: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  marginPercent: number;
}

export interface UnitEconomicsResult {
  costPrice: number;
  sellingPrice: number;
  profitPerUnit: number;
  grossMarginPercent: number;
  markupPercent: number;
  volumeTiers: VolumeTier[];
}

export function calculateUnitEconomics(
  input: UnitEconomicsInput
): UnitEconomicsResult {
  const cost = Math.max(0, Number(input.costPrice) || 0);
  let sell = 0;
  let profit = 0;
  let margin = 0;
  let markup = 0;

  if (input.mode === "target_margin") {
    // Required Sell = Cost / (1 - Margin/100)
    const targetMargin = Math.min(99.9, Math.max(0, Number(input.targetMarginPercent) || 0));
    if (targetMargin >= 100) {
      sell = cost * 2;
    } else {
      sell = targetMargin > 0 ? cost / (1 - targetMargin / 100) : cost;
    }
    profit = sell - cost;
    margin = targetMargin;
    markup = cost > 0 ? (profit / cost) * 100 : 0;
  } else if (input.mode === "target_markup") {
    // Required Sell = Cost * (1 + Markup/100)
    const targetMarkup = Math.max(0, Number(input.targetMarkupPercent) || 0);
    profit = (cost * targetMarkup) / 100;
    sell = cost + profit;
    markup = targetMarkup;
    margin = sell > 0 ? (profit / sell) * 100 : 0;
  } else {
    // Forward mode: Cost + Sell given
    sell = Math.max(0, Number(input.sellingPrice) || 0);
    profit = sell - cost;
    margin = sell > 0 ? (profit / sell) * 100 : 0;
    markup = cost > 0 ? (profit / cost) * 100 : 0;
  }

  // Volume projections matrix
  const tierUnits = [10, 50, 100, 250, 500, 1000, 2500, 5000];
  const volumeTiers: VolumeTier[] = tierUnits.map((units) => {
    const totalRev = sell * units;
    const totalCst = cost * units;
    const totalPrf = profit * units;
    return {
      units,
      totalRevenue: totalRev,
      totalCost: totalCst,
      totalProfit: totalPrf,
      marginPercent: totalRev > 0 ? (totalPrf / totalRev) * 100 : 0,
    };
  });

  return {
    costPrice: cost,
    sellingPrice: sell,
    profitPerUnit: profit,
    grossMarginPercent: margin,
    markupPercent: markup,
    volumeTiers,
  };
}

// ---------------------------------------------------------------------------
// 3. E-Commerce & DTC Order Net Profit Calculator
// ---------------------------------------------------------------------------
export interface EcommerceOrderInput {
  retailPrice: number;
  cogs: number;
  paymentGatewayFeePercent: number; // e.g. 2.9%
  paymentGatewayFixedFee: number; // e.g. $0.30
  platformCommissionPercent: number; // e.g. 15% (Amazon/Shopify)
  shippingCost: number; // Shipping charged by carrier
  fulfillmentCost: number; // Pick & Pack
  adSpendPerOrder: number; // Blended CPA / CAC
  returnRatePercent: number; // % of orders returned
}

export interface EcommerceOrderResult {
  retailPrice: number;
  cogs: number;
  paymentFee: number;
  platformFee: number;
  shippingAndFulfillment: number;
  adSpend: number;
  returnAllowance: number;
  totalDirectCost: number;
  netProfitPerOrder: number;
  netMarginPercent: number;
  maxBreakevenAdSpend: number;
  contributionMarginPercent: number;
}

export function calculateEcommerceOrderProfit(
  input: EcommerceOrderInput
): EcommerceOrderResult {
  const price = Math.max(0, Number(input.retailPrice) || 0);
  const cogs = Math.max(0, Number(input.cogs) || 0);

  const gatewayPercent = Math.max(0, Number(input.paymentGatewayFeePercent) || 0);
  const gatewayFixed = Math.max(0, Number(input.paymentGatewayFixedFee) || 0);
  const paymentFee = price > 0 ? (price * gatewayPercent) / 100 + gatewayFixed : 0;

  const platformPercent = Math.max(0, Number(input.platformCommissionPercent) || 0);
  const platformFee = (price * platformPercent) / 100;

  const shipping = Math.max(0, Number(input.shippingCost) || 0);
  const fulfillment = Math.max(0, Number(input.fulfillmentCost) || 0);
  const shippingAndFulfillment = shipping + fulfillment;

  const adSpend = Math.max(0, Number(input.adSpendPerOrder) || 0);

  const returnRate = Math.max(0, Math.min(100, Number(input.returnRatePercent) || 0));
  // Return allowance accounts for lost shipping/fulfillment and restocking cost on returned orders
  const returnAllowance = (price * (returnRate / 100)) * 0.5;

  const nonAdDirectCosts = cogs + paymentFee + platformFee + shippingAndFulfillment + returnAllowance;
  const totalDirectCost = nonAdDirectCosts + adSpend;

  const netProfitPerOrder = price - totalDirectCost;
  const netMarginPercent = price > 0 ? (netProfitPerOrder / price) * 100 : 0;

  // Max CPA before losing money on the unit
  const maxBreakevenAdSpend = Math.max(0, price - nonAdDirectCosts);

  // Contribution margin before ad spend
  const contributionMargin = price - nonAdDirectCosts;
  const contributionMarginPercent = price > 0 ? (contributionMargin / price) * 100 : 0;

  return {
    retailPrice: price,
    cogs,
    paymentFee,
    platformFee,
    shippingAndFulfillment,
    adSpend,
    returnAllowance,
    totalDirectCost,
    netProfitPerOrder,
    netMarginPercent,
    maxBreakevenAdSpend,
    contributionMarginPercent,
  };
}

// ---------------------------------------------------------------------------
// 4. Curated Business Presets
// ---------------------------------------------------------------------------
export interface ProfitPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  currency: string;
  waterfall: ProfitWaterfallInput;
  unit: UnitEconomicsInput;
  ecommerce: EcommerceOrderInput;
}

export const PROFIT_PRESETS: ProfitPreset[] = [
  {
    id: "saas-startup",
    name: "SaaS / B2B Subscription",
    badge: "82% Gross Margin",
    description: "High gross margin subscription model with heavy R&D engineering and sales acquisition expenses.",
    currency: "USD",
    waterfall: {
      revenue: 1200000,
      cogs: 216000, // 18% hosting, cloud, support
      operatingExpenses: {
        salesMarketing: 380000,
        researchDev: 320000,
        generalAdmin: 110000,
        rentUtilities: 36000,
        otherOpex: 18000,
      },
      depreciationAmortization: 24000,
      interestExpense: 0,
      taxRatePercent: 21,
    },
    unit: {
      mode: "forward",
      costPrice: 18,
      sellingPrice: 100,
    },
    ecommerce: {
      retailPrice: 99,
      cogs: 12,
      paymentGatewayFeePercent: 2.9,
      paymentGatewayFixedFee: 0.3,
      platformCommissionPercent: 0,
      shippingCost: 0,
      fulfillmentCost: 0,
      adSpendPerOrder: 35,
      returnRatePercent: 2,
    },
  },
  {
    id: "ecommerce-dtc",
    name: "E-Commerce DTC Brand",
    badge: "DTC Apparel & Goods",
    description: "Physical retail brand with manufacturing costs, fulfillment logistics, and paid digital ads.",
    currency: "USD",
    waterfall: {
      revenue: 650000,
      cogs: 292500, // 45% COGS
      operatingExpenses: {
        salesMarketing: 162500, // Meta / Google ads
        researchDev: 15000,
        generalAdmin: 65000,
        rentUtilities: 28000,
        otherOpex: 12000,
      },
      depreciationAmortization: 12000,
      interestExpense: 6500,
      taxRatePercent: 21,
    },
    unit: {
      mode: "forward",
      costPrice: 22,
      sellingPrice: 65,
    },
    ecommerce: {
      retailPrice: 65,
      cogs: 22,
      paymentGatewayFeePercent: 2.9,
      paymentGatewayFixedFee: 0.3,
      platformCommissionPercent: 2.5,
      shippingCost: 6.5,
      fulfillmentCost: 2.5,
      adSpendPerOrder: 18,
      returnRatePercent: 6,
    },
  },
  {
    id: "agency-consulting",
    name: "Agency / Consulting Studio",
    badge: "Service Retainers",
    description: "Professional client services firm with billable staff labor and minimal capital equipment.",
    currency: "USD",
    waterfall: {
      revenue: 850000,
      cogs: 340000, // Direct contractor & designer labor
      operatingExpenses: {
        salesMarketing: 68000,
        researchDev: 0,
        generalAdmin: 145000,
        rentUtilities: 42000,
        otherOpex: 25000,
      },
      depreciationAmortization: 8000,
      interestExpense: 0,
      taxRatePercent: 25,
    },
    unit: {
      mode: "forward",
      costPrice: 60,
      sellingPrice: 150,
    },
    ecommerce: {
      retailPrice: 1500,
      cogs: 600,
      paymentGatewayFeePercent: 2.9,
      paymentGatewayFixedFee: 0.3,
      platformCommissionPercent: 0,
      shippingCost: 0,
      fulfillmentCost: 0,
      adSpendPerOrder: 250,
      returnRatePercent: 0,
    },
  },
  {
    id: "retail-wholesale",
    name: "Wholesale & Distribution",
    badge: "Volume Distribution",
    description: "High-volume wholesale distributor operating on 25–30% gross margins with freight logistics.",
    currency: "EUR",
    waterfall: {
      revenue: 2500000,
      cogs: 1825000, // 73% Landed COGS
      operatingExpenses: {
        salesMarketing: 125000,
        researchDev: 0,
        generalAdmin: 220000,
        rentUtilities: 140000, // Warehousing
        otherOpex: 45000,
      },
      depreciationAmortization: 35000,
      interestExpense: 28000,
      taxRatePercent: 25,
    },
    unit: {
      mode: "forward",
      costPrice: 42,
      sellingPrice: 58,
    },
    ecommerce: {
      retailPrice: 58,
      cogs: 42,
      paymentGatewayFeePercent: 1.8,
      paymentGatewayFixedFee: 0.25,
      platformCommissionPercent: 0,
      shippingCost: 4.5,
      fulfillmentCost: 1.5,
      adSpendPerOrder: 3.5,
      returnRatePercent: 1.5,
    },
  },
  {
    id: "restaurant-fnb",
    name: "Restaurant & F&B Hospitality",
    badge: "Hospitality & Dining",
    description: "Food and beverage operation balancing prime costs (30% food cost + 30% direct kitchen labor).",
    currency: "USD",
    waterfall: {
      revenue: 480000,
      cogs: 144000, // 30% Food & beverage ingredients
      operatingExpenses: {
        salesMarketing: 14000,
        researchDev: 0,
        generalAdmin: 168000, // Service & kitchen staff
        rentUtilities: 68000, // Restaurant lease + energy
        otherOpex: 22000,
      },
      depreciationAmortization: 16000,
      interestExpense: 8000,
      taxRatePercent: 21,
    },
    unit: {
      mode: "forward",
      costPrice: 7.5,
      sellingPrice: 24,
    },
    ecommerce: {
      retailPrice: 24,
      cogs: 7.5,
      paymentGatewayFeePercent: 2.6,
      paymentGatewayFixedFee: 0.15,
      platformCommissionPercent: 15, // DoorDash / UberEats commission
      shippingCost: 0,
      fulfillmentCost: 1.5,
      adSpendPerOrder: 2,
      returnRatePercent: 1,
    },
  },
];

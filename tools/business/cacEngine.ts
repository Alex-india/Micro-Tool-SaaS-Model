// ============================================================================
// ToolVerse Business Suite: CAC & LTV Intelligence Engine
// Customer Acquisition Cost, Lifetime Value, Payback Periods & Channel Efficiency
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

export function formatCacCurrency(
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
// 1. CAC & LTV Unit Economics Model
// ---------------------------------------------------------------------------
export interface CacInput {
  // S&M Cost Components
  paidAdSpend: number;
  marketingSalaries: number;
  salesCommissions: number;
  softwareTools: number;
  agencyFees: number;

  // Acquisition Volume
  paidCustomersAcquired: number;
  organicCustomersAcquired: number;

  // Unit Revenue & Retention
  arpuMonthly: number; // Average Revenue Per User / Month
  grossMarginPercent: number; // e.g. 80 for 80%
  monthlyChurnPercent: number; // e.g. 3 for 3% monthly churn
}

export interface CashRecoveryPoint {
  month: number;
  cumulativeGrossMargin: number;
  netCashFlow: number; // Cumulative GM - CAC
  isBreakeven: boolean;
}

export interface CacDiagnostic {
  status: "exceptional" | "healthy" | "suboptimal" | "dangerous" | "underinvesting";
  headline: string;
  ratioDescription: string;
  paybackAssessment: string;
  recommendations: string[];
}

export interface CacResult {
  // Cost breakdown
  paidAdSpend: number;
  overheadSpend: number; // Salaries + Tools + Commissions + Agency
  totalSpend: number;

  // Customers
  paidCustomers: number;
  organicCustomers: number;
  totalCustomers: number;
  organicSharePercent: number;

  // CAC Variations
  paidCac: number; // Ad spend / Paid customers
  blendedCac: number; // Ad spend / Total customers
  fullyLoadedCac: number; // Total spend / Total customers
  fullyLoadedPaidCac: number; // Total spend / Paid customers

  // Lifetime Value (LTV)
  customerLifespanMonths: number;
  customerLifetimeRevenue: number;
  grossMarginPercent: number;
  ltv: number; // Lifetime Gross Profit

  // Ratios & Timelines
  ltvToCacRatio: number; // LTV / Fully-Loaded CAC
  ltvToBlendedRatio: number; // LTV / Blended CAC
  monthlyGrossProfitPerUser: number;
  cacPaybackMonths: number;
  cacPaybackDays: number;

  // Cashflow Trajectory (24 Months)
  cashRecoveryTimeline: CashRecoveryPoint[];
  breakevenMonth: number;

  // Diagnostics
  diagnostic: CacDiagnostic;
}

export function calculateCacMetrics(input: CacInput): CacResult {
  const adSpend = Math.max(0, Number(input.paidAdSpend) || 0);
  const salaries = Math.max(0, Number(input.marketingSalaries) || 0);
  const commissions = Math.max(0, Number(input.salesCommissions) || 0);
  const tools = Math.max(0, Number(input.softwareTools) || 0);
  const agency = Math.max(0, Number(input.agencyFees) || 0);

  const overheadSpend = salaries + commissions + tools + agency;
  const totalSpend = adSpend + overheadSpend;

  const paidCust = Math.max(0, Math.floor(Number(input.paidCustomersAcquired) || 0));
  const organicCust = Math.max(0, Math.floor(Number(input.organicCustomersAcquired) || 0));
  const totalCust = paidCust + organicCust;

  const organicSharePercent = totalCust > 0 ? (organicCust / totalCust) * 100 : 0;

  // CAC Calculations
  const paidCac = paidCust > 0 ? adSpend / paidCust : 0;
  const blendedCac = totalCust > 0 ? adSpend / totalCust : 0;
  const fullyLoadedCac = totalCust > 0 ? totalSpend / totalCust : 0;
  const fullyLoadedPaidCac = paidCust > 0 ? totalSpend / paidCust : 0;

  // LTV Calculations
  const arpu = Math.max(0, Number(input.arpuMonthly) || 0);
  const marginPercent = Math.max(1, Math.min(100, Number(input.grossMarginPercent) || 80));
  const marginDecimal = marginPercent / 100;

  const monthlyChurn = Math.max(0.01, Math.min(100, Number(input.monthlyChurnPercent) || 3));
  const churnDecimal = monthlyChurn / 100;

  // Lifespan = 1 / Churn (months)
  const customerLifespanMonths = Math.min(120, 1 / churnDecimal);
  const customerLifetimeRevenue = arpu * customerLifespanMonths;
  const ltv = customerLifetimeRevenue * marginDecimal;

  // Monthly Gross Profit generated per customer
  const monthlyGrossProfitPerUser = arpu * marginDecimal;

  // Payback Period: CAC / Monthly Gross Profit
  const targetCac = fullyLoadedCac > 0 ? fullyLoadedCac : blendedCac;
  const cacPaybackMonths =
    monthlyGrossProfitPerUser > 0 ? targetCac / monthlyGrossProfitPerUser : 999;
  const cacPaybackDays = Math.round(cacPaybackMonths * 30.417);

  // Ratios
  const ltvToCacRatio = targetCac > 0 ? ltv / targetCac : 0;
  const ltvToBlendedRatio = blendedCac > 0 ? ltv / blendedCac : 0;

  // 24-Month Cashflow Trajectory
  const cashRecoveryTimeline: CashRecoveryPoint[] = [];
  let breakevenMonth = 0;

  for (let m = 1; m <= 24; m++) {
    // Survival rate at month m: (1 - churn)^m
    const survivalRate = Math.pow(1 - churnDecimal, m - 1);
    const cumulativeGM = arpu * marginDecimal * ((1 - Math.pow(1 - churnDecimal, m)) / churnDecimal);
    const netCash = cumulativeGM - targetCac;
    const isBe = netCash >= 0;

    if (isBe && breakevenMonth === 0) {
      breakevenMonth = m;
    }

    cashRecoveryTimeline.push({
      month: m,
      cumulativeGrossMargin: Math.round(cumulativeGM),
      netCashFlow: Math.round(netCash),
      isBreakeven: isBe,
    });
  }

  // Diagnostic Assessment
  let status: CacDiagnostic["status"] = "healthy";
  let headline = "Healthy Unit Economics (3.0x - 5.0x)";
  let ratioDescription = `Your LTV:CAC ratio of ${ltvToCacRatio.toFixed(1)}x is within the ideal venture-backed SaaS sweet spot.`;
  let paybackAssessment = "";
  const recommendations: string[] = [];

  if (targetCac === 0) {
    status = "healthy";
    headline = "Enter Acquisition Spend";
    ratioDescription = "Provide ad spend and customer count to evaluate unit economics.";
  } else if (ltvToCacRatio < 1.0) {
    status = "dangerous";
    headline = "Value Destroyer (< 1.0x LTV:CAC)";
    ratioDescription = `You are losing ${formatCacCurrency(targetCac - ltv)} on every customer acquired. Your business is burning capital faster than it can be recovered.`;
    recommendations.push("Immediately pause high-CPA acquisition campaigns.");
    recommendations.push("Increase ARPU with price adjustments or add-ons.");
    recommendations.push("Reduce monthly churn: customers are leaving before paying off acquisition costs.");
  } else if (ltvToCacRatio < 3.0) {
    status = "suboptimal";
    headline = "Sub-Optimal Margin (1.0x - 2.9x LTV:CAC)";
    ratioDescription = `While positive, an LTV:CAC of ${ltvToCacRatio.toFixed(1)}x leaves very little buffer after general & administrative overhead.`;
    recommendations.push("Optimize conversion funnels to drive down blended CAC.");
    recommendations.push("Introduce annual upfront prepayments with discounts to accelerate cash inflow.");
  } else if (ltvToCacRatio > 5.0) {
    status = "underinvesting";
    headline = "Capital Under-Investment (> 5.0x LTV:CAC)";
    ratioDescription = `An exceptional LTV:CAC of ${ltvToCacRatio.toFixed(1)}x indicates you are under-spending on sales and marketing. You could grow significantly faster.`;
    recommendations.push("Scale up paid ad budgets and expand into higher-intent paid search or outbound sales.");
    recommendations.push("You have substantial margin headroom to bid more aggressively for high-value leads.");
  } else {
    status = "healthy";
    headline = "Ideal SaaS Sweet Spot (3.0x - 5.0x LTV:CAC)";
    ratioDescription = `Your LTV:CAC ratio of ${ltvToCacRatio.toFixed(1)}x demonstrates strong capital efficiency and sustainable unit profitability.`;
    recommendations.push("Maintain current channel allocation and focus on expanding organic referral loops.");
  }

  // Payback period evaluation
  if (cacPaybackMonths <= 12) {
    paybackAssessment = `Payback period of ${cacPaybackMonths.toFixed(1)} months (${cacPaybackDays} days) is outstanding (under the gold standard 12-month ceiling).`;
  } else if (cacPaybackMonths <= 18) {
    paybackAssessment = `Payback period of ${cacPaybackMonths.toFixed(1)} months is acceptable for enterprise contracts, but watch your working capital requirements.`;
  } else {
    paybackAssessment = `Payback period of ${cacPaybackMonths.toFixed(1)} months is dangerously long. You require large cash reserves to float customer acquisition.`;
  }

  return {
    paidAdSpend: adSpend,
    overheadSpend,
    totalSpend,
    paidCustomers: paidCust,
    organicCustomers: organicCust,
    totalCustomers: totalCust,
    organicSharePercent,
    paidCac: Math.round(paidCac * 100) / 100,
    blendedCac: Math.round(blendedCac * 100) / 100,
    fullyLoadedCac: Math.round(fullyLoadedCac * 100) / 100,
    fullyLoadedPaidCac: Math.round(fullyLoadedPaidCac * 100) / 100,
    customerLifespanMonths: Math.round(customerLifespanMonths * 10) / 10,
    customerLifetimeRevenue: Math.round(customerLifetimeRevenue * 100) / 100,
    grossMarginPercent: marginPercent,
    ltv: Math.round(ltv * 100) / 100,
    ltvToCacRatio: Math.round(ltvToCacRatio * 100) / 100,
    ltvToBlendedRatio: Math.round(ltvToBlendedRatio * 100) / 100,
    monthlyGrossProfitPerUser: Math.round(monthlyGrossProfitPerUser * 100) / 100,
    cacPaybackMonths: Math.round(cacPaybackMonths * 10) / 10,
    cacPaybackDays,
    cashRecoveryTimeline,
    breakevenMonth,
    diagnostic: {
      status,
      headline,
      ratioDescription,
      paybackAssessment,
      recommendations,
    },
  };
}

// ---------------------------------------------------------------------------
// 2. Multi-Channel Acquisition Breakdown
// ---------------------------------------------------------------------------
export interface ChannelData {
  id: string;
  name: string;
  spend: number;
  conversions: number;
}

export interface ChannelAnalysis {
  id: string;
  name: string;
  spend: number;
  conversions: number;
  channelCac: number;
  shareOfConversionsPercent: number;
  shareOfSpendPercent: number;
  efficiencyRating: "top_performer" | "average" | "high_cost";
}

export function calculateChannelBreakdown(
  channels: ChannelData[]
): {
  channels: ChannelAnalysis[];
  totalSpend: number;
  totalConversions: number;
  overallChannelCac: number;
} {
  const totalSpend = channels.reduce((sum, c) => sum + (Math.max(0, c.spend) || 0), 0);
  const totalConversions = channels.reduce((sum, c) => sum + (Math.max(0, c.conversions) || 0), 0);
  const overallChannelCac = totalConversions > 0 ? totalSpend / totalConversions : 0;

  const analyzed: ChannelAnalysis[] = channels.map((ch) => {
    const s = Math.max(0, ch.spend) || 0;
    const c = Math.max(0, ch.conversions) || 0;
    const cac = c > 0 ? s / c : 0;
    const shareConversions = totalConversions > 0 ? (c / totalConversions) * 100 : 0;
    const shareSpend = totalSpend > 0 ? (s / totalSpend) * 100 : 0;

    let efficiencyRating: ChannelAnalysis["efficiencyRating"] = "average";
    if (c === 0 && s > 0) {
      efficiencyRating = "high_cost";
    } else if (overallChannelCac > 0 && cac <= overallChannelCac * 0.75) {
      efficiencyRating = "top_performer";
    } else if (overallChannelCac > 0 && cac >= overallChannelCac * 1.35) {
      efficiencyRating = "high_cost";
    }

    return {
      id: ch.id,
      name: ch.name,
      spend: s,
      conversions: c,
      channelCac: Math.round(cac * 100) / 100,
      shareOfConversionsPercent: Math.round(shareConversions * 10) / 10,
      shareOfSpendPercent: Math.round(shareSpend * 10) / 10,
      efficiencyRating,
    };
  });

  return {
    channels: analyzed,
    totalSpend,
    totalConversions,
    overallChannelCac: Math.round(overallChannelCac * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// 3. SaaS Magic Number & Capital Efficiency
// ---------------------------------------------------------------------------
export interface MagicNumberInput {
  quarterlyNetNewArr: number;
  quarterlySalesMarketingSpend: number;
}

export interface MagicNumberResult {
  magicNumber: number;
  efficiencyScore: "exceptional" | "healthy" | "questionable" | "inefficient";
  guidance: string;
}

export function calculateMagicNumber(input: MagicNumberInput): MagicNumberResult {
  const newArr = Math.max(0, Number(input.quarterlyNetNewArr) || 0);
  const smSpend = Math.max(0, Number(input.quarterlySalesMarketingSpend) || 0);
  const magicNumber = smSpend > 0 ? newArr / smSpend : 0;

  let efficiencyScore: MagicNumberResult["efficiencyScore"] = "healthy";
  let guidance = "";

  if (magicNumber >= 1.0) {
    efficiencyScore = "exceptional";
    guidance =
      "Magic Number > 1.0: Pour fuel on the fire. Your sales and marketing engine generates more than $1 in ARR for every $1 spent in under a year.";
  } else if (magicNumber >= 0.75) {
    efficiencyScore = "healthy";
    guidance =
      "Magic Number 0.75 - 1.0: Solid capital efficiency. Continue expanding sales capacity while maintaining acquisition discipline.";
  } else if (magicNumber >= 0.5) {
    efficiencyScore = "questionable";
    guidance =
      "Magic Number 0.5 - 0.75: Warning zone. Investigate why customer acquisition costs are climbing relative to new ARR generation.";
  } else {
    efficiencyScore = "inefficient";
    guidance =
      "Magic Number < 0.5: Inefficient engine. Pause sales hiring and evaluate product-market fit or sales enablement before investing further.";
  }

  return {
    magicNumber: Math.round(magicNumber * 100) / 100,
    efficiencyScore,
    guidance,
  };
}

// ---------------------------------------------------------------------------
// 4. Curated Presets
// ---------------------------------------------------------------------------
export interface CacPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  currency: string;
  input: CacInput;
  channels: ChannelData[];
}

export const CAC_PRESETS: CacPreset[] = [
  {
    id: "b2b-saas-smb",
    name: "B2B SMB SaaS",
    badge: "Self-Serve & Inbound",
    description: "Inbound-heavy SaaS platform with $120/mo ARPU, 3% churn, and digital ads.",
    currency: "USD",
    input: {
      paidAdSpend: 18000,
      marketingSalaries: 12000,
      salesCommissions: 4500,
      softwareTools: 2500,
      agencyFees: 3000,
      paidCustomersAcquired: 65,
      organicCustomersAcquired: 35,
      arpuMonthly: 120,
      grossMarginPercent: 82,
      monthlyChurnPercent: 2.8,
    },
    channels: [
      { id: "ch-1", name: "Google Search Ads", spend: 9500, conversions: 38 },
      { id: "ch-2", name: "LinkedIn Ads", spend: 5500, conversions: 16 },
      { id: "ch-3", name: "Meta / Retargeting", spend: 3000, conversions: 11 },
      { id: "ch-4", name: "Organic SEO & Content", spend: 0, conversions: 22 },
      { id: "ch-5", name: "Customer Referrals", spend: 0, conversions: 13 },
    ],
  },
  {
    id: "b2b-enterprise-saas",
    name: "Enterprise B2B SaaS",
    badge: "Outbound & AE Sales",
    description: "High-ticket software contract with $2,500/mo ARPU, outbound SDRs, and low 0.8% churn.",
    currency: "USD",
    input: {
      paidAdSpend: 25000,
      marketingSalaries: 38000,
      salesCommissions: 28000,
      softwareTools: 6500,
      agencyFees: 8000,
      paidCustomersAcquired: 14,
      organicCustomersAcquired: 4,
      arpuMonthly: 2500,
      grossMarginPercent: 85,
      monthlyChurnPercent: 0.8,
    },
    channels: [
      { id: "ch-1", name: "Outbound SDR Calling", spend: 45000, conversions: 8 },
      { id: "ch-2", name: "Executive Dinners & Events", spend: 35000, conversions: 4 },
      { id: "ch-3", name: "LinkedIn ABM Ads", spend: 20000, conversions: 2 },
      { id: "ch-4", name: "Partner Referrals", spend: 5500, conversions: 4 },
    ],
  },
  {
    id: "b2c-mobile-subscription",
    name: "B2C Consumer App",
    badge: "Mobile Subscriptions",
    description: "High volume consumer app with $14.99/mo ARPU, Apple/Google search ads, and 5.5% churn.",
    currency: "USD",
    input: {
      paidAdSpend: 42000,
      marketingSalaries: 8000,
      salesCommissions: 0,
      softwareTools: 1800,
      agencyFees: 2500,
      paidCustomersAcquired: 1100,
      organicCustomersAcquired: 650,
      arpuMonthly: 14.99,
      grossMarginPercent: 78,
      monthlyChurnPercent: 5.5,
    },
    channels: [
      { id: "ch-1", name: "Apple Search Ads (ASA)", spend: 18000, conversions: 520 },
      { id: "ch-2", name: "Meta / Instagram Reels", spend: 15000, conversions: 380 },
      { id: "ch-3", name: "TikTok UGC Ads", spend: 9000, conversions: 200 },
      { id: "ch-4", name: "App Store Organic", spend: 0, conversions: 650 },
    ],
  },
  {
    id: "ecommerce-dtc",
    name: "E-Commerce DTC Brand",
    badge: "DTC Repeat Purchases",
    description: "Direct-to-consumer brand with $68 AOV, Meta/Google ads, and 45% repeat purchase rate.",
    currency: "USD",
    input: {
      paidAdSpend: 32000,
      marketingSalaries: 6500,
      salesCommissions: 0,
      softwareTools: 1200,
      agencyFees: 3500,
      paidCustomersAcquired: 720,
      organicCustomersAcquired: 280,
      arpuMonthly: 45,
      grossMarginPercent: 58,
      monthlyChurnPercent: 8.5,
    },
    channels: [
      { id: "ch-1", name: "Meta Advantage+ Ads", spend: 21000, conversions: 510 },
      { id: "ch-2", name: "Google Shopping PMax", spend: 11000, conversions: 210 },
      { id: "ch-3", name: "Email / SMS Winback", spend: 0, conversions: 280 },
    ],
  },
  {
    id: "fintech-marketplace",
    name: "Fintech & Marketplace",
    badge: "Viral Loops",
    description: "Fintech product with high referral coefficients, $85 monthly transaction revenue, and low churn.",
    currency: "USD",
    input: {
      paidAdSpend: 55000,
      marketingSalaries: 22000,
      salesCommissions: 8000,
      softwareTools: 4000,
      agencyFees: 5000,
      paidCustomersAcquired: 450,
      organicCustomersAcquired: 850,
      arpuMonthly: 85,
      grossMarginPercent: 75,
      monthlyChurnPercent: 1.8,
    },
    channels: [
      { id: "ch-1", name: "Google Search Finance", spend: 32000, conversions: 260 },
      { id: "ch-2", name: "Affiliate & Influencer", spend: 23000, conversions: 190 },
      { id: "ch-3", name: "Viral User Referrals", spend: 0, conversions: 580 },
      { id: "ch-4", name: "Direct Organic Word-of-Mouth", spend: 0, conversions: 270 },
    ],
  },
];

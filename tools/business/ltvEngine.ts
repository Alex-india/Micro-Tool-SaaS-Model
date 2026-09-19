// ============================================================================
// ToolVerse Business Suite: Customer Lifetime Value (LTV) Intelligence Engine
// Models SaaS Recurring LTV, E-Commerce Transactional LTV, Tier Segmentation & Sensitivity
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

export function formatLtvCurrency(
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
// 1. SaaS / Subscription Recurring LTV
// ---------------------------------------------------------------------------
export interface SaasLtvInput {
  arpuMonthly: number; // Average Revenue per User / Month
  grossMarginPercent: number; // e.g. 80 for 80%
  monthlyChurnPercent: number; // e.g. 2.5 for 2.5%
  monthlyExpansionPercent: number; // e.g. 1.0 for 1.0% upsells/expansion
  annualDiscountRatePercent: number; // e.g. 10% WACC / Cost of Capital
  estimatedCac?: number; // Optional CAC for LTV:CAC comparison
}

export interface SaasLtvResult {
  arpuMonthly: number;
  grossMarginPercent: number;
  monthlyChurnPercent: number;
  netChurnPercent: number; // Churn - Expansion
  annualizedChurnPercent: number;
  netRevenueRetentionPercent: number; // 100 + (Expansion - Churn)*12
  customerLifespanMonths: number;
  undiscountedLifetimeRevenue: number;
  undiscountedLtv: number; // Gross margin * Lifetime Revenue
  discountedNpvLtv: number; // Discounted future cashflows
  monthlyGrossProfitPerUser: number;
  estimatedCac: number;
  ltvToCacRatio: number;
  paybackMonths: number;
  diagnostic: {
    status: "exceptional" | "healthy" | "suboptimal" | "critical";
    headline: string;
    description: string;
  };
}

export function calculateSaasLtv(input: SaasLtvInput): SaasLtvResult {
  const arpu = Math.max(0, Number(input.arpuMonthly) || 0);
  const marginPercent = Math.max(1, Math.min(100, Number(input.grossMarginPercent) || 80));
  const margin = marginPercent / 100;

  const churnPercent = Math.max(0.01, Math.min(100, Number(input.monthlyChurnPercent) || 2.5));
  const churn = churnPercent / 100;

  const expansionPercent = Math.max(0, Number(input.monthlyExpansionPercent) || 0);
  const expansion = expansionPercent / 100;

  // Net churn = Churn - Expansion
  const netChurnPercent = Math.max(-50, churnPercent - expansionPercent);
  const netChurn = netChurnPercent / 100;

  // Annualized churn: 1 - (1 - churn)^12
  const annualizedChurnPercent = (1 - Math.pow(1 - churn, 12)) * 100;

  // Net Revenue Retention (NRR): (1 + expansion - churn)^12 * 100
  const monthlyRet = Math.max(0.5, 1 - churn + expansion);
  const netRevenueRetentionPercent = Math.pow(monthlyRet, 12) * 100;

  // Lifespan based on logo churn: 1 / churn (capped at 120 months for sanity)
  const customerLifespanMonths = Math.min(120, 1 / churn);

  // Undiscounted LTV
  const monthlyGrossProfitPerUser = arpu * margin;
  const undiscountedLifetimeRevenue = arpu * customerLifespanMonths;
  const undiscountedLtv = undiscountedLifetimeRevenue * margin;

  // Discounted NPV LTV (accounting for monthly discount rate)
  const annualDiscount = Math.max(0, Number(input.annualDiscountRatePercent) || 10) / 100;
  const monthlyDiscount = Math.pow(1 + annualDiscount, 1 / 12) - 1;

  let discountedNpvLtv = 0;
  // Sum of discounted monthly cashflows over lifespan (up to 120 months)
  for (let m = 1; m <= Math.ceil(customerLifespanMonths); m++) {
    const survivalProbability = Math.pow(1 - churn, m - 1);
    const expansionFactor = Math.pow(1 + expansion, m - 1);
    const expectedCashFlow = arpu * margin * survivalProbability * expansionFactor;
    const discountFactor = Math.pow(1 + monthlyDiscount, m);
    discountedNpvLtv += expectedCashFlow / discountFactor;
  }

  // CAC & Ratios
  const cac = Math.max(0, Number(input.estimatedCac) || 0);
  const ltvToCacRatio = cac > 0 ? undiscountedLtv / cac : 0;
  const paybackMonths = monthlyGrossProfitPerUser > 0 && cac > 0 ? cac / monthlyGrossProfitPerUser : 0;

  // Diagnostic
  let status: SaasLtvResult["diagnostic"]["status"] = "healthy";
  let headline = "Strong SaaS Unit Economics";
  let description = `With a ${undiscountedLtv > 0 ? "healthy" : "nominal"} LTV of ${formatLtvCurrency(
    undiscountedLtv
  )}, your recurring model generates sustained value.`;

  if (churnPercent >= 5.0) {
    status = "critical";
    headline = "High Customer Churn Warning";
    description = `Monthly churn of ${churnPercent.toFixed(1)}% (${annualizedChurnPercent.toFixed(
      1
    )}% annualized) drains customer equity. Average lifespan is only ${customerLifespanMonths.toFixed(1)} months.`;
  } else if (netRevenueRetentionPercent >= 115) {
    status = "exceptional";
    headline = "World-Class Net Expansion (NRR > 115%)";
    description = `Your accounts expand faster than logo churn. Customer cohort value compounds over time.`;
  } else if (cac > 0 && ltvToCacRatio < 2.0) {
    status = "suboptimal";
    headline = "Sub-Optimal LTV:CAC Ratio";
    description = `LTV:CAC of ${ltvToCacRatio.toFixed(1)}x is below the 3.0x venture threshold. Focus on lowering CAC or extending retention.`;
  }

  return {
    arpuMonthly: arpu,
    grossMarginPercent: marginPercent,
    monthlyChurnPercent: churnPercent,
    netChurnPercent: Math.round(netChurnPercent * 100) / 100,
    annualizedChurnPercent: Math.round(annualizedChurnPercent * 10) / 10,
    netRevenueRetentionPercent: Math.round(netRevenueRetentionPercent * 10) / 10,
    customerLifespanMonths: Math.round(customerLifespanMonths * 10) / 10,
    undiscountedLifetimeRevenue: Math.round(undiscountedLifetimeRevenue * 100) / 100,
    undiscountedLtv: Math.round(undiscountedLtv * 100) / 100,
    discountedNpvLtv: Math.round(discountedNpvLtv * 100) / 100,
    monthlyGrossProfitPerUser: Math.round(monthlyGrossProfitPerUser * 100) / 100,
    estimatedCac: cac,
    ltvToCacRatio: Math.round(ltvToCacRatio * 100) / 100,
    paybackMonths: Math.round(paybackMonths * 10) / 10,
    diagnostic: { status, headline, description },
  };
}

// ---------------------------------------------------------------------------
// 2. E-Commerce / Transactional LTV
// ---------------------------------------------------------------------------
export interface EcommerceLtvInput {
  averageOrderValue: number; // AOV
  purchaseFrequencyPerYear: number; // Orders per customer per year
  customerLifespanYears: number; // Number of years a customer stays active
  grossMarginPercent: number; // Product gross margin %
  repeatPurchaseRatePercent?: number; // % of first-time buyers who make a 2nd order
}

export interface EcommerceLtvResult {
  averageOrderValue: number;
  purchaseFrequencyPerYear: number;
  customerLifespanYears: number;
  grossMarginPercent: number;
  totalLifetimeOrders: number;
  annualRevenuePerCustomer: number;
  lifetimeRevenue: number;
  ltv: number; // Lifetime Gross Margin
  maxAllowableCac: number; // Typically 33% of LTV for sustainable DTC
  grossProfitPerOrder: number;
}

export function calculateEcommerceLtv(
  input: EcommerceLtvInput
): EcommerceLtvResult {
  const aov = Math.max(0, Number(input.averageOrderValue) || 0);
  const freq = Math.max(0.1, Number(input.purchaseFrequencyPerYear) || 1);
  const lifespanYears = Math.max(0.1, Number(input.customerLifespanYears) || 1);
  const marginPercent = Math.max(1, Math.min(100, Number(input.grossMarginPercent) || 50));
  const margin = marginPercent / 100;

  const totalLifetimeOrders = freq * lifespanYears;
  const annualRevenuePerCustomer = aov * freq;
  const lifetimeRevenue = annualRevenuePerCustomer * lifespanYears;
  const ltv = lifetimeRevenue * margin;
  const grossProfitPerOrder = aov * margin;

  // Max allowable CAC benchmark for healthy 3x LTV:CAC
  const maxAllowableCac = ltv / 3;

  return {
    averageOrderValue: aov,
    purchaseFrequencyPerYear: freq,
    customerLifespanYears: lifespanYears,
    grossMarginPercent: marginPercent,
    totalLifetimeOrders: Math.round(totalLifetimeOrders * 10) / 10,
    annualRevenuePerCustomer: Math.round(annualRevenuePerCustomer * 100) / 100,
    lifetimeRevenue: Math.round(lifetimeRevenue * 100) / 100,
    ltv: Math.round(ltv * 100) / 100,
    maxAllowableCac: Math.round(maxAllowableCac * 100) / 100,
    grossProfitPerOrder: Math.round(grossProfitPerOrder * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// 3. Customer Tier Segmentation & Base Equity
// ---------------------------------------------------------------------------
export interface CustomerTier {
  id: string;
  tierName: string;
  customerCount: number;
  arpuMonthly: number;
  monthlyChurnPercent: number;
  grossMarginPercent: number;
}

export interface TierAnalysis {
  id: string;
  tierName: string;
  customerCount: number;
  customerSharePercent: number;
  arpuMonthly: number;
  monthlyChurnPercent: number;
  lifespanMonths: number;
  tierLtv: number;
  tierAggregateEquity: number; // customerCount * tierLtv
  equitySharePercent: number;
}

export function calculateTierSegmentation(
  tiers: CustomerTier[]
): {
  tiers: TierAnalysis[];
  totalCustomers: number;
  totalCustomerEquity: number;
  blendedLtv: number;
} {
  const totalCustomers = tiers.reduce((sum, t) => sum + (Math.max(0, t.customerCount) || 0), 0);

  // Calculate LTV per tier
  const analyzedTiers: TierAnalysis[] = tiers.map((t) => {
    const count = Math.max(0, t.customerCount) || 0;
    const arpu = Math.max(0, t.arpuMonthly) || 0;
    const churn = Math.max(0.01, Math.min(100, t.monthlyChurnPercent || 3)) / 100;
    const margin = Math.max(1, Math.min(100, t.grossMarginPercent || 80)) / 100;

    const lifespan = Math.min(120, 1 / churn);
    const ltv = arpu * lifespan * margin;
    const aggregateEquity = count * ltv;
    const shareCust = totalCustomers > 0 ? (count / totalCustomers) * 100 : 0;

    return {
      id: t.id,
      tierName: t.tierName,
      customerCount: count,
      customerSharePercent: Math.round(shareCust * 10) / 10,
      arpuMonthly: arpu,
      monthlyChurnPercent: t.monthlyChurnPercent,
      lifespanMonths: Math.round(lifespan * 10) / 10,
      tierLtv: Math.round(ltv * 100) / 100,
      tierAggregateEquity: Math.round(aggregateEquity),
      equitySharePercent: 0, // set below
    };
  });

  const totalCustomerEquity = analyzedTiers.reduce((sum, t) => sum + t.tierAggregateEquity, 0);

  analyzedTiers.forEach((t) => {
    t.equitySharePercent =
      totalCustomerEquity > 0 ? Math.round((t.tierAggregateEquity / totalCustomerEquity) * 1000) / 10 : 0;
  });

  const blendedLtv = totalCustomers > 0 ? totalCustomerEquity / totalCustomers : 0;

  return {
    tiers: analyzedTiers,
    totalCustomers,
    totalCustomerEquity,
    blendedLtv: Math.round(blendedLtv * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// 4. Cohort Retention Decay Projections
// ---------------------------------------------------------------------------
export interface CohortMilestone {
  month: number;
  activeCustomerRatePercent: number; // % of original cohort active
  cumulativeRevenuePerUser: number;
  cumulativeGrossProfitPerUser: number;
}

export function calculateCohortDecay(
  arpuMonthly: number,
  grossMarginPercent: number,
  monthlyChurnPercent: number
): CohortMilestone[] {
  const arpu = Math.max(0, arpuMonthly);
  const margin = Math.max(0.01, Math.min(1, grossMarginPercent / 100));
  const churn = Math.max(0.001, Math.min(1, monthlyChurnPercent / 100));

  const milestones = [1, 3, 6, 12, 24, 36, 60];

  return milestones.map((targetMonth) => {
    let cumRev = 0;
    for (let m = 1; m <= targetMonth; m++) {
      const activeProb = Math.pow(1 - churn, m - 1);
      cumRev += arpu * activeProb;
    }

    const activeRate = Math.pow(1 - churn, targetMonth - 1) * 100;
    const cumProfit = cumRev * margin;

    return {
      month: targetMonth,
      activeCustomerRatePercent: Math.round(activeRate * 10) / 10,
      cumulativeRevenuePerUser: Math.round(cumRev * 100) / 100,
      cumulativeGrossProfitPerUser: Math.round(cumProfit * 100) / 100,
    };
  });
}

// ---------------------------------------------------------------------------
// 5. What-If Sensitivity Modeler
// ---------------------------------------------------------------------------
export interface SensitivityResult {
  baseLtv: number;
  churnReduced1Percent: { ltv: number; percentageGain: number };
  churnReduced2Percent: { ltv: number; percentageGain: number };
  arpuIncreased10Percent: { ltv: number; percentageGain: number };
  arpuIncreased20Percent: { ltv: number; percentageGain: number };
  marginIncreased5Percent: { ltv: number; percentageGain: number };
}

export function calculateSensitivityAnalysis(
  arpu: number,
  grossMarginPercent: number,
  monthlyChurnPercent: number
): SensitivityResult {
  const baseMargin = Math.max(1, grossMarginPercent) / 100;
  const baseChurn = Math.max(0.01, monthlyChurnPercent) / 100;
  const baseLtv = (arpu * (1 / baseChurn)) * baseMargin;

  const calcDiff = (newLtv: number) => ({
    ltv: Math.round(newLtv * 100) / 100,
    percentageGain: baseLtv > 0 ? Math.round(((newLtv - baseLtv) / baseLtv) * 1000) / 10 : 0,
  });

  // Churn -1%
  const churn1 = Math.max(0.005, (monthlyChurnPercent - 1) / 100);
  const ltvChurn1 = arpu * (1 / churn1) * baseMargin;

  // Churn -2%
  const churn2 = Math.max(0.002, (monthlyChurnPercent - 2) / 100);
  const ltvChurn2 = arpu * (1 / churn2) * baseMargin;

  // ARPU +10%
  const ltvArpu10 = arpu * 1.1 * (1 / baseChurn) * baseMargin;

  // ARPU +20%
  const ltvArpu20 = arpu * 1.2 * (1 / baseChurn) * baseMargin;

  // Margin +5%
  const margin5 = Math.min(1.0, baseMargin + 0.05);
  const ltvMargin5 = arpu * (1 / baseChurn) * margin5;

  return {
    baseLtv: Math.round(baseLtv * 100) / 100,
    churnReduced1Percent: calcDiff(ltvChurn1),
    churnReduced2Percent: calcDiff(ltvChurn2),
    arpuIncreased10Percent: calcDiff(ltvArpu10),
    arpuIncreased20Percent: calcDiff(ltvArpu20),
    marginIncreased5Percent: calcDiff(ltvMargin5),
  };
}

// ---------------------------------------------------------------------------
// 6. Curated Business Presets
// ---------------------------------------------------------------------------
export interface LtvPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  currency: string;
  saasInput: SaasLtvInput;
  ecommerceInput: EcommerceLtvInput;
  tiers: CustomerTier[];
}

export const LTV_PRESETS: LtvPreset[] = [
  {
    id: "b2b-saas-enterprise",
    name: "Enterprise B2B SaaS",
    badge: "120% NRR • Low Churn",
    description: "High-ticket enterprise software with expansion revenue, $2,400 monthly ARPU, and 0.8% churn.",
    currency: "USD",
    saasInput: {
      arpuMonthly: 2400,
      grossMarginPercent: 85,
      monthlyChurnPercent: 0.8,
      monthlyExpansionPercent: 1.5,
      annualDiscountRatePercent: 10,
      estimatedCac: 12000,
    },
    ecommerceInput: {
      averageOrderValue: 5000,
      purchaseFrequencyPerYear: 4,
      customerLifespanYears: 4,
      grossMarginPercent: 80,
    },
    tiers: [
      { id: "t-1", tierName: "Strategic Enterprise", customerCount: 25, arpuMonthly: 8500, monthlyChurnPercent: 0.5, grossMarginPercent: 88 },
      { id: "t-2", tierName: "Mid-Market Growth", customerCount: 80, arpuMonthly: 2800, monthlyChurnPercent: 0.9, grossMarginPercent: 85 },
      { id: "t-3", tierName: "Commercial / SMB", customerCount: 240, arpuMonthly: 950, monthlyChurnPercent: 1.8, grossMarginPercent: 80 },
    ],
  },
  {
    id: "b2b-saas-smb",
    name: "Self-Serve B2B SaaS",
    badge: "$120 ARPU • Product-Led",
    description: "Inbound PLG product with $120 monthly subscription, 82% margin, and 2.5% monthly churn.",
    currency: "USD",
    saasInput: {
      arpuMonthly: 120,
      grossMarginPercent: 82,
      monthlyChurnPercent: 2.5,
      monthlyExpansionPercent: 0.8,
      annualDiscountRatePercent: 10,
      estimatedCac: 450,
    },
    ecommerceInput: {
      averageOrderValue: 250,
      purchaseFrequencyPerYear: 3,
      customerLifespanYears: 2.5,
      grossMarginPercent: 75,
    },
    tiers: [
      { id: "t-1", tierName: "Team Pro Plan", customerCount: 150, arpuMonthly: 299, monthlyChurnPercent: 1.8, grossMarginPercent: 85 },
      { id: "t-2", tierName: "Starter Standard", customerCount: 650, arpuMonthly: 89, monthlyChurnPercent: 2.9, grossMarginPercent: 80 },
      { id: "t-3", tierName: "Solo Freelance", customerCount: 1200, arpuMonthly: 39, monthlyChurnPercent: 4.2, grossMarginPercent: 78 },
    ],
  },
  {
    id: "b2c-mobile-app",
    name: "Consumer App Subscription",
    badge: "High Volume B2C",
    description: "Mobile fitness or productivity app with $14.99/mo ARPU, Apple IAP, and 5.5% monthly churn.",
    currency: "USD",
    saasInput: {
      arpuMonthly: 14.99,
      grossMarginPercent: 78,
      monthlyChurnPercent: 5.5,
      monthlyExpansionPercent: 0.2,
      annualDiscountRatePercent: 12,
      estimatedCac: 35,
    },
    ecommerceInput: {
      averageOrderValue: 45,
      purchaseFrequencyPerYear: 2,
      customerLifespanYears: 1.5,
      grossMarginPercent: 65,
    },
    tiers: [
      { id: "t-1", tierName: "Annual VIP Pass", customerCount: 3500, arpuMonthly: 19.99, monthlyChurnPercent: 3.5, grossMarginPercent: 82 },
      { id: "t-2", tierName: "Monthly Premium", customerCount: 12000, arpuMonthly: 12.99, monthlyChurnPercent: 6.2, grossMarginPercent: 75 },
    ],
  },
  {
    id: "dtc-ecommerce",
    name: "E-Commerce DTC Brand",
    badge: "$75 AOV • 3.2x Repeat",
    description: "Retail lifestyle brand with $75 AOV, 3.2 repeat orders per year, and 2.5-year average customer lifespan.",
    currency: "USD",
    saasInput: {
      arpuMonthly: 45,
      grossMarginPercent: 55,
      monthlyChurnPercent: 7.5,
      monthlyExpansionPercent: 0,
      annualDiscountRatePercent: 10,
      estimatedCac: 25,
    },
    ecommerceInput: {
      averageOrderValue: 75,
      purchaseFrequencyPerYear: 3.2,
      customerLifespanYears: 2.5,
      grossMarginPercent: 58,
      repeatPurchaseRatePercent: 42,
    },
    tiers: [
      { id: "t-1", tierName: "VIP Repeat Buyers", customerCount: 850, arpuMonthly: 120, monthlyChurnPercent: 3.0, grossMarginPercent: 60 },
      { id: "t-2", tierName: "Occasional Shoppers", customerCount: 4200, arpuMonthly: 35, monthlyChurnPercent: 8.5, grossMarginPercent: 55 },
    ],
  },
  {
    id: "fintech-wealth",
    name: "Fintech & Wealth Platform",
    badge: "High Retention • AuM",
    description: "Wealth management platform with $85 monthly fee, low 1.2% churn, and high referral stickiness.",
    currency: "USD",
    saasInput: {
      arpuMonthly: 85,
      grossMarginPercent: 88,
      monthlyChurnPercent: 1.2,
      monthlyExpansionPercent: 1.1,
      annualDiscountRatePercent: 10,
      estimatedCac: 600,
    },
    ecommerceInput: {
      averageOrderValue: 120,
      purchaseFrequencyPerYear: 12,
      customerLifespanYears: 5,
      grossMarginPercent: 85,
    },
    tiers: [
      { id: "t-1", tierName: "Private Wealth", customerCount: 120, arpuMonthly: 450, monthlyChurnPercent: 0.6, grossMarginPercent: 90 },
      { id: "t-2", tierName: "Active Investor", customerCount: 850, arpuMonthly: 95, monthlyChurnPercent: 1.1, grossMarginPercent: 88 },
      { id: "t-3", tierName: "Retail Saver", customerCount: 3200, arpuMonthly: 25, monthlyChurnPercent: 2.2, grossMarginPercent: 82 },
    ],
  },
];

// ============================================================================
// ToolVerse Business Suite: Revenue Analytics Engine
// Covers: Product Revenue, Sales Channel Mix, Cohort Revenue, Seasonality,
//         Revenue Waterfall, Revenue-Per-Unit, Revenue Forecasting & Goals
// ============================================================================

export type RevenueModel =
  | "unit_sales"
  | "subscription"
  | "usage_based"
  | "marketplace"
  | "project_based";

export type PricingTier = {
  id: string;
  name: string;
  unitPrice: number;
  units: number;
  discountPercent: number;
};

export interface RevenueInput {
  model: RevenueModel;
  currency: string;
  tiers: PricingTier[];
  refundRate: number;
  returnRate: number;
  commissionRate: number;
  seasonalityFactors: number[];
  monthlyGrowthRate: number;
  projectionMonths: number;
}

export interface TierBreakdown {
  id: string;
  name: string;
  unitPrice: number;
  units: number;
  discountPercent: number;
  grossRevenue: number;
  discountAmount: number;
  netRevenue: number;
  percentage: number;
}

export interface RevenueCalculation {
  grossRevenue: number;
  totalDiscounts: number;
  netRevenue: number;
  refundAmount: number;
  returnAmount: number;
  commissionAmount: number;
  adjustedRevenue: number;
  revenuePerUnit: number;
  totalUnits: number;
  tiers: TierBreakdown[];
  annualRunRate: number;
  annualAdjusted: number;
  effectiveDiscountRate: number;
  netMarginAfterDeductions: number;
}

export interface RevenueProjection {
  month: number;
  monthLabel: string;
  baseRevenue: number;
  adjustedForSeasonality: number;
  cumulativeRevenue: number;
  growthVsMonth1: number;
}

export interface RevenueProjectionResult {
  months: RevenueProjection[];
  peakMonth: { label: string; revenue: number };
  troughMonth: { label: string; revenue: number };
  totalProjected: number;
  averageMonthly: number;
  compoundedEndRevenue: number;
}

export interface WaterfallStep {
  label: string;
  value: number;
  type: "positive" | "negative" | "neutral";
  running: number;
}

export const REVENUE_CURRENCIES: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: "$", name: "US Dollar" },
  EUR: { symbol: "euro", name: "Euro" },
  GBP: { symbol: "pound", name: "British Pound" },
  INR: { symbol: "Rs", name: "Indian Rupee" },
  CAD: { symbol: "CA$", name: "Canadian Dollar" },
  AUD: { symbol: "AU$", name: "Australian Dollar" },
  JPY: { symbol: "JPY", name: "Japanese Yen" },
  SGD: { symbol: "SG$", name: "Singapore Dollar" },
  AED: { symbol: "AED", name: "UAE Dirham" },
};

export function formatRevenueCurrency(amount: number, currencyCode: string): string {
  const config = REVENUE_CURRENCIES[currencyCode] || REVENUE_CURRENCIES.USD;
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (absAmount >= 1_000_000_000) {
    return `${sign}${config.symbol}${(absAmount / 1_000_000_000).toFixed(2)}B`;
  }
  if (absAmount >= 1_000_000) {
    return `${sign}${config.symbol}${(absAmount / 1_000_000).toFixed(2)}M`;
  }
  if (absAmount >= 1_000) {
    return `${sign}${config.symbol}${(absAmount / 1_000).toFixed(1)}K`;
  }
  return `${sign}${config.symbol}${absAmount.toFixed(2)}`;
}

export function formatRevenueNumber(num: number, decimals: number = 2): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function calculateRevenue(input: RevenueInput): RevenueCalculation {
  const { tiers, refundRate, returnRate, commissionRate } = input;

  let grossRevenue = 0;
  let totalDiscounts = 0;
  let totalUnits = 0;
  let netRevenue = 0;

  const tierBreakdowns: TierBreakdown[] = tiers.map((tier) => {
    const units = Math.max(0, Number(tier.units) || 0);
    const price = Math.max(0, Number(tier.unitPrice) || 0);
    const discount = Math.min(100, Math.max(0, Number(tier.discountPercent) || 0));

    const gross = formatRevenueNumber(units * price);
    const discountAmt = formatRevenueNumber((gross * discount) / 100);
    const net = formatRevenueNumber(gross - discountAmt);

    grossRevenue += gross;
    totalDiscounts += discountAmt;
    totalUnits += units;
    netRevenue += net;

    return {
      id: tier.id,
      name: tier.name,
      unitPrice: price,
      units,
      discountPercent: discount,
      grossRevenue: gross,
      discountAmount: discountAmt,
      netRevenue: net,
      percentage: 0,
    };
  });

  tierBreakdowns.forEach((t) => {
    t.percentage = netRevenue > 0 ? formatRevenueNumber((t.netRevenue / netRevenue) * 100, 1) : 0;
  });

  grossRevenue = formatRevenueNumber(grossRevenue);
  totalDiscounts = formatRevenueNumber(totalDiscounts);
  netRevenue = formatRevenueNumber(netRevenue);

  const refundAmt = formatRevenueNumber((netRevenue * Math.min(100, Math.max(0, refundRate))) / 100);
  const returnAmt = formatRevenueNumber((netRevenue * Math.min(100, Math.max(0, returnRate))) / 100);
  const commAmt = formatRevenueNumber((netRevenue * Math.min(100, Math.max(0, commissionRate))) / 100);
  const adjustedRevenue = formatRevenueNumber(Math.max(0, netRevenue - refundAmt - returnAmt - commAmt));

  const revenuePerUnit = totalUnits > 0 ? formatRevenueNumber(adjustedRevenue / totalUnits) : 0;
  const annualRunRate = formatRevenueNumber(netRevenue * 12);
  const annualAdjusted = formatRevenueNumber(adjustedRevenue * 12);

  const effectiveDiscountRate = grossRevenue > 0 ? formatRevenueNumber((totalDiscounts / grossRevenue) * 100, 1) : 0;
  const netMarginAfterDeductions = grossRevenue > 0 ? formatRevenueNumber((adjustedRevenue / grossRevenue) * 100, 1) : 0;

  return {
    grossRevenue,
    totalDiscounts,
    netRevenue,
    refundAmount: refundAmt,
    returnAmount: returnAmt,
    commissionAmount: commAmt,
    adjustedRevenue,
    revenuePerUnit,
    totalUnits,
    tiers: tierBreakdowns,
    annualRunRate,
    annualAdjusted,
    effectiveDiscountRate,
    netMarginAfterDeductions,
  };
}

export function buildRevenueWaterfall(calc: RevenueCalculation): WaterfallStep[] {
  const steps: WaterfallStep[] = [];
  let running = 0;

  steps.push({ label: "Gross Revenue", value: calc.grossRevenue, type: "positive", running: calc.grossRevenue });
  running = calc.grossRevenue;

  if (calc.totalDiscounts > 0) {
    running -= calc.totalDiscounts;
    steps.push({ label: "Volume Discounts", value: -calc.totalDiscounts, type: "negative", running });
  }

  steps.push({ label: "Net Revenue", value: calc.netRevenue, type: "neutral", running: calc.netRevenue });

  if (calc.refundAmount > 0) {
    running = calc.netRevenue - calc.refundAmount;
    steps.push({ label: "Refunds", value: -calc.refundAmount, type: "negative", running });
  }

  if (calc.returnAmount > 0) {
    running -= calc.returnAmount;
    steps.push({ label: "Returns", value: -calc.returnAmount, type: "negative", running });
  }

  if (calc.commissionAmount > 0) {
    running -= calc.commissionAmount;
    steps.push({ label: "Commission", value: -calc.commissionAmount, type: "negative", running });
  }

  steps.push({ label: "Adjusted Revenue", value: calc.adjustedRevenue, type: "positive", running: calc.adjustedRevenue });
  return steps;
}

export function calculateRevenueProjection(
  baseMonthlyRevenue: number,
  monthlyGrowthRate: number,
  seasonalityFactors: number[],
  months: number = 12
): RevenueProjectionResult {
  const growthDecimal = monthlyGrowthRate / 100;
  const factors = seasonalityFactors.length === 12 ? seasonalityFactors : new Array(12).fill(1.0);

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const projections: RevenueProjection[] = [];
  let cumulative = 0;

  for (let i = 0; i < months; i++) {
    const compounded = baseMonthlyRevenue * Math.pow(1 + growthDecimal, i);
    const seasonalAdjusted = formatRevenueNumber(compounded * (factors[i % 12] ?? 1.0));
    cumulative += seasonalAdjusted;

    projections.push({
      month: i + 1,
      monthLabel: months === 12 ? MONTH_NAMES[i] : `Month ${i + 1}`,
      baseRevenue: formatRevenueNumber(compounded),
      adjustedForSeasonality: seasonalAdjusted,
      cumulativeRevenue: formatRevenueNumber(cumulative),
      growthVsMonth1: formatRevenueNumber(
        i === 0 ? 0 : ((seasonalAdjusted - projections[0].adjustedForSeasonality) /
          Math.max(1, projections[0].adjustedForSeasonality)) * 100, 1
      ),
    });
  }

  const sorted = [...projections].sort((a, b) => b.adjustedForSeasonality - a.adjustedForSeasonality);
  const peak = sorted[0];
  const trough = sorted[sorted.length - 1];

  return {
    months: projections,
    peakMonth: { label: peak.monthLabel, revenue: peak.adjustedForSeasonality },
    troughMonth: { label: trough.monthLabel, revenue: trough.adjustedForSeasonality },
    totalProjected: formatRevenueNumber(cumulative),
    averageMonthly: formatRevenueNumber(cumulative / months),
    compoundedEndRevenue: formatRevenueNumber(projections[projections.length - 1].adjustedForSeasonality),
  };
}

export interface RevenueHealthScore {
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  label: string;
  insights: string[];
}

export function scoreRevenueHealth(calc: RevenueCalculation, monthlyGrowthRate: number): RevenueHealthScore {
  const insights: string[] = [];
  let score = 0;

  if (calc.effectiveDiscountRate < 5) { score += 25; insights.push("Minimal discounting - strong pricing power"); }
  else if (calc.effectiveDiscountRate < 15) { score += 18; insights.push("Moderate discounting - review volume deals"); }
  else if (calc.effectiveDiscountRate < 30) { score += 10; insights.push("High discounting - pricing integrity at risk"); }
  else { insights.push("Excessive discounting - revenue quality is poor"); }

  if (calc.netMarginAfterDeductions >= 90) { score += 30; insights.push("Excellent net revenue retention after deductions"); }
  else if (calc.netMarginAfterDeductions >= 75) { score += 20; insights.push("Some revenue leaking through refunds or commissions"); }
  else if (calc.netMarginAfterDeductions >= 50) { score += 10; insights.push("Significant revenue lost to deductions"); }
  else { insights.push("Over half of gross revenue is lost to deductions"); }

  const topTierPct = calc.tiers.length > 0 ? Math.max(...calc.tiers.map((t) => t.percentage)) : 100;
  if (calc.tiers.length >= 3 && topTierPct < 60) { score += 20; insights.push("Well-diversified revenue across product tiers"); }
  else if (calc.tiers.length >= 2 && topTierPct < 80) { score += 12; insights.push("Revenue moderately concentrated in top tier"); }
  else { score += 5; insights.push("Revenue heavily concentrated - single-product risk"); }

  if (monthlyGrowthRate >= 10) { score += 25; insights.push("Exceptional monthly growth - hyper-growth trajectory"); }
  else if (monthlyGrowthRate >= 5) { score += 20; insights.push("Strong monthly growth rate"); }
  else if (monthlyGrowthRate >= 2) { score += 12; insights.push("Moderate growth - explore new acquisition channels"); }
  else if (monthlyGrowthRate > 0) { score += 5; insights.push("Slow growth - review product-market fit"); }
  else { insights.push("Negative or zero growth - business at critical risk"); }

  score = Math.min(100, Math.max(0, score));

  let grade: RevenueHealthScore["grade"];
  let label: string;
  if (score >= 90) { grade = "A+"; label = "Exceptional"; }
  else if (score >= 80) { grade = "A"; label = "Excellent"; }
  else if (score >= 65) { grade = "B"; label = "Good"; }
  else if (score >= 50) { grade = "C"; label = "Moderate"; }
  else if (score >= 35) { grade = "D"; label = "Weak"; }
  else { grade = "F"; label = "Critical"; }

  return { score, grade, label, insights };
}

export interface RevenueGoal {
  targetRevenue: number;
  currentRevenue: number;
  achievementPercent: number;
  gap: number;
  monthsToTarget: number;
  status: "achieved" | "on_track" | "at_risk" | "off_track";
}

export function calculateRevenueGoal(
  targetRevenue: number,
  currentRevenue: number,
  monthlyGrowthRate: number
): RevenueGoal {
  const target = Math.max(0, targetRevenue);
  const current = Math.max(0, currentRevenue);
  const achievementPercent = target > 0 ? formatRevenueNumber((current / target) * 100, 1) : 0;
  const gap = formatRevenueNumber(target - current);

  let monthsToTarget = 0;
  if (current >= target) {
    monthsToTarget = 0;
  } else if (monthlyGrowthRate <= 0) {
    monthsToTarget = 999;
  } else {
    const r = monthlyGrowthRate / 100;
    monthsToTarget = Math.ceil(Math.log(target / current) / Math.log(1 + r));
  }

  let status: RevenueGoal["status"];
  if (current >= target) { status = "achieved"; }
  else if (achievementPercent >= 80) { status = "on_track"; }
  else if (achievementPercent >= 50) { status = "at_risk"; }
  else { status = "off_track"; }

  return { targetRevenue: target, currentRevenue: current, achievementPercent, gap, monthsToTarget, status };
}

export interface RevenuePreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  model: RevenueModel;
  tiers: PricingTier[];
  refundRate: number;
  returnRate: number;
  commissionRate: number;
  monthlyGrowthRate: number;
  currency: string;
}

export const REVENUE_PRESETS: RevenuePreset[] = [
  {
    id: "saas-tiered",
    name: "SaaS - Tiered Subscription",
    badge: "SaaS - 3 Tiers",
    description: "Classic freemium-to-enterprise pricing model.",
    model: "subscription",
    tiers: [
      { id: "starter", name: "Starter ($29/mo)", unitPrice: 29, units: 200, discountPercent: 0 },
      { id: "pro", name: "Pro ($79/mo)", unitPrice: 79, units: 80, discountPercent: 5 },
      { id: "enterprise", name: "Enterprise ($249/mo)", unitPrice: 249, units: 15, discountPercent: 10 },
    ],
    refundRate: 2,
    returnRate: 0,
    commissionRate: 5,
    monthlyGrowthRate: 7,
    currency: "USD",
  },
  {
    id: "ecommerce-mixed",
    name: "E-Commerce - Product Mix",
    badge: "E-Com - Physical Goods",
    description: "Multi-SKU e-commerce with volume discounts and returns.",
    model: "unit_sales",
    tiers: [
      { id: "basic", name: "Basic Widget ($25)", unitPrice: 25, units: 500, discountPercent: 0 },
      { id: "premium", name: "Premium Widget ($75)", unitPrice: 75, units: 150, discountPercent: 8 },
      { id: "bundle", name: "3-Pack Bundle ($60)", unitPrice: 60, units: 80, discountPercent: 15 },
    ],
    refundRate: 3,
    returnRate: 5,
    commissionRate: 12,
    monthlyGrowthRate: 4,
    currency: "USD",
  },
  {
    id: "agency-projects",
    name: "Agency - Project-Based",
    badge: "Agency - Services",
    description: "Service agency with small, mid, and enterprise projects.",
    model: "project_based",
    tiers: [
      { id: "small", name: "Small Projects ($2,000)", unitPrice: 2000, units: 8, discountPercent: 0 },
      { id: "mid", name: "Mid Projects ($8,000)", unitPrice: 8000, units: 3, discountPercent: 5 },
      { id: "enterprise", name: "Enterprise ($25,000)", unitPrice: 25000, units: 1, discountPercent: 10 },
    ],
    refundRate: 1,
    returnRate: 0,
    commissionRate: 8,
    monthlyGrowthRate: 3,
    currency: "USD",
  },
  {
    id: "marketplace",
    name: "Marketplace - GMV Model",
    badge: "Marketplace - Take Rate",
    description: "Two-sided marketplace with 15% take rate on gross merchandise value.",
    model: "marketplace",
    tiers: [
      { id: "gmv", name: "GMV", unitPrice: 15, units: 10000, discountPercent: 0 },
    ],
    refundRate: 2,
    returnRate: 1,
    commissionRate: 0,
    monthlyGrowthRate: 8,
    currency: "USD",
  },
  {
    id: "india-saas",
    name: "Indian SaaS - INR Pricing",
    badge: "India - SaaS",
    description: "India-focused SaaS product with INR pricing.",
    model: "subscription",
    tiers: [
      { id: "basic", name: "Basic", unitPrice: 499, units: 300, discountPercent: 0 },
      { id: "growth", name: "Growth", unitPrice: 1499, units: 80, discountPercent: 5 },
      { id: "scale", name: "Scale", unitPrice: 4999, units: 20, discountPercent: 10 },
    ],
    refundRate: 3,
    returnRate: 0,
    commissionRate: 3,
    monthlyGrowthRate: 10,
    currency: "INR",
  },
];

export const SEASONALITY_PROFILES: Record<string, { name: string; factors: number[] }> = {
  flat: { name: "Flat (No Seasonality)", factors: [1,1,1,1,1,1,1,1,1,1,1,1] },
  retail_peak: { name: "Retail (Q4 Peak)", factors: [0.7,0.75,0.8,0.85,0.9,0.85,0.8,0.85,0.95,1.0,1.2,1.5] },
  b2b_saas: { name: "B2B SaaS (Q3-Q4 Strong)", factors: [0.8,0.9,1.0,1.05,1.05,0.95,0.9,0.95,1.1,1.15,1.1,0.85] },
  summer_peak: { name: "Summer Peak (Consumer)", factors: [0.7,0.75,0.85,0.95,1.1,1.3,1.4,1.35,1.1,0.9,0.75,0.7] },
  education: { name: "Education (Academic Calendar)", factors: [0.9,1.1,0.9,0.7,0.6,0.5,0.6,1.2,1.3,1.1,1.0,0.8] },
};

/**
 * SaaS Monthly Recurring Revenue (MRR) & ARR Engine
 * 
 * Implements standard SaaS metrics per Bessemer Venture Partners, SaaStr, and ChartMogul:
 * - MRR Waterfall (Starting, New, Expansion, Reactivation, Contraction, Churned, Ending)
 * - SaaS Quick Ratio & Unit Health Diagnostics
 * - Net Revenue Retention (NRR) and Gross Revenue Retention (GRR)
 * - Multi-Plan Subscription Tiers with Monthly & Annual Billing Normalization
 * - 12-Month Compound MRR & ARR Forward Projections
 * - SaaS Enterprise Valuation Multiples
 */

export type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "CAD" | "AUD" | "JPY" | "SGD" | "AED" | "CHF";

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar (USD)" },
  EUR: { code: "EUR", symbol: "€", name: "Euro (EUR)" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound (GBP)" },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee (INR)" },
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar (CAD)" },
  AUD: { code: "AUD", symbol: "AU$", name: "Australian Dollar (AUD)" },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen (JPY)" },
  SGD: { code: "SGD", symbol: "SG$", name: "Singapore Dollar (SGD)" },
  AED: { code: "AED", symbol: "AED", name: "UAE Dirham (AED)" },
  CHF: { code: "CHF", symbol: "CHF", name: "Swiss Franc (CHF)" },
};

export interface MrrWaterfallInputs {
  startingMrr: number;
  newMrr: number;
  expansionMrr: number;
  reactivationMrr: number;
  contractionMrr: number;
  churnedMrr: number;
}

export interface MrrWaterfallOutputs {
  startingMrr: number;
  newMrr: number;
  expansionMrr: number;
  reactivationMrr: number;
  contractionMrr: number;
  churnedMrr: number;
  grossAdditions: number;
  grossLosses: number;
  netNewMrr: number;
  endingMrr: number;
  arr: number;
  quickRatio: number;
  quickRatioStatus: "exceptional" | "healthy" | "sluggish" | "critical";
  quickRatioLabel: string;
  quickRatioDescription: string;
  netGrowthRate: number;
}

export interface RetentionInputs {
  startingMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnedMrr: number;
  startingCustomers: number;
  churnedCustomers: number;
}

export interface RetentionOutputs {
  nrr: number;
  grr: number;
  nrrStatus: "world-class" | "strong" | "healthy" | "leaky";
  nrrDescription: string;
  logoChurnRate: number;
  netRevenueChurnRate: number;
  valuation: {
    conservative: number; // 4x ARR
    median: number; // 7x ARR
    premium: number; // 12x ARR
  };
}

export interface SubscriptionTier {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlySubscribers: number;
  annualSubscribers: number;
}

export interface TierBreakdownOutputs {
  tiers: Array<
    SubscriptionTier & {
      totalSubscribers: number;
      mrrContribution: number;
      arrContribution: number;
      mrrPercentage: number;
    }
  >;
  totalSubscribers: number;
  totalMrr: number;
  totalArr: number;
  blendedArpu: number;
}

export interface ProjectionMonth {
  month: number;
  monthName: string;
  mrr: number;
  arr: number;
  netNewMrr: number;
  subscribers: number;
  milestones: string[];
}

export interface ProjectionOutputs {
  months: ProjectionMonth[];
  endMrr: number;
  endArr: number;
  totalGrowthPercent: number;
  annualNetGain: number;
}

export interface MrrPreset {
  id: string;
  name: string;
  description: string;
  waterfall: MrrWaterfallInputs;
  startingCustomers: number;
  churnedCustomers: number;
  tiers: SubscriptionTier[];
  monthlyGrowthRate: number;
}

/**
 * 1. Calculate MRR Waterfall, Ending MRR, Net New MRR, ARR, and SaaS Quick Ratio
 */
export function calculateMrrWaterfall(inputs: MrrWaterfallInputs): MrrWaterfallOutputs {
  const startingMrr = Math.max(0, inputs.startingMrr || 0);
  const newMrr = Math.max(0, inputs.newMrr || 0);
  const expansionMrr = Math.max(0, inputs.expansionMrr || 0);
  const reactivationMrr = Math.max(0, inputs.reactivationMrr || 0);
  const contractionMrr = Math.max(0, inputs.contractionMrr || 0);
  const churnedMrr = Math.max(0, inputs.churnedMrr || 0);

  const grossAdditions = newMrr + expansionMrr + reactivationMrr;
  const grossLosses = contractionMrr + churnedMrr;
  const netNewMrr = grossAdditions - grossLosses;
  const endingMrr = Math.max(0, startingMrr + netNewMrr);
  const arr = endingMrr * 12;

  // SaaS Quick Ratio = (New + Expansion + Reactivation) / (Contraction + Churned)
  let quickRatio = 0;
  if (grossLosses > 0) {
    quickRatio = Number((grossAdditions / grossLosses).toFixed(2));
  } else if (grossAdditions > 0) {
    quickRatio = 99.9; // Effectively infinite ratio when churn & contraction are 0
  }

  let quickRatioStatus: MrrWaterfallOutputs["quickRatioStatus"] = "healthy";
  let quickRatioLabel = "Healthy Growth";
  let quickRatioDescription = "Growth is solid and comfortably outpacing customer contraction.";

  if (quickRatio >= 4.0) {
    quickRatioStatus = "exceptional";
    quickRatioLabel = "Exceptional (Hyper-Growth)";
    quickRatioDescription = "Adding $4+ in new expansion revenue for every $1 lost. Top-decile venture SaaS efficiency.";
  } else if (quickRatio >= 2.0) {
    quickRatioStatus = "healthy";
    quickRatioLabel = "Healthy SaaS Growth";
    quickRatioDescription = "Sustainable unit economics where new acquisitions and upsells comfortably absorb churn.";
  } else if (quickRatio >= 1.0) {
    quickRatioStatus = "sluggish";
    quickRatioLabel = "Sluggish / High Friction";
    quickRatioDescription = "Treading water. Churn is consuming over 50% of top-of-funnel acquisitions. Focus on retention.";
  } else {
    quickRatioStatus = "critical";
    quickRatioLabel = "Leaky Bucket (Contracting)";
    quickRatioDescription = "Losses exceed additions. The customer base is actively shrinking in recurring revenue.";
  }

  const netGrowthRate = startingMrr > 0 ? Number(((netNewMrr / startingMrr) * 100).toFixed(2)) : 0;

  return {
    startingMrr,
    newMrr,
    expansionMrr,
    reactivationMrr,
    contractionMrr,
    churnedMrr,
    grossAdditions,
    grossLosses,
    netNewMrr,
    endingMrr,
    arr,
    quickRatio,
    quickRatioStatus,
    quickRatioLabel,
    quickRatioDescription,
    netGrowthRate,
  };
}

/**
 * 2. Calculate Net Revenue Retention (NRR), Gross Revenue Retention (GRR), Logo Churn, and Valuations
 */
export function calculateRetentionMetrics(inputs: RetentionInputs): RetentionOutputs {
  const startingMrr = Math.max(0, inputs.startingMrr || 0);
  const expansionMrr = Math.max(0, inputs.expansionMrr || 0);
  const contractionMrr = Math.max(0, inputs.contractionMrr || 0);
  const churnedMrr = Math.max(0, inputs.churnedMrr || 0);
  const startingCustomers = Math.max(0, inputs.startingCustomers || 0);
  const churnedCustomers = Math.max(0, inputs.churnedCustomers || 0);

  // NRR = (Starting + Expansion - Contraction - Churn) / Starting
  let nrr = 100;
  if (startingMrr > 0) {
    nrr = Number((((startingMrr + expansionMrr - contractionMrr - churnedMrr) / startingMrr) * 100).toFixed(2));
  }

  // GRR = (Starting - Contraction - Churn) / Starting (capped at 100%)
  let grr = 100;
  if (startingMrr > 0) {
    const retained = Math.max(0, startingMrr - contractionMrr - churnedMrr);
    grr = Number(Math.min(100, (retained / startingMrr) * 100).toFixed(2));
  }

  let nrrStatus: RetentionOutputs["nrrStatus"] = "healthy";
  let nrrDescription = "Net retention is healthy and maintaining baseline revenue.";

  if (nrr >= 120) {
    nrrStatus = "world-class";
    nrrDescription = "World-class enterprise net retention (>120%). High expansion and negative net revenue churn.";
  } else if (nrr >= 105) {
    nrrStatus = "strong";
    nrrDescription = "Strong retention (>105%). Existing cohort accounts expand faster than churn losses.";
  } else if (nrr >= 95) {
    nrrStatus = "healthy";
    nrrDescription = "Stable baseline. Upgrades nearly balance cancellations; typical for early-stage B2B SaaS.";
  } else {
    nrrStatus = "leaky";
    nrrDescription = "Below 95% NRR indicates revenue erosion without massive new acquisition replenishment.";
  }

  const logoChurnRate = startingCustomers > 0 ? Number(((churnedCustomers / startingCustomers) * 100).toFixed(2)) : 0;
  const netRevenueChurnRate = startingMrr > 0 ? Number((((churnedMrr + contractionMrr - expansionMrr) / startingMrr) * 100).toFixed(2)) : 0;

  // Ending MRR and ARR for valuation
  const endingMrr = Math.max(0, startingMrr + expansionMrr - contractionMrr - churnedMrr);
  const arr = endingMrr * 12;

  return {
    nrr,
    grr,
    nrrStatus,
    nrrDescription,
    logoChurnRate,
    netRevenueChurnRate,
    valuation: {
      conservative: Math.round(arr * 4),
      median: Math.round(arr * 7),
      premium: Math.round(arr * 12),
    },
  };
}

/**
 * 3. Calculate Subscription Tier Breakdown & Billing Normalization
 */
export function calculateTierBreakdown(tiers: SubscriptionTier[]): TierBreakdownOutputs {
  let totalSubscribers = 0;
  let totalMrr = 0;

  // First pass: compute total subscribers and raw MRR per tier
  const computedTiers = tiers.map((tier) => {
    const mSubs = Math.max(0, tier.monthlySubscribers || 0);
    const aSubs = Math.max(0, tier.annualSubscribers || 0);
    const subTotal = mSubs + aSubs;

    // Monthly plans contribute monthlyPrice directly
    // Annual plans contribute annualPrice / 12 per month
    const monthlyRev = mSubs * Math.max(0, tier.monthlyPrice || 0);
    const annualMonthlyNormalized = aSubs * (Math.max(0, tier.annualPrice || 0) / 12);
    const tierMrr = monthlyRev + annualMonthlyNormalized;
    const tierArr = tierMrr * 12;

    totalSubscribers += subTotal;
    totalMrr += tierMrr;

    return {
      ...tier,
      totalSubscribers: subTotal,
      mrrContribution: Number(tierMrr.toFixed(2)),
      arrContribution: Number(tierArr.toFixed(2)),
      mrrPercentage: 0,
    };
  });

  // Second pass: compute percentage share of total MRR
  const finalTiers = computedTiers.map((t) => ({
    ...t,
    mrrPercentage: totalMrr > 0 ? Number(((t.mrrContribution / totalMrr) * 100).toFixed(1)) : 0,
  }));

  const totalArr = totalMrr * 12;
  const blendedArpu = totalSubscribers > 0 ? Number((totalMrr / totalSubscribers).toFixed(2)) : 0;

  return {
    tiers: finalTiers,
    totalSubscribers,
    totalMrr: Number(totalMrr.toFixed(2)),
    totalArr: Number(totalArr.toFixed(2)),
    blendedArpu,
  };
}

/**
 * 4. Calculate 12-Month Forward Compound MRR Projections
 */
export function calculate12MonthProjections(
  currentMrr: number,
  monthlyNetGrowthRatePercent: number,
  currentSubscribers: number
): ProjectionOutputs {
  const months: ProjectionMonth[] = [];
  let runningMrr = Math.max(0, currentMrr || 0);
  const growthFactor = 1 + (monthlyNetGrowthRatePercent || 0) / 100;
  let runningSubscribers = Math.max(1, currentSubscribers || 1);

  const monthNames = [
    "Month 1", "Month 2", "Month 3", "Month 4",
    "Month 5", "Month 6", "Month 7", "Month 8",
    "Month 9", "Month 10", "Month 11", "Month 12",
  ];

  for (let i = 0; i < 12; i++) {
    const prevMrr = runningMrr;
    runningMrr = Math.max(0, runningMrr * growthFactor);
    const netGain = runningMrr - prevMrr;
    runningSubscribers = Math.max(1, Math.round(runningSubscribers * growthFactor));
    const runningArr = runningMrr * 12;

    const milestones: string[] = [];
    if (prevMrr < 10000 && runningMrr >= 10000) milestones.push("$10k MRR Milestone");
    if (prevMrr < 50000 && runningMrr >= 50000) milestones.push("$50k MRR Milestone");
    if (prevMrr < 83333 && runningMrr >= 83333) milestones.push("$1M ARR ($83.3k MRR)");
    if (prevMrr < 250000 && runningMrr >= 250000) milestones.push("$3M ARR ($250k MRR)");
    if (prevMrr < 416666 && runningMrr >= 416666) milestones.push("$5M ARR ($416k MRR)");
    if (prevMrr < 833333 && runningMrr >= 833333) milestones.push("$10M ARR Milestone");

    months.push({
      month: i + 1,
      monthName: monthNames[i],
      mrr: Math.round(runningMrr),
      arr: Math.round(runningArr),
      netNewMrr: Math.round(netGain),
      subscribers: runningSubscribers,
      milestones,
    });
  }

  const endMrr = months[months.length - 1].mrr;
  const endArr = months[months.length - 1].arr;
  const totalGrowthPercent = currentMrr > 0 ? Number((((endMrr - currentMrr) / currentMrr) * 100).toFixed(1)) : 0;
  const annualNetGain = endMrr - currentMrr;

  return {
    months,
    endMrr,
    endArr,
    totalGrowthPercent,
    annualNetGain,
  };
}

/**
 * 5. Format Currency Values
 */
export function formatMrrCurrency(amount: number, currency: CurrencyCode = "USD"): string {
  const meta = CURRENCIES[currency] || CURRENCIES.USD;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formatted = "";
  if (currency === "INR") {
    formatted = absAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  } else if (currency === "JPY") {
    formatted = absAmount.toLocaleString("ja-JP", { maximumFractionDigits: 0 });
  } else {
    formatted = absAmount.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  return `${isNegative ? "-" : ""}${meta.symbol}${formatted}`;
}

/**
 * 6. Industry Presets
 */
export const MRR_PRESETS: MrrPreset[] = [
  {
    id: "early-b2b-saas",
    name: "Early-Stage B2B Micro-SaaS",
    description: "$18,500 MRR, seed-stage product with strong initial product-market fit and healthy 3.8x Quick Ratio.",
    waterfall: {
      startingMrr: 15000,
      newMrr: 3200,
      expansionMrr: 1400,
      reactivationMrr: 300,
      contractionMrr: 400,
      churnedMrr: 900,
    },
    startingCustomers: 120,
    churnedCustomers: 4,
    tiers: [
      { id: "starter", name: "Starter", monthlyPrice: 49, annualPrice: 490, monthlySubscribers: 60, annualSubscribers: 25 },
      { id: "pro", name: "Professional", monthlyPrice: 149, annualPrice: 1490, monthlySubscribers: 30, annualSubscribers: 15 },
      { id: "agency", name: "Agency / Team", monthlyPrice: 399, annualPrice: 3990, monthlySubscribers: 8, annualSubscribers: 5 },
    ],
    monthlyGrowthRate: 7.5,
  },
  {
    id: "enterprise-scaleup",
    name: "Enterprise B2B Scaleup",
    description: "$185,000 MRR, Series B SaaS with 126% NRR, account expansion driving over 40% of additions.",
    waterfall: {
      startingMrr: 165000,
      newMrr: 22000,
      expansionMrr: 14500,
      reactivationMrr: 2500,
      contractionMrr: 2200,
      churnedMrr: 4800,
    },
    startingCustomers: 210,
    churnedCustomers: 3,
    tiers: [
      { id: "business", name: "Business Core", monthlyPrice: 499, annualPrice: 4990, monthlySubscribers: 80, annualSubscribers: 45 },
      { id: "enterprise", name: "Enterprise Suite", monthlyPrice: 1850, annualPrice: 18500, monthlySubscribers: 35, annualSubscribers: 30 },
      { id: "strategic", name: "Strategic Global", monthlyPrice: 4500, annualPrice: 45000, monthlySubscribers: 10, annualSubscribers: 12 },
    ],
    monthlyGrowthRate: 5.0,
  },
  {
    id: "plg-freemium",
    name: "Product-Led Growth (Freemium)",
    description: "$48,000 MRR, self-serve viral tool with high subscriber volume and automated tier upgrades.",
    waterfall: {
      startingMrr: 42000,
      newMrr: 8500,
      expansionMrr: 2800,
      reactivationMrr: 1200,
      contractionMrr: 1100,
      churnedMrr: 2400,
    },
    startingCustomers: 1450,
    churnedCustomers: 42,
    tiers: [
      { id: "creator", name: "Creator Individual", monthlyPrice: 15, annualPrice: 144, monthlySubscribers: 800, annualSubscribers: 350 },
      { id: "pro-team", name: "Pro Team", monthlyPrice: 49, annualPrice: 470, monthlySubscribers: 240, annualSubscribers: 120 },
      { id: "unlimited", name: "Unlimited Org", monthlyPrice: 199, annualPrice: 1990, monthlySubscribers: 35, annualSubscribers: 20 },
    ],
    monthlyGrowthRate: 8.0,
  },
  {
    id: "consumer-b2c",
    name: "Consumer App Subscription",
    description: "$78,000 MRR, high-volume consumer lifestyle/fitness app with annual upfront commitment discounts.",
    waterfall: {
      startingMrr: 72000,
      newMrr: 14000,
      expansionMrr: 1200,
      reactivationMrr: 2800,
      contractionMrr: 800,
      churnedMrr: 6200,
    },
    startingCustomers: 5800,
    churnedCustomers: 310,
    tiers: [
      { id: "monthly-sub", name: "Standard Monthly", monthlyPrice: 12.99, annualPrice: 120, monthlySubscribers: 2800, annualSubscribers: 0 },
      { id: "annual-sub", name: "Annual Pass (Save 35%)", monthlyPrice: 12.99, annualPrice: 99, monthlySubscribers: 0, annualSubscribers: 4200 },
      { id: "family-sub", name: "Family Bundle", monthlyPrice: 24.99, annualPrice: 220, monthlySubscribers: 350, annualSubscribers: 250 },
    ],
    monthlyGrowthRate: 6.0,
  },
  {
    id: "leaky-bucket",
    name: "Leaky Bucket Diagnostic",
    description: "Contracting business where churned MRR ($6,800) outstrips new MRR ($3,500), yielding Quick Ratio 0.65x.",
    waterfall: {
      startingMrr: 52000,
      newMrr: 3500,
      expansionMrr: 800,
      reactivationMrr: 400,
      contractionMrr: 1800,
      churnedMrr: 5400,
    },
    startingCustomers: 340,
    churnedCustomers: 28,
    tiers: [
      { id: "basic", name: "Legacy Basic", monthlyPrice: 79, annualPrice: 790, monthlySubscribers: 180, annualSubscribers: 40 },
      { id: "advanced", name: "Advanced Legacy", monthlyPrice: 199, annualPrice: 1990, monthlySubscribers: 80, annualSubscribers: 20 },
    ],
    monthlyGrowthRate: -2.0,
  },
];

// tools/business/arrChurnEngine.ts
// Production-grade ARR Calculator + Churn Rate Calculator engine

export interface ARRInput {
  mrrBase: number;
  newMRR: number;
  expansionMRR: number;
  contractionMRR: number;
  churnedMRR: number;
  reactivationMRR: number;
}

export interface ARRResult {
  mrr: number;
  arr: number;
  netNewMRR: number;
  netMRRMovement: number;
  expansionRevenue: number;
  contractionRevenue: number;
  churnedRevenue: number;
  reactivationRevenue: number;
  quickRatio: number;          // (New + Expansion + Reactivation) / (Churn + Contraction)
  growthEfficiency: string;    // grade based on quick ratio
  dailyRunRate: number;
  weeklyRunRate: number;
  quarterlyRunRate: number;
  mrrGrowthDrivers: MRRDriver[];
}

export interface MRRDriver {
  label: string;
  value: number;
  type: "positive" | "negative" | "neutral";
  percentOfMRR: number;
}

export interface ChurnCohort {
  id: string;
  name: string;
  startingCustomers: number;
  churnedCustomers: number;
  startingMRR: number;
  churnedMRR: number;
  expansionMRR: number;
  period: string;
}

export interface ChurnResult {
  id: string;
  name: string;
  period: string;
  startingCustomers: number;
  churnedCustomers: number;
  logoChurnRate: number;          // % customers churned
  logoRetentionRate: number;      // 100 - logoChurnRate
  startingMRR: number;
  churnedMRR: number;
  expansionMRR: number;
  netRevenueRetention: number;    // NRR: (starting - churned + expansion) / starting * 100
  grossRevenueRetention: number;  // GRR: (starting - churned) / starting * 100
  revenueChurnRate: number;       // churnedMRR / startingMRR * 100
  averageRevenuePerCustomer: number;
  impliedAnnualLogoChurn: number;
  impliedCustomerLifespanMonths: number;
  ltv: number;                    // ARPC * lifespan
  churnHealthGrade: "Excellent" | "Good" | "Average" | "Poor" | "Critical";
  churnHealthInsight: string;
}

export interface ChurnBenchmarks {
  smb: { good: number; avg: number };
  midMarket: { good: number; avg: number };
  enterprise: { good: number; avg: number };
}

export const CHURN_BENCHMARKS: ChurnBenchmarks = {
  smb:        { good: 2.0, avg: 5.0 },
  midMarket:  { good: 1.0, avg: 3.0 },
  enterprise: { good: 0.5, avg: 2.0 },
};

export type CustomerSegment = "smb" | "midMarket" | "enterprise";

export const ARR_PRESETS: { name: string; input: ARRInput }[] = [
  { name: "Early SaaS Startup", input: { mrrBase: 50000, newMRR: 12000, expansionMRR: 4000, contractionMRR: 1000, churnedMRR: 3500, reactivationMRR: 500 } },
  { name: "Growth Stage SaaS", input: { mrrBase: 250000, newMRR: 40000, expansionMRR: 20000, contractionMRR: 5000, churnedMRR: 12000, reactivationMRR: 2000 } },
  { name: "Scale-Up Company", input: { mrrBase: 1000000, newMRR: 120000, expansionMRR: 80000, contractionMRR: 15000, churnedMRR: 40000, reactivationMRR: 8000 } },
];

function n(v: number, d = 2): number {
  return Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
}

export function calculateARR(input: ARRInput): ARRResult {
  const { mrrBase, newMRR, expansionMRR, contractionMRR, churnedMRR, reactivationMRR } = input;
  const netNewMRR = n(newMRR + expansionMRR + reactivationMRR - contractionMRR - churnedMRR, 2);
  const mrr = n(mrrBase + netNewMRR, 2);
  const arr = n(mrr * 12, 2);

  const positiveMRR = newMRR + expansionMRR + reactivationMRR;
  const negativeMRR = contractionMRR + churnedMRR;
  const quickRatio = negativeMRR > 0 ? n(positiveMRR / negativeMRR, 2) : 99;

  let growthEfficiency = "Struggling";
  if (quickRatio >= 4) growthEfficiency = "Exceptional (4x+)";
  else if (quickRatio >= 2) growthEfficiency = "Healthy (2-4x)";
  else if (quickRatio >= 1) growthEfficiency = "Acceptable (1-2x)";
  else growthEfficiency = "Struggling (<1x)";

  const mrrGrowthDrivers: MRRDriver[] = [
    { label: "New Business MRR", value: newMRR, type: "positive", percentOfMRR: mrrBase > 0 ? n((newMRR / mrrBase) * 100, 1) : 0 },
    { label: "Expansion MRR", value: expansionMRR, type: "positive", percentOfMRR: mrrBase > 0 ? n((expansionMRR / mrrBase) * 100, 1) : 0 },
    { label: "Reactivation MRR", value: reactivationMRR, type: "positive", percentOfMRR: mrrBase > 0 ? n((reactivationMRR / mrrBase) * 100, 1) : 0 },
    { label: "Contraction MRR", value: -contractionMRR, type: "negative", percentOfMRR: mrrBase > 0 ? n((contractionMRR / mrrBase) * 100, 1) : 0 },
    { label: "Churned MRR", value: -churnedMRR, type: "negative", percentOfMRR: mrrBase > 0 ? n((churnedMRR / mrrBase) * 100, 1) : 0 },
  ];

  return {
    mrr, arr, netNewMRR, netMRRMovement: netNewMRR,
    expansionRevenue: expansionMRR, contractionRevenue: contractionMRR,
    churnedRevenue: churnedMRR, reactivationRevenue: reactivationMRR,
    quickRatio, growthEfficiency,
    dailyRunRate: n(mrr / 30, 2),
    weeklyRunRate: n(mrr / 4.33, 2),
    quarterlyRunRate: n(mrr * 3, 2),
    mrrGrowthDrivers,
  };
}

function gradeChurn(logoChurnRate: number, segment: CustomerSegment): ChurnResult["churnHealthGrade"] {
  const b = CHURN_BENCHMARKS[segment];
  if (logoChurnRate <= b.good / 2) return "Excellent";
  if (logoChurnRate <= b.good) return "Good";
  if (logoChurnRate <= b.avg) return "Average";
  if (logoChurnRate <= b.avg * 1.5) return "Poor";
  return "Critical";
}

function churnInsight(logoChurnRate: number, nrr: number): string {
  if (nrr >= 120 && logoChurnRate <= 2) return "Best-in-class retention. Expansion is outpacing churn — you're in negative net churn territory.";
  if (nrr >= 100) return "Net revenue retention above 100% — expansion MRR is compensating for churn losses effectively.";
  if (logoChurnRate <= 2) return "Low logo churn. Monitor expansion MRR to push NRR above 100%.";
  if (logoChurnRate <= 5) return "Moderate churn. Investigate top churn reasons and implement proactive CS playbooks.";
  return "High churn is a critical risk. Focus on onboarding, engagement scores, and QBR cadence immediately.";
}

export function calculateChurn(cohort: ChurnCohort, segment: CustomerSegment = "smb"): ChurnResult {
  const { id, name, period, startingCustomers, churnedCustomers, startingMRR, churnedMRR, expansionMRR } = cohort;
  const logoChurnRate = startingCustomers > 0 ? n((churnedCustomers / startingCustomers) * 100, 2) : 0;
  const logoRetentionRate = n(100 - logoChurnRate, 2);
  const grossRevenueRetention = startingMRR > 0 ? n(((startingMRR - churnedMRR) / startingMRR) * 100, 2) : 100;
  const netRevenueRetention = startingMRR > 0 ? n(((startingMRR - churnedMRR + expansionMRR) / startingMRR) * 100, 2) : 100;
  const revenueChurnRate = startingMRR > 0 ? n((churnedMRR / startingMRR) * 100, 2) : 0;
  const remainingCustomers = startingCustomers - churnedCustomers;
  const averageRevenuePerCustomer = remainingCustomers > 0 ? n((startingMRR - churnedMRR) / remainingCustomers, 2) : 0;
  const impliedAnnualLogoChurn = n(logoChurnRate * 12, 1);
  const impliedCustomerLifespanMonths = logoChurnRate > 0 ? n(100 / logoChurnRate, 1) : 999;
  const ltv = n(averageRevenuePerCustomer * impliedCustomerLifespanMonths, 2);

  return {
    id, name, period, startingCustomers, churnedCustomers,
    logoChurnRate, logoRetentionRate,
    startingMRR, churnedMRR, expansionMRR,
    netRevenueRetention, grossRevenueRetention, revenueChurnRate,
    averageRevenuePerCustomer,
    impliedAnnualLogoChurn,
    impliedCustomerLifespanMonths,
    ltv,
    churnHealthGrade: gradeChurn(logoChurnRate, segment),
    churnHealthInsight: churnInsight(logoChurnRate, netRevenueRetention),
  };
}

export function fmtARR(v: number, currency = "USD"): string {
  const sym: Record<string, string> = { USD: "$", INR: "₹", EUR: "€", GBP: "£" };
  const s = sym[currency] ?? "$";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e6) return `${sign}${s}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1000) return `${sign}${s}${(abs / 1000).toFixed(1)}K`;
  return `${sign}${s}${abs.toFixed(2)}`;
}
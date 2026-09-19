// tools/business/commissionEngine.ts
// Production-grade Sales Commission Calculator engine

export interface CommissionTier {
  id: string;
  label: string;
  minQuotaPercent: number;   // e.g. 0 = 0%, 80 = 80% attainment
  maxQuotaPercent: number;   // e.g. 80, 100, 120, Infinity
  ratePercent: number;       // commission % for this tier
  accelerator: number;       // multiplier applied on top (e.g. 1.5 = 1.5x rate)
}

export interface SalesRep {
  id: string;
  name: string;
  quota: number;
  actualSales: number;
  baseSalary: number;
  currency: string;
}

export interface CommissionResult {
  repId: string;
  repName: string;
  quota: number;
  actualSales: number;
  attainmentPercent: number;
  baseSalary: number;
  totalCommission: number;
  totalComp: number;       // base + commission
  ote: number;             // on-target earnings (base + target commission)
  tierBreakdown: TierPayout[];
  bonusEarned: number;
  acceleratorApplied: boolean;
  performanceBadge: "Presidents Club" | "Overachiever" | "On Target" | "Below Target" | "Off Track";
  annualizedComp: number;
}

export interface TierPayout {
  tierLabel: string;
  ratePercent: number;
  accelerator: number;
  salesInTier: number;
  commission: number;
}

export interface TeamSummary {
  reps: CommissionResult[];
  totalSales: number;
  totalCommission: number;
  totalBaseSalary: number;
  totalComp: number;
  avgAttainment: number;
  repsAboveQuota: number;
  repsBelowQuota: number;
  topPerformer: CommissionResult | null;
  bottomPerformer: CommissionResult | null;
  commissionToSalesRatio: number;
  avgOTE: number;
}

export const DEFAULT_TIERS: CommissionTier[] = [
  { id: "t1", label: "Ramp (0–80%)",        minQuotaPercent: 0,   maxQuotaPercent: 80,  ratePercent: 5,  accelerator: 1.0 },
  { id: "t2", label: "Target (80–100%)",     minQuotaPercent: 80,  maxQuotaPercent: 100, ratePercent: 8,  accelerator: 1.0 },
  { id: "t3", label: "Overachiever (100–120%)", minQuotaPercent: 100, maxQuotaPercent: 120, ratePercent: 10, accelerator: 1.25 },
  { id: "t4", label: "Club (120%+)",         minQuotaPercent: 120, maxQuotaPercent: Infinity, ratePercent: 12, accelerator: 1.5 },
];

export const COMMISSION_PRESETS: { name: string; tiers: CommissionTier[]; reps: SalesRep[] }[] = [
  {
    name: "SaaS AE Team",
    tiers: DEFAULT_TIERS,
    reps: [
      { id: "r1", name: "Alice Chen",    quota: 600000, actualSales: 750000, baseSalary: 80000, currency: "USD" },
      { id: "r2", name: "Bob Patel",     quota: 600000, actualSales: 480000, baseSalary: 80000, currency: "USD" },
      { id: "r3", name: "Carol Mendes",  quota: 600000, actualSales: 620000, baseSalary: 80000, currency: "USD" },
    ],
  },
  {
    name: "India SDR Team",
    tiers: [
      { id: "t1", label: "0–80%",   minQuotaPercent: 0,   maxQuotaPercent: 80,       ratePercent: 3,  accelerator: 1.0 },
      { id: "t2", label: "80–100%", minQuotaPercent: 80,  maxQuotaPercent: 100,      ratePercent: 5,  accelerator: 1.0 },
      { id: "t3", label: "100%+",   minQuotaPercent: 100, maxQuotaPercent: Infinity, ratePercent: 7,  accelerator: 1.2 },
    ],
    reps: [
      { id: "r1", name: "Rahul Sharma",  quota: 1500000, actualSales: 1800000, baseSalary: 600000, currency: "INR" },
      { id: "r2", name: "Priya Singh",   quota: 1500000, actualSales: 1200000, baseSalary: 600000, currency: "INR" },
    ],
  },
];

function n(v: number, d = 2): number {
  return Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
}

function badge(attainment: number): CommissionResult["performanceBadge"] {
  if (attainment >= 120) return "Presidents Club";
  if (attainment >= 100) return "Overachiever";
  if (attainment >= 80)  return "On Target";
  if (attainment >= 50)  return "Below Target";
  return "Off Track";
}

export function calculateRepCommission(rep: SalesRep, tiers: CommissionTier[], targetRatePercent = 8): CommissionResult {
  const attainmentPercent = rep.quota > 0 ? n((rep.actualSales / rep.quota) * 100, 2) : 0;
  const tierBreakdown: TierPayout[] = [];
  let totalCommission = 0;
  let acceleratorApplied = false;

  for (const tier of tiers) {
    const tierMin = (tier.minQuotaPercent / 100) * rep.quota;
    const tierMax = tier.maxQuotaPercent === Infinity ? rep.actualSales : (tier.maxQuotaPercent / 100) * rep.quota;
    const salesInTier = Math.max(0, Math.min(rep.actualSales, tierMax) - Math.min(rep.actualSales, tierMin));
    if (salesInTier <= 0) { tierBreakdown.push({ tierLabel: tier.label, ratePercent: tier.ratePercent, accelerator: tier.accelerator, salesInTier: 0, commission: 0 }); continue; }
    const effectiveRate = (tier.ratePercent / 100) * tier.accelerator;
    const commission = n(salesInTier * effectiveRate, 2);
    totalCommission += commission;
    if (tier.accelerator > 1) acceleratorApplied = true;
    tierBreakdown.push({ tierLabel: tier.label, ratePercent: tier.ratePercent, accelerator: tier.accelerator, salesInTier: n(salesInTier, 2), commission });
  }

  totalCommission = n(totalCommission, 2);
  const ote = n(rep.baseSalary + (rep.quota * targetRatePercent / 100), 2);
  const bonusEarned = n(Math.max(0, totalCommission - (rep.quota * targetRatePercent / 100)), 2);

  return {
    repId: rep.id, repName: rep.name,
    quota: rep.quota, actualSales: rep.actualSales,
    attainmentPercent, baseSalary: rep.baseSalary,
    totalCommission, totalComp: n(rep.baseSalary + totalCommission, 2),
    ote, tierBreakdown, bonusEarned, acceleratorApplied,
    performanceBadge: badge(attainmentPercent),
    annualizedComp: n((rep.baseSalary + totalCommission) * 12, 2),
  };
}

export function calculateTeamSummary(reps: SalesRep[], tiers: CommissionTier[], targetRatePercent = 8): TeamSummary {
  const results = reps.map(r => calculateRepCommission(r, tiers, targetRatePercent));
  const totalSales = n(results.reduce((s, r) => s + r.actualSales, 0), 2);
  const totalCommission = n(results.reduce((s, r) => s + r.totalCommission, 0), 2);
  const totalBaseSalary = n(results.reduce((s, r) => s + r.baseSalary, 0), 2);
  const totalComp = n(results.reduce((s, r) => s + r.totalComp, 0), 2);
  const avgAttainment = results.length > 0 ? n(results.reduce((s, r) => s + r.attainmentPercent, 0) / results.length, 1) : 0;
  const repsAboveQuota = results.filter(r => r.attainmentPercent >= 100).length;
  const sorted = [...results].sort((a, b) => b.attainmentPercent - a.attainmentPercent);

  return {
    reps: results, totalSales, totalCommission, totalBaseSalary, totalComp, avgAttainment,
    repsAboveQuota, repsBelowQuota: results.length - repsAboveQuota,
    topPerformer: sorted[0] ?? null,
    bottomPerformer: sorted[sorted.length - 1] ?? null,
    commissionToSalesRatio: totalSales > 0 ? n((totalCommission / totalSales) * 100, 2) : 0,
    avgOTE: results.length > 0 ? n(results.reduce((s, r) => s + r.ote, 0) / results.length, 2) : 0,
  };
}

export function fmtComm(v: number, currency = "USD"): string {
  const sym: Record<string, string> = { USD: "$", INR: "₹", EUR: "€", GBP: "£" };
  const s = sym[currency] ?? "$";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}${s}${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}${s}${(abs / 1e5).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}${s}${(abs / 1000).toFixed(1)}K`;
  return `${sign}${s}${abs.toFixed(2)}`;
}
// tools/business/roasEngine.ts
export type AdPlatform = "google" | "meta" | "tiktok" | "linkedin" | "twitter" | "amazon" | "snapchat" | "other";

export interface AdCampaign {
  id: string;
  name: string;
  platform: AdPlatform;
  adSpend: number;
  adRevenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface ROASResult {
  id: string;
  name: string;
  platform: AdPlatform;
  adSpend: number;
  adRevenue: number;
  roas: number;
  roasPercent: number;
  netProfit: number;
  roi: number;
  cpm: number;
  cpc: number;
  cpa: number;
  ctr: number;
  conversionRate: number;
  revenuePerClick: number;
  performanceGrade: "Exceptional" | "Good" | "Average" | "Poor" | "Critical";
  benchmarkComparison: string;
  isAboveBreakEven: boolean;
}

export interface BlendedROASResult {
  campaigns: ROASResult[];
  totalAdSpend: number;
  totalAdRevenue: number;
  blendedROAS: number;
  blendedROASPercent: number;
  totalNetProfit: number;
  totalROI: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  blendedCPM: number;
  blendedCPC: number;
  blendedCPA: number;
  blendedCTR: number;
  blendedConversionRate: number;
  bestCampaign: ROASResult | null;
  worstCampaign: ROASResult | null;
  platformBreakdown: PlatformBreakdown[];
}

export interface PlatformBreakdown {
  platform: AdPlatform;
  totalSpend: number;
  totalRevenue: number;
  roas: number;
  shareOfSpend: number;
  shareOfRevenue: number;
}

export interface ROASGoalResult {
  targetROAS: number;
  currentROAS: number;
  requiredRevenue: number;
  revenueGap: number;
  requiredConversions: number;
  conversionsGap: number;
  status: "achieved" | "close" | "needs_work" | "far_off";
  achievementPercent: number;
}

export const PLATFORM_BENCHMARKS: Record<AdPlatform, { avgROAS: number; goodROAS: number; label: string }> = {
  google:   { avgROAS: 2.0, goodROAS: 4.0, label: "Google Ads" },
  meta:     { avgROAS: 1.5, goodROAS: 3.5, label: "Meta (FB/IG)" },
  tiktok:   { avgROAS: 1.2, goodROAS: 2.5, label: "TikTok Ads" },
  linkedin: { avgROAS: 1.0, goodROAS: 2.0, label: "LinkedIn Ads" },
  twitter:  { avgROAS: 0.8, goodROAS: 1.8, label: "Twitter/X Ads" },
  amazon:   { avgROAS: 3.0, goodROAS: 6.0, label: "Amazon Ads" },
  snapchat: { avgROAS: 1.0, goodROAS: 2.2, label: "Snapchat Ads" },
  other:    { avgROAS: 1.5, goodROAS: 3.0, label: "Other Channel" },
};

export const ROAS_PRESETS: AdCampaign[] = [
  { id: "p1", name: "Google Search - Brand", platform: "google", adSpend: 50000, adRevenue: 250000, impressions: 180000, clicks: 9000, conversions: 300 },
  { id: "p2", name: "Meta Retargeting", platform: "meta", adSpend: 30000, adRevenue: 105000, impressions: 500000, clicks: 8500, conversions: 175 },
  { id: "p3", name: "Google Shopping", platform: "google", adSpend: 40000, adRevenue: 140000, impressions: 300000, clicks: 12000, conversions: 210 },
];

export function roasN(v: number, d = 2): number {
  return Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
}

function gradeROAS(roas: number, platform: AdPlatform): ROASResult["performanceGrade"] {
  const b = PLATFORM_BENCHMARKS[platform];
  if (roas >= b.goodROAS * 1.5) return "Exceptional";
  if (roas >= b.goodROAS) return "Good";
  if (roas >= b.avgROAS) return "Average";
  if (roas >= 1) return "Poor";
  return "Critical";
}

function benchmarkText(roas: number, platform: AdPlatform): string {
  const b = PLATFORM_BENCHMARKS[platform];
  const diff = roasN(((roas - b.avgROAS) / b.avgROAS) * 100, 1);
  if (diff >= 0) return `${diff}% above ${b.label} avg (${b.avgROAS}x)`;
  return `${Math.abs(diff)}% below ${b.label} avg (${b.avgROAS}x)`;
}

export function calculateCampaignROAS(c: AdCampaign): ROASResult {
  const roas = c.adSpend > 0 ? roasN(c.adRevenue / c.adSpend, 2) : 0;
  const netProfit = roasN(c.adRevenue - c.adSpend, 2);
  return {
    id: c.id, name: c.name, platform: c.platform, adSpend: c.adSpend, adRevenue: c.adRevenue,
    roas, roasPercent: roasN(roas * 100, 1), netProfit,
    roi: c.adSpend > 0 ? roasN((netProfit / c.adSpend) * 100, 2) : 0,
    cpm: c.impressions > 0 ? roasN((c.adSpend / c.impressions) * 1000, 2) : 0,
    cpc: c.clicks > 0 ? roasN(c.adSpend / c.clicks, 2) : 0,
    cpa: c.conversions > 0 ? roasN(c.adSpend / c.conversions, 2) : 0,
    ctr: c.impressions > 0 ? roasN((c.clicks / c.impressions) * 100, 3) : 0,
    conversionRate: c.clicks > 0 ? roasN((c.conversions / c.clicks) * 100, 2) : 0,
    revenuePerClick: c.clicks > 0 ? roasN(c.adRevenue / c.clicks, 2) : 0,
    performanceGrade: gradeROAS(roas, c.platform),
    benchmarkComparison: benchmarkText(roas, c.platform),
    isAboveBreakEven: roas >= 1,
  };
}

export function calculateBlendedROAS(campaigns: AdCampaign[]): BlendedROASResult {
  const results = campaigns.map(calculateCampaignROAS);
  const tSpend = roasN(results.reduce((s, r) => s + r.adSpend, 0), 2);
  const tRevenue = roasN(results.reduce((s, r) => s + r.adRevenue, 0), 2);
  const tImpressions = results.reduce((s, r) => s + (campaigns.find(c => c.id === r.id)?.impressions ?? 0), 0);
  const tClicks = results.reduce((s, r) => s + (campaigns.find(c => c.id === r.id)?.clicks ?? 0), 0);
  const tConversions = results.reduce((s, r) => s + (campaigns.find(c => c.id === r.id)?.conversions ?? 0), 0);
  const blendedROAS = tSpend > 0 ? roasN(tRevenue / tSpend, 2) : 0;
  const netProfit = roasN(tRevenue - tSpend, 2);
  const sorted = [...results].sort((a, b) => b.roas - a.roas);

  const platformMap = new Map<AdPlatform, { spend: number; revenue: number }>();
  campaigns.forEach(c => {
    const p = platformMap.get(c.platform) ?? { spend: 0, revenue: 0 };
    p.spend += c.adSpend; p.revenue += c.adRevenue;
    platformMap.set(c.platform, p);
  });
  const platformBreakdown: PlatformBreakdown[] = Array.from(platformMap.entries()).map(([platform, v]) => ({
    platform,
    totalSpend: roasN(v.spend, 2), totalRevenue: roasN(v.revenue, 2),
    roas: v.spend > 0 ? roasN(v.revenue / v.spend, 2) : 0,
    shareOfSpend: tSpend > 0 ? roasN((v.spend / tSpend) * 100, 1) : 0,
    shareOfRevenue: tRevenue > 0 ? roasN((v.revenue / tRevenue) * 100, 1) : 0,
  }));

  return {
    campaigns: results, totalAdSpend: tSpend, totalAdRevenue: tRevenue,
    blendedROAS, blendedROASPercent: roasN(blendedROAS * 100, 1),
    totalNetProfit: netProfit, totalROI: tSpend > 0 ? roasN((netProfit / tSpend) * 100, 2) : 0,
    totalImpressions: tImpressions, totalClicks: tClicks, totalConversions: tConversions,
    blendedCPM: tImpressions > 0 ? roasN((tSpend / tImpressions) * 1000, 2) : 0,
    blendedCPC: tClicks > 0 ? roasN(tSpend / tClicks, 2) : 0,
    blendedCPA: tConversions > 0 ? roasN(tSpend / tConversions, 2) : 0,
    blendedCTR: tImpressions > 0 ? roasN((tClicks / tImpressions) * 100, 3) : 0,
    blendedConversionRate: tClicks > 0 ? roasN((tConversions / tClicks) * 100, 2) : 0,
    bestCampaign: sorted[0] ?? null,
    worstCampaign: sorted[sorted.length - 1] ?? null,
    platformBreakdown,
  };
}

export function calculateROASGoal(targetROAS: number, currentAdSpend: number, currentAdRevenue: number, avgOrderValue: number): ROASGoalResult {
  const currentROAS = currentAdSpend > 0 ? roasN(currentAdRevenue / currentAdSpend, 2) : 0;
  const requiredRevenue = roasN(targetROAS * currentAdSpend, 2);
  const revenueGap = roasN(Math.max(0, requiredRevenue - currentAdRevenue), 2);
  const aov = avgOrderValue > 0 ? avgOrderValue : 100;
  const requiredConversions = Math.ceil(requiredRevenue / aov);
  const currentConversions = Math.ceil(currentAdRevenue / aov);
  const conversionsGap = Math.max(0, requiredConversions - currentConversions);
  const achievementPercent = targetROAS > 0 ? roasN(Math.min(200, (currentROAS / targetROAS) * 100), 1) : 0;
  let status: ROASGoalResult["status"] = "far_off";
  if (achievementPercent >= 100) status = "achieved";
  else if (achievementPercent >= 85) status = "close";
  else if (achievementPercent >= 60) status = "needs_work";
  return { targetROAS, currentROAS, requiredRevenue, revenueGap, requiredConversions, conversionsGap, status, achievementPercent };
}

export function fmtROAS(v: number, currency = "USD"): string {
  const sym: Record<string, string> = { USD: "$", INR: "₹", EUR: "€", GBP: "£" };
  const s = sym[currency] ?? "$";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e6) return `${sign}${s}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1000) return `${sign}${s}${(abs / 1000).toFixed(1)}K`;
  return `${sign}${s}${abs.toFixed(2)}`;
}
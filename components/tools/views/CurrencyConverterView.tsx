"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Input } from "@/components/ui/Input";
import { ResultDisplay } from "../ResultDisplay";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { 
  ArrowLeftRight, 
  RefreshCw, 
  Check, 
  Copy, 
  Globe, 
  Radio, 
  TrendingUp,
  Share2
} from "lucide-react";

export interface CurrencyConverterViewProps {
  tool: ToolMeta;
}

export interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyMeta> = {
  USD: { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  EUR: { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  AED: { code: "AED", name: "UAE Dirham", symbol: "AED", flag: "🇦🇪" },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦" },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "AU$", flag: "🇦🇺" },
  JPY: { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  SGD: { code: "SGD", name: "Singapore Dollar", symbol: "SG$", flag: "🇸🇬" },
  CHF: { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  CNY: { code: "CNY", name: "Chinese Yuan", symbol: "CN¥", flag: "🇨🇳" },
  SAR: { code: "SAR", name: "Saudi Riyal", symbol: "SAR", flag: "🇸🇦" },
  QAR: { code: "QAR", name: "Qatari Riyal", symbol: "QAR", flag: "🇶🇦" },
  KWD: { code: "KWD", name: "Kuwaiti Dinar", symbol: "KWD", flag: "🇰🇼" },
  BHD: { code: "BHD", name: "Bahraini Dinar", symbol: "BHD", flag: "🇧🇭" },
  OMR: { code: "OMR", name: "Omani Rial", symbol: "OMR", flag: "🇴🇲" },
  NZD: { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
  BRL: { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  ZAR: { code: "ZAR", name: "South African Rand", symbol: "ZAR", flag: "🇿🇦" },
  MXN: { code: "MXN", name: "Mexican Peso", symbol: "MX$", flag: "🇲🇽" },
  KRW: { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  THB: { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
  MYR: { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
  IDR: { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  PHP: { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
  PKR: { code: "PKR", name: "Pakistani Rupee", symbol: "PKR", flag: "🇵🇰" },
  BDT: { code: "BDT", name: "Bangladeshi Taka", symbol: "BDT", flag: "🇧🇩" },
  LKR: { code: "LKR", name: "Sri Lankan Rupee", symbol: "LKR", flag: "🇱🇰" },
  RUB: { code: "RUB", name: "Russian Ruble", symbol: "₽", flag: "🇷🇺" },
  TRY: { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
  SEK: { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },
  NOK: { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴" },
  DKK: { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰" },
  PLN: { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱" },
  HKD: { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
};

// Seed baseline rates against USD (used instantly before live async fetch resolves)
const SEED_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  INR: 94.544,
  EUR: 0.8604,
  GBP: 0.7386,
  AED: 3.6725,
  CAD: 1.3812,
  AUD: 1.3853,
  JPY: 154.41,
  SGD: 1.2658,
  CHF: 0.8092,
  CNY: 6.7284,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.3086,
  BHD: 0.376,
  OMR: 0.3845,
  NZD: 1.7003,
  BRL: 5.1262,
  ZAR: 15.9862,
  MXN: 16.9329,
  KRW: 1345.38,
  THB: 32.88,
  MYR: 4.0456,
  IDR: 17654.4,
  PHP: 62.686,
  PKR: 277.66,
  BDT: 122.95,
  LKR: 328.08,
  RUB: 86.238,
  TRY: 48.458,
  SEK: 9.5963,
  NOK: 9.2696,
  DKK: 6.4313,
  PLN: 3.7082,
  HKD: 7.8403,
};

const PRESET_AMOUNTS = [10, 50, 100, 500, 1000, 5000, 10000];

export const CurrencyConverterView: React.FC<CurrencyConverterViewProps> = ({ tool }) => {
  const [amount, setAmount] = useState<string>("");
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("INR");
  
  // Live rates state
  const [rates, setRates] = useState<Record<string, number>>(SEED_RATES_TO_USD);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("Initializing...");
  const [copied, setCopied] = useState<boolean>(false);
  const [shared, setShared] = useState<boolean>(false);

  // Live Exchange Rate Fetcher
  const fetchLiveRates = useCallback(async (forceRefresh = false) => {
    setIsLoadingRates(true);

    // Check localStorage cache if not forced
    if (!forceRefresh && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("toolverse_fx_rates");
        if (cached) {
          const parsed = JSON.parse(cached);
          const ageMinutes = (Date.now() - parsed.timestamp) / (1000 * 60);
          if (ageMinutes < 30 && parsed.rates?.INR) {
            setRates((prev) => ({ ...prev, ...parsed.rates }));
            setLastUpdated(parsed.timeString || "Cached recently");
            setIsLive(true);
            setIsLoadingRates(false);
            return;
          }
        }
      } catch {
        // Continue to fresh fetch
      }
    }

    try {
      // Primary Live API endpoint (Open Exchange Rates / ER-API)
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) throw new Error("Primary API failed");
      const data = await res.json();

      if (data && data.rates) {
        setRates((prev) => ({ ...prev, ...data.rates }));
        const timeStr = data.time_last_update_utc 
          ? new Date(data.time_last_update_utc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " UTC"
          : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        
        setLastUpdated(timeStr);
        setIsLive(true);

        if (typeof window !== "undefined") {
          localStorage.setItem("toolverse_fx_rates", JSON.stringify({
            rates: data.rates,
            timestamp: Date.now(),
            timeString: timeStr,
          }));
        }
      }
    } catch {
      // Fallback API endpoint
      try {
        const fallbackRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData && fallbackData.rates) {
            setRates((prev) => ({ ...prev, ...fallbackData.rates }));
            const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            setLastUpdated(timeStr);
            setIsLive(true);
          }
        }
      } catch (err) {
        console.error("Failed to load live exchange rates:", err);
      }
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  // Fetch rates on mount
  useEffect(() => {
    fetchLiveRates();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchLiveRates(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLiveRates]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Accurate Multi-Currency Conversion
  const conversion = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;

    // Convert: From -> USD -> To
    const inUSD = numAmount / fromRate;
    const converted = inUSD * toRate;
    const unitRate = toRate / fromRate;
    const inverseUnitRate = fromRate / toRate;

    const fromMeta = SUPPORTED_CURRENCIES[fromCurrency] || { symbol: fromCurrency, flag: "", name: fromCurrency };
    const toMeta = SUPPORTED_CURRENCIES[toCurrency] || { symbol: toCurrency, flag: "", name: toCurrency };

    return {
      converted: converted.toFixed(2),
      formattedConverted: converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      unitRate: unitRate.toFixed(4),
      inverseUnitRate: inverseUnitRate.toFixed(4),
      fromSymbol: fromMeta.symbol,
      toSymbol: toMeta.symbol,
      fromFlag: fromMeta.flag,
      toFlag: toMeta.flag,
      fromName: fromMeta.name,
      toName: toMeta.name,
    };
  }, [amount, fromCurrency, toCurrency, rates]);

  // Copy result to clipboard
  const handleCopy = () => {
    const numAmount = parseFloat(amount) || 0;
    const text = `${conversion.fromSymbol}${numAmount.toLocaleString()} ${fromCurrency} = ${conversion.toSymbol}${conversion.formattedConverted} ${toCurrency} (Rate: 1 ${fromCurrency} = ${conversion.unitRate} ${toCurrency})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share result
  const handleShare = () => {
    const numAmount = parseFloat(amount) || 0;
    const text = `${numAmount.toLocaleString()} ${fromCurrency} = ${conversion.formattedConverted} ${toCurrency} at live exchange rate on ToolVerse`;
    if (navigator.share) {
      navigator.share({ title: "Currency Conversion", text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  // Quick comparison matrix for popular global currencies
  const popularCurrencies = useMemo(() => {
    const popularCodes = ["INR", "USD", "EUR", "GBP", "AED", "CAD", "AUD", "SGD", "JPY", "SAR"]
      .filter((c) => c !== fromCurrency)
      .slice(0, 8);

    const numAmount = parseFloat(amount) || 0;
    const fromRate = rates[fromCurrency] || 1;
    const inUSD = numAmount / fromRate;

    return popularCodes.map((code) => {
      const cRate = rates[code] || 1;
      const convertedVal = inUSD * cRate;
      const unit = (cRate / fromRate).toFixed(4);
      const meta = SUPPORTED_CURRENCIES[code] || { symbol: code, flag: "", name: code };

      return {
        code,
        name: meta.name,
        symbol: meta.symbol,
        flag: meta.flag,
        converted: convertedVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        unitRate: unit,
      };
    });
  }, [amount, fromCurrency, rates]);

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      {/* Live Market Rates Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-surface-raised/80 border border-border px-4 py-2.5 rounded-xl text-xs backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            {isLive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? "bg-emerald-500" : "bg-amber-500"}`}></span>
          </span>
          <span className="font-semibold text-text-primary flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            {isLive ? "Live Market FX Rates Active" : "Connecting to Live FX Feed..."}
          </span>
          <span className="text-text-tertiary hidden sm:inline">•</span>
          <span className="text-text-secondary hidden sm:inline">
            Updated: <span className="text-text-primary font-medium">{lastUpdated}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => fetchLiveRates(true)}
          disabled={isLoadingRates}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-surface hover:bg-surface-raised text-text-secondary hover:text-accent transition-all font-medium disabled:opacity-50"
          title="Fetch latest live rates now"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRates ? "animate-spin text-accent" : ""}`} />
          <span>{isLoadingRates ? "Updating Rates..." : "Refresh Rates"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Input Configuration */}
        <div className="lg:col-span-6 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent" />
              Live Currency Converter
            </h3>
            <span className="text-[11px] text-text-secondary bg-surface-raised px-2.5 py-0.5 rounded-full border border-border/80">
              35+ Currencies Supported
            </span>
          </div>

          {/* Amount Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">Amount to Convert</label>
              <span className="text-xs font-mono text-text-tertiary">
                {conversion.fromFlag} {conversion.fromName}
              </span>
            </div>
            <Input
              type="number"
              min={0}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              prefixSymbol={conversion.fromSymbol}
              className="text-lg font-semibold"
              placeholder="Enter amount to convert (e.g. 100)..."
            />

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset.toString())}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                    amount === preset.toString()
                      ? "bg-accent text-white border-accent shadow-sm"
                      : "bg-surface-raised border-border hover:border-accent/40 text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {conversion.fromSymbol}{preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* From & To Currency Pickers with Swap */}
          <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-end">
            <div className="sm:col-span-5 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">From Currency</label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-lg p-3 text-sm text-text-primary font-medium outline-none focus:border-accent cursor-pointer transition-colors"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} - {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1 flex justify-center pb-1">
              <button
                type="button"
                onClick={handleSwap}
                className="p-3 rounded-lg border border-border bg-surface-raised hover:bg-surface text-accent hover:border-accent hover:scale-105 active:scale-95 transition-all shadow-sm"
                title="Swap Currencies"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            <div className="sm:col-span-5 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">To Currency</label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-lg p-3 text-sm text-text-primary font-medium outline-none focus:border-accent cursor-pointer transition-colors"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} - {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Rate Summary Card */}
          <div className="p-4 rounded-xl bg-surface-raised/70 border border-border flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-accent" />
                Live Exchange Rate:
              </span>
              <span className="font-mono font-bold text-text-primary text-sm">
                1 {fromCurrency} = {conversion.unitRate} {toCurrency}
              </span>
            </div>
            <div className="flex items-center justify-between text-text-tertiary border-t border-border/50 pt-2">
              <span>Inverse Rate:</span>
              <span className="font-mono">
                1 {toCurrency} = {conversion.inverseUnitRate} {fromCurrency}
              </span>
            </div>
            <div className="text-[11px] text-text-tertiary pt-1 flex items-center justify-between">
              <span>Market standard zero-spread rate</span>
              <span className="text-emerald-400 font-medium">Real-time sync</span>
            </div>
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-6 flex flex-col gap-6 sticky top-20">
          <ResultDisplay
            primaryMetric={{
              label: `Converted Amount in ${conversion.toName}`,
              value: `${conversion.toSymbol} ${conversion.formattedConverted}`,
            }}
            secondaryMetrics={[
              {
                label: "Base Amount",
                value: `${conversion.fromSymbol} ${(parseFloat(amount) || 0).toLocaleString()} ${fromCurrency}`,
              },
              {
                label: "Live Market Rate",
                value: `1 ${fromCurrency} = ${conversion.unitRate} ${toCurrency}`,
              },
              {
                label: "Market Spread / Markup",
                value: "0.00% (Mid-Market Interbank)",
              },
              {
                label: "Data Provider",
                value: "Live Global FX Feed",
              },
            ]}
          />

          {/* Actions: Copy & Share */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 py-2.5 px-4 rounded-lg bg-surface border border-border hover:border-accent text-text-primary text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-accent" />
                  <span>Copy Conversion Details</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="py-2.5 px-4 rounded-lg bg-surface border border-border hover:border-accent text-text-primary text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              title="Share or Copy Link"
            >
              {shared ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-accent" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>

          {/* Popular Live Comparisons Grid */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                {conversion.fromSymbol}{(parseFloat(amount) || 0).toLocaleString()} {fromCurrency} in Other Currencies
              </h4>
              <span className="text-[11px] font-mono text-accent">Live Rates</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {popularCurrencies.map((item) => (
                <div 
                  key={item.code} 
                  className="p-3 bg-surface-raised rounded-lg border border-border/80 flex flex-col gap-1 hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary flex items-center gap-1.5">
                      <span>{item.flag}</span>
                      <span>{item.code}</span>
                    </span>
                    <span className="text-[11px] font-mono text-text-tertiary">
                      {item.unitRate}
                    </span>
                  </div>
                  <div className="font-mono text-sm font-bold text-text-primary">
                    {item.symbol} {item.converted}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};

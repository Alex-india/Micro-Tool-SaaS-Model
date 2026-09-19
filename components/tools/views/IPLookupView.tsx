"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Button } from "@/components/ui/Button";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import {
  calculateSubnetDetails,
  IP_PRESETS,
  type IpLookupResult,
  type SubnetCalculation,
} from "@/tools/web/ipEngine";
import {
  MapPin,
  Search,
  RefreshCw,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  Server,
  Globe,
  Sliders,
  List,
  Sparkles,
  Layers,
  Network,
  Lock,
  Unlock,
  AlertTriangle,
  Info,
  BookOpen,
  Cpu,
  Code2,
} from "lucide-react";

export interface IPLookupViewProps {
  tool: ToolMeta;
}

export const IPLookupView: React.FC<IPLookupViewProps> = ({ tool }) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"lookup" | "subnet" | "batch" | "guide">("lookup");

  // Single IP Lookup State
  const [queryInput, setQueryInput] = useState<string>("8.8.8.8");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<IpLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Subnet Calculator State
  const [subnetIp, setSubnetIp] = useState<string>("192.168.1.0");
  const [subnetPrefix, setSubnetPrefix] = useState<number>(24);

  // Batch Lookup State
  const [batchInput, setBatchInput] = useState<string>(
    "8.8.8.8\n1.1.1.1\n208.67.222.222\n9.9.9.9\n192.168.1.1"
  );
  const [batchResults, setBatchResults] = useState<Array<{
    query: string;
    ip: string;
    country: string;
    city: string;
    isp: string;
    asn?: string;
    classification: string;
    isDatacenter: boolean;
    error?: string;
  }>>([]);
  const [isBatchLoading, setIsBatchLoading] = useState<boolean>(false);

  // Copy Status Tracker
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = useCallback((text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  // Run Lookup
  const handleRunLookup = async (overrideTarget?: string) => {
    const target = overrideTarget !== undefined ? overrideTarget : queryInput.trim();
    setIsLoading(true);
    setLookupError(null);

    try {
      const res = await fetch("/api/web/ip-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: target }),
      });

      const data = await res.json();
      if (!data.success) {
        setLookupError(data.error || "Failed to lookup IP address.");
        setResult(null);
      } else {
        setResult(data.result);
        if (data.result.subnet) {
          setSubnetIp(data.result.ip);
          setSubnetPrefix(data.result.subnet.prefix);
        }
      }
    } catch (err: any) {
      setLookupError(err.message || "Network error while looking up IP.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Run "My IP" Lookup
  const handleLookupMyIp = () => {
    setQueryInput("");
    handleRunLookup("me");
  };

  // Run Batch Lookup
  const handleRunBatch = async () => {
    const lines = batchInput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .slice(0, 10);

    if (lines.length === 0) return;

    setIsBatchLoading(true);
    setBatchResults([]);

    const results: typeof batchResults = [];
    for (const q of lines) {
      try {
        const res = await fetch("/api/web/ip-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        });
        const data = await res.json();
        if (data.success && data.result) {
          results.push({
            query: q,
            ip: data.result.ip,
            country: `${data.result.flagEmoji} ${data.result.country}`,
            city: data.result.city,
            isp: data.result.isp,
            asn: data.result.asn,
            classification: data.result.classificationName,
            isDatacenter: data.result.isDatacenter,
          });
        } else {
          results.push({
            query: q,
            ip: "N/A",
            country: "-",
            city: "-",
            isp: "-",
            classification: "Failed",
            isDatacenter: false,
            error: data.error || "Lookup failed",
          });
        }
      } catch (err: any) {
        results.push({
          query: q,
          ip: "N/A",
          country: "-",
          city: "-",
          isp: "-",
          classification: "Error",
          isDatacenter: false,
          error: err.message,
        });
      }
    }

    setBatchResults(results);
    setIsBatchLoading(false);
  };

  // Export Batch CSV
  const handleExportBatchCsv = () => {
    if (batchResults.length === 0) return;
    const header = "Query,Resolved IP,Country,City,ISP,ASN,Classification,Datacenter,Error\n";
    const rows = batchResults
      .map(
        (r) =>
          `"${r.query}","${r.ip}","${r.country}","${r.city}","${r.isp}","${r.asn || ""}","${r.classification}",${r.isDatacenter ? "Yes" : "No"},"${r.error || ""}"`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ip-batch-lookup.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Interactive Subnet Calculator
  const calculatedSubnet: SubnetCalculation = useMemo(() => {
    return calculateSubnetDetails(subnetIp, subnetPrefix);
  }, [subnetIp, subnetPrefix]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-16">
      <ToolHeader tool={tool} />

      {/* Preset Scenario Launcher */}
      <div className="flex flex-col gap-2 bg-surface-raised/40 backdrop-blur-md p-4 rounded-xl border border-border/80">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Curated Public DNS & Network Presets
          </span>
          <span className="text-[11px] text-text-tertiary">
            Click any network address to inspect geolocation, ASN, and subnet bounds
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {IP_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setQueryInput(preset.ip);
                setActiveTab("lookup");
                handleRunLookup(preset.ip);
              }}
              className="text-xs px-3 py-1.5 rounded-lg border bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary border-border transition-all whitespace-nowrap flex items-center gap-2"
              title={preset.description}
            >
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                {preset.expectedType}
              </span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto scrollbar-thin">
        {[
          { id: "lookup", label: "IP Geolocation Inspector", icon: MapPin },
          { id: "subnet", label: "CIDR Subnet Calculator", icon: Sliders },
          { id: "batch", label: "Batch Multi-IP Auditor", icon: List },
          { id: "guide", label: "IPv4 vs IPv6 Architecture", icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${
                isActive
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: IP GEOLOCATION INSPECTOR */}
      {activeTab === "lookup" && (
        <div className="flex flex-col gap-6">
          {/* Query Bar */}
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label htmlFor="ip-query-input" className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                IP Address or Domain Hostname
              </label>
              <button
                onClick={handleLookupMyIp}
                disabled={isLoading}
                className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
              >
                <Cpu className="w-3.5 h-3.5" />
                Detect My Current Public IP
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                id="ip-query-input"
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRunLookup();
                }}
                placeholder="Enter IPv4 (8.8.8.8), IPv6 (2001:4860:4860::8888), or domain (google.com)"
                className="w-full bg-background border border-border focus:border-accent rounded-lg px-3.5 py-2.5 text-xs font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />
              <Button
                size="md"
                variant="primary"
                onClick={() => handleRunLookup()}
                disabled={isLoading}
                className="shrink-0 w-full sm:w-auto px-5"
                leftIcon={
                  isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )
                }
              >
                {isLoading ? "Querying..." : "Lookup IP"}
              </Button>
            </div>
          </div>

          {/* Error notice */}
          {lookupError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-bold">Lookup Error</span>
                <span className="text-text-secondary">{lookupError}</span>
              </div>
            </div>
          )}

          {/* Results Cards */}
          {result && (
            <div className="flex flex-col gap-6">
              {/* Hero Overview Card */}
              <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="text-4xl select-none">{result.flagEmoji}</div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-2xl font-black text-text-primary">
                        {result.ip}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent/15 text-accent font-bold border border-accent/30">
                        {result.type}
                      </span>
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded font-bold border ${
                          result.isRoutable
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {result.classificationName}
                      </span>
                    </div>

                    <span className="text-sm font-semibold text-text-secondary mt-1">
                      {result.city && result.city !== "Private Network" ? `${result.city}, ` : ""}
                      {result.region ? `${result.region}, ` : ""}
                      {result.country}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy(result.ip, "hero_ip")}
                    leftIcon={
                      copiedKey === "hero_ip" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )
                    }
                  >
                    {copiedKey === "hero_ip" ? "Copied" : "Copy IP"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy(JSON.stringify(result, null, 2), "hero_json")}
                    leftIcon={
                      copiedKey === "hero_json" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Code2 className="w-3.5 h-3.5" />
                      )
                    }
                  >
                    {copiedKey === "hero_json" ? "Copied" : "Copy JSON"}
                  </Button>
                </div>
              </div>

              {/* Grid: 3 Main Cards (Geo, Network, Subnet/Map) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Geographic Details */}
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border/70 pb-2.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Geographic Location
                  </span>

                  <div className="flex flex-col gap-2.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-text-tertiary">Country</span>
                      <span className="font-semibold text-text-primary flex items-center gap-1.5">
                        <span>{result.flagEmoji}</span>
                        <span>{result.country} ({result.countryCode})</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-text-tertiary">Region / State</span>
                      <span className="font-semibold text-text-primary">
                        {result.region || "-"} {result.regionCode ? `(${result.regionCode})` : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-text-tertiary">City</span>
                      <span className="font-semibold text-text-primary">{result.city || "-"}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-text-tertiary">Postal / ZIP Code</span>
                      <span className="font-mono text-text-primary">{result.postal || "-"}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-text-tertiary">Coordinates (Lat, Lon)</span>
                      <span className="font-mono text-text-primary font-bold">
                        {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-tertiary">Timezone</span>
                      <span className="font-semibold text-text-primary">{result.timezone}</span>
                    </div>
                  </div>

                  {result.latitude !== 0 && result.longitude !== 0 && (
                    <a
                      href={`https://www.google.com/maps?q=${result.latitude},${result.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-accent hover:underline flex items-center justify-center gap-1 pt-2 border-t border-border/60"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Location on Google Maps
                    </a>
                  )}
                </div>

                {/* 2. Network & Autonomous System (ASN) */}
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border/70 pb-2.5">
                    <Server className="w-4 h-4 text-sky-400" />
                    Network &amp; ASN Carrier
                  </span>

                  <div className="flex flex-col gap-2.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-text-tertiary">Internet Service Provider (ISP)</span>
                      <span className="font-semibold text-text-primary text-right max-w-[180px] truncate">
                        {result.isp}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-text-tertiary">Organization</span>
                      <span className="font-semibold text-text-primary text-right max-w-[180px] truncate">
                        {result.org}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-text-tertiary">Autonomous System (ASN)</span>
                      <span className="font-mono font-bold text-accent">
                        {result.asn || "-"} {result.asName ? `(${result.asName})` : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-text-tertiary">Reverse DNS (PTR)</span>
                      <span className="font-mono text-text-primary text-right max-w-[180px] truncate">
                        {result.hostname || "None / Not Delegated"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-text-tertiary">Infrastructure Type</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                          result.isDatacenter
                            ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                            : "bg-surface-raised border border-border text-text-secondary"
                        }`}
                      >
                        {result.isDatacenter ? "Cloud / Datacenter Hosting" : "Residential / Office"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Subnet Quick Details */}
                <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 border-b border-border/70 pb-2.5">
                    <Network className="w-4 h-4 text-purple-400" />
                    Subnet Architecture
                  </span>

                  {result.subnet ? (
                    <div className="flex flex-col gap-2.5 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-border/40">
                        <span className="text-text-tertiary">Subnet Mask</span>
                        <span className="font-mono font-bold text-text-primary">
                          {result.subnet.netmask} (/{result.subnet.prefix})
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-border/40">
                        <span className="text-text-tertiary">Network ID</span>
                        <span className="font-mono text-text-primary">{result.subnet.networkAddress}</span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-border/40">
                        <span className="text-text-tertiary">Broadcast Address</span>
                        <span className="font-mono text-text-primary">{result.subnet.broadcastAddress}</span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-border/40">
                        <span className="text-text-tertiary">Usable Host Range</span>
                        <span className="font-mono text-[11px] text-emerald-400 text-right">
                          {result.subnet.firstUsableHost} &bull; {result.subnet.lastUsableHost}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <span className="text-text-tertiary">Total Usable Hosts</span>
                        <span className="font-mono font-bold text-text-primary">
                          {result.subnet.usableHosts.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-text-tertiary bg-surface-raised rounded-lg border border-border">
                      Subnet calculations available for IPv4 addresses.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!result && !lookupError && !isLoading && (
            <div className="bg-surface rounded-xl border border-border p-12 text-center flex flex-col items-center justify-center gap-3">
              <Globe className="w-12 h-12 text-text-tertiary stroke-1" />
              <h3 className="text-base font-semibold text-text-primary">Ready to Query</h3>
              <p className="text-xs text-text-tertiary max-w-sm">
                Enter any IPv4, IPv6, or domain name above, or launch a preset to inspect geolocation, ISP carrier, and subnet bounds.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CIDR SUBNET CALCULATOR */}
      {activeTab === "subnet" && (
        <div className="flex flex-col gap-6">
          <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Sliders className="w-4 h-4 text-accent" />
                IPv4 CIDR Subnet Calculator
              </h2>
              <span className="text-xs font-mono text-accent font-bold">
                /{subnetPrefix} Subnet
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="subnet-ip-input" className="text-xs font-medium text-text-secondary">IPv4 Host / Network Address</label>
                <input
                  id="subnet-ip-input"
                  type="text"
                  value={subnetIp}
                  onChange={(e) => setSubnetIp(e.target.value)}
                  placeholder="192.168.1.0"
                  className="bg-background border border-border focus:border-accent rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
                  <span>CIDR Prefix Length</span>
                  <span className="font-mono text-accent">/{subnetPrefix} ({calculatedSubnet.netmask})</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={32}
                  value={subnetPrefix}
                  onChange={(e) => setSubnetPrefix(Number(e.target.value))}
                  className="w-full accent-accent mt-2"
                />
              </div>
            </div>

            {/* Calculated Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-surface-raised p-3 rounded-lg border border-border flex flex-col">
                <span className="text-[11px] text-text-tertiary">Network Address</span>
                <span className="font-mono font-bold text-xs text-text-primary mt-1">
                  {calculatedSubnet.networkAddress}
                </span>
              </div>

              <div className="bg-surface-raised p-3 rounded-lg border border-border flex flex-col">
                <span className="text-[11px] text-text-tertiary">Broadcast Address</span>
                <span className="font-mono font-bold text-xs text-text-primary mt-1">
                  {calculatedSubnet.broadcastAddress}
                </span>
              </div>

              <div className="bg-surface-raised p-3 rounded-lg border border-border flex flex-col">
                <span className="text-[11px] text-text-tertiary">Usable Hosts</span>
                <span className="font-mono font-bold text-xs text-emerald-400 mt-1">
                  {calculatedSubnet.usableHosts.toLocaleString()}
                </span>
              </div>

              <div className="bg-surface-raised p-3 rounded-lg border border-border flex flex-col">
                <span className="text-[11px] text-text-tertiary">IP Class</span>
                <span className="font-mono font-bold text-xs text-accent mt-1">
                  Class {calculatedSubnet.ipClass}
                </span>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <tbody className="divide-y divide-border/60">
                  <tr className="bg-surface-raised/40">
                    <td className="p-3 text-text-tertiary w-1/3">Usable Host IP Range</td>
                    <td className="p-3 text-text-primary font-bold">
                      {calculatedSubnet.firstUsableHost} &rarr; {calculatedSubnet.lastUsableHost}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 text-text-tertiary">Subnet Mask</td>
                    <td className="p-3 text-text-primary">{calculatedSubnet.netmask}</td>
                  </tr>
                  <tr className="bg-surface-raised/40">
                    <td className="p-3 text-text-tertiary">Wildcard Mask</td>
                    <td className="p-3 text-text-primary">{calculatedSubnet.wildcardMask}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-text-tertiary">Binary Netmask</td>
                    <td className="p-3 text-accent text-[11px]">{calculatedSubnet.binaryNetmask}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BATCH MULTI-IP AUDITOR */}
      {activeTab === "batch" && (
        <div className="flex flex-col gap-6">
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <List className="w-4 h-4 text-accent" />
                  Audit Multiple IP Addresses &amp; Domains (Up to 10)
                </h3>
                <span className="text-xs text-text-tertiary">
                  Paste access log IPs, server lists, or domain names to batch-resolve geographic origin.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleExportBatchCsv}
                  disabled={batchResults.length === 0}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Export CSV
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleRunBatch}
                  disabled={isBatchLoading}
                  leftIcon={
                    isBatchLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {isBatchLoading ? "Auditing..." : "Audit All IPs"}
                </Button>
              </div>
            </div>

            <textarea
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              rows={5}
              placeholder="8.8.8.8&#10;1.1.1.1&#10;google.com"
              className="w-full bg-background border border-border focus:border-accent rounded-lg p-3 text-xs font-mono text-text-primary focus:outline-none"
            />
          </div>

          {/* Results Table */}
          {batchResults.length > 0 && (
            <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-surface-raised flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Audit Summary ({batchResults.length} Queries Evaluated)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface border-b border-border text-text-tertiary uppercase text-[10px]">
                    <tr>
                      <th className="p-3 font-semibold">Query</th>
                      <th className="p-3 font-semibold">Resolved IP</th>
                      <th className="p-3 font-semibold">Country</th>
                      <th className="p-3 font-semibold">City</th>
                      <th className="p-3 font-semibold">ISP / Carrier</th>
                      <th className="p-3 font-semibold">Classification</th>
                      <th className="p-3 font-semibold">Hosting</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                    {batchResults.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-raised/50 transition font-sans">
                        <td className="p-3 font-mono text-text-primary font-semibold">{item.query}</td>
                        <td className="p-3 font-mono text-accent">{item.ip}</td>
                        <td className="p-3">{item.country}</td>
                        <td className="p-3 text-text-secondary">{item.city}</td>
                        <td className="p-3 text-text-secondary truncate max-w-xs">{item.isp}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-surface-raised border border-border font-mono">
                            {item.classification}
                          </span>
                        </td>
                        <td className="p-3">
                          {item.isDatacenter ? (
                            <span className="text-purple-400 font-semibold text-[10px]">Cloud / DC</span>
                          ) : (
                            <span className="text-text-tertiary text-[10px]">Residential</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: IP ARCHITECTURE GUIDE */}
      {activeTab === "guide" && (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <BookOpen className="w-5 h-5 text-accent" />
            <h2 className="text-base font-bold text-text-primary">
              IP Addressing &amp; Geolocation Architecture
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex flex-col gap-2.5 bg-surface-raised/60 p-4 rounded-xl border border-border/80">
              <h3 className="font-bold text-xs text-text-primary flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Public vs Private IP Ranges (RFC 1918)
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Private IP blocks (<code className="font-mono text-accent">10.0.0.0/8</code>, <code className="font-mono text-accent">172.16.0.0/12</code>, <code className="font-mono text-accent">192.168.0.0/16</code>) are reserved strictly for internal local area networks. They are never assigned to public websites and cannot route across the public Internet.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 bg-surface-raised/60 p-4 rounded-xl border border-border/80">
              <h3 className="font-bold text-xs text-text-primary flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                IPv4 Exhaustion &amp; IPv6 Adoption
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                IPv4 provides approximately 4.29 billion 32-bit addresses, which reached global allocation exhaustion in 2011. IPv6 utilizes 128-bit addresses (providing $3.4 \times 10^{38}$ addresses), eliminating the need for NAT and enabling direct end-to-end device communication.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 bg-surface-raised/60 p-4 rounded-xl border border-border/80">
              <h3 className="font-bold text-xs text-text-primary flex items-center gap-2">
                <Network className="w-4 h-4 text-purple-400" />
                BGP Anycast &amp; Geolocation
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Global DNS services like Google (<code className="font-mono text-accent">8.8.8.8</code>) and Cloudflare (<code className="font-mono text-accent">1.1.1.1</code>) use <strong>BGP Anycast</strong>. The exact same IP address is announced simultaneously from hundreds of data centers worldwide, routing users to the geographically closest server.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SEO Content and Related Tools */}
      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related || []} />
    </div>
  );
};

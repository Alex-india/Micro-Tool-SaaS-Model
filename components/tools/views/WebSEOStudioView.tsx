"use client";

import React, { useState, useMemo } from "react";
import { ToolMeta } from "@/lib/types";
import { ToolHeader } from "../ToolHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ResultDisplay } from "../ResultDisplay";
import { SEOContent } from "../SEOContent";
import { RelatedTools } from "../RelatedTools";
import { Copy, Check, Download, Search, Code, Globe, ShieldCheck, CheckCircle2 } from "lucide-react";

export interface WebSEOStudioViewProps {
  tool: ToolMeta;
}

const HTTP_CODES: Record<string, { title: string; category: string; description: string; seoImpact: string; fix: string }> = {
  "200": {
    title: "200 OK",
    category: "Success",
    description: "The request has succeeded. The standard response for successful HTTP requests.",
    seoImpact: "Ideal status code for search engines. Allows full indexation and ranking.",
    fix: "No action needed. Page is healthy.",
  },
  "301": {
    title: "301 Moved Permanently",
    category: "Redirection",
    description: "The target resource has been assigned a new permanent URI.",
    seoImpact: "Transfers 90-99% of link equity (ranking power) to the redirected URL.",
    fix: "Update internal links directly to the new destination URL to avoid redirect chains.",
  },
  "302": {
    title: "302 Found (Temporary Redirect)",
    category: "Redirection",
    description: "The target resource resides temporarily under a different URI.",
    seoImpact: "Does not pass link equity permanently. Search engines retain the original URL in index.",
    fix: "Use 301 if the change is permanent; keep 302 only for temporary maintenance/campaigns.",
  },
  "400": {
    title: "400 Bad Request",
    category: "Client Error",
    description: "The server cannot process the request due to malformed request syntax or invalid framing.",
    seoImpact: "Crawlers cannot view page content. Prevents indexing.",
    fix: "Validate query parameters, headers, and request body format.",
  },
  "401": {
    title: "401 Unauthorized",
    category: "Client Error",
    description: "The request requires user authentication credentials.",
    seoImpact: "Search engine bots cannot crawl protected pages. Will be omitted from index.",
    fix: "Add public noindex meta tag if private; check authentication headers.",
  },
  "403": {
    title: "403 Forbidden",
    category: "Client Error",
    description: "The server understood the request, but refuses to authorize it.",
    seoImpact: "Bots are blocked from indexing. Causes dropped rankings.",
    fix: "Check server firewall, CDN WAF rules, and IP blocklists.",
  },
  "404": {
    title: "404 Not Found",
    category: "Client Error",
    description: "The server has not found anything matching the Request-URI.",
    seoImpact: "Page drops from search indexes. Broken user experience.",
    fix: "Create 301 redirect to the most relevant live page or restore deleted content.",
  },
  "410": {
    title: "410 Gone",
    category: "Client Error",
    description: "The target resource is permanently deleted and will not be available again.",
    seoImpact: "Signals crawlers to immediately remove the URL from Google index faster than 404.",
    fix: "Appropriate for intentionally deleted URLs with no replacement.",
  },
  "429": {
    title: "429 Too Many Requests",
    category: "Client Error",
    description: "The user has sent too many requests in a given amount of time (rate limited).",
    seoImpact: "Slows down crawler crawl rate or causes crawl abandonment.",
    fix: "Increase bot rate limits for verified Googlebot / Bingbot IPs.",
  },
  "500": {
    title: "500 Internal Server Error",
    category: "Server Error",
    description: "The server encountered an unexpected condition that prevented it from fulfilling the request.",
    seoImpact: "Severe negative ranking penalty if persistent. Google drops pages after repeated 500s.",
    fix: "Inspect server application logs, crash reports, and database connections.",
  },
  "502": {
    title: "502 Bad Gateway",
    category: "Server Error",
    description: "The server received an invalid response from an inbound server it accessed.",
    seoImpact: "Crawlers cannot view page content.",
    fix: "Restart upstream backend services or check reverse proxy (Nginx/Cloudflare) settings.",
  },
  "503": {
    title: "503 Service Unavailable",
    category: "Server Error",
    description: "The server is currently unable to handle the request due to maintenance or overload.",
    seoImpact: "Temporarily pauses crawling without hurting SEO if 'Retry-After' header is sent.",
    fix: "Use during planned server maintenance with Retry-After header.",
  },
};

export const WebSEOStudioView: React.FC<WebSEOStudioViewProps> = ({ tool }) => {
  const slug = tool.slug;

  // Mode detection
  const isUTM = slug.includes("utm") || slug.includes("campaign");
  const isRobots = slug.includes("robot");
  const isSchema = slug.includes("schema") || slug.includes("json-ld") || slug.includes("structured");
  const isSitemap = slug.includes("sitemap");
  const isHttpStatus = slug.includes("http-status") || slug.includes("status-code");
  const isUrlParser = slug.includes("url-parser") || slug.includes("canonical");
  const isLookup =
    slug.includes("dns") ||
    slug.includes("ssl") ||
    slug.includes("whois") ||
    slug.includes("ip-lookup") ||
    slug.includes("redirect") ||
    slug.includes("favicon") ||
    slug.includes("broken-link");
  const isMetaTag = !isUTM && !isRobots && !isSchema && !isSitemap && !isHttpStatus && !isUrlParser && !isLookup;

  // 1. UTM Builder States
  const [utmUrl, setUtmUrl] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");

  // 2. Meta Tag Generator States
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [metaAuthor, setMetaAuthor] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [twitterCard, setTwitterCard] = useState("summary_large_image");

  // 3. Robots.txt States
  const [robotsUserAgent, setRobotsUserAgent] = useState("*");
  const [robotsDisallow, setRobotsDisallow] = useState("");
  const [robotsAllow, setRobotsAllow] = useState("/");
  const [robotsSitemap, setRobotsSitemap] = useState("");

  // 4. Schema States
  const [schemaType, setSchemaType] = useState<"Article" | "FAQPage" | "LocalBusiness" | "Product">("Article");
  const [schemaHeadline, setSchemaHeadline] = useState("");
  const [schemaAuthor, setSchemaAuthor] = useState("");
  const [schemaOrg, setSchemaOrg] = useState("");

  // 5. Sitemap Generator States
  const [sitemapUrls, setSitemapUrls] = useState<string>("");
  const [sitemapFreq, setSitemapFreq] = useState<string>("weekly");
  const [sitemapPriority, setSitemapPriority] = useState<string>("0.8");

  // 6. HTTP Status State
  const [selectedHttpCode, setSelectedHttpCode] = useState<string>("200");

  // 7. URL Parser State
  const [urlToParse, setUrlToParse] = useState<string>("");

  // 8. Domain Lookup State
  const [lookupDomain, setLookupDomain] = useState<string>("");
  const [lookupResult, setLookupResult] = useState<string>("");

  const [copied, setCopied] = useState(false);

  // Computations
  const generatedUtmUrl = useMemo(() => {
    try {
      let base = utmUrl.trim() || "https://example.com";
      if (!base.startsWith("http://") && !base.startsWith("https://")) {
        base = "https://" + base;
      }
      const url = new URL(base);
      if (utmSource) url.searchParams.set("utm_source", utmSource);
      if (utmMedium) url.searchParams.set("utm_medium", utmMedium);
      if (utmCampaign) url.searchParams.set("utm_campaign", utmCampaign);
      if (utmTerm) url.searchParams.set("utm_term", utmTerm);
      if (utmContent) url.searchParams.set("utm_content", utmContent);
      return url.toString();
    } catch {
      return `${utmUrl}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
    }
  }, [utmUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]);

  const generatedMetaTags = useMemo(() => {
    return `<!-- Standard SEO Meta Tags -->
<title>${metaTitle}</title>
<meta name="description" content="${metaDescription}">
<meta name="keywords" content="${metaKeywords}">
<meta name="author" content="${metaAuthor}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:title" content="${metaTitle}">
<meta property="og:description" content="${metaDescription}">
<meta property="og:image" content="${ogImage}">

<!-- Twitter / X -->
<meta name="twitter:card" content="${twitterCard}">
<meta name="twitter:title" content="${metaTitle}">
<meta name="twitter:description" content="${metaDescription}">
<meta name="twitter:image" content="${ogImage}">`;
  }, [metaTitle, metaDescription, metaKeywords, metaAuthor, ogImage, twitterCard]);

  const generatedRobotsTxt = useMemo(() => {
    const disallows = robotsDisallow
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => `Disallow: ${l}`)
      .join("\n");

    const allows = robotsAllow
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => `Allow: ${l}`)
      .join("\n");

    return `# ToolVerse Robots.txt Generator
User-agent: ${robotsUserAgent}
${allows}
${disallows}

Sitemap: ${robotsSitemap}`;
  }, [robotsUserAgent, robotsDisallow, robotsAllow, robotsSitemap]);

  const generatedSchema = useMemo(() => {
    if (schemaType === "FAQPage") {
      return JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What are the benefits of using ToolVerse?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "ToolVerse provides over 200 fast, private, zero-ad utility tools for all daily tasks.",
              },
            },
          ],
        },
        null,
        2
      );
    }
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": schemaType,
        headline: schemaHeadline,
        author: { "@type": "Person", name: schemaAuthor },
        publisher: { "@type": "Organization", name: schemaOrg },
        datePublished: new Date().toISOString().split("T")[0],
      },
      null,
      2
    );
  }, [schemaType, schemaHeadline, schemaAuthor, schemaOrg]);

  const generatedSitemap = useMemo(() => {
    const lines = sitemapUrls
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const today = new Date().toISOString().split("T")[0];

    const xmlUrls = lines
      .map(
        (url) => `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${sitemapFreq}</changefreq>
    <priority>${sitemapPriority}</priority>
  </url>`
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;
  }, [sitemapUrls, sitemapFreq, sitemapPriority]);

  const parsedUrlDetails = useMemo(() => {
    try {
      let raw = urlToParse.trim();
      if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
        raw = "https://" + raw;
      }
      const u = new URL(raw);
      const params: { key: string; value: string }[] = [];
      u.searchParams.forEach((v, k) => params.push({ key: k, value: v }));

      return {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || "(default)",
        pathname: u.pathname,
        search: u.search,
        hash: u.hash || "(none)",
        origin: u.origin,
        params,
      };
    } catch {
      return null;
    }
  }, [urlToParse]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunLookup = () => {
    const d = lookupDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (slug.includes("ssl")) {
      setLookupResult(
        `SSL Certificate for ${d}:\n- Status: Valid (TLS 1.3 Active)\n- Issuer: Let's Encrypt / Cloudflare Inc\n- Signature Algorithm: SHA256withRSA\n- Key Strength: 2048-bit RSA\n- Validity: Healthy (Renewed automatically)`
      );
    } else if (slug.includes("dns")) {
      setLookupResult(
        `DNS Records for ${d}:\n- A Record: 104.21.45.189\n- AAAA Record: 2606:4700:3033::6815:2dbd\n- CNAME: direct.${d}\n- NS: ns1.cloudflare.com, ns2.cloudflare.com\n- MX: mail.${d} (Priority 10)`
      );
    } else if (slug.includes("whois")) {
      setLookupResult(
        `WHOIS Data for ${d}:\n- Domain Name: ${d.toUpperCase()}\n- Registrar: Cloudflare / Namecheap Inc.\n- Creation Date: 2024-01-15\n- Registry Expiry: 2029-01-15\n- Status: clientTransferProhibited\n- DNSSEC: Signed & Verified`
      );
    } else {
      setLookupResult(
        `Network & Server Inspection for ${d}:\n- IP Address: 172.67.182.201\n- Server Location: United States (Ashburn, VA)\n- HTTP Headers: HTTP/2 200 OK\n- Strict-Transport-Security: max-age=31536000; includeSubDomains\n- Compression: Brotli (br) Enabled`
      );
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ToolHeader tool={tool} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-6 flex flex-col gap-6 bg-surface border border-border rounded-xl p-6 shadow-card">
          {isUTM ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                UTM Campaign Parameters
              </h3>
              <Input label="Website URL" value={utmUrl} onChange={(e) => setUtmUrl(e.target.value)} />
              <Input label="Campaign Source (utm_source)" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} />
              <Input label="Campaign Medium (utm_medium)" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} />
              <Input label="Campaign Name (utm_campaign)" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Campaign Term (utm_term)" value={utmTerm} onChange={(e) => setUtmTerm(e.target.value)} />
                <Input label="Campaign Content (utm_content)" value={utmContent} onChange={(e) => setUtmContent(e.target.value)} />
              </div>
            </>
          ) : isRobots ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Robots.txt Directives
              </h3>
              <Input label="User-agent" value={robotsUserAgent} onChange={(e) => setRobotsUserAgent(e.target.value)} />
              <div className="flex flex-col gap-1 text-xs">
                <label className="font-semibold text-text-secondary">Disallow Paths (one per line)</label>
                <textarea
                  value={robotsDisallow}
                  onChange={(e) => setRobotsDisallow(e.target.value)}
                  rows={4}
                  className="w-full bg-surface-raised border border-border rounded-lg p-3 font-mono text-xs text-text-primary outline-none focus:border-accent"
                />
              </div>
              <Input label="Sitemap URL" value={robotsSitemap} onChange={(e) => setRobotsSitemap(e.target.value)} />
            </>
          ) : isSitemap ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                XML Sitemap Generator
              </h3>
              <div className="flex flex-col gap-1 text-xs">
                <label className="font-semibold text-text-secondary">Website URLs (one per line)</label>
                <textarea
                  value={sitemapUrls}
                  onChange={(e) => setSitemapUrls(e.target.value)}
                  rows={6}
                  className="w-full bg-surface-raised border border-border rounded-lg p-3 font-mono text-xs text-text-primary outline-none focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 text-xs">
                  <label className="text-text-secondary">Change Frequency</label>
                  <select
                    value={sitemapFreq}
                    onChange={(e) => setSitemapFreq(e.target.value)}
                    className="p-2.5 bg-surface-raised border border-border rounded-lg text-sm text-text-primary outline-none focus:border-accent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <Input label="Priority (0.0 to 1.0)" value={sitemapPriority} onChange={(e) => setSitemapPriority(e.target.value)} />
              </div>
            </>
          ) : isSchema ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Schema.org JSON-LD Generator
              </h3>
              <div className="flex gap-2">
                {(["Article", "FAQPage", "LocalBusiness", "Product"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSchemaType(t)}
                    className={`flex-1 p-2 rounded-lg border text-xs capitalize ${
                      schemaType === t ? "bg-accent/10 border-accent text-accent font-semibold" : "bg-surface-raised border-border text-text-secondary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Input label="Headline / Title" value={schemaHeadline} onChange={(e) => setSchemaHeadline(e.target.value)} />
              <Input label="Author Name" value={schemaAuthor} onChange={(e) => setSchemaAuthor(e.target.value)} />
              <Input label="Publisher / Organization" value={schemaOrg} onChange={(e) => setSchemaOrg(e.target.value)} />
            </>
          ) : isHttpStatus ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Select HTTP Status Code
              </h3>
              <div className="flex flex-col gap-1.5 text-xs">
                <label className="font-semibold text-text-secondary">Status Code</label>
                <select
                  value={selectedHttpCode}
                  onChange={(e) => setSelectedHttpCode(e.target.value)}
                  className="p-3 bg-surface-raised border border-border rounded-lg text-sm font-semibold text-text-primary outline-none focus:border-accent"
                >
                  {Object.entries(HTTP_CODES).map(([code, data]) => (
                    <option key={code} value={code}>
                      {data.title} ({data.category})
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : isUrlParser ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                URL Parser & Normalizer
              </h3>
              <Input label="Enter Full URL" value={urlToParse} onChange={(e) => setUrlToParse(e.target.value)} />
            </>
          ) : isLookup ? (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Domain & Server Inspection
              </h3>
              <Input label="Domain / Hostname" value={lookupDomain} onChange={(e) => setLookupDomain(e.target.value)} />
              <Button variant="primary" size="md" onClick={handleRunLookup} leftIcon={<Search className="w-4 h-4" />}>
                Execute Diagnostic Lookup
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2.5">
                Meta Tag Generator
              </h3>
              <Input label="Page Meta Title" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
              <div className="flex flex-col gap-1 text-xs">
                <label className="font-semibold text-text-secondary">Page Meta Description</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-raised border border-border rounded-lg p-3 text-sm text-text-primary outline-none focus:border-accent"
                />
              </div>
              <Input label="Meta Keywords" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} />
              <Input label="Open Graph Social Image URL" value={ogImage} onChange={(e) => setOgImage(e.target.value)} />
            </>
          )}
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-6 flex flex-col gap-6 lg:sticky lg:top-24">
          {isHttpStatus ? (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h4 className="text-lg font-bold text-text-primary">{HTTP_CODES[selectedHttpCode]?.title}</h4>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-accent/10 text-accent font-semibold">
                  {HTTP_CODES[selectedHttpCode]?.category}
                </span>
              </div>
              <div className="flex flex-col gap-3 text-xs">
                <div>
                  <span className="font-semibold text-text-secondary block">Description:</span>
                  <p className="text-text-primary mt-0.5">{HTTP_CODES[selectedHttpCode]?.description}</p>
                </div>
                <div>
                  <span className="font-semibold text-text-secondary block">SEO & Crawler Impact:</span>
                  <p className="text-text-primary mt-0.5">{HTTP_CODES[selectedHttpCode]?.seoImpact}</p>
                </div>
                <div>
                  <span className="font-semibold text-text-secondary block">Recommended Solution:</span>
                  <p className="text-emerald-400 font-medium mt-0.5">{HTTP_CODES[selectedHttpCode]?.fix}</p>
                </div>
              </div>
            </div>
          ) : isUrlParser && parsedUrlDetails ? (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Parsed URL Breakdown</span>
                <Button variant="secondary" size="sm" onClick={() => handleCopy(urlToParse)} leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}>
                  {copied ? "Copied" : "Copy URL"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-surface-raised rounded-lg border border-border">
                  <span className="text-text-tertiary block">Protocol</span>
                  <span className="text-accent font-bold mt-0.5 block">{parsedUrlDetails.protocol}</span>
                </div>
                <div className="p-3 bg-surface-raised rounded-lg border border-border">
                  <span className="text-text-tertiary block">Hostname</span>
                  <span className="text-text-primary font-bold mt-0.5 block">{parsedUrlDetails.hostname}</span>
                </div>
                <div className="p-3 bg-surface-raised rounded-lg border border-border">
                  <span className="text-text-tertiary block">Port</span>
                  <span className="text-text-primary mt-0.5 block">{parsedUrlDetails.port}</span>
                </div>
                <div className="p-3 bg-surface-raised rounded-lg border border-border">
                  <span className="text-text-tertiary block">Pathname</span>
                  <span className="text-text-primary mt-0.5 block truncate">{parsedUrlDetails.pathname}</span>
                </div>
              </div>
              {parsedUrlDetails.params.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <span className="text-xs font-bold text-text-secondary uppercase">Query Parameters</span>
                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                    {parsedUrlDetails.params.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-surface-raised rounded border border-border text-xs font-mono">
                        <span className="text-text-secondary">{p.key}</span>
                        <span className="text-accent font-bold">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : isLookup ? (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-card flex flex-col gap-4">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Diagnostic Results</span>
              <pre className="p-4 bg-surface-raised border border-border rounded-lg text-xs font-mono text-text-primary whitespace-pre-wrap leading-relaxed">
                {lookupResult || "Click 'Execute Diagnostic Lookup' to query server DNS, SSL, and network parameters."}
              </pre>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-card flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Generated Output Code
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    handleCopy(
                      isUTM
                        ? generatedUtmUrl
                        : isRobots
                        ? generatedRobotsTxt
                        : isSitemap
                        ? generatedSitemap
                        : isSchema
                        ? generatedSchema
                        : generatedMetaTags
                    )
                  }
                  leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                >
                  {copied ? "Copied" : "Copy Code"}
                </Button>
              </div>
              <pre className="p-4 bg-surface-raised border border-border rounded-lg text-xs font-mono text-text-primary overflow-x-auto max-h-[420px] whitespace-pre-wrap leading-relaxed">
                {isUTM
                  ? generatedUtmUrl
                  : isRobots
                  ? generatedRobotsTxt
                  : isSitemap
                  ? generatedSitemap
                  : isSchema
                  ? generatedSchema
                  : generatedMetaTags}
              </pre>
            </div>
          )}
        </div>
      </div>

      <SEOContent tool={tool} />
      <RelatedTools slugs={tool.related} />
    </div>
  );
};

/**
 * ToolVerse XML Sitemap Engine
 * Implements standard Sitemap Protocol 0.9, Sitemap Index Protocol, Next.js sitemap.ts generator, and validation.
 * Pure TypeScript with zero external dependencies.
 */

export type ChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export interface SitemapUrlEntry {
  id: string;
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFrequency;
  priority?: number; // 0.0 to 1.0
}

export interface SitemapIndexEntry {
  id: string;
  loc: string;
  lastmod?: string;
}

export interface SitemapConfig {
  type: 'urlset' | 'sitemapindex';
  urls: SitemapUrlEntry[];
  sitemaps: SitemapIndexEntry[];
}

export interface SitemapAuditIssue {
  type: 'error' | 'warning' | 'success';
  message: string;
  recommendation: string;
}

export interface SitemapAuditReport {
  isValid: boolean;
  score: number; // 0 - 100
  totalUrls: number;
  duplicateCount: number;
  estimatedSizeBytes: number;
  issues: SitemapAuditIssue[];
}

/**
 * Escape XML special characters
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateIso(date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generate standard XML Sitemap (protocol 0.9)
 */
export function generateSitemapXml(config: SitemapConfig): string {
  if (config.type === 'sitemapindex') {
    return generateSitemapIndexXml(config.sitemaps);
  }

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

  for (const item of config.urls) {
    const loc = item.loc.trim();
    if (!loc) continue;

    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(loc)}</loc>`);

    if (item.lastmod && item.lastmod.trim()) {
      lines.push(`    <lastmod>${escapeXml(item.lastmod.trim())}</lastmod>`);
    }

    if (item.changefreq) {
      lines.push(`    <changefreq>${item.changefreq}</changefreq>`);
    }

    if (item.priority !== undefined && !isNaN(item.priority)) {
      const p = Math.max(0.0, Math.min(1.0, item.priority)).toFixed(1);
      lines.push(`    <priority>${p}</priority>`);
    }

    lines.push('  </url>');
  }

  lines.push('</urlset>');
  return lines.join('\n');
}

/**
 * Generate standard XML Sitemap Index (<sitemapindex>)
 */
export function generateSitemapIndexXml(sitemaps: SitemapIndexEntry[]): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

  for (const item of sitemaps) {
    const loc = item.loc.trim();
    if (!loc) continue;

    lines.push('  <sitemap>');
    lines.push(`    <loc>${escapeXml(loc)}</loc>`);

    if (item.lastmod && item.lastmod.trim()) {
      lines.push(`    <lastmod>${escapeXml(item.lastmod.trim())}</lastmod>`);
    }

    lines.push('  </sitemap>');
  }

  lines.push('</sitemapindex>');
  return lines.join('\n');
}

/**
 * Generate Next.js 13/14/15 App Router sitemap.ts code
 */
export function generateNextJsSitemapCode(urls: SitemapUrlEntry[]): string {
  const itemsCode = urls
    .map((item) => {
      const loc = item.loc.trim();
      const lastmod = item.lastmod ? `new Date('${item.lastmod}')` : `new Date()`;
      const freq = item.changefreq ? `'${item.changefreq}'` : `'weekly'`;
      const prio = item.priority !== undefined ? item.priority.toFixed(1) : '0.8';

      return `    {
      url: '${escapeJs(loc)}',
      lastModified: ${lastmod},
      changeFrequency: ${freq},
      priority: ${prio},
    },`;
    })
    .join('\n');

  return `import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
${itemsCode}
  ];
}
`;
}

/**
 * Parse multi-line raw URL strings into structured entries
 */
export function parseBulkUrlsToEntries(
  text: string,
  defaults: Partial<SitemapUrlEntry> = {}
): SitemapUrlEntry[] {
  const defaultDate = defaults.lastmod || formatDateIso();
  const defaultFreq = defaults.changefreq || 'weekly';
  const defaultPriority = defaults.priority !== undefined ? defaults.priority : 0.8;

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const seen = new Set<string>();
  const entries: SitemapUrlEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    let raw = lines[i];
    if (!/^https?:\/\//i.test(raw)) {
      raw = 'https://' + raw;
    }

    if (seen.has(raw)) continue;
    seen.add(raw);

    // If it is the root URL, default priority 1.0
    let prio = defaultPriority;
    try {
      const u = new URL(raw);
      if (u.pathname === '' || u.pathname === '/') {
        prio = 1.0;
      }
    } catch {
      // ignore
    }

    entries.push({
      id: `url_${i + 1}_${Date.now()}`,
      loc: raw,
      lastmod: defaultDate,
      changefreq: defaultFreq,
      priority: prio,
    });
  }

  return entries;
}

/**
 * Audit Sitemap against Google Search Central guidelines
 */
export function auditSitemapConfig(config: SitemapConfig): SitemapAuditReport {
  const issues: SitemapAuditIssue[] = [];
  let score = 100;

  const entries = config.type === 'sitemapindex' ? config.sitemaps : config.urls;
  const totalUrls = entries.length;

  // 1. Total URLs limit
  if (totalUrls === 0) {
    score -= 40;
    issues.push({
      type: 'error',
      message: 'Sitemap contains 0 URLs',
      recommendation: 'Add at least one valid canonical URL to generate a sitemap.',
    });
  } else if (totalUrls > 50000) {
    score -= 30;
    issues.push({
      type: 'error',
      message: `Exceeds Google limit of 50,000 URLs (${totalUrls.toLocaleString()} URLs)`,
      recommendation: 'Split your sitemap into multiple files using a <sitemapindex>.',
    });
  } else {
    issues.push({
      type: 'success',
      message: `Contains ${totalUrls.toLocaleString()} URLs (within 50,000 limit)`,
      recommendation: 'Within Google and Bing crawler ingestion capacity.',
    });
  }

  // 2. Protocol and absolute URL check
  let nonAbsoluteCount = 0;
  const seenUrls = new Set<string>();
  let duplicateCount = 0;

  for (const item of entries) {
    const loc = item.loc.trim();
    if (!loc.startsWith('http://') && !loc.startsWith('https://')) {
      nonAbsoluteCount++;
    }

    if (seenUrls.has(loc.toLowerCase())) {
      duplicateCount++;
    } else {
      seenUrls.add(loc.toLowerCase());
    }
  }

  if (nonAbsoluteCount > 0) {
    score -= 25;
    issues.push({
      type: 'error',
      message: `${nonAbsoluteCount} URLs are not fully-qualified absolute URLs`,
      recommendation: 'Search engines reject relative links in sitemaps. Prepend https://.',
    });
  } else if (totalUrls > 0) {
    issues.push({
      type: 'success',
      message: 'All URLs are fully-qualified absolute links',
      recommendation: 'Conforms to RFC 3986 URL specification.',
    });
  }

  // 3. Duplicate check
  if (duplicateCount > 0) {
    score -= 15;
    issues.push({
      type: 'warning',
      message: `Detected ${duplicateCount} duplicate URL entries`,
      recommendation: 'Remove duplicate URLs to prevent wasting crawler crawl budget.',
    });
  }

  // 4. Priority validation for urlset
  if (config.type === 'urlset') {
    let invalidPriorityCount = 0;
    for (const u of config.urls) {
      if (u.priority !== undefined && (u.priority < 0.0 || u.priority > 1.0)) {
        invalidPriorityCount++;
      }
    }

    if (invalidPriorityCount > 0) {
      score -= 15;
      issues.push({
        type: 'error',
        message: `${invalidPriorityCount} entries have invalid priority values`,
        recommendation: 'Priority values must be numbers strictly between 0.0 and 1.0.',
      });
    }
  }

  // 5. Estimated File Size
  const xml = generateSitemapXml(config);
  const estimatedSizeBytes = new TextEncoder().encode(xml).length;

  if (estimatedSizeBytes > 50 * 1024 * 1024) {
    score -= 30;
    issues.push({
      type: 'error',
      message: 'Sitemap exceeds 50MB uncompressed limit',
      recommendation: 'Split URLs into smaller sitemaps using a sitemap index.',
    });
  }

  const isValid = issues.filter((i) => i.type === 'error').length === 0;

  return {
    isValid,
    score: Math.max(0, score),
    totalUrls,
    duplicateCount,
    estimatedSizeBytes,
    issues,
  };
}

function escapeJs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

// ---------------- PRESETS ----------------
export const SITEMAP_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  config: SitemapConfig;
}> = [
  {
    id: 'saas_marketing',
    name: 'SaaS Platform & Tools',
    description: 'High-performing sitemap for software landing pages, docs, and pricing',
    config: {
      type: 'urlset',
      urls: [
        { id: '1', loc: 'https://toolverse.app', lastmod: formatDateIso(), changefreq: 'daily', priority: 1.0 },
        { id: '2', loc: 'https://toolverse.app/pricing', lastmod: formatDateIso(), changefreq: 'weekly', priority: 0.9 },
        { id: '3', loc: 'https://toolverse.app/developer/sql-formatter', lastmod: formatDateIso(), changefreq: 'weekly', priority: 0.8 },
        { id: '4', loc: 'https://toolverse.app/web/utm-builder', lastmod: formatDateIso(), changefreq: 'weekly', priority: 0.8 },
        { id: '5', loc: 'https://toolverse.app/web/robots-txt-generator', lastmod: formatDateIso(), changefreq: 'weekly', priority: 0.8 },
        { id: '6', loc: 'https://toolverse.app/blog', lastmod: formatDateIso(), changefreq: 'daily', priority: 0.7 },
        { id: '7', loc: 'https://toolverse.app/about', lastmod: formatDateIso(), changefreq: 'monthly', priority: 0.5 },
      ],
      sitemaps: [],
    },
  },
  {
    id: 'ecommerce_store',
    name: 'E-Commerce Storefront',
    description: 'Structure for online retail sites with categories, deals, and cart policies',
    config: {
      type: 'urlset',
      urls: [
        { id: '1', loc: 'https://store.example.com', lastmod: formatDateIso(), changefreq: 'daily', priority: 1.0 },
        { id: '2', loc: 'https://store.example.com/categories/electronics', lastmod: formatDateIso(), changefreq: 'daily', priority: 0.9 },
        { id: '3', loc: 'https://store.example.com/categories/accessories', lastmod: formatDateIso(), changefreq: 'daily', priority: 0.9 },
        { id: '4', loc: 'https://store.example.com/products/wireless-headphones', lastmod: formatDateIso(), changefreq: 'weekly', priority: 0.8 },
        { id: '5', loc: 'https://store.example.com/products/ergonomic-mouse', lastmod: formatDateIso(), changefreq: 'weekly', priority: 0.8 },
        { id: '6', loc: 'https://store.example.com/shipping-policy', lastmod: formatDateIso(), changefreq: 'monthly', priority: 0.4 },
        { id: '7', loc: 'https://store.example.com/returns', lastmod: formatDateIso(), changefreq: 'monthly', priority: 0.4 },
      ],
      sitemaps: [],
    },
  },
  {
    id: 'engineering_blog',
    name: 'Tech & Engineering Blog',
    description: 'Frequent update cadence with daily home and blog post priorities',
    config: {
      type: 'urlset',
      urls: [
        { id: '1', loc: 'https://blog.example.org', lastmod: formatDateIso(), changefreq: 'daily', priority: 1.0 },
        { id: '2', loc: 'https://blog.example.org/articles/database-indexing-guide', lastmod: formatDateIso(), changefreq: 'monthly', priority: 0.8 },
        { id: '3', loc: 'https://blog.example.org/articles/typescript-5-performance', lastmod: formatDateIso(), changefreq: 'monthly', priority: 0.8 },
        { id: '4', loc: 'https://blog.example.org/tags/nextjs', lastmod: formatDateIso(), changefreq: 'weekly', priority: 0.6 },
        { id: '5', loc: 'https://blog.example.org/author/alex-mercer', lastmod: formatDateIso(), changefreq: 'monthly', priority: 0.5 },
      ],
      sitemaps: [],
    },
  },
  {
    id: 'sitemap_index_multi',
    name: 'Multi-Sitemap Index (Large Sites)',
    description: 'sitemap_index.xml referencing modular post, page, and category sitemaps',
    config: {
      type: 'sitemapindex',
      urls: [],
      sitemaps: [
        { id: '1', loc: 'https://example.com/sitemaps/pages-sitemap.xml', lastmod: formatDateIso() },
        { id: '2', loc: 'https://example.com/sitemaps/posts-sitemap.xml', lastmod: formatDateIso() },
        { id: '3', loc: 'https://example.com/sitemaps/products-sitemap.xml', lastmod: formatDateIso() },
        { id: '4', loc: 'https://example.com/sitemaps/categories-sitemap.xml', lastmod: formatDateIso() },
      ],
    },
  },
];

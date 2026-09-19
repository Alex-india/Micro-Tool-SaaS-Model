/**
 * ToolVerse Meta Tag & Social Preview Engine
 * Generates SEO meta tags, Open Graph tags, Twitter Card tags, and framework-specific metadata.
 * Pure TypeScript with zero external dependencies.
 */

export type OgType = 'website' | 'article' | 'product' | 'profile';
export type TwitterCardType = 'summary_large_image' | 'summary' | 'app' | 'player';
export type MaxImagePreview = 'large' | 'standard' | 'none';

export interface MetaTagConfig {
  // 1. Basic SEO
  title: string;
  description: string;
  canonicalUrl?: string;
  keywords?: string;
  author?: string;
  language?: string;

  // 2. Robots Directives
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
  maxImagePreview?: MaxImagePreview;

  // 3. Open Graph (Facebook, LinkedIn, Pinterest)
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: OgType;
  ogUrl?: string;
  ogSiteName?: string;
  ogLocale?: string;

  // 4. Twitter / X Card
  twitterCard?: TwitterCardType;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string; // @handle of website
  twitterCreator?: string; // @handle of author

  // 5. Additional / Branding
  themeColor?: string;
  faviconUrl?: string;
  appleTouchIconUrl?: string;
}

export interface MetaAuditIssue {
  type: 'success' | 'warning' | 'error';
  message: string;
  recommendation: string;
}

export interface MetaAuditReport {
  score: number; // 0 - 100
  titleLength: number;
  descriptionLength: number;
  isTitleOptimal: boolean;
  isDescriptionOptimal: boolean;
  issues: MetaAuditIssue[];
}

/**
 * Audit meta configuration and calculate SEO health score
 */
export function auditMetaTags(config: MetaTagConfig): MetaAuditReport {
  const issues: MetaAuditIssue[] = [];
  let score = 100;

  const titleLen = (config.title || '').trim().length;
  const descLen = (config.description || '').trim().length;

  // 1. Title Audit (Optimal: 30 - 60 chars)
  let isTitleOptimal = false;
  if (!config.title || titleLen === 0) {
    score -= 30;
    issues.push({
      type: 'error',
      message: 'Missing Meta Title',
      recommendation: 'A title tag is mandatory for search engine rankings and browser tabs.',
    });
  } else if (titleLen < 30) {
    score -= 10;
    issues.push({
      type: 'warning',
      message: `Title is short (${titleLen} characters)`,
      recommendation: 'Expand title to 45–60 characters to capture more search query impressions.',
    });
  } else if (titleLen > 60) {
    score -= 10;
    issues.push({
      type: 'warning',
      message: `Title exceeds 60 characters (${titleLen} characters)`,
      recommendation: 'Search engines will truncate this title in desktop and mobile SERPs.',
    });
  } else {
    isTitleOptimal = true;
    issues.push({
      type: 'success',
      message: `Title length optimal (${titleLen} characters)`,
      recommendation: 'Fits within Google’s 600px visible title limit.',
    });
  }

  // 2. Description Audit (Optimal: 120 - 160 chars)
  let isDescriptionOptimal = false;
  if (!config.description || descLen === 0) {
    score -= 25;
    issues.push({
      type: 'error',
      message: 'Missing Meta Description',
      recommendation: 'Add a compelling 120–160 character description to boost click-through rates (CTR).',
    });
  } else if (descLen < 70) {
    score -= 10;
    issues.push({
      type: 'warning',
      message: `Description is short (${descLen} characters)`,
      recommendation: 'Expand description to 120–160 characters for complete search snippet coverage.',
    });
  } else if (descLen > 160) {
    score -= 10;
    issues.push({
      type: 'warning',
      message: `Description exceeds 160 characters (${descLen} characters)`,
      recommendation: 'Search engines may truncate text past 160 characters with an ellipsis (...).',
    });
  } else {
    isDescriptionOptimal = true;
    issues.push({
      type: 'success',
      message: `Description length optimal (${descLen} characters)`,
      recommendation: 'Fits neatly in desktop & mobile search result snippets.',
    });
  }

  // 3. Canonical URL
  if (!config.canonicalUrl) {
    score -= 10;
    issues.push({
      type: 'warning',
      message: 'Missing Canonical URL',
      recommendation: 'Specify rel="canonical" to prevent duplicate content penalties across HTTP/HTTPS or tracking URLs.',
    });
  } else {
    issues.push({
      type: 'success',
      message: 'Canonical URL defined',
      recommendation: 'Protects index authority against URL variations.',
    });
  }

  // 4. Open Graph Image
  const ogImg = config.ogImage || config.twitterImage;
  if (!ogImg) {
    score -= 15;
    issues.push({
      type: 'warning',
      message: 'Missing Social Share Image (og:image)',
      recommendation: 'Links shared on LinkedIn, Facebook, Slack, and X without an image have up to 80% lower engagement.',
    });
  } else {
    issues.push({
      type: 'success',
      message: 'Social share preview image defined',
      recommendation: 'Recommended resolution: 1200 x 630 pixels (1.91:1 ratio).',
    });
  }

  // 5. Robots
  if (config.index === false) {
    issues.push({
      type: 'warning',
      message: 'noindex active',
      recommendation: 'Search engines are instructed NOT to index this page.',
    });
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    titleLength: titleLen,
    descriptionLength: descLen,
    isTitleOptimal,
    isDescriptionOptimal,
    issues,
  };
}

/**
 * Generate standard HTML <head> markup
 */
export function generateHtmlMetaTags(config: MetaTagConfig): string {
  const lines: string[] = [];

  // Helper
  const escapeHtml = (str?: string) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  lines.push('<!-- Primary Meta Tags -->');
  lines.push(`<title>${escapeHtml(config.title)}</title>`);
  lines.push(`<meta name="title" content="${escapeHtml(config.title)}">`);
  if (config.description) {
    lines.push(`<meta name="description" content="${escapeHtml(config.description)}">`);
  }
  if (config.keywords) {
    lines.push(`<meta name="keywords" content="${escapeHtml(config.keywords)}">`);
  }
  if (config.author) {
    lines.push(`<meta name="author" content="${escapeHtml(config.author)}">`);
  }
  lines.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  lines.push('<meta charset="UTF-8">');

  if (config.canonicalUrl) {
    lines.push(`<link rel="canonical" href="${escapeHtml(config.canonicalUrl)}">`);
  }
  if (config.themeColor) {
    lines.push(`<meta name="theme-color" content="${escapeHtml(config.themeColor)}">`);
  }
  if (config.faviconUrl) {
    lines.push(`<link rel="icon" type="image/x-icon" href="${escapeHtml(config.faviconUrl)}">`);
  }
  if (config.appleTouchIconUrl) {
    lines.push(`<link rel="apple-touch-icon" href="${escapeHtml(config.appleTouchIconUrl)}">`);
  }

  // Robots
  const robotsParts: string[] = [];
  robotsParts.push(config.index === false ? 'noindex' : 'index');
  robotsParts.push(config.follow === false ? 'nofollow' : 'follow');
  if (config.noarchive) robotsParts.push('noarchive');
  if (config.nosnippet) robotsParts.push('nosnippet');
  if (config.maxImagePreview) {
    robotsParts.push(`max-image-preview:${config.maxImagePreview}`);
  }
  lines.push('');
  lines.push('<!-- Search Engine Crawlers (Robots) -->');
  lines.push(`<meta name="robots" content="${robotsParts.join(', ')}">`);

  // Open Graph
  const ogTitle = config.ogTitle || config.title;
  const ogDesc = config.ogDescription || config.description;
  const ogUrl = config.ogUrl || config.canonicalUrl;
  const ogType = config.ogType || 'website';
  const ogImage = config.ogImage;

  lines.push('');
  lines.push('<!-- Open Graph / Facebook / LinkedIn -->');
  lines.push(`<meta property="og:type" content="${ogType}">`);
  if (ogUrl) lines.push(`<meta property="og:url" content="${escapeHtml(ogUrl)}">`);
  lines.push(`<meta property="og:title" content="${escapeHtml(ogTitle)}">`);
  if (ogDesc) lines.push(`<meta property="og:description" content="${escapeHtml(ogDesc)}">`);
  if (ogImage) {
    lines.push(`<meta property="og:image" content="${escapeHtml(ogImage)}">`);
    if (config.ogImageAlt) {
      lines.push(`<meta property="og:image:alt" content="${escapeHtml(config.ogImageAlt)}">`);
    }
  }
  if (config.ogSiteName) {
    lines.push(`<meta property="og:site_name" content="${escapeHtml(config.ogSiteName)}">`);
  }
  if (config.ogLocale) {
    lines.push(`<meta property="og:locale" content="${escapeHtml(config.ogLocale)}">`);
  }

  // Twitter
  const twCard = config.twitterCard || 'summary_large_image';
  const twTitle = config.twitterTitle || config.title;
  const twDesc = config.twitterDescription || config.description;
  const twImage = config.twitterImage || config.ogImage;

  lines.push('');
  lines.push('<!-- Twitter / X -->');
  lines.push(`<meta name="twitter:card" content="${twCard}">`);
  if (ogUrl) lines.push(`<meta name="twitter:url" content="${escapeHtml(ogUrl)}">`);
  lines.push(`<meta name="twitter:title" content="${escapeHtml(twTitle)}">`);
  if (twDesc) lines.push(`<meta name="twitter:description" content="${escapeHtml(twDesc)}">`);
  if (twImage) lines.push(`<meta name="twitter:image" content="${escapeHtml(twImage)}">`);
  if (config.twitterSite) {
    const handle = config.twitterSite.startsWith('@') ? config.twitterSite : `@${config.twitterSite}`;
    lines.push(`<meta name="twitter:site" content="${escapeHtml(handle)}">`);
  }
  if (config.twitterCreator) {
    const handle = config.twitterCreator.startsWith('@') ? config.twitterCreator : `@${config.twitterCreator}`;
    lines.push(`<meta name="twitter:creator" content="${escapeHtml(handle)}">`);
  }

  return lines.join('\n');
}

/**
 * Generate Next.js App Router metadata definition
 */
export function generateNextJsAppRouterMetadata(config: MetaTagConfig): string {
  const ogTitle = config.ogTitle || config.title;
  const ogDesc = config.ogDescription || config.description;
  const ogUrl = config.ogUrl || config.canonicalUrl;
  const ogImage = config.ogImage;
  const twCard = config.twitterCard || 'summary_large_image';
  const twTitle = config.twitterTitle || config.title;
  const twDesc = config.twitterDescription || config.description;
  const twImage = config.twitterImage || config.ogImage;

  return `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: ${JSON.stringify(config.title)},
  description: ${JSON.stringify(config.description || '')},
  ${config.canonicalUrl ? `alternates: { canonical: ${JSON.stringify(config.canonicalUrl)} },` : ''}
  ${config.keywords ? `keywords: ${JSON.stringify(config.keywords.split(',').map((k) => k.trim()))},` : ''}
  ${config.author ? `authors: [{ name: ${JSON.stringify(config.author)} }],` : ''}
  robots: {
    index: ${config.index ?? true},
    follow: ${config.follow ?? true},
    ${config.maxImagePreview ? `maxImagePreview: ${JSON.stringify(config.maxImagePreview)},` : ''}
  },
  openGraph: {
    type: ${JSON.stringify(config.ogType || 'website')},
    title: ${JSON.stringify(ogTitle)},
    description: ${JSON.stringify(ogDesc || '')},
    ${ogUrl ? `url: ${JSON.stringify(ogUrl)},` : ''}
    ${config.ogSiteName ? `siteName: ${JSON.stringify(config.ogSiteName)},` : ''}
    ${config.ogLocale ? `locale: ${JSON.stringify(config.ogLocale)},` : ''}
    ${ogImage ? `images: [{ url: ${JSON.stringify(ogImage)}, alt: ${JSON.stringify(config.ogImageAlt || ogTitle)} }],` : ''}
  },
  twitter: {
    card: ${JSON.stringify(twCard)},
    title: ${JSON.stringify(twTitle)},
    description: ${JSON.stringify(twDesc || '')},
    ${twImage ? `images: [${JSON.stringify(twImage)}],` : ''}
    ${config.twitterSite ? `site: ${JSON.stringify(config.twitterSite.startsWith('@') ? config.twitterSite : '@' + config.twitterSite)},` : ''}
    ${config.twitterCreator ? `creator: ${JSON.stringify(config.twitterCreator.startsWith('@') ? config.twitterCreator : '@' + config.twitterCreator)},` : ''}
  },
};`;
}

/**
 * Generate Next.js Pages Router <Head> snippet
 */
export function generateNextJsPagesHead(config: MetaTagConfig): string {
  const ogTitle = config.ogTitle || config.title;
  const ogDesc = config.ogDescription || config.description;
  const ogUrl = config.ogUrl || config.canonicalUrl;
  const ogImage = config.ogImage;
  const twCard = config.twitterCard || 'summary_large_image';

  return `import Head from 'next/head';

export default function Page() {
  return (
    <>
      <Head>
        <title>${config.title}</title>
        <meta name="description" content="${config.description || ''}" />
        ${config.canonicalUrl ? `<link rel="canonical" href="${config.canonicalUrl}" />` : ''}
        
        {/* Open Graph */}
        <meta property="og:type" content="${config.ogType || 'website'}" />
        <meta property="og:title" content="${ogTitle}" />
        <meta property="og:description" content="${ogDesc || ''}" />
        ${ogUrl ? `<meta property="og:url" content="${ogUrl}" />` : ''}
        ${ogImage ? `<meta property="og:image" content="${ogImage}" />` : ''}
        
        {/* Twitter */}
        <meta name="twitter:card" content="${twCard}" />
        <meta name="twitter:title" content="${config.twitterTitle || config.title}" />
        <meta name="twitter:description" content="${config.twitterDescription || config.description || ''}" />
        ${config.twitterImage || ogImage ? `<meta name="twitter:image" content="${config.twitterImage || ogImage}" />` : ''}
      </Head>
      <main>
        {/* Page Content */}
      </main>
    </>
  );
}`;
}

/**
 * Generate Nuxt / Vue useHead snippet
 */
export function generateNuxtHead(config: MetaTagConfig): string {
  const ogTitle = config.ogTitle || config.title;
  const ogDesc = config.ogDescription || config.description;
  const ogUrl = config.ogUrl || config.canonicalUrl;

  return `// Nuxt 3 useHead / useSeoMeta
useSeoMeta({
  title: '${config.title}',
  description: '${config.description || ''}',
  ogTitle: '${ogTitle}',
  ogDescription: '${ogDesc || ''}',
  ${ogUrl ? `ogUrl: '${ogUrl}',` : ''}
  ${config.ogImage ? `ogImage: '${config.ogImage}',` : ''}
  twitterCard: '${config.twitterCard || 'summary_large_image'}',
  twitterTitle: '${config.twitterTitle || config.title}',
  twitterDescription: '${config.twitterDescription || config.description || ''}',
});`;
}

// ---------------- Preset Configurations ----------------
export const META_TAG_PRESETS = [
  {
    id: 'saas_landing',
    label: 'SaaS Software Landing Page',
    description: 'Conversion-focused title and description with large Open Graph branding card',
    config: {
      title: 'ToolVerse - High-Performance Online Micro Tools Suite',
      description: 'Access over 200 blazing-fast, private, zero-tracking web utility tools. Free converters, formatters, generators, and SEO utilities built for modern workflows.',
      canonicalUrl: 'https://toolverse.app',
      keywords: 'developer tools, online utilities, json formatter, base64, hash generator',
      author: 'ToolVerse Engineering Team',
      index: true,
      follow: true,
      maxImagePreview: 'large' as MaxImagePreview,
      ogTitle: 'ToolVerse | 200+ Free Online Developer & Productivity Tools',
      ogDescription: 'Instant formatters, encoders, calculators, and media processors directly in your browser. 100% private, zero uploads required.',
      ogImage: 'https://toolverse.app/og-banner.png',
      ogImageAlt: 'ToolVerse Developer Tools Suite Interface',
      ogType: 'website' as OgType,
      ogSiteName: 'ToolVerse',
      twitterCard: 'summary_large_image' as TwitterCardType,
      twitterSite: '@toolverseapp',
      twitterCreator: '@toolverseapp',
      themeColor: '#0f172a',
    },
  },
  {
    id: 'tech_blog',
    label: 'Technical Engineering Blog Post',
    description: 'Optimized for Google Discover, article rich snippets, and author attribution',
    config: {
      title: 'Mastering SQL Query Optimization for PostgreSQL & MySQL',
      description: 'Learn how to write blazing fast SQL queries, analyze EXPLAIN plans, avoid index scans, and eliminate N+1 query bottlenecks in production databases.',
      canonicalUrl: 'https://toolverse.app/blog/sql-query-optimization-guide',
      keywords: 'sql optimization, postgresql, database performance, query tuning',
      author: 'Alex Rivera',
      index: true,
      follow: true,
      maxImagePreview: 'large' as MaxImagePreview,
      ogTitle: 'How We Cut Database Query Latency by 80% with Index Tuning',
      ogDescription: 'A practical deep-dive into B-Tree index structure, composite indexes, and CTE performance traps.',
      ogImage: 'https://toolverse.app/blog/images/sql-optimization-cover.png',
      ogImageAlt: 'PostgreSQL EXPLAIN ANALYZE Performance Chart',
      ogType: 'article' as OgType,
      ogSiteName: 'ToolVerse Engineering Blog',
      twitterCard: 'summary_large_image' as TwitterCardType,
      twitterSite: '@toolverseapp',
      twitterCreator: '@alexrivera_dev',
    },
  },
  {
    id: 'ecommerce_product',
    label: 'E-Commerce Product Page',
    description: 'Product schema attributes, high-resolution product photography tag, and pricing metadata',
    config: {
      title: 'Ergonomic Mechanical Keyboard - Wireless Hot-Swappable RGB',
      description: 'Engineered for developers and writers. Features hot-swappable switches, sound dampening foam, Bluetooth 5.2, and 80-hour battery life. Free shipping worldwide.',
      canonicalUrl: 'https://toolverse.app/shop/keyboards/pro-wireless-rgb',
      keywords: 'mechanical keyboard, wireless keyboard, hot swappable, developer setup',
      author: 'Hardware Studio',
      index: true,
      follow: true,
      maxImagePreview: 'large' as MaxImagePreview,
      ogTitle: 'Pro Wireless RGB Mechanical Keyboard | ToolVerse Hardware',
      ogDescription: 'Precision mechanical switches with aerospace-grade aluminum chassis and dual wireless connectivity.',
      ogImage: 'https://toolverse.app/shop/images/keyboard-hero-1200x630.jpg',
      ogImageAlt: 'Ergonomic Wireless Mechanical Keyboard with RGB Backlighting',
      ogType: 'product' as OgType,
      ogSiteName: 'ToolVerse Hardware',
      twitterCard: 'summary_large_image' as TwitterCardType,
      twitterSite: '@toolverseapp',
    },
  },
  {
    id: 'creator_portfolio',
    label: 'Developer Portfolio / Profile',
    description: 'Personal branding, GitHub/LinkedIn links, and summary card',
    config: {
      title: 'Elena Vance - Senior Full-Stack Engineer & Open-Source Author',
      description: 'Building distributed cloud architecture, high-throughput Node.js microservices, and modern React interfaces. Check out open-source projects and talks.',
      canonicalUrl: 'https://toolverse.app/creators/elena-vance',
      keywords: 'software engineer, full stack developer, typescript, open source',
      author: 'Elena Vance',
      index: true,
      follow: true,
      ogTitle: 'Elena Vance | Systems Engineer & UI Specialist',
      ogDescription: 'Personal portfolio showcasing open-source libraries, cloud architectures, and interactive web tools.',
      ogImage: 'https://toolverse.app/creators/images/elena-card.png',
      ogType: 'profile' as OgType,
      twitterCard: 'summary' as TwitterCardType,
      twitterCreator: '@elenavance_code',
    },
  },
];

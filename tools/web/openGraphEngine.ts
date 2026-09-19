/**
 * ToolVerse Open Graph Protocol (OGP) Engine
 * Implements the complete Open Graph Protocol specification (https://ogp.me)
 * Pure TypeScript with zero external dependencies.
 */

export type OpenGraphType =
  | 'website'
  | 'article'
  | 'product'
  | 'profile'
  | 'book'
  | 'video.other'
  | 'music.song';

export interface OpenGraphImage {
  url: string;
  secureUrl?: string;
  type?: string; // 'image/jpeg' | 'image/png' | 'image/webp'
  width?: number; // recommended: 1200
  height?: number; // recommended: 630
  alt?: string;
}

export interface OpenGraphArticleData {
  publishedTime?: string;
  modifiedTime?: string;
  expirationTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export interface OpenGraphProfileData {
  firstName?: string;
  lastName?: string;
  username?: string;
  gender?: 'male' | 'female';
}

export interface OpenGraphConfig {
  // Core Required Properties
  title: string;
  type: OpenGraphType;
  image: OpenGraphImage;
  url: string;

  // Optional Properties
  description?: string;
  siteName?: string;
  locale?: string; // default: 'en_US'
  localeAlternates?: string[];
  fbAppId?: string;

  // Type-specific extensions
  article?: OpenGraphArticleData;
  profile?: OpenGraphProfileData;

  // Twitter fallback tags (optional compatibility)
  includeTwitterCard?: boolean;
  twitterCardType?: 'summary_large_image' | 'summary';
  twitterSite?: string;
}

export interface OgAuditIssue {
  type: 'error' | 'warning' | 'success';
  property: string;
  message: string;
  recommendation: string;
}

export interface OgAuditReport {
  isValid: boolean;
  score: number; // 0 - 100
  issues: OgAuditIssue[];
  imageAspectRatio: string;
  isImageOptimal: boolean;
}

/**
 * Generate standard HTML Open Graph <meta> tags
 */
export function generateHtmlOgTags(config: OpenGraphConfig): string {
  const tags: string[] = [];

  // Core Open Graph tags
  if (config.title) {
    tags.push(`<meta property="og:title" content="${escapeHtml(config.title)}" />`);
  }
  if (config.type) {
    tags.push(`<meta property="og:type" content="${escapeHtml(config.type)}" />`);
  }
  if (config.url) {
    tags.push(`<meta property="og:url" content="${escapeHtml(config.url)}" />`);
  }
  if (config.description) {
    tags.push(`<meta property="og:description" content="${escapeHtml(config.description)}" />`);
  }
  if (config.siteName) {
    tags.push(`<meta property="og:site_name" content="${escapeHtml(config.siteName)}" />`);
  }
  if (config.locale) {
    tags.push(`<meta property="og:locale" content="${escapeHtml(config.locale)}" />`);
  }
  if (config.localeAlternates && config.localeAlternates.length > 0) {
    for (const alt of config.localeAlternates) {
      if (alt.trim()) {
        tags.push(`<meta property="og:locale:alternate" content="${escapeHtml(alt.trim())}" />`);
      }
    }
  }

  // Image tags
  if (config.image && config.image.url) {
    tags.push(`<meta property="og:image" content="${escapeHtml(config.image.url)}" />`);
    if (config.image.secureUrl || config.image.url.startsWith('https://')) {
      const sec = config.image.secureUrl || config.image.url;
      tags.push(`<meta property="og:image:secure_url" content="${escapeHtml(sec)}" />`);
    }
    if (config.image.width) {
      tags.push(`<meta property="og:image:width" content="${config.image.width}" />`);
    }
    if (config.image.height) {
      tags.push(`<meta property="og:image:height" content="${config.image.height}" />`);
    }
    if (config.image.alt) {
      tags.push(`<meta property="og:image:alt" content="${escapeHtml(config.image.alt)}" />`);
    }
    if (config.image.type) {
      tags.push(`<meta property="og:image:type" content="${escapeHtml(config.image.type)}" />`);
    }
  }

  // Facebook App ID
  if (config.fbAppId) {
    tags.push(`<meta property="fb:app_id" content="${escapeHtml(config.fbAppId)}" />`);
  }

  // Article extensions
  if (config.type === 'article' && config.article) {
    const a = config.article;
    if (a.publishedTime) tags.push(`<meta property="article:published_time" content="${escapeHtml(a.publishedTime)}" />`);
    if (a.modifiedTime) tags.push(`<meta property="article:modified_time" content="${escapeHtml(a.modifiedTime)}" />`);
    if (a.author) tags.push(`<meta property="article:author" content="${escapeHtml(a.author)}" />`);
    if (a.section) tags.push(`<meta property="article:section" content="${escapeHtml(a.section)}" />`);
    if (a.tags && a.tags.length > 0) {
      for (const t of a.tags) {
        if (t.trim()) tags.push(`<meta property="article:tag" content="${escapeHtml(t.trim())}" />`);
      }
    }
  }

  // Profile extensions
  if (config.type === 'profile' && config.profile) {
    const p = config.profile;
    if (p.firstName) tags.push(`<meta property="profile:first_name" content="${escapeHtml(p.firstName)}" />`);
    if (p.lastName) tags.push(`<meta property="profile:last_name" content="${escapeHtml(p.lastName)}" />`);
    if (p.username) tags.push(`<meta property="profile:username" content="${escapeHtml(p.username)}" />`);
    if (p.gender) tags.push(`<meta property="profile:gender" content="${escapeHtml(p.gender)}" />`);
  }

  // Optional Twitter Card fallback
  if (config.includeTwitterCard) {
    tags.push('');
    tags.push(`<!-- Twitter Card Fallback -->`);
    tags.push(`<meta name="twitter:card" content="${config.twitterCardType || 'summary_large_image'}" />`);
    tags.push(`<meta name="twitter:title" content="${escapeHtml(config.title)}" />`);
    if (config.description) {
      tags.push(`<meta name="twitter:description" content="${escapeHtml(config.description)}" />`);
    }
    if (config.image && config.image.url) {
      tags.push(`<meta name="twitter:image" content="${escapeHtml(config.image.url)}" />`);
    }
    if (config.twitterSite) {
      tags.push(`<meta name="twitter:site" content="${escapeHtml(config.twitterSite)}" />`);
    }
  }

  return tags.join('\n');
}

/**
 * Generate Next.js 13/14/15 App Router metadata object code
 */
export function generateNextJsAppRouterOgCode(config: OpenGraphConfig): string {
  const imagesArray = config.image && config.image.url
    ? `[
      {
        url: '${escapeJs(config.image.url)}',
        width: ${config.image.width || 1200},
        height: ${config.image.height || 630},
        alt: '${escapeJs(config.image.alt || config.title)}',
      },
    ]`
    : `[]`;

  let code = `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${escapeJs(config.title)}',
  description: '${escapeJs(config.description || '')}',
  openGraph: {
    title: '${escapeJs(config.title)}',
    description: '${escapeJs(config.description || '')}',
    url: '${escapeJs(config.url)}',
    siteName: '${escapeJs(config.siteName || '')}',
    locale: '${escapeJs(config.locale || 'en_US')}',
    type: '${config.type}',
    images: ${imagesArray},
  },`;

  if (config.includeTwitterCard) {
    code += `
  twitter: {
    card: '${config.twitterCardType || 'summary_large_image'}',
    title: '${escapeJs(config.title)}',
    description: '${escapeJs(config.description || '')}',
    images: ['${escapeJs(config.image?.url || '')}'],
    ${config.twitterSite ? `site: '${escapeJs(config.twitterSite)}',` : ''}
  },`;
  }

  code += `\n};`;
  return code;
}

/**
 * Generate Next.js Pages Router <Head> tags
 */
export function generateNextJsPagesHeadOgCode(config: OpenGraphConfig): string {
  const htmlTags = generateHtmlOgTags(config);
  const indented = htmlTags
    .split('\n')
    .map((line) => (line ? `        ${line}` : ''))
    .join('\n');

  return `import Head from 'next/head';

export default function Page() {
  return (
    <>
      <Head>
${indented}
      </Head>
      <main>
        {/* Page Content */}
      </main>
    </>
  );
}`;
}

/**
 * Generate Nuxt 3 useSeoMeta code
 */
export function generateNuxtOgCode(config: OpenGraphConfig): string {
  return `<script setup lang="ts">
useSeoMeta({
  title: '${escapeJs(config.title)}',
  description: '${escapeJs(config.description || '')}',
  ogTitle: '${escapeJs(config.title)}',
  ogDescription: '${escapeJs(config.description || '')}',
  ogImage: '${escapeJs(config.image?.url || '')}',
  ogUrl: '${escapeJs(config.url)}',
  ogSiteName: '${escapeJs(config.siteName || '')}',
  ogLocale: '${escapeJs(config.locale || 'en_US')}',
  ogType: '${config.type}',
  ${config.includeTwitterCard ? `twitterCard: '${config.twitterCardType || 'summary_large_image'}',` : ''}
})
</script>`;
}

/**
 * Audit Open Graph tags against social platform requirements
 */
export function auditOpenGraph(config: OpenGraphConfig): OgAuditReport {
  const issues: OgAuditIssue[] = [];
  let score = 100;

  // 1. Title Audit
  if (!config.title || config.title.trim().length === 0) {
    score -= 30;
    issues.push({
      type: 'error',
      property: 'og:title',
      message: 'Missing og:title',
      recommendation: 'A title is required by Facebook, LinkedIn, and WhatsApp to render a link preview.',
    });
  } else if (config.title.length > 88) {
    score -= 10;
    issues.push({
      type: 'warning',
      property: 'og:title',
      message: `og:title is long (${config.title.length} chars)`,
      recommendation: 'Facebook truncates titles longer than 60–88 characters on mobile devices.',
    });
  } else {
    issues.push({
      type: 'success',
      property: 'og:title',
      message: 'Title is within optimal range',
      recommendation: '30–65 characters displays crisply on both desktop feeds and mobile screens.',
    });
  }

  // 2. Image Audit
  let imageAspectRatio = 'Unknown';
  let isImageOptimal = false;

  if (!config.image || !config.image.url || config.image.url.trim().length === 0) {
    score -= 35;
    issues.push({
      type: 'error',
      property: 'og:image',
      message: 'Missing og:image URL',
      recommendation: 'Links without an og:image render as plain text or miniature thumbnails on Facebook and LinkedIn.',
    });
  } else {
    const w = config.image.width || 1200;
    const h = config.image.height || 630;
    const ratio = (w / h).toFixed(2);
    imageAspectRatio = `${w}x${h} (${ratio}:1)`;

    if (w < 200 || h < 200) {
      score -= 20;
      issues.push({
        type: 'error',
        property: 'og:image',
        message: 'Image is below minimum 200x200 resolution',
        recommendation: 'Facebook rejects images smaller than 200x200 pixels.',
      });
    } else if (w >= 1200 && h >= 630 && Math.abs(w / h - 1.91) < 0.1) {
      isImageOptimal = true;
      issues.push({
        type: 'success',
        property: 'og:image',
        message: 'Image dimensions are optimal (1200x630, 1.91:1)',
        recommendation: 'Guarantees sharp high-DPI retina display on Facebook, LinkedIn, Twitter, and Slack.',
      });
    } else {
      issues.push({
        type: 'warning',
        property: 'og:image',
        message: `Image resolution is ${w}x${h}`,
        recommendation: 'Use 1200x630 px (1.91:1 ratio) to prevent automatic cropping or blurriness.',
      });
    }

    if (!config.image.alt) {
      score -= 5;
      issues.push({
        type: 'warning',
        property: 'og:image:alt',
        message: 'Missing og:image:alt description',
        recommendation: 'Add alt text for screen readers and accessibility standards.',
      });
    }
  }

  // 3. URL Audit
  if (!config.url || config.url.trim().length === 0) {
    score -= 20;
    issues.push({
      type: 'error',
      property: 'og:url',
      message: 'Missing canonical og:url',
      recommendation: 'og:url establishes the canonical entity that accumulates likes and shares.',
    });
  } else if (!/^https?:\/\//i.test(config.url)) {
    score -= 10;
    issues.push({
      type: 'warning',
      property: 'og:url',
      message: 'og:url must be an absolute URL with https://',
      recommendation: 'Specify the full URL including https:// for social crawlers.',
    });
  }

  // 4. Description Audit
  if (!config.description || config.description.trim().length === 0) {
    score -= 15;
    issues.push({
      type: 'warning',
      property: 'og:description',
      message: 'Missing og:description',
      recommendation: 'A 1–2 sentence description summarizes your page in WhatsApp, Discord, and LinkedIn feeds.',
    });
  } else if (config.description.length > 200) {
    issues.push({
      type: 'warning',
      property: 'og:description',
      message: `Description is long (${config.description.length} chars)`,
      recommendation: 'Keep descriptions under 150–200 characters to prevent ellipsis cutoff.',
    });
  }

  return {
    isValid: score >= 60,
    score: Math.max(0, score),
    issues,
    imageAspectRatio,
    isImageOptimal,
  };
}

// ---------------- Helpers ----------------
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeJs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

// ---------------- PRESETS ----------------
export const OPEN_GRAPH_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  config: OpenGraphConfig;
}> = [
  {
    id: 'saas_launch',
    name: 'SaaS Product Homepage',
    description: 'High-converting social card for software platforms and landing pages',
    config: {
      title: 'ToolVerse - 100+ Professional Developer & Web Micro Tools',
      type: 'website',
      url: 'https://toolverse.app',
      description: 'Zero-install, browser-native suite of high-speed developer utilities, converters, formatters, and SEO builders.',
      siteName: 'ToolVerse',
      locale: 'en_US',
      image: {
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'ToolVerse Developer Suite Dashboard Preview',
        type: 'image/jpeg',
      },
      includeTwitterCard: true,
      twitterCardType: 'summary_large_image',
      twitterSite: '@toolverse_app',
    },
  },
  {
    id: 'tech_article',
    name: 'Engineering Blog Article',
    description: 'Article schema with author, publication timestamp, and topic section',
    config: {
      title: 'Architecting Zero-Allocation JSON Parsers in TypeScript',
      type: 'article',
      url: 'https://toolverse.app/blog/zero-allocation-json-parser',
      description: 'How we reduced GC pressure and memory allocations by 80% when processing multi-megabyte payloads in the browser.',
      siteName: 'ToolVerse Engineering',
      locale: 'en_US',
      image: {
        url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Code snippet on dark monitor illustrating memory benchmarks',
        type: 'image/jpeg',
      },
      article: {
        author: 'Alex Mercer',
        publishedTime: '2025-04-10T08:00:00Z',
        modifiedTime: '2025-04-12T14:30:00Z',
        section: 'Performance Engineering',
        tags: ['TypeScript', 'Memory Optimization', 'Web Performance'],
      },
      includeTwitterCard: true,
      twitterCardType: 'summary_large_image',
      twitterSite: '@toolverse_eng',
    },
  },
  {
    id: 'ecommerce_product',
    name: 'E-Commerce Product Page',
    description: 'Product share card optimized for Facebook Feed and WhatsApp catalog sharing',
    config: {
      title: 'ProMechanical Wireless Split Ergonomic Keyboard (RGB)',
      type: 'website',
      url: 'https://store.example.com/products/promechanical-split-keyboard',
      description: 'Ortholinear hot-swappable mechanical keyboard with Bluetooth 5.4, 80-hour battery life, and custom walnut wrist rests.',
      siteName: 'ErgoGear Store',
      locale: 'en_US',
      image: {
        url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Ergonomic split mechanical keyboard on minimalist oak desk',
        type: 'image/jpeg',
      },
      includeTwitterCard: true,
      twitterCardType: 'summary_large_image',
      twitterSite: '@ergogear',
    },
  },
  {
    id: 'creator_profile',
    name: 'Developer / Creator Profile',
    description: 'Personal profile card for portfolio websites and LinkedIn shares',
    config: {
      title: 'Elena Rostova - Principal Distributed Systems Architect',
      type: 'profile',
      url: 'https://elenarostova.dev',
      description: 'Building resilient cloud backends, high-throughput message queues, and open-source developer tooling.',
      siteName: 'Elena Rostova Portfolio',
      locale: 'en_US',
      image: {
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Portrait of Elena Rostova speaking at tech conference',
        type: 'image/jpeg',
      },
      profile: {
        firstName: 'Elena',
        lastName: 'Rostova',
        username: 'erostova',
        gender: 'female',
      },
      includeTwitterCard: true,
      twitterCardType: 'summary',
      twitterSite: '@erostova_dev',
    },
  },
];

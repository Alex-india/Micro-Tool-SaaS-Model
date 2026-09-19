/**
 * ToolVerse Twitter / X Card Engine
 * Implements Twitter Card tags, multi-framework code generation, validation, and tweet previews.
 * Pure TypeScript with zero external dependencies.
 */

export type TwitterCardType = 'summary_large_image' | 'summary' | 'app' | 'player';

export interface TwitterAppConfig {
  iphoneName?: string;
  iphoneId?: string;
  iphoneUrl?: string;
  ipadName?: string;
  ipadId?: string;
  ipadUrl?: string;
  googlePlayName?: string;
  googlePlayId?: string;
  googlePlayUrl?: string;
  country?: string;
}

export interface TwitterPlayerConfig {
  url?: string;
  width?: number;
  height?: number;
  streamUrl?: string;
}

export interface TwitterCardConfig {
  cardType: TwitterCardType;
  title: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  site?: string; // e.g. @toolverse_app
  creator?: string; // e.g. @alexmercer
  canonicalUrl?: string;

  // App Card Specifics
  app?: TwitterAppConfig;

  // Player Card Specifics
  player?: TwitterPlayerConfig;

  // Cross-Platform Open Graph Fallback
  includeOpenGraphFallback?: boolean;
}

export interface TwitterAuditIssue {
  type: 'error' | 'warning' | 'success';
  property: string;
  message: string;
  recommendation: string;
}

export interface TwitterCardAuditReport {
  isValid: boolean;
  score: number; // 0 - 100
  titleLength: number;
  descriptionLength: number;
  isTitleOptimal: boolean;
  isDescriptionOptimal: boolean;
  issues: TwitterAuditIssue[];
}

/**
 * Format handle to ensure it begins with @
 */
export function formatTwitterHandle(handle: string): string {
  const trimmed = handle.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

/**
 * Generate standard HTML <meta name="twitter:..."> tags
 */
export function generateHtmlTwitterTags(config: TwitterCardConfig): string {
  const tags: string[] = [];

  // Core Twitter tags
  tags.push(`<meta name="twitter:card" content="${config.cardType}" />`);

  if (config.site) {
    tags.push(`<meta name="twitter:site" content="${escapeHtml(formatTwitterHandle(config.site))}" />`);
  }
  if (config.creator) {
    tags.push(`<meta name="twitter:creator" content="${escapeHtml(formatTwitterHandle(config.creator))}" />`);
  }
  if (config.title) {
    tags.push(`<meta name="twitter:title" content="${escapeHtml(config.title)}" />`);
  }
  if (config.description) {
    tags.push(`<meta name="twitter:description" content="${escapeHtml(config.description)}" />`);
  }
  if (config.image) {
    tags.push(`<meta name="twitter:image" content="${escapeHtml(config.image)}" />`);
    if (config.imageAlt) {
      tags.push(`<meta name="twitter:image:alt" content="${escapeHtml(config.imageAlt)}" />`);
    }
  }

  // App Card tags
  if (config.cardType === 'app' && config.app) {
    const a = config.app;
    if (a.iphoneName) tags.push(`<meta name="twitter:app:name:iphone" content="${escapeHtml(a.iphoneName)}" />`);
    if (a.iphoneId) tags.push(`<meta name="twitter:app:id:iphone" content="${escapeHtml(a.iphoneId)}" />`);
    if (a.iphoneUrl) tags.push(`<meta name="twitter:app:url:iphone" content="${escapeHtml(a.iphoneUrl)}" />`);
    if (a.ipadName) tags.push(`<meta name="twitter:app:name:ipad" content="${escapeHtml(a.ipadName)}" />`);
    if (a.ipadId) tags.push(`<meta name="twitter:app:id:ipad" content="${escapeHtml(a.ipadId)}" />`);
    if (a.ipadUrl) tags.push(`<meta name="twitter:app:url:ipad" content="${escapeHtml(a.ipadUrl)}" />`);
    if (a.googlePlayName) tags.push(`<meta name="twitter:app:name:googleplay" content="${escapeHtml(a.googlePlayName)}" />`);
    if (a.googlePlayId) tags.push(`<meta name="twitter:app:id:googleplay" content="${escapeHtml(a.googlePlayId)}" />`);
    if (a.googlePlayUrl) tags.push(`<meta name="twitter:app:url:googleplay" content="${escapeHtml(a.googlePlayUrl)}" />`);
    if (a.country) tags.push(`<meta name="twitter:app:country" content="${escapeHtml(a.country)}" />`);
  }

  // Player Card tags
  if (config.cardType === 'player' && config.player) {
    const p = config.player;
    if (p.url) tags.push(`<meta name="twitter:player" content="${escapeHtml(p.url)}" />`);
    if (p.width) tags.push(`<meta name="twitter:player:width" content="${p.width}" />`);
    if (p.height) tags.push(`<meta name="twitter:player:height" content="${p.height}" />`);
    if (p.streamUrl) tags.push(`<meta name="twitter:player:stream" content="${escapeHtml(p.streamUrl)}" />`);
  }

  // Optional Open Graph Fallbacks
  if (config.includeOpenGraphFallback) {
    tags.push('');
    tags.push(`<!-- Open Graph Fallback Tags -->`);
    if (config.title) tags.push(`<meta property="og:title" content="${escapeHtml(config.title)}" />`);
    if (config.description) tags.push(`<meta property="og:description" content="${escapeHtml(config.description)}" />`);
    if (config.image) tags.push(`<meta property="og:image" content="${escapeHtml(config.image)}" />`);
    if (config.canonicalUrl) tags.push(`<meta property="og:url" content="${escapeHtml(config.canonicalUrl)}" />`);
    tags.push(`<meta property="og:type" content="website" />`);
  }

  return tags.join('\n');
}

/**
 * Generate Next.js 13/14/15 App Router metadata object code
 */
export function generateNextJsAppRouterTwitterCode(config: TwitterCardConfig): string {
  const siteHandle = config.site ? formatTwitterHandle(config.site) : '';
  const creatorHandle = config.creator ? formatTwitterHandle(config.creator) : '';

  let code = `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${escapeJs(config.title)}',
  description: '${escapeJs(config.description || '')}',
  twitter: {
    card: '${config.cardType}',
    title: '${escapeJs(config.title)}',
    description: '${escapeJs(config.description || '')}',
    ${siteHandle ? `site: '${escapeJs(siteHandle)}',` : ''}
    ${creatorHandle ? `creator: '${escapeJs(creatorHandle)}',` : ''}
    ${config.image ? `images: ['${escapeJs(config.image)}'],` : ''}
  },`;

  if (config.includeOpenGraphFallback) {
    code += `
  openGraph: {
    title: '${escapeJs(config.title)}',
    description: '${escapeJs(config.description || '')}',
    ${config.canonicalUrl ? `url: '${escapeJs(config.canonicalUrl)}',` : ''}
    ${config.image ? `images: ['${escapeJs(config.image)}'],` : ''}
    type: 'website',
  },`;
  }

  code += `\n};`;
  return code;
}

/**
 * Generate Next.js Pages Router <Head> tags
 */
export function generateNextJsPagesHeadTwitterCode(config: TwitterCardConfig): string {
  const htmlTags = generateHtmlTwitterTags(config);
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
export function generateNuxtTwitterCode(config: TwitterCardConfig): string {
  const siteHandle = config.site ? formatTwitterHandle(config.site) : '';
  const creatorHandle = config.creator ? formatTwitterHandle(config.creator) : '';

  return `<script setup lang="ts">
useSeoMeta({
  title: '${escapeJs(config.title)}',
  description: '${escapeJs(config.description || '')}',
  twitterCard: '${config.cardType}',
  twitterTitle: '${escapeJs(config.title)}',
  twitterDescription: '${escapeJs(config.description || '')}',
  ${config.image ? `twitterImage: '${escapeJs(config.image)}',` : ''}
  ${config.imageAlt ? `twitterImageAlt: '${escapeJs(config.imageAlt)}',` : ''}
  ${siteHandle ? `twitterSite: '${escapeJs(siteHandle)}',` : ''}
  ${creatorHandle ? `twitterCreator: '${escapeJs(creatorHandle)}',` : ''}
})
</script>`;
}

/**
 * Audit Twitter Card configuration against X / Twitter bot specifications
 */
export function auditTwitterCard(config: TwitterCardConfig): TwitterCardAuditReport {
  const issues: TwitterAuditIssue[] = [];
  let score = 100;

  const titleLen = (config.title || '').trim().length;
  const descLen = (config.description || '').trim().length;

  // 1. Title Audit (Optimal: 25 - 70 chars)
  let isTitleOptimal = false;
  if (!config.title || titleLen === 0) {
    score -= 30;
    issues.push({
      type: 'error',
      property: 'twitter:title',
      message: 'Missing twitter:title',
      recommendation: 'A title is required by Twitter to generate any card summary.',
    });
  } else if (titleLen > 70) {
    score -= 10;
    issues.push({
      type: 'warning',
      property: 'twitter:title',
      message: `Title exceeds 70 characters (${titleLen} chars)`,
      recommendation: 'Twitter truncates titles longer than 70 characters in mobile feed cards.',
    });
  } else {
    isTitleOptimal = true;
    issues.push({
      type: 'success',
      property: 'twitter:title',
      message: `Title length is optimal (${titleLen} characters)`,
      recommendation: 'Displays cleanly on both mobile and desktop X feeds.',
    });
  }

  // 2. Image Audit
  if (!config.image || config.image.trim().length === 0) {
    if (config.cardType === 'summary_large_image') {
      score -= 35;
      issues.push({
        type: 'error',
        property: 'twitter:image',
        message: 'Missing image for summary_large_image card',
        recommendation: 'Twitter will fall back to a small plain link without an image.',
      });
    } else if (config.cardType === 'summary') {
      score -= 20;
      issues.push({
        type: 'warning',
        property: 'twitter:image',
        message: 'No thumbnail image provided',
        recommendation: 'A 1:1 square image (min 120x120px) increases tweet engagement.',
      });
    }
  } else {
    if (!/^https?:\/\//i.test(config.image)) {
      score -= 10;
      issues.push({
        type: 'warning',
        property: 'twitter:image',
        message: 'Image URL must be an absolute URL starting with https://',
        recommendation: 'Twitter crawlers cannot fetch relative image URLs.',
      });
    } else {
      issues.push({
        type: 'success',
        property: 'twitter:image',
        message: 'Valid absolute image URL specified',
        recommendation:
          config.cardType === 'summary_large_image'
            ? 'Ensure image is 2:1 aspect ratio (recommended 1200x600 or 1200x628, < 5MB).'
            : 'Ensure image is 1:1 square ratio (min 120x120px, < 5MB).',
      });
    }

    if (!config.imageAlt) {
      score -= 5;
      issues.push({
        type: 'warning',
        property: 'twitter:image:alt',
        message: 'Missing accessibility twitter:image:alt tag',
        recommendation: 'Describe the image for screen readers and vision-impaired users.',
      });
    }
  }

  // 3. Description Audit (Max 200 chars)
  let isDescriptionOptimal = false;
  if (!config.description || descLen === 0) {
    score -= 15;
    issues.push({
      type: 'warning',
      property: 'twitter:description',
      message: 'Missing twitter:description',
      recommendation: 'A 1–2 sentence summary provides context in timeline tweets.',
    });
  } else if (descLen > 200) {
    score -= 10;
    issues.push({
      type: 'warning',
      property: 'twitter:description',
      message: `Description exceeds 200 characters (${descLen} chars)`,
      recommendation: 'Twitter limits summary text to 200 characters before truncating with an ellipsis.',
    });
  } else {
    isDescriptionOptimal = true;
    issues.push({
      type: 'success',
      property: 'twitter:description',
      message: `Description length is optimal (${descLen} characters)`,
      recommendation: 'Fits neatly inside both summary and large image tweet containers.',
    });
  }

  // 4. Site Handle Audit
  if (!config.site || config.site.trim().length === 0) {
    score -= 10;
    issues.push({
      type: 'warning',
      property: 'twitter:site',
      message: 'Missing twitter:site handle',
      recommendation: 'Include your brand or website Twitter @handle for attribution in cards.',
    });
  } else {
    issues.push({
      type: 'success',
      property: 'twitter:site',
      message: `Attributed to ${formatTwitterHandle(config.site)}`,
      recommendation: 'Links to your Twitter profile directly from the card footer.',
    });
  }

  // 5. App Card Requirements
  if (config.cardType === 'app') {
    const hasIphone = config.app?.iphoneId;
    const hasGooglePlay = config.app?.googlePlayId;
    if (!hasIphone && !hasGooglePlay) {
      score -= 30;
      issues.push({
        type: 'error',
        property: 'twitter:app:id',
        message: 'Missing Store App IDs for App Card',
        recommendation: 'Provide at least one iOS App Store ID or Google Play Store ID.',
      });
    }
  }

  // 6. Player Card Requirements
  if (config.cardType === 'player') {
    if (!config.player?.url) {
      score -= 30;
      issues.push({
        type: 'error',
        property: 'twitter:player',
        message: 'Missing iframe URL for Player Card',
        recommendation: 'Provide an HTTPS embed iframe URL with width and height.',
      });
    }
  }

  return {
    isValid: score >= 60,
    score: Math.max(0, score),
    titleLength: titleLen,
    descriptionLength: descLen,
    isTitleOptimal,
    isDescriptionOptimal,
    issues,
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
export const TWITTER_CARD_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  config: TwitterCardConfig;
}> = [
  {
    id: 'saas_large_image',
    name: 'SaaS Large Banner Card',
    description: 'Full-width visual banner card for high-converting product launches',
    config: {
      cardType: 'summary_large_image',
      title: 'ToolVerse: 100+ Free Browser-Native Developer Tools',
      description: 'Format SQL, decode JWTs, build UTMs, and test Regex in your browser with zero latency and complete privacy.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop',
      imageAlt: 'ToolVerse developer tools dark mode interface dashboard',
      site: '@toolverse_app',
      creator: '@alexmercer',
      canonicalUrl: 'https://toolverse.app',
      includeOpenGraphFallback: true,
    },
  },
  {
    id: 'blog_article',
    name: 'Engineering Blog Post',
    description: 'Editorial article card with author handle and high-res header',
    config: {
      cardType: 'summary_large_image',
      title: 'PostgreSQL Indexing Under High Concurrency',
      description: 'Deep dive into B-Trees, BRIN indexes, and write amplification when processing millions of transactions per second.',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop',
      imageAlt: 'Database indexing query plan benchmark visualization',
      site: '@toolverse_eng',
      creator: '@db_architect',
      canonicalUrl: 'https://toolverse.app/blog/postgres-indexing',
      includeOpenGraphFallback: true,
    },
  },
  {
    id: 'compact_profile',
    name: 'Compact Profile Thumbnail',
    description: 'Summary card with 1:1 square profile picture for portfolios and blogs',
    config: {
      cardType: 'summary',
      title: 'Elena Rostova - Distributed Systems Engineer',
      description: 'Open source contributor, speaker, and architect specializing in Kafka pipelines and low-latency microservices.',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop',
      imageAlt: 'Elena Rostova developer portrait',
      site: '@erostova_dev',
      creator: '@erostova_dev',
      canonicalUrl: 'https://elenarostova.dev',
      includeOpenGraphFallback: true,
    },
  },
  {
    id: 'mobile_app',
    name: 'Mobile App Store Card',
    description: 'App card with deep links to Apple App Store and Google Play',
    config: {
      cardType: 'app',
      title: 'ToolVerse Pocket Developer Companion',
      description: 'Quickly inspect JSON tokens, verify hashes, and generate UUIDs right on your mobile phone.',
      image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=600&fit=crop',
      site: '@toolverse_mobile',
      app: {
        iphoneName: 'ToolVerse iOS',
        iphoneId: '149817234',
        iphoneUrl: 'toolverse://open',
        googlePlayName: 'ToolVerse Android',
        googlePlayId: 'app.toolverse.mobile',
        googlePlayUrl: 'market://details?id=app.toolverse.mobile',
        country: 'US',
      },
      includeOpenGraphFallback: false,
    },
  },
  {
    id: 'podcast_player',
    name: 'Audio / Video Player Card',
    description: 'Embedded media player card for podcasts, videos, and music',
    config: {
      cardType: 'player',
      title: 'Engineering Deep Dive: Building Fast Web Tools',
      description: 'Episode 42: How modern client-side WebAssembly and Web Crypto revolutionize micro tool performance.',
      image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1200&h=600&fit=crop',
      site: '@toolverse_podcast',
      creator: '@podcast_host',
      player: {
        url: 'https://toolverse.app/embed/player/episode-42',
        width: 1280,
        height: 720,
        streamUrl: 'https://toolverse.app/media/ep42.mp4',
      },
      includeOpenGraphFallback: true,
    },
  },
];

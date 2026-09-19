/**
 * ToolVerse Canonical URL Engine
 * Implements RFC 6596 Canonical Link Relations, normalization, multi-framework exporters, and SEO audit rules.
 * Pure TypeScript with zero external dependencies.
 */

export type TrailingSlashOption = 'preserve' | 'remove' | 'enforce';
export type WwwOption = 'preserve' | 'remove' | 'enforce';
export type ProtocolOption = 'https' | 'http' | 'preserve';
export type QueryOption = 'strip_tracking' | 'strip_all' | 'preserve' | 'whitelist';

export interface CanonicalOptions {
  protocol?: ProtocolOption;
  www?: WwwOption;
  trailingSlash?: TrailingSlashOption;
  queryMode?: QueryOption;
  paramsToKeep?: string[];
  customParamsToRemove?: string[];
  stripHash?: boolean;
  sortQueryParams?: boolean;
}

export interface CanonicalChange {
  type: 'protocol' | 'hostname' | 'trailing_slash' | 'query_param' | 'hash' | 'port';
  before: string;
  after: string;
  reason: string;
}

export interface CanonicalAuditIssue {
  type: 'error' | 'warning' | 'success';
  message: string;
  recommendation: string;
}

export interface CanonicalResult {
  originalUrl: string;
  canonicalUrl: string;
  isValid: boolean;
  htmlTag: string;
  httpHeader: string;
  nextJsAppCode: string;
  nextJsPagesCode: string;
  nuxtCode: string;
  changes: CanonicalChange[];
  auditIssues: CanonicalAuditIssue[];
  score: number;
}

// Common tracking parameters to strip
export const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_source_platform',
  'utm_creative_format',
  'utm_marketing_tactic',
  'fbclid',
  'gclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'twclid',
  'ttclid',
  'yclid',
  'dclid',
  'rdt_cid',
  'igshid',
  'ref_src',
  'ref_url',
  'mc_cid',
  'mc_eid',
  '_hsenc',
  '_hsmi',
  'mkt_tok',
  'session_id',
  'phpsessid',
  'jsessionid',
  'aspsessionid',
]);

/**
 * Generate canonical URL, normalize path, apply options, and create code snippets
 */
export function generateCanonicalUrl(
  inputUrl: string,
  options: CanonicalOptions = {}
): CanonicalResult {
  const raw = (inputUrl || '').trim();
  const changes: CanonicalChange[] = [];
  const auditIssues: CanonicalAuditIssue[] = [];

  const protocolOpt = options.protocol ?? 'https';
  const wwwOpt = options.www ?? 'remove';
  const trailingSlashOpt = options.trailingSlash ?? 'remove';
  const queryMode = options.queryMode ?? 'strip_tracking';
  const stripHash = options.stripHash ?? true;
  const sortQueryParams = options.sortQueryParams ?? true;
  const keepSet = new Set((options.paramsToKeep || ['id', 'page', 'p', 'v', 'q']).map((k) => k.toLowerCase()));
  const customRemoveSet = new Set((options.customParamsToRemove || []).map((k) => k.toLowerCase()));

  if (!raw) {
    return {
      originalUrl: '',
      canonicalUrl: '',
      isValid: false,
      htmlTag: '',
      httpHeader: '',
      nextJsAppCode: '',
      nextJsPagesCode: '',
      nuxtCode: '',
      changes: [],
      auditIssues: [
        {
          type: 'error',
          message: 'No URL provided',
          recommendation: 'Enter a valid URL to generate canonical tags.',
        },
      ],
      score: 0,
    };
  }

  let parseable = raw;
  const hadHttp = /^https?:\/\//i.test(parseable);
  if (!hadHttp) {
    parseable = 'https://' + parseable;
    changes.push({
      type: 'protocol',
      before: 'None',
      after: 'https://',
      reason: 'URL lacked protocol; default https:// prepended',
    });
  }

  try {
    const u = new URL(parseable);

    // 1. Protocol Normalization
    if (protocolOpt === 'https' && u.protocol !== 'https:') {
      changes.push({
        type: 'protocol',
        before: u.protocol,
        after: 'https:',
        reason: 'Search engines prefer secure HTTPS canonical destinations',
      });
      u.protocol = 'https:';
    } else if (protocolOpt === 'http' && u.protocol !== 'http:') {
      changes.push({
        type: 'protocol',
        before: u.protocol,
        after: 'http:',
        reason: 'Forced unencrypted HTTP protocol',
      });
      u.protocol = 'http:';
    }

    // 2. Port Normalization (strip default ports)
    if (u.port === '80' || u.port === '443') {
      changes.push({
        type: 'port',
        before: `:${u.port}`,
        after: '',
        reason: 'Standard HTTP/HTTPS ports should be omitted in canonical URLs',
      });
      u.port = '';
    }

    // 3. Hostname Normalization (lowercase + www rule)
    let host = u.hostname.toLowerCase();
    if (host !== u.hostname) {
      changes.push({
        type: 'hostname',
        before: u.hostname,
        after: host,
        reason: 'Domain converted to lowercase for consistency',
      });
      u.hostname = host;
    }

    if (wwwOpt === 'remove' && host.startsWith('www.')) {
      const nonWww = host.slice(4);
      changes.push({
        type: 'hostname',
        before: host,
        after: nonWww,
        reason: 'Normalized to non-www canonical domain',
      });
      u.hostname = nonWww;
    } else if (wwwOpt === 'enforce' && !host.startsWith('www.') && !host.includes('localhost')) {
      const withWww = 'www.' + host;
      changes.push({
        type: 'hostname',
        before: host,
        after: withWww,
        reason: 'Enforced www. subdomain on canonical domain',
      });
      u.hostname = withWww;
    }

    // 4. Trailing Slash Normalization on Path
    let path = u.pathname;
    const isRoot = path === '' || path === '/';
    const hasExtension = /\.[a-z0-9]+$/i.test(path);

    if (!isRoot && !hasExtension) {
      if (trailingSlashOpt === 'remove' && path.endsWith('/')) {
        const withoutSlash = path.slice(0, -1);
        changes.push({
          type: 'trailing_slash',
          before: path,
          after: withoutSlash,
          reason: 'Removed trailing slash for clean uniform URI format',
        });
        u.pathname = withoutSlash;
      } else if (trailingSlashOpt === 'enforce' && !path.endsWith('/')) {
        const withSlash = path + '/';
        changes.push({
          type: 'trailing_slash',
          before: path,
          after: withSlash,
          reason: 'Enforced trailing slash on directory URL path',
        });
        u.pathname = withSlash;
      }
    }

    // 5. Query Parameters Handling
    if (queryMode === 'strip_all') {
      if (u.search) {
        changes.push({
          type: 'query_param',
          before: u.search,
          after: '',
          reason: 'Stripped all query parameters to create clean canonical permalink',
        });
        u.search = '';
      }
    } else if (queryMode === 'strip_tracking') {
      const originalSearch = u.search;
      const params = Array.from(u.searchParams.entries());
      const remaining: Array<[string, string]> = [];

      for (const [k, v] of params) {
        const lk = k.toLowerCase();
        if (TRACKING_PARAMS.has(lk) || customRemoveSet.has(lk) || lk.startsWith('utm_')) {
          changes.push({
            type: 'query_param',
            before: `${k}=${v}`,
            after: '(Removed)',
            reason: `Filtered tracking parameter ${k}`,
          });
        } else {
          remaining.push([k, v]);
        }
      }

      u.search = '';
      if (sortQueryParams) {
        remaining.sort((a, b) => a[0].localeCompare(b[0]));
      }
      for (const [k, v] of remaining) {
        u.searchParams.append(k, v);
      }

      if (originalSearch && !u.search) {
        changes.push({
          type: 'query_param',
          before: originalSearch,
          after: '',
          reason: 'All query parameters were tracking tokens and got removed',
        });
      }
    } else if (queryMode === 'whitelist') {
      const originalSearch = u.search;
      const params = Array.from(u.searchParams.entries());
      const remaining: Array<[string, string]> = [];

      for (const [k, v] of params) {
        if (keepSet.has(k.toLowerCase())) {
          remaining.push([k, v]);
        } else {
          changes.push({
            type: 'query_param',
            before: `${k}=${v}`,
            after: '(Removed)',
            reason: `Parameter ${k} not in whitelist`,
          });
        }
      }

      u.search = '';
      if (sortQueryParams) {
        remaining.sort((a, b) => a[0].localeCompare(b[0]));
      }
      for (const [k, v] of remaining) {
        u.searchParams.append(k, v);
      }
    } else if (sortQueryParams && u.search) {
      // Just sort existing parameters
      const params = Array.from(u.searchParams.entries());
      params.sort((a, b) => a[0].localeCompare(b[0]));
      u.search = '';
      for (const [k, v] of params) {
        u.searchParams.append(k, v);
      }
    }

    // 6. Hash Fragment Normalization
    if (stripHash && u.hash) {
      changes.push({
        type: 'hash',
        before: u.hash,
        after: '',
        reason: 'Search engines ignore hash fragments; RFC 6596 mandates omitting fragments from canonical URLs',
      });
      u.hash = '';
    }

    const canonicalUrl = u.toString();

    // 7. Audit Rules & Score
    let score = 100;

    if (!canonicalUrl.startsWith('https://')) {
      score -= 20;
      auditIssues.push({
        type: 'warning',
        message: 'Canonical URL is not using HTTPS',
        recommendation: 'Google prioritizes HTTPS URLs as canonical over unencrypted HTTP equivalents.',
      });
    } else {
      auditIssues.push({
        type: 'success',
        message: 'Canonical URL uses secure HTTPS protocol',
        recommendation: 'Guarantees search equity flows to the encrypted version.',
      });
    }

    if (canonicalUrl.includes('#')) {
      score -= 30;
      auditIssues.push({
        type: 'error',
        message: 'Canonical URL contains hash fragment (#)',
        recommendation: 'Remove the fragment identifier. Googlebot ignores fragments in canonical tags.',
      });
    }

    if (changes.some((c) => c.type === 'query_param')) {
      auditIssues.push({
        type: 'success',
        message: 'Filtered tracking and duplicate query parameters',
        recommendation: 'Prevents search engines from wasting crawl budget on duplicate URL variations.',
      });
    }

    // Code generators
    const htmlTag = `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`;
    const httpHeader = `Link: <${canonicalUrl}>; rel="canonical"`;

    const nextJsAppCode = `import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: '${escapeJs(canonicalUrl)}',
  },
};`;

    const nextJsPagesCode = `import Head from 'next/head';

export default function Page() {
  return (
    <>
      <Head>
        <link rel="canonical" href="${escapeJs(canonicalUrl)}" />
      </Head>
      <main>
        {/* Page Content */}
      </main>
    </>
  );
}`;

    const nuxtCode = `<script setup lang="ts">
useHead({
  link: [
    { rel: 'canonical', href: '${escapeJs(canonicalUrl)}' },
  ],
});
</script>`;

    return {
      originalUrl: raw,
      canonicalUrl,
      isValid: true,
      htmlTag,
      httpHeader,
      nextJsAppCode,
      nextJsPagesCode,
      nuxtCode,
      changes,
      auditIssues,
      score: Math.max(0, score),
    };
  } catch {
    return {
      originalUrl: raw,
      canonicalUrl: raw,
      isValid: false,
      htmlTag: `<link rel="canonical" href="${escapeHtml(raw)}" />`,
      httpHeader: `Link: <${raw}>; rel="canonical"`,
      nextJsAppCode: '',
      nextJsPagesCode: '',
      nuxtCode: '',
      changes: [],
      auditIssues: [
        {
          type: 'error',
          message: 'Invalid URL syntax',
          recommendation: 'Check that the URL contains a valid domain and path without forbidden characters.',
        },
      ],
      score: 0,
    };
  }
}

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

// ---------------- CURATED PRESETS ----------------
export const CANONICAL_PRESETS = [
  {
    id: 'tracking_parameters',
    name: 'Tracking & Ad Click Pollution',
    description: 'URL polluted with Facebook click ID, UTM tags, and hash fragment',
    url: 'http://www.store.example.com/products/sneakers/?id=9942&color=red&utm_source=facebook&utm_medium=cpc&utm_campaign=summer_sale&fbclid=IwAR123abc456def#customer-reviews',
  },
  {
    id: 'sorting_ecommerce',
    name: 'E-Commerce Filter & Sorting Variations',
    description: 'Product listing with pagination, sort order, and session token',
    url: 'https://shop.example.com/catalog/electronics/?category=audio&sort=price_asc&session_id=sess_98765&page=1',
  },
  {
    id: 'case_and_protocol',
    name: 'Protocol & Domain Inconsistency',
    description: 'Inconsistent mixed-case domain, default port 80, and uppercase path',
    url: 'http://WWW.EXAMPLE.COM:80/about/Team/',
  },
  {
    id: 'pdf_document',
    name: 'PDF / Document Header Canonical',
    description: 'Whitepaper PDF file requiring an HTTP header Link canonical',
    url: 'https://example.com/assets/annual-report-2025.pdf?download=true&utm_source=email',
  },
  {
    id: 'clean_permalink',
    name: 'Self-Referencing Clean Permalinks',
    description: 'Standard clean SaaS pricing page canonical tag',
    url: 'https://toolverse.app/pricing',
  },
];

/**
 * ToolVerse URL Parser & Decomposition Engine
 * RFC 3986 compliant URL parsing, query string deconstruction, security auditing,
 * and multi-language code generation.
 * Pure TypeScript with zero external dependencies.
 */

export interface ParsedQueryParam {
  id: string;
  key: string;
  value: string;
  rawValue: string;
  isTracking: boolean;
  isSensitive: boolean;
}

export interface UrlAuditIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  recommendation: string;
}

export interface ParsedUrlReport {
  originalUrl: string;
  isValid: boolean;
  protocol: string;
  isSecure: boolean;
  username: string;
  password: string;
  hasCredentials: boolean;
  host: string;
  hostname: string;
  port: string;
  origin: string;
  subdomain: string;
  domain: string;
  tld: string;
  pathname: string;
  pathSegments: string[];
  fileName: string;
  fileExtension: string;
  search: string;
  queryParams: ParsedQueryParam[];
  hash: string;
  hashPath: string;
  hashQueryParams: ParsedQueryParam[];
  reconstructedUrl: string;
  auditIssues: UrlAuditIssue[];
  codeSnippets: {
    js: string;
    node: string;
    python: string;
    php: string;
    go: string;
    curl: string;
  };
}

// Known tracking parameters
export const TRACKING_PARAM_KEYS = new Set([
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
]);

// Sensitive keys that should not appear in URL query strings
export const SENSITIVE_PARAM_KEYS = new Set([
  'token',
  'access_token',
  'id_token',
  'refresh_token',
  'api_key',
  'apikey',
  'key',
  'secret',
  'password',
  'passwd',
  'pwd',
  'auth',
  'authorization',
  'bearer',
  'credential',
  'credentials',
  'private_key',
  'session_token',
]);

/**
 * Parses any URL into structured RFC 3986 components
 */
export function parseUrl(rawInput: string): ParsedUrlReport {
  const raw = (rawInput || '').trim();
  const auditIssues: UrlAuditIssue[] = [];

  if (!raw) {
    return createEmptyReport('');
  }

  // Prepend protocol if missing so new URL() can parse cleanly
  let parseable = raw;
  let hasImplicitProtocol = false;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(parseable)) {
    parseable = 'https://' + parseable;
    hasImplicitProtocol = true;
    auditIssues.push({
      type: 'info',
      message: 'Implicit protocol detected',
      recommendation: 'No protocol was supplied in the raw input; "https://" was prepended for parsing.',
    });
  }

  try {
    const u = new URL(parseable);

    const protocol = hasImplicitProtocol ? 'https:' : u.protocol;
    const isSecure = protocol === 'https:' || protocol === 'wss:';

    if (!isSecure && (protocol === 'http:' || protocol === 'ws:')) {
      auditIssues.push({
        type: 'warning',
        message: 'Unencrypted cleartext protocol',
        recommendation: 'The URL uses unencrypted HTTP/WS. Passwords, cookies, and tokens transmitted in this URL are vulnerable to eavesdropping.',
      });
    }

    const username = u.username;
    const password = u.password;
    const hasCredentials = Boolean(username || password);

    if (hasCredentials) {
      auditIssues.push({
        type: 'error',
        message: 'Plaintext credentials exposed in URL',
        recommendation: 'RFC 3986 strongly deprecates user:password in URLs. Credentials are leaked in server logs, browser history, and Referer headers.',
      });
    }

    const host = u.host;
    const hostname = u.hostname;
    const port = u.port;
    const origin = u.origin;

    // Subdomain & Domain decomposition
    const { subdomain, domain, tld } = extractDomainParts(hostname);

    // Path segments & file details
    const pathname = u.pathname;
    const pathSegments = pathname
      .split('/')
      .filter(Boolean)
      .map((s) => decodeURIComponent(s));

    let fileName = '';
    let fileExtension = '';
    const lastSegment = pathSegments[pathSegments.length - 1] || '';
    if (lastSegment.includes('.')) {
      fileName = lastSegment;
      fileExtension = lastSegment.slice(lastSegment.lastIndexOf('.'));
    }

    // Query parameters
    const queryParams: ParsedQueryParam[] = [];
    const search = u.search;

    if (u.search) {
      const entries = Array.from(u.searchParams.entries());
      entries.forEach(([key, val], idx) => {
        const lk = key.toLowerCase();
        const isTracking = TRACKING_PARAM_KEYS.has(lk) || lk.startsWith('utm_');
        const isSensitive = SENSITIVE_PARAM_KEYS.has(lk);

        queryParams.push({
          id: `param_${idx}_${key}`,
          key,
          value: val,
          rawValue: encodeURIComponent(val),
          isTracking,
          isSensitive,
        });

        if (isSensitive) {
          auditIssues.push({
            type: 'error',
            message: `Sensitive parameter "${key}" exposed in query string`,
            recommendation: 'Authentication secrets, passwords, or API keys should be sent in the Authorization request header or POST payload, never in URL query strings.',
          });
        }
      });
    }

    // Hash fragment & SPA routing
    const hash = u.hash;
    let hashPath = '';
    const hashQueryParams: ParsedQueryParam[] = [];

    if (hash) {
      const cleanHash = hash.replace(/^#/, '');
      if (cleanHash.includes('?')) {
        const [hp, qs] = cleanHash.split('?');
        hashPath = hp;
        try {
          const hpParams = new URLSearchParams(qs);
          let hIdx = 0;
          for (const [hk, hv] of hpParams.entries()) {
            hashQueryParams.push({
              id: `hash_param_${hIdx++}_${hk}`,
              key: hk,
              value: hv,
              rawValue: encodeURIComponent(hv),
              isTracking: TRACKING_PARAM_KEYS.has(hk.toLowerCase()),
              isSensitive: SENSITIVE_PARAM_KEYS.has(hk.toLowerCase()),
            });
          }
        } catch {}
      } else {
        hashPath = cleanHash;
      }
    }

    // URL Length audit
    if (raw.length > 2048) {
      auditIssues.push({
        type: 'warning',
        message: `Oversized URL length (${raw.length} characters)`,
        recommendation: 'URLs over 2,048 characters risk truncation in older browsers, web proxies, and CDN edge servers.',
      });
    }

    const reconstructedUrl = u.toString();
    const codeSnippets = generateUrlCodeSnippets(reconstructedUrl);

    return {
      originalUrl: raw,
      isValid: true,
      protocol,
      isSecure,
      username,
      password,
      hasCredentials,
      host,
      hostname,
      port,
      origin,
      subdomain,
      domain,
      tld,
      pathname,
      pathSegments,
      fileName,
      fileExtension,
      search,
      queryParams,
      hash,
      hashPath,
      hashQueryParams,
      reconstructedUrl,
      auditIssues,
      codeSnippets,
    };
  } catch {
    return {
      ...createEmptyReport(raw),
      auditIssues: [
        {
          type: 'error',
          message: 'Malformed URL syntax',
          recommendation: 'The URL could not be parsed according to RFC 3986. Verify hostname characters, brackets, and percent encodings.',
        },
      ],
    };
  }
}

/**
 * Extracts Subdomain, Domain, and TLD from a hostname
 */
export function extractDomainParts(hostname: string): {
  subdomain: string;
  domain: string;
  tld: string;
} {
  if (!hostname || hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return { subdomain: '', domain: hostname || '', tld: '' };
  }

  const parts = hostname.split('.');
  if (parts.length <= 1) {
    return { subdomain: '', domain: hostname, tld: '' };
  }

  // Common multi-part TLDs (e.g. .co.uk, .com.au, .gov.in)
  const multiPartTlds = new Set([
    'co.uk',
    'org.uk',
    'gov.uk',
    'com.au',
    'net.au',
    'org.au',
    'co.nz',
    'co.in',
    'net.in',
    'org.in',
    'co.jp',
    'ne.jp',
    'com.br',
    'com.mx',
    'com.sg',
  ]);

  if (parts.length >= 3) {
    const lastTwo = parts.slice(-2).join('.');
    if (multiPartTlds.has(lastTwo)) {
      const tld = '.' + lastTwo;
      const domain = parts[parts.length - 3] + tld;
      const subdomain = parts.slice(0, -3).join('.');
      return { subdomain, domain, tld };
    }
  }

  const tld = '.' + parts[parts.length - 1];
  const domain = parts[parts.length - 2] + tld;
  const subdomain = parts.slice(0, -2).join('.');

  return { subdomain, domain, tld };
}

/**
 * Reconstructs a URL from individual editable components
 */
export function rebuildUrl(components: {
  protocol: string;
  username?: string;
  password?: string;
  hostname: string;
  port?: string;
  pathname?: string;
  queryParams: Array<{ key: string; value: string }>;
  hash?: string;
}): string {
  try {
    let base = `${components.protocol}//`;

    if (components.username || components.password) {
      base += `${encodeURIComponent(components.username || '')}`;
      if (components.password) {
        base += `:${encodeURIComponent(components.password)}`;
      }
      base += '@';
    }

    base += components.hostname;
    if (components.port) {
      base += `:${components.port}`;
    }

    let path = components.pathname || '/';
    if (!path.startsWith('/')) path = '/' + path;
    base += path;

    const u = new URL(base);

    if (components.queryParams && components.queryParams.length > 0) {
      u.search = '';
      for (const p of components.queryParams) {
        if (p.key.trim()) {
          u.searchParams.append(p.key.trim(), p.value);
        }
      }
    }

    if (components.hash) {
      u.hash = components.hash.startsWith('#') ? components.hash : `#${components.hash}`;
    }

    return u.toString();
  } catch {
    return '';
  }
}

/**
 * Multi-language code generators for parsing the given URL
 */
export function generateUrlCodeSnippets(url: string) {
  const cleanUrl = url.replace(/"/g, '\\"');

  const js = `// JavaScript (Browser & modern Node.js)
const url = new URL("${cleanUrl}");

console.log("Protocol:", url.protocol); // e.g. "https:"
console.log("Host:", url.host);         // e.g. "example.com:443"
console.log("Pathname:", url.pathname); // e.g. "/path"
console.log("Search:", url.search);     // e.g. "?id=123"
console.log("Hash:", url.hash);         // e.g. "#section"

// Access query parameters
for (const [key, val] of url.searchParams.entries()) {
  console.log(\`\${key}: \${val}\`);
}`;

  const node = `// Node.js URL Module
const { URL } = require('url');

const parsed = new URL("${cleanUrl}");
const params = Object.fromEntries(parsed.searchParams.entries());
console.log(params);`;

  const python = `# Python 3
from urllib.parse import urlparse, parse_qs

parsed = urlparse("${cleanUrl}")
print("Scheme:", parsed.scheme)
print("Netloc:", parsed.netloc)
print("Path:", parsed.path)
print("Params:", parse_qs(parsed.query))
print("Fragment:", parsed.fragment)`;

  const php = `<?php
// PHP
$parts = parse_url("${cleanUrl}");
parse_str($parts['query'] ?? '', $query);

echo "Scheme: " . ($parts['scheme'] ?? '') . "\\n";
echo "Host: " . ($parts['host'] ?? '') . "\\n";
echo "Path: " . ($parts['path'] ?? '') . "\\n";
print_r($query);
?>`;

  const go = `// Go
package main

import (
\t"fmt"
\t"net/url"
)

func main() {
\tu, err := url.Parse("${cleanUrl}")
\tif err != nil {
\t\tpanic(err)
\t}
\tfmt.Println("Scheme:", u.Scheme)
\tfmt.Println("Host:", u.Host)
\tfmt.Println("Path:", u.Path)
\tfmt.Println("Query:", u.Query())
}`;

  const curl = `# cURL inspection
curl -I "${cleanUrl}"`;

  return { js, node, python, php, go, curl };
}

function createEmptyReport(url: string): ParsedUrlReport {
  return {
    originalUrl: url,
    isValid: false,
    protocol: '',
    isSecure: false,
    username: '',
    password: '',
    hasCredentials: false,
    host: '',
    hostname: '',
    port: '',
    origin: '',
    subdomain: '',
    domain: '',
    tld: '',
    pathname: '',
    pathSegments: [],
    fileName: '',
    fileExtension: '',
    search: '',
    queryParams: [],
    hash: '',
    hashPath: '',
    hashQueryParams: [],
    reconstructedUrl: url,
    auditIssues: [],
    codeSnippets: { js: '', node: '', python: '', php: '', go: '', curl: '' },
  };
}

// ---------------- CURATED PRESETS ----------------
export const URL_PARSER_PRESETS = [
  {
    id: 'ecommerce_filters',
    name: 'E-Commerce Product with Filters',
    description: 'Deep category path, multiple query filters, sorting, and pagination',
    url: 'https://store.example.com/catalog/electronics/laptops?brand=apple&ram=16gb&sort=price_asc&page=2#specs-table',
  },
  {
    id: 'oauth_callback',
    name: 'OAuth 2.0 Authorization Callback',
    description: 'Auth code callback with security state token, scope, and redirect URI',
    url: 'https://auth.company.io/oauth/v2/callback?code=spl987654321xyz&state=sec_994827104&scope=read%20write&redirect_uri=https%3A%2F%2Fapp.client.com%2Fdashboard',
  },
  {
    id: 'tracking_campaign',
    name: 'Marketing Campaign with UTM & Ad Tags',
    description: 'Polluted marketing link with Google Analytics, Facebook click ID, and hash anchor',
    url: 'https://www.saas.io/features/automation?utm_source=facebook&utm_medium=cpc&utm_campaign=summer_2026&utm_content=hero_cta&fbclid=IwAR3s8J2k09#pricing',
  },
  {
    id: 'embedded_credentials',
    name: 'Credentials & Custom Port in URL',
    description: 'URL containing embedded basic-auth credentials and non-standard port 8443',
    url: 'http://admin:secret_pass123@api.internal.org:8443/v1/metrics/export?format=json',
  },
  {
    id: 'spa_hash_router',
    name: 'Single Page App (SPA) Hash Router',
    description: 'Vue/React hash-based routing with internal route parameters and anchors',
    url: 'https://cloud.console.net/#/projects/alpha/settings?view=billing&tab=invoices',
  },
];

/**
 * ToolVerse Redirect Engine
 * Traces HTTP redirect chains, identifies loops, evaluates SEO PageRank equity,
 * detects protocol downgrades, and generates direct resolution rules.
 * Pure TypeScript with zero external dependencies.
 */

export interface RedirectHop {
  hopNumber: number;
  url: string;
  status: number;
  statusText: string;
  location?: string;
  latencyMs: number;
  headers: Record<string, string>;
  protocol: 'https' | 'http';
  server?: string;
  isPermanent: boolean;
  isTemporary: boolean;
}

export interface RedirectDiagnostic {
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
}

export interface RedirectChainReport {
  initialUrl: string;
  finalUrl: string;
  finalStatus: number;
  totalHops: number;
  totalLatencyMs: number;
  hops: RedirectHop[];
  isLoop: boolean;
  hasChain: boolean;
  hasTemporaryInChain: boolean;
  hasSecurityDowngrade: boolean;
  linkEquityScore: number;
  statusSummary: string;
  diagnostics: RedirectDiagnostic[];
  directRules: {
    nginx: string;
    apache: string;
    nextjs: string;
    express: string;
    cloudflare: string;
  };
}

/**
 * Analyzes a list of hops to produce a comprehensive SEO redirect report
 */
export function analyzeRedirectChain(
  initialUrl: string,
  hops: RedirectHop[],
  isLoop = false
): RedirectChainReport {
  const diagnostics: RedirectDiagnostic[] = [];
  const totalHops = hops.length;
  const lastHop = hops[hops.length - 1] || null;
  const finalUrl = lastHop ? lastHop.url : initialUrl;
  const finalStatus = lastHop ? lastHop.status : 0;
  const totalLatencyMs = hops.reduce((acc, h) => acc + (h.latencyMs || 0), 0);

  // Check redirect count (hops that actually redirected, i.e., have location or status 3xx)
  const redirectSteps = hops.filter((h) => h.status >= 300 && h.status < 400);
  const hasChain = redirectSteps.length > 1;

  let hasTemporaryInChain = false;
  let hasSecurityDowngrade = false;
  let linkEquityScore = 100;

  // Evaluate each hop
  for (let i = 0; i < hops.length; i++) {
    const hop = hops[i];
    if (hop.isTemporary) {
      hasTemporaryInChain = true;
    }

    // Protocol check: check if https downgraded to http in next hop
    if (i < hops.length - 1) {
      const nextHop = hops[i + 1];
      if (hop.protocol === 'https' && nextHop.protocol === 'http') {
        hasSecurityDowngrade = true;
      }
    }
  }

  // 1. Loop Diagnostic
  if (isLoop) {
    linkEquityScore = 0;
    diagnostics.push({
      type: 'error',
      title: 'Circular Redirect Loop Detected',
      message: 'The URL redirects back to an earlier URL in the path. Search engines and browsers will abort with ERR_TOO_MANY_REDIRECTS.',
    });
  }

  // 2. Chain Length Diagnostic
  if (redirectSteps.length === 0) {
    if (finalStatus === 200) {
      diagnostics.push({
        type: 'success',
        title: 'Direct 200 OK (No Redirection)',
        message: 'This URL loads directly without any intermediate redirect hops, maximizing page speed and crawl efficiency.',
      });
    }
  } else if (redirectSteps.length === 1) {
    diagnostics.push({
      type: 'success',
      title: 'Clean 1-Hop Redirection',
      message: 'Optimal redirect structure. Standard single-hop redirection complies with Google Search Central recommendations.',
    });
  } else if (redirectSteps.length >= 2 && redirectSteps.length <= 4) {
    linkEquityScore -= (redirectSteps.length - 1) * 15;
    diagnostics.push({
      type: 'warning',
      title: `Redirect Chain Detected (${redirectSteps.length} hops)`,
      message: `Multiple redirect hops delay Time to First Byte (TTFB) and risk crawler abandonment. Google recommends resolving chains directly to the final destination.`,
    });
  } else if (redirectSteps.length >= 5) {
    linkEquityScore -= 50;
    diagnostics.push({
      type: 'error',
      title: `Excessive Redirect Chain (${redirectSteps.length}+ hops)`,
      message: `Googlebot officially drops crawl attempts after 5 redirect hops to prevent infinite resource loops. This URL is at critical risk of de-indexing.`,
    });
  }

  // 3. Temporary Redirects in Chain
  if (hasTemporaryInChain) {
    linkEquityScore -= 20;
    diagnostics.push({
      type: 'warning',
      title: 'Temporary Redirect (302/307) Detected',
      message: 'Temporary redirects do not pass permanent PageRank link equity. If this URL migration is permanent, update to a 301 or 308 redirect.',
    });
  }

  // 4. Security Downgrade
  if (hasSecurityDowngrade) {
    linkEquityScore -= 25;
    diagnostics.push({
      type: 'error',
      title: 'Insecure Protocol Downgrade (HTTPS to HTTP)',
      message: 'The redirect chain transitions from secure HTTPS back to unencrypted HTTP, breaking HSTS security and triggering browser warnings.',
    });
  }

  // 5. Final Status Check
  if (finalStatus === 404 || finalStatus === 410) {
    linkEquityScore = 0;
    diagnostics.push({
      type: 'error',
      title: `Dead End Redirect (${finalStatus})`,
      message: `The redirect chain resolves to a broken page (${finalStatus} ${lastHop?.statusText || 'Not Found'}). Backlinks pointing to the source URL are losing 100% of their value.`,
    });
  } else if (finalStatus >= 500) {
    linkEquityScore = 0;
    diagnostics.push({
      type: 'error',
      title: `Server Error at Destination (${finalStatus})`,
      message: `The target destination server crashed or failed with HTTP ${finalStatus}.`,
    });
  }

  linkEquityScore = Math.max(0, Math.min(100, linkEquityScore));

  // Build summary string (e.g. "301 -> 301 -> 200 OK")
  const statusSummary = hops.map((h) => h.status).join(' -> ');

  // Direct Resolution Code Snippets (from initialUrl to finalUrl)
  const directRules = generateDirectRules(initialUrl, finalUrl);

  return {
    initialUrl,
    finalUrl,
    finalStatus,
    totalHops,
    totalLatencyMs,
    hops,
    isLoop,
    hasChain,
    hasTemporaryInChain,
    hasSecurityDowngrade,
    linkEquityScore,
    statusSummary,
    diagnostics,
    directRules,
  };
}

/**
 * Generate 1-hop direct redirect rules for various servers
 */
export function generateDirectRules(
  sourceUrl: string,
  targetUrl: string,
  statusCode = 301
) {
  let sourcePath = '/old-page';
  let targetPath = targetUrl;

  try {
    const s = new URL(sourceUrl);
    sourcePath = s.pathname + s.search;
  } catch {}

  const isPermanent = statusCode === 301 || statusCode === 308;

  const nginx = `# Nginx 1-Hop Direct Redirect Rule
location = ${sourcePath} {
    return ${statusCode} ${targetUrl};
}`;

  const apache = `# Apache .htaccess 1-Hop Direct Redirect
Redirect ${statusCode} ${sourcePath} ${targetUrl}`;

  const nextjs = `// Next.js (next.config.js redirects)
module.exports = {
  async redirects() {
    return [
      {
        source: '${sourcePath}',
        destination: '${targetUrl}',
        permanent: ${isPermanent},
      },
    ];
  },
};`;

  const express = `// Express.js Direct Redirect Route
app.get('${sourcePath}', (req, res) => {
  res.redirect(${statusCode}, '${targetUrl}');
});`;

  const cloudflare = `# Cloudflare Redirect Rule (Single Redirect)
When incoming requests match:
(http.request.uri.path eq "${sourcePath}")
Then redirect to:
${targetUrl} (Status: ${statusCode} ${isPermanent ? 'Permanent' : 'Temporary'})`;

  return {
    nginx,
    apache,
    nextjs,
    express,
    cloudflare,
  };
}

// ---------------- CURATED REDIRECT PRESETS ----------------
export const REDIRECT_PRESETS = [
  {
    id: 'http_to_https',
    name: 'HTTP to HTTPS Enforcement',
    description: 'Clean 1-hop permanent 301 redirect upgrading unencrypted web traffic',
    url: 'http://github.com',
    expectedHops: 1,
  },
  {
    id: 'rebranding_migration',
    name: 'Multi-Hop Canonical Chain',
    description: 'Protocol upgrade followed by non-www canonicalization (http -> https:www -> https:naked)',
    url: 'http://www.github.com',
    expectedHops: 2,
  },
  {
    id: 'www_canonicalization',
    name: 'WWW Subdomain Consolidation',
    description: 'Enforcing consistent canonical non-www hostname',
    url: 'http://www.toolverse.app',
    expectedHops: 2,
  },
  {
    id: 'dead_end_redirect',
    name: 'Dead-End 301 to 404 Not Found',
    description: 'URL redirects to an endpoint that returns a 404 client error',
    url: 'https://httpbin.org/redirect-to?url=https%3A%2F%2Fhttpbin.org%2Fstatus%2F404&status_code=301',
    expectedHops: 2,
  },
  {
    id: 'temporary_302_chain',
    name: 'Temporary 302 Redirection',
    description: 'Redirect chain using temporary status codes that do not pass PageRank equity',
    url: 'https://httpbin.org/redirect/2',
    expectedHops: 2,
  },
];

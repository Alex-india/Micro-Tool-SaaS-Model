/**
 * ToolVerse HTTP Status Engine
 * Comprehensive IANA & RFC 9110 status code repository, diagnostic rules,
 * SEO impact evaluation, cURL command generator, and server config templates.
 * Zero external dependencies.
 */

export type HttpStatusClass = '1xx' | '2xx' | '3xx' | '4xx' | '5xx' | 'cdn';

export interface HttpStatusCodeInfo {
  code: number;
  title: string;
  category: HttpStatusClass;
  categoryName: string;
  rfc: string;
  summary: string;
  description: string;
  seoImpact: string;
  crawlerAction: string;
  fixRecommendation: string;
  commonHeaders: string[];
  serverConfigs: {
    apache: string;
    nginx: string;
    nextjs: string;
    express: string;
  };
}

export interface HttpStatusCheckResult {
  url: string;
  status: number;
  statusText: string;
  category: HttpStatusClass;
  latencyMs: number;
  headers: Record<string, string>;
  isRedirect: boolean;
  redirectLocation?: string;
  redirectChain?: Array<{
    url: string;
    status: number;
    statusText: string;
    location?: string;
  }>;
  finalUrl: string;
  info?: HttpStatusCodeInfo;
  seoVerdict: {
    badge: 'success' | 'warning' | 'error' | 'info';
    message: string;
    recommendation: string;
  };
}

export const HTTP_STATUS_DATABASE: Record<number, HttpStatusCodeInfo> = {
  // ---------------- 1xx Informational ----------------
  100: {
    code: 100,
    title: 'Continue',
    category: '1xx',
    categoryName: 'Informational',
    rfc: 'RFC 9110, Section 15.2.1',
    summary: 'Initial part of request received, client should continue.',
    description: 'The server has received the request headers and the client should proceed to send the request body (such as with large POST uploads).',
    seoImpact: 'Search engine bots do not index 1xx responses. Generally transparent to SEO.',
    crawlerAction: 'Crawlers wait for final 2xx/3xx/4xx response before recording index status.',
    fixRecommendation: 'Normal for chunked uploads or large payloads using Expect: 100-continue.',
    commonHeaders: ['Expect'],
    serverConfigs: {
      apache: '# Automatic server-level handling',
      nginx: '# Automatic proxy_buffering handling',
      nextjs: '// Handled by Node.js HTTP parser automatically',
      express: '// Handled by underlying http server',
    },
  },
  101: {
    code: 101,
    title: 'Switching Protocols',
    category: '1xx',
    categoryName: 'Informational',
    rfc: 'RFC 9110, Section 15.2.2',
    summary: 'Server agrees to switch protocols (e.g., HTTP to WebSocket).',
    description: 'The requester has asked the server to switch protocols and the server has agreed to do so (common in WebSocket handshakes).',
    seoImpact: 'WebSockets are not indexed by search engines. No direct SEO ranking impact.',
    crawlerAction: 'Search crawlers do not upgrade to WebSocket connections.',
    fixRecommendation: 'Ensure Upgrade and Connection: Upgrade headers are properly validated.',
    commonHeaders: ['Upgrade', 'Connection'],
    serverConfigs: {
      apache: 'RewriteEngine On\nRewriteCond %{HTTP:Upgrade} websocket [NC]\nRewriteRule /(.*) ws://localhost:3001/$1 [P,L]',
      nginx: 'proxy_set_header Upgrade $http_upgrade;\nproxy_set_header Connection "upgrade";',
      nextjs: '// Use standalone WebSocket server or custom server for WS upgrade',
      express: 'server.on("upgrade", (req, socket, head) => { wss.handleUpgrade(req, socket, head, (ws) => { wss.emit("connection", ws, req); }); });',
    },
  },

  // ---------------- 2xx Success ----------------
  200: {
    code: 200,
    title: 'OK',
    category: '2xx',
    categoryName: 'Success',
    rfc: 'RFC 9110, Section 15.3.1',
    summary: 'Standard success response for well-formed HTTP requests.',
    description: 'The request has succeeded. The information returned with the response depends on the method used in the request (GET, POST, HEAD, etc.).',
    seoImpact: 'Optimal SEO status. Search crawlers render, parse, and index page content immediately.',
    crawlerAction: 'Googlebot indexes the page and passes link equity to discovered internal links.',
    fixRecommendation: 'Ideal status for all primary, indexable content pages.',
    commonHeaders: ['Content-Type', 'Cache-Control', 'ETag', 'Last-Modified'],
    serverConfigs: {
      apache: '# Default Apache response when resource exists',
      nginx: '# Default Nginx response when file exists',
      nextjs: 'return NextResponse.json({ success: true }, { status: 200 });',
      express: 'res.status(200).json({ success: true });',
    },
  },
  201: {
    code: 201,
    title: 'Created',
    category: '2xx',
    categoryName: 'Success',
    rfc: 'RFC 9110, Section 15.3.2',
    summary: 'Request fulfilled and resulted in a new resource being created.',
    description: 'The request has succeeded and a new resource has been created as a result, typically sent after POST or PUT creation requests.',
    seoImpact: 'Typically used for API creation endpoints rather than HTML documents.',
    crawlerAction: 'Search bots treat as successful response if encountered on GET.',
    fixRecommendation: 'Provide the Location header pointing to the URI of the newly created resource.',
    commonHeaders: ['Location', 'Content-Type'],
    serverConfigs: {
      apache: '# Set via server-side script',
      nginx: '# Set via backend application proxy',
      nextjs: 'return NextResponse.json(newEntity, { status: 201, headers: { Location: `/items/${newEntity.id}` } });',
      express: 'res.status(201).location(`/items/${newEntity.id}`).json(newEntity);',
    },
  },
  204: {
    code: 204,
    title: 'No Content',
    category: '2xx',
    categoryName: 'Success',
    rfc: 'RFC 9110, Section 15.3.5',
    summary: 'Server successfully fulfilled request, but returns no content.',
    description: 'The server has successfully fulfilled the request and that there is no additional content to send in the response payload body.',
    seoImpact: 'If returned on an HTML URL, search engines will have no content to index and may consider it a Soft 404.',
    crawlerAction: 'Crawlers will not extract keywords or content; existing index entry may be dropped.',
    fixRecommendation: 'Avoid 204 for public webpage URLs; reserve strictly for background API calls (DELETE, PUT) or beacons.',
    commonHeaders: ['Cache-Control'],
    serverConfigs: {
      apache: '# Generated by API handler',
      nginx: '# Generated by backend proxy or empty return: return 204;',
      nextjs: 'return new Response(null, { status: 204 });',
      express: 'res.status(204).send();',
    },
  },
  206: {
    code: 206,
    title: 'Partial Content',
    category: '2xx',
    categoryName: 'Success',
    rfc: 'RFC 9110, Section 15.3.7',
    summary: 'Server is delivering only part of the resource due to a Range header.',
    description: 'The server is delivering only part of the resource (byte serving) due to a Range header sent by the client, common in video streaming and pause/resume downloads.',
    seoImpact: 'Standard for media and large file distribution. Search crawlers understand Range requests for video/audio indexing.',
    crawlerAction: 'Search engine video indexers parse byte ranges for thumbnails and media length.',
    fixRecommendation: 'Ensure Content-Range and Accept-Ranges: bytes headers are correctly formatted.',
    commonHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Type'],
    serverConfigs: {
      apache: '# Automatic when mod_headers and byte ranges are supported',
      nginx: '# Nginx automatically supports byte ranges for static files',
      nextjs: 'return new Response(chunk, { status: 206, headers: { "Content-Range": `bytes ${start}-${end}/${size}` } });',
      express: 'res.status(206).set({ "Content-Range": `bytes ${start}-${end}/${total}` }).send(chunk);',
    },
  },

  // ---------------- 3xx Redirection ----------------
  301: {
    code: 301,
    title: 'Moved Permanently',
    category: '3xx',
    categoryName: 'Redirection',
    rfc: 'RFC 9110, Section 15.4.2',
    summary: 'Target resource has been assigned a new permanent URI.',
    description: 'The target resource has been assigned a new permanent URI and any future references to this resource SHOULD use one of the returned URIs in the Location header.',
    seoImpact: 'Transfers 90-99% of link equity (PageRank) to the target URL. Google updates index to destination.',
    crawlerAction: 'Googlebot replaces old URL with target URL in index and transfers ranking signals over time.',
    fixRecommendation: 'Use for domain migrations, HTTP to HTTPS enforcement, and permanent content relocations.',
    commonHeaders: ['Location', 'Cache-Control'],
    serverConfigs: {
      apache: 'Redirect 301 /old-page https://example.com/new-page\n# Or HTTPS rewrite:\nRewriteCond %{HTTPS} off\nRewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
      nginx: 'return 301 https://$host$request_uri;',
      nextjs: 'import { redirect } from "next/navigation";\n// In route or page:\nredirect("/new-page"); // or next.config.js permanent: true',
      express: 'res.redirect(301, "https://example.com/new-page");',
    },
  },
  302: {
    code: 302,
    title: 'Found (Temporary Redirect)',
    category: '3xx',
    categoryName: 'Redirection',
    rfc: 'RFC 9110, Section 15.4.3',
    summary: 'Target resource resides temporarily under a different URI.',
    description: 'The target resource resides temporarily under a different URI. Since the redirection might be altered on occasion, the client SHOULD continue to use the effective request URI for future requests.',
    seoImpact: 'Does NOT permanently transfer PageRank. Original URL remains in search index.',
    crawlerAction: 'Crawlers keep crawling original URL expecting it to return; link equity remains with original.',
    fixRecommendation: 'Use 302 only for temporary maintenance, geo-location switching, or A/B tests. For permanent moves, change to 301.',
    commonHeaders: ['Location', 'Cache-Control'],
    serverConfigs: {
      apache: 'Redirect 302 /temp-promo /special-sale',
      nginx: 'rewrite ^/temp-promo$ /special-sale redirect;',
      nextjs: '// in next.config.js redirects:\n{ source: "/temp", destination: "/target", permanent: false }',
      express: 'res.redirect(302, "/temporary-target");',
    },
  },
  304: {
    code: 304,
    title: 'Not Modified',
    category: '3xx',
    categoryName: 'Redirection',
    rfc: 'RFC 9110, Section 15.4.5',
    summary: 'Resource has not been modified since the version specified in request headers.',
    description: 'There is no need for the server to retransmit the resource because the client already has a cached copy matching If-Modified-Since or If-None-Match conditional headers.',
    seoImpact: 'Crucial for SEO crawl budget efficiency. Signals to Googlebot that content has not changed without wasting bandwidth.',
    crawlerAction: 'Googlebot saves crawl budget and retains cached indexing document.',
    fixRecommendation: 'Ensure ETag or Last-Modified headers are properly configured on web server.',
    commonHeaders: ['ETag', 'Last-Modified', 'Cache-Control'],
    serverConfigs: {
      apache: '# Automatic when mod_expires and FileETag are enabled',
      nginx: '# Automatic when etag on; is enabled',
      nextjs: 'if (req.headers.get("if-none-match") === etag) {\n  return new Response(null, { status: 304 });\n}',
      express: 'if (req.fresh) return res.status(304).end();',
    },
  },
  307: {
    code: 307,
    title: 'Temporary Redirect',
    category: '3xx',
    categoryName: 'Redirection',
    rfc: 'RFC 9110, Section 15.4.8',
    summary: 'Target resource resides temporarily under different URI, request method MUST NOT change.',
    description: 'The target resource resides temporarily under a different URI. Unlike 302, user agents MUST NOT change the request method (e.g. POST remains POST).',
    seoImpact: 'Treated similarly to 302. Does not pass permanent link equity.',
    crawlerAction: 'Crawlers follow redirect but do not update canonical indexing URL.',
    fixRecommendation: 'Use when temporary redirecting POST or API requests where payload and method must be preserved.',
    commonHeaders: ['Location'],
    serverConfigs: {
      apache: 'Redirect 307 /api/v1/checkout /api/v2/checkout',
      nginx: 'return 307 https://example.com/api/v2/checkout;',
      nextjs: 'return NextResponse.redirect(new URL("/new-url", req.url), 307);',
      express: 'res.redirect(307, "/target");',
    },
  },
  308: {
    code: 308,
    title: 'Permanent Redirect',
    category: '3xx',
    categoryName: 'Redirection',
    rfc: 'RFC 9110, Section 15.4.9',
    summary: 'Target resource permanently moved, request method MUST NOT change.',
    description: 'The target resource has been assigned a new permanent URI. Unlike 301, the request method (e.g. POST) is guaranteed not to be converted to GET.',
    seoImpact: 'Treated identically to 301 by Googlebot. Full PageRank and link equity transferred.',
    crawlerAction: 'Googlebot permanently replaces original URL in index.',
    fixRecommendation: 'Modern standard for permanent redirection, especially for RESTful POST/PUT endpoints and HSTS redirects.',
    commonHeaders: ['Location', 'Cache-Control'],
    serverConfigs: {
      apache: 'Redirect 308 /api/data https://api.example.com/data',
      nginx: 'return 308 https://$host$request_uri;',
      nextjs: 'return NextResponse.redirect(new URL("/new-url", req.url), 308);',
      express: 'res.redirect(308, "/target");',
    },
  },

  // ---------------- 4xx Client Errors ----------------
  400: {
    code: 400,
    title: 'Bad Request',
    category: '4xx',
    categoryName: 'Client Error',
    rfc: 'RFC 9110, Section 15.5.1',
    summary: 'Server cannot process request due to perceived client error.',
    description: 'The server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid query parameters, deceptive routing).',
    seoImpact: 'Prevents search engines from crawling the page. If a primary page returns 400, it drops from search rankings.',
    crawlerAction: 'Crawlers will log an error and abandon the request.',
    fixRecommendation: 'Inspect URL query string encoding, malformed headers, cookie size, and request payload.',
    commonHeaders: ['Content-Type'],
    serverConfigs: {
      apache: 'ErrorDocument 400 /errors/400.html',
      nginx: 'error_page 400 /errors/400.html;',
      nextjs: 'return NextResponse.json({ error: "Malformed request payload" }, { status: 400 });',
      express: 'res.status(400).json({ error: "Invalid parameters" });',
    },
  },
  401: {
    code: 401,
    title: 'Unauthorized',
    category: '4xx',
    categoryName: 'Client Error',
    rfc: 'RFC 9110, Section 15.5.2',
    summary: 'Request lacks valid authentication credentials for the target resource.',
    description: 'The request has not been applied because it lacks valid authentication credentials for the target resource. The server must provide a WWW-Authenticate header.',
    seoImpact: 'Search engine crawlers do not carry user credentials. Protected pages return 401 and are excluded from search indexes.',
    crawlerAction: 'Crawlers treat page as password-protected and will not crawl or index.',
    fixRecommendation: 'Ensure public content is not gated by authentication. Use WWW-Authenticate header correctly.',
    commonHeaders: ['WWW-Authenticate', 'Content-Type'],
    serverConfigs: {
      apache: 'AuthType Basic\nAuthName "Restricted"\nAuthUserFile /path/.htpasswd\nRequire valid-user',
      nginx: 'auth_basic "Restricted Access";\nauth_basic_user_file /etc/nginx/.htpasswd;',
      nextjs: 'return new Response("Authentication required", { status: 401, headers: { "WWW-Authenticate": "Bearer" } });',
      express: 'res.status(401).set("WWW-Authenticate", "Bearer").json({ error: "Unauthorized" });',
    },
  },
  403: {
    code: 403,
    title: 'Forbidden',
    category: '4xx',
    categoryName: 'Client Error',
    rfc: 'RFC 9110, Section 15.5.4',
    summary: 'Server understood request but refuses to authorize it.',
    description: 'The server understood the request but refuses to authorize it. Unlike 401, authentication will not help (e.g. IP block, firewall WAF rule, directory listing blocked).',
    seoImpact: 'Severe negative SEO impact if applied to public pages. Googlebot will drop 403 pages from the index.',
    crawlerAction: 'Googlebot halts indexing and flags page as inaccessible in Google Search Console.',
    fixRecommendation: 'Check Cloudflare WAF, CloudFront security rules, ModSecurity, and IP blocklists to verify Googlebot is not being blocked.',
    commonHeaders: ['Content-Type'],
    serverConfigs: {
      apache: 'ErrorDocument 403 /errors/403.html\n# Or deny from specific IP:\nRequire not ip 198.51.100.1',
      nginx: 'error_page 403 /errors/403.html;\n# deny 198.51.100.1;',
      nextjs: 'return NextResponse.json({ error: "Forbidden access" }, { status: 403 });',
      express: 'res.status(403).json({ error: "Access Denied" });',
    },
  },
  404: {
    code: 404,
    title: 'Not Found',
    category: '4xx',
    categoryName: 'Client Error',
    rfc: 'RFC 9110, Section 15.5.5',
    summary: 'The server cannot find the requested resource.',
    description: 'The origin server did not find a current representation for the target resource or is not willing to disclose that one exists.',
    seoImpact: 'Google will eventually de-index the page. Broken inbound links waste link equity.',
    crawlerAction: 'Crawlers retry a few times, then drop page from the index. Crawl budget is consumed.',
    fixRecommendation: 'If the page moved, implement a 301 redirect to the closest relevant page. Otherwise, serve a friendly 404 page.',
    commonHeaders: ['Content-Type'],
    serverConfigs: {
      apache: 'ErrorDocument 404 /404.html',
      nginx: 'error_page 404 /404.html;',
      nextjs: 'import { notFound } from "next/navigation";\n// inside Server Component:\nnotFound();',
      express: 'res.status(404).sendFile(path.join(__dirname, "public/404.html"));',
    },
  },
  405: {
    code: 405,
    title: 'Method Not Allowed',
    category: '4xx',
    categoryName: 'Client Error',
    rfc: 'RFC 9110, Section 15.5.6',
    summary: 'The method received in request line is known by server but not supported.',
    description: 'The method received in the request-line is known by the origin server but not supported by the target resource (e.g. sending a POST to a static GET-only page).',
    seoImpact: 'Search engine crawlers primarily use GET and HEAD. If GET returns 405, page cannot be indexed.',
    crawlerAction: 'Crawlers cannot parse content and will drop page.',
    fixRecommendation: 'Server must send an Allow header listing supported methods (e.g. Allow: GET, HEAD).',
    commonHeaders: ['Allow', 'Content-Type'],
    serverConfigs: {
      apache: 'ErrorDocument 405 /errors/405.html',
      nginx: 'error_page 405 /errors/405.html;',
      nextjs: 'return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, POST" } });',
      express: 'res.status(405).set("Allow", "GET, POST").send("Method Not Allowed");',
    },
  },
  410: {
    code: 410,
    title: 'Gone',
    category: '4xx',
    categoryName: 'Client Error',
    rfc: 'RFC 9110, Section 15.5.11',
    summary: 'Target resource has been permanently deleted with no forwarding address.',
    description: 'Access to the target resource is no longer available at the origin server and that this condition is likely to be permanent.',
    seoImpact: 'Fastest way to remove deleted pages from Google. Googlebot de-indexes 410 URLs significantly faster than 404 URLs.',
    crawlerAction: 'Crawlers immediately remove URL from index and stop re-crawling much sooner than 404.',
    fixRecommendation: 'Use 410 when intentionally deleting discontinued products, deprecated documentation, or expired legal pages.',
    commonHeaders: ['Content-Type'],
    serverConfigs: {
      apache: 'Redirect 410 /discontinued-product\nErrorDocument 410 /errors/410.html',
      nginx: 'location = /discontinued-product { return 410; }',
      nextjs: 'return new Response("Resource Permanently Deleted", { status: 410 });',
      express: 'res.status(410).send("Resource permanently removed");',
    },
  },
  429: {
    code: 429,
    title: 'Too Many Requests',
    category: '4xx',
    categoryName: 'Client Error',
    rfc: 'RFC 6585, Section 4',
    summary: 'The user has sent too many requests in a given amount of time (rate limiting).',
    description: 'The user has sent too many requests in a given amount of time ("rate limiting"). Should include a Retry-After header.',
    seoImpact: 'If served to Googlebot, Google slows down or halts crawling, resulting in delayed indexing of new content.',
    crawlerAction: 'Googlebot honors Retry-After header and reduces crawl frequency.',
    fixRecommendation: 'Whitelist verified Googlebot and Bingbot IP addresses or reverse DNS lookups in rate limiter.',
    commonHeaders: ['Retry-After', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    serverConfigs: {
      apache: '# Mod_ratelimit or custom header return',
      nginx: 'limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;\nlimit_req_status 429;',
      nextjs: 'return new Response("Rate limit exceeded", { status: 429, headers: { "Retry-After": "60" } });',
      express: 'res.status(429).set("Retry-After", "60").json({ error: "Too Many Requests" });',
    },
  },

  // ---------------- 5xx Server Errors ----------------
  500: {
    code: 500,
    title: 'Internal Server Error',
    category: '5xx',
    categoryName: 'Server Error',
    rfc: 'RFC 9110, Section 15.6.1',
    summary: 'The server encountered an unexpected condition that prevented request fulfillment.',
    description: 'A generic catch-all server error response indicating an unhandled exception, code bug, database crash, or configuration fault.',
    seoImpact: 'Critical SEO threat. Sustained 500 errors cause rapid dropping from search result rankings.',
    crawlerAction: 'Googlebot slows down crawl rate and temporarily demotes page until server recovers.',
    fixRecommendation: 'Inspect server application logs, unhandled exceptions, database connection pools, and environment variables.',
    commonHeaders: ['Content-Type'],
    serverConfigs: {
      apache: 'ErrorDocument 500 /errors/500.html',
      nginx: 'error_page 500 502 503 504 /50x.html;',
      nextjs: 'return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });',
      express: 'res.status(500).json({ error: "Internal Server Error" });',
    },
  },
  502: {
    code: 502,
    title: 'Bad Gateway',
    category: '5xx',
    categoryName: 'Server Error',
    rfc: 'RFC 9110, Section 15.6.3',
    summary: 'Server, while acting as gateway or proxy, received invalid response from upstream.',
    description: 'The server, while acting as a gateway or proxy (e.g. Nginx proxying to Node.js/PHP-FPM), received an invalid response from an inbound upstream server.',
    seoImpact: 'Severe. If Googlebot encounters 502 across multiple pages, it concludes the site is down and pauses crawling.',
    crawlerAction: 'Crawlers retry later, but consecutive 502s lead to de-indexing.',
    fixRecommendation: 'Check backend application process (PM2, Docker, Node.js process crash) or proxy upstream connection socket.',
    commonHeaders: ['Content-Type'],
    serverConfigs: {
      apache: '# Check mod_proxy connection to upstream host',
      nginx: 'proxy_pass http://localhost:3000;\nproxy_connect_timeout 60s;\nproxy_read_timeout 60s;',
      nextjs: '// Returned when upstream fetch in API route fails',
      express: '// Check upstream microservice connections',
    },
  },
  503: {
    code: 503,
    title: 'Service Unavailable',
    category: '5xx',
    categoryName: 'Server Error',
    rfc: 'RFC 9110, Section 15.6.4',
    summary: 'Server is currently unable to handle request due to temporary overload or maintenance.',
    description: 'The server is currently unable to handle the request due to a temporary overload or scheduled maintenance. Crucially, it SHOULD send a Retry-After header.',
    seoImpact: 'Best way to handle temporary server downtime without losing SEO rankings. With Retry-After, Googlebot pauses and preserves existing rankings.',
    crawlerAction: 'Googlebot waits for the Retry-After interval before re-checking without removing page from index.',
    fixRecommendation: 'Always serve 503 with a Retry-After header (e.g. Retry-After: 3600) during planned maintenance.',
    commonHeaders: ['Retry-After', 'Content-Type'],
    serverConfigs: {
      apache: 'ErrorDocument 503 /maintenance.html\nHeader always set Retry-After "7200"',
      nginx: 'return 503;\nadd_header Retry-After 3600 always;',
      nextjs: 'return new Response("Under Maintenance", { status: 503, headers: { "Retry-After": "3600" } });',
      express: 'res.status(503).set("Retry-After", "3600").sendFile("/path/to/maintenance.html");',
    },
  },
  504: {
    code: 504,
    title: 'Gateway Timeout',
    category: '5xx',
    categoryName: 'Server Error',
    rfc: 'RFC 9110, Section 15.6.5',
    summary: 'Gateway did not receive timely response from upstream server.',
    description: 'The server, while acting as a gateway or proxy, did not receive a timely response from an upstream server it needed to access in order to complete the request.',
    seoImpact: 'Negatively impacts Core Web Vitals (INP/TTFB) and causes search bots to abandon crawl.',
    crawlerAction: 'Crawlers log a timeout and may drop the URL if timeouts persist.',
    fixRecommendation: 'Optimize database queries, external API calls, increase proxy read timeout, or enable async background job processing.',
    commonHeaders: ['Content-Type'],
    serverConfigs: {
      apache: 'ProxyTimeout 120',
      nginx: 'proxy_read_timeout 120s;\nproxy_connect_timeout 120s;',
      nextjs: '// Ensure external fetches have abort controllers and reasonable timeouts',
      express: 'req.setTimeout(120000);',
    },
  },

  // ---------------- CDN / Cloudflare Edge Codes ----------------
  520: {
    code: 520,
    title: 'Web Server Returned an Unknown Error',
    category: 'cdn',
    categoryName: 'CDN / Edge Error',
    rfc: 'Cloudflare Unofficial',
    summary: 'Origin server returned an empty, unknown, or unexpected response to Cloudflare.',
    description: 'Catch-all error used when the origin server returns something unexpected or empty (such as connection reset or oversized headers).',
    seoImpact: 'Prevents visitors and search bots from reaching site.',
    crawlerAction: 'Treated as 5xx server failure by search crawlers.',
    fixRecommendation: 'Check origin server access and error logs for crashes or connection resets.',
    commonHeaders: ['CF-RAY'],
    serverConfigs: {
      apache: '# Check Apache error_log for segfaults or crash traces',
      nginx: '# Check fastcgi_buffer_size or client_header_buffer_size',
      nextjs: '// Check for uncaught runtime errors in API routes',
      express: '// Ensure uncaughtException handlers are logged',
    },
  },
  521: {
    code: 521,
    title: 'Web Server Is Down',
    category: 'cdn',
    categoryName: 'CDN / Edge Error',
    rfc: 'Cloudflare Unofficial',
    summary: 'Origin web server refused connections from Cloudflare.',
    description: 'The origin web server refused connections from the CDN edge, typically because web server software (Apache/Nginx) crashed or origin firewall blocked CDN IP ranges.',
    seoImpact: 'Complete outage. Googlebot cannot access site.',
    crawlerAction: 'Search indexers flag site as unreachable.',
    fixRecommendation: 'Restart web server and whitelist Cloudflare IP ranges in origin firewall (iptables/UFW).',
    commonHeaders: ['CF-RAY'],
    serverConfigs: {
      apache: 'systemctl restart apache2',
      nginx: 'systemctl restart nginx',
      nextjs: 'pm2 restart next-app',
      express: 'pm2 restart express-app',
    },
  },
  522: {
    code: 522,
    title: 'Connection Timed Out',
    category: 'cdn',
    categoryName: 'CDN / Edge Error',
    rfc: 'Cloudflare Unofficial',
    summary: 'Cloudflare could not negotiate a TCP handshake with the origin server.',
    description: 'TCP handshake between edge and origin timed out, commonly caused by routing issues, overloaded origin server, or dropped packets.',
    seoImpact: 'Prevents crawling and indexing.',
    crawlerAction: 'Crawlers fail to connect and abandon request.',
    fixRecommendation: 'Check origin CPU/memory load and verify network routing and firewall rules.',
    commonHeaders: ['CF-RAY'],
    serverConfigs: {
      apache: '# Check origin server CPU/RAM exhaustion',
      nginx: '# Verify server listen port and firewall',
      nextjs: '# Verify Node process responsiveness',
      express: '# Monitor event loop lag',
    },
  },
  524: {
    code: 524,
    title: 'A Timeout Occurred',
    category: 'cdn',
    categoryName: 'CDN / Edge Error',
    rfc: 'Cloudflare Unofficial',
    summary: 'Cloudflare established TCP connection, but origin did not reply in time (default 100s).',
    description: 'The edge server successfully connected to the origin, but the origin took longer than 100 seconds to return an HTTP response.',
    seoImpact: 'Extreme latency failure. Severely hurts SEO and user retention.',
    crawlerAction: 'Googlebot times out and aborts crawl.',
    fixRecommendation: 'Offload long-running operations (PDF generation, bulk exports, AI generation) to background queues or WebSockets.',
    commonHeaders: ['CF-RAY'],
    serverConfigs: {
      apache: '# Move long operations to background workers',
      nginx: '# Offload heavy jobs to queues (BullMQ, Celery)',
      nextjs: '// Use streaming responses or background webhook processing',
      express: '// Return immediate 202 Accepted with polling job ID',
    },
  },
};

/**
 * Get HTTP Status Info by numeric code
 */
export function getHttpStatusInfo(code: number): HttpStatusCodeInfo {
  if (HTTP_STATUS_DATABASE[code]) {
    return HTTP_STATUS_DATABASE[code];
  }

  // Fallback for codes not explicitly listed
  let category: HttpStatusClass = '5xx';
  let categoryName = 'Server Error';

  if (code >= 100 && code < 200) {
    category = '1xx';
    categoryName = 'Informational';
  } else if (code >= 200 && code < 300) {
    category = '2xx';
    categoryName = 'Success';
  } else if (code >= 300 && code < 400) {
    category = '3xx';
    categoryName = 'Redirection';
  } else if (code >= 400 && code < 500) {
    category = '4xx';
    categoryName = 'Client Error';
  } else if (code >= 520 && code <= 530) {
    category = 'cdn';
    categoryName = 'CDN / Edge Error';
  }

  return {
    code,
    title: `Status ${code}`,
    category,
    categoryName,
    rfc: 'RFC 9110 HTTP Semantics',
    summary: `HTTP status code ${code} (${categoryName})`,
    description: `Standard or custom HTTP response status code ${code}.`,
    seoImpact: category === '2xx' ? 'Standard indexing.' : 'May hinder indexing depending on server intention.',
    crawlerAction: 'Search crawlers treat according to status class.',
    fixRecommendation: 'Review server application logs and HTTP documentation.',
    commonHeaders: ['Content-Type'],
    serverConfigs: {
      apache: `# Custom code ${code}`,
      nginx: `return ${code};`,
      nextjs: `return new Response(null, { status: ${code} });`,
      express: `res.status(${code}).end();`,
    },
  };
}

/**
 * Search and filter status codes database
 */
export function searchHttpStatusCodes(query: string, filterClass?: HttpStatusClass | 'all'): HttpStatusCodeInfo[] {
  const q = (query || '').trim().toLowerCase();
  const allCodes = Object.values(HTTP_STATUS_DATABASE);

  return allCodes.filter((item) => {
    // Class filter
    if (filterClass && filterClass !== 'all' && item.category !== filterClass) {
      return false;
    }

    if (!q) return true;

    return (
      item.code.toString().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.seoImpact.toLowerCase().includes(q)
    );
  }).sort((a, b) => a.code - b.code);
}

/**
 * Evaluate SEO verdict and diagnosis from status code and response details
 */
export function evaluateSeoVerdict(status: number, isRedirect: boolean, redirectLocation?: string, headers: Record<string, string> = {}) {
  const xRobots = headers['x-robots-tag']?.toLowerCase() || '';

  if (status === 200) {
    if (xRobots.includes('noindex')) {
      return {
        badge: 'warning' as const,
        message: '200 OK with "noindex" X-Robots-Tag Header',
        recommendation: 'The page returns 200 OK, but search crawlers are explicitly instructed NOT to index it via the X-Robots-Tag HTTP header.',
      };
    }
    return {
      badge: 'success' as const,
      message: 'Optimal 200 OK Response for Search Indexing',
      recommendation: 'Googlebot and search crawlers will render and index this URL normally, distributing link equity to linked pages.',
    };
  }

  if (status === 301 || status === 308) {
    return {
      badge: 'info' as const,
      message: `Permanent Redirect (${status}) to Destination`,
      recommendation: `Transfers 90-99% of PageRank link equity to: ${redirectLocation || 'target URL'}. Googlebot updates index to the target.`,
    };
  }

  if (status === 302 || status === 307) {
    return {
      badge: 'warning' as const,
      message: `Temporary Redirect (${status}) - Equity Not Transferred`,
      recommendation: `Original URL remains in Google search index. If this move is permanent, change to 301 to preserve link authority.`,
    };
  }

  if (status === 304) {
    return {
      badge: 'success' as const,
      message: '304 Not Modified - Optimal Crawl Budget Preservation',
      recommendation: 'Signals to Googlebot that content has not changed since last crawl, saving crawl budget and bandwidth.',
    };
  }

  if (status === 404) {
    return {
      badge: 'error' as const,
      message: '404 Not Found - Broken URL or Missing Page',
      recommendation: 'Page is missing and will be de-indexed. If this page had backlinks or high traffic, set up a 301 redirect to the closest live page.',
    };
  }

  if (status === 410) {
    return {
      badge: 'warning' as const,
      message: '410 Gone - Permanent De-indexing Signal',
      recommendation: 'Instructs search engines to rapidly purge this URL from search indexes. More aggressive and faster than 404.',
    };
  }

  if (status === 403) {
    return {
      badge: 'error' as const,
      message: '403 Forbidden - Bot Access Blocked',
      recommendation: 'Check firewall, CDN WAF (Cloudflare/CloudFront), and IP blocklists to verify legitimate search bots are not blocked.',
    };
  }

  if (status === 429) {
    return {
      badge: 'error' as const,
      message: '429 Too Many Requests - Crawl Rate Throttled',
      recommendation: 'Rate limiter is choking requests. Ensure Googlebot and Bingbot IP addresses are whitelisted from rate limiting.',
    };
  }

  if (status >= 500) {
    if (status === 503) {
      const retryAfter = headers['retry-after'];
      return {
        badge: 'warning' as const,
        message: '503 Service Unavailable (Temporary Downtime)',
        recommendation: retryAfter
          ? `Proper 503 with Retry-After: ${retryAfter}. Search crawlers will preserve rankings and retry later.`
          : 'Missing Retry-After header. Add Retry-After: 3600 so crawlers know when to return.',
      };
    }
    return {
      badge: 'error' as const,
      message: `${status} Server Error - Critical Outage Threat`,
      recommendation: 'Persistent 5xx errors cause search engines to demote or de-index your site. Check backend server logs immediately.',
    };
  }

  return {
    badge: 'info' as const,
    message: `HTTP Status ${status}`,
    recommendation: 'Review HTTP headers and server response configuration.',
  };
}

/**
 * Generate cURL command for testing this URL
 */
export function generateCurlCommand(url: string, userAgent = 'curl/8.0.0', followRedirects = true): string {
  const parts = ['curl -I'];
  if (followRedirects) parts.push('-L');
  parts.push(`-A "${userAgent}"`);
  parts.push(`"${url}"`);
  return parts.join(' ');
}

// Curated live / demo presets
export const HTTP_STATUS_PRESETS = [
  {
    id: 'google_home',
    name: '200 OK (Google.com)',
    url: 'https://www.google.com',
    expectedStatus: 200,
    description: 'Standard secure live HTTPS response with rich caching headers',
  },
  {
    id: 'github_redirect',
    name: '301 Redirect (HTTP -> HTTPS)',
    url: 'http://github.com',
    expectedStatus: 301,
    description: 'Standard permanent redirect enforcing HTTPS protocol',
  },
  {
    id: 'httpbin_404',
    name: '404 Not Found (Missing URL)',
    url: 'https://httpbin.org/status/404',
    expectedStatus: 404,
    description: 'Simulated 404 Not Found client error endpoint',
  },
  {
    id: 'httpbin_410',
    name: '410 Gone (Permanently Deleted)',
    url: 'https://httpbin.org/status/410',
    expectedStatus: 410,
    description: 'Simulated 410 Gone de-indexing status',
  },
  {
    id: 'httpbin_500',
    name: '500 Internal Server Error',
    url: 'https://httpbin.org/status/500',
    expectedStatus: 500,
    description: 'Simulated 500 Internal Server Error',
  },
  {
    id: 'httpbin_503',
    name: '503 Service Unavailable',
    url: 'https://httpbin.org/status/503',
    expectedStatus: 503,
    description: 'Simulated 503 Maintenance response',
  },
];

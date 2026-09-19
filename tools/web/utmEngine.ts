/**
 * ToolVerse UTM Campaign Engine
 * Pure TypeScript UTM Parameter Builder, Parser, Cleaner, and Batch Generator.
 * Zero external dependencies.
 */

export interface UtmParams {
  baseUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm?: string;
  utmContent?: string;
  utmId?: string; // GA4 Campaign ID
  utmSourcePlatform?: string; // GA4 Source Platform
  utmCreativeFormat?: string; // GA4 Creative Format
  utmMarketingTactic?: string; // GA4 Marketing Tactic
}

export interface UtmBuildOptions {
  autoLowercase?: boolean;
  spaceReplacement?: 'hyphen' | 'underscore' | 'plus' | 'none';
  preserveExistingParams?: boolean;
}

export interface UtmBuildResult {
  fullUrl: string;
  isValidUrl: boolean;
  warnings: string[];
  protocol: string;
  hostname: string;
  pathname: string;
  hash: string;
  utmParams: Record<string, string>;
  otherParams: Record<string, string>;
  totalParamCount: number;
}

export interface CleanUrlResult {
  cleanUrl: string;
  removedParams: string[];
  originalLength: number;
  cleanLength: number;
  charactersSaved: number;
}

export interface BatchUtmItem {
  id: string;
  channelName: string;
  source: string;
  medium: string;
  url: string;
}

// Common ad click IDs and tracking parameters to clean
export const TRACKING_PARAMS_TO_REMOVE = new Set([
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
  'mc_cid',
  'mc_eid',
  'igshid',
  'yclid',
  'wickedid',
  'dclid',
  '_hsenc',
  '_hsmi',
  'zanpid',
]);

/**
 * Format string value according to options (lowercase, space substitution)
 */
export function sanitizeUtmValue(
  val: string,
  options: UtmBuildOptions = {}
): string {
  if (!val) return '';
  let str = val.trim();

  const autoLowercase = options.autoLowercase ?? true;
  const spaceReplacement = options.spaceReplacement ?? 'hyphen';

  if (autoLowercase) {
    str = str.toLowerCase();
  }

  if (spaceReplacement === 'hyphen') {
    str = str.replace(/\s+/g, '-');
  } else if (spaceReplacement === 'underscore') {
    str = str.replace(/\s+/g, '_');
  } else if (spaceReplacement === 'plus') {
    str = str.replace(/\s+/g, '+');
  }

  return str;
}

/**
 * Build standard UTM tracking URL
 */
export function buildUtmUrl(
  params: UtmParams,
  options: UtmBuildOptions = {}
): UtmBuildResult {
  const warnings: string[] = [];
  let rawUrl = params.baseUrl.trim();

  if (!rawUrl) {
    return {
      fullUrl: '',
      isValidUrl: false,
      warnings: ['Please provide a target website URL.'],
      protocol: '',
      hostname: '',
      pathname: '',
      hash: '',
      utmParams: {},
      otherParams: {},
      totalParamCount: 0,
    };
  }

  // Prepend protocol if omitted
  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = 'https://' + rawUrl;
  }

  let urlObj: URL;
  try {
    urlObj = new URL(rawUrl);
  } catch {
    return {
      fullUrl: rawUrl,
      isValidUrl: false,
      warnings: ['Invalid URL format. Please check the domain.'],
      protocol: '',
      hostname: '',
      pathname: '',
      hash: '',
      utmParams: {},
      otherParams: {},
      totalParamCount: 0,
    };
  }

  // Check required parameters
  const sSource = sanitizeUtmValue(params.utmSource, options);
  const sMedium = sanitizeUtmValue(params.utmMedium, options);
  const sCampaign = sanitizeUtmValue(params.utmCampaign, options);
  const sTerm = sanitizeUtmValue(params.utmTerm || '', options);
  const sContent = sanitizeUtmValue(params.utmContent || '', options);
  const sId = sanitizeUtmValue(params.utmId || '', options);
  const sPlatform = sanitizeUtmValue(params.utmSourcePlatform || '', options);
  const sFormat = sanitizeUtmValue(params.utmCreativeFormat || '', options);
  const sTactic = sanitizeUtmValue(params.utmMarketingTactic || '', options);

  if (!sSource) warnings.push('Missing "utm_source" (e.g. google, newsletter, facebook).');
  if (!sMedium) warnings.push('Missing "utm_medium" (e.g. cpc, email, paid-social).');
  if (!sCampaign) warnings.push('Missing "utm_campaign" (e.g. summer-sale, product-launch).');

  // Preserve existing non-UTM query params if requested
  const preserve = options.preserveExistingParams ?? true;
  const existingParams: Record<string, string> = {};
  const utmMap: Record<string, string> = {};

  if (!preserve) {
    urlObj.search = '';
  } else {
    urlObj.searchParams.forEach((v, k) => {
      if (!k.startsWith('utm_')) {
        existingParams[k] = v;
      }
    });
  }

  // Append UTM tags
  if (sSource) {
    urlObj.searchParams.set('utm_source', sSource);
    utmMap['utm_source'] = sSource;
  }
  if (sMedium) {
    urlObj.searchParams.set('utm_medium', sMedium);
    utmMap['utm_medium'] = sMedium;
  }
  if (sCampaign) {
    urlObj.searchParams.set('utm_campaign', sCampaign);
    utmMap['utm_campaign'] = sCampaign;
  }
  if (sTerm) {
    urlObj.searchParams.set('utm_term', sTerm);
    utmMap['utm_term'] = sTerm;
  }
  if (sContent) {
    urlObj.searchParams.set('utm_content', sContent);
    utmMap['utm_content'] = sContent;
  }
  if (sId) {
    urlObj.searchParams.set('utm_id', sId);
    utmMap['utm_id'] = sId;
  }
  if (sPlatform) {
    urlObj.searchParams.set('utm_source_platform', sPlatform);
    utmMap['utm_source_platform'] = sPlatform;
  }
  if (sFormat) {
    urlObj.searchParams.set('utm_creative_format', sFormat);
    utmMap['utm_creative_format'] = sFormat;
  }
  if (sTactic) {
    urlObj.searchParams.set('utm_marketing_tactic', sTactic);
    utmMap['utm_marketing_tactic'] = sTactic;
  }

  const fullUrl = urlObj.toString();
  const totalParamCount = Object.keys(existingParams).length + Object.keys(utmMap).length;

  return {
    fullUrl,
    isValidUrl: true,
    warnings,
    protocol: urlObj.protocol,
    hostname: urlObj.hostname,
    pathname: urlObj.pathname,
    hash: urlObj.hash,
    utmParams: utmMap,
    otherParams: existingParams,
    totalParamCount,
  };
}

/**
 * Parse any existing URL and extract UTM parameters
 */
export function parseUtmUrl(urlStr: string): UtmBuildResult {
  let raw = urlStr.trim();
  if (!raw) {
    return {
      fullUrl: '',
      isValidUrl: false,
      warnings: ['No URL provided'],
      protocol: '',
      hostname: '',
      pathname: '',
      hash: '',
      utmParams: {},
      otherParams: {},
      totalParamCount: 0,
    };
  }

  if (!/^https?:\/\//i.test(raw)) {
    raw = 'https://' + raw;
  }

  try {
    const urlObj = new URL(raw);
    const utmParams: Record<string, string> = {};
    const otherParams: Record<string, string> = {};
    const warnings: string[] = [];

    urlObj.searchParams.forEach((v, k) => {
      if (k.startsWith('utm_') || TRACKING_PARAMS_TO_REMOVE.has(k)) {
        utmParams[k] = v;
      } else {
        otherParams[k] = v;
      }
    });

    if (!utmParams['utm_source']) warnings.push('URL does not contain utm_source');
    if (!utmParams['utm_medium']) warnings.push('URL does not contain utm_medium');
    if (!utmParams['utm_campaign']) warnings.push('URL does not contain utm_campaign');

    return {
      fullUrl: urlObj.toString(),
      isValidUrl: true,
      warnings,
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      pathname: urlObj.pathname,
      hash: urlObj.hash,
      utmParams,
      otherParams,
      totalParamCount: Object.keys(utmParams).length + Object.keys(otherParams).length,
    };
  } catch {
    return {
      fullUrl: raw,
      isValidUrl: false,
      warnings: ['Invalid URL string'],
      protocol: '',
      hostname: '',
      pathname: '',
      hash: '',
      utmParams: {},
      otherParams: {},
      totalParamCount: 0,
    };
  }
}

/**
 * Strip tracking and UTM parameters from a URL
 */
export function cleanUtmUrl(urlStr: string): CleanUrlResult {
  const originalLength = urlStr.length;
  let raw = urlStr.trim();

  if (!raw) {
    return {
      cleanUrl: '',
      removedParams: [],
      originalLength: 0,
      cleanLength: 0,
      charactersSaved: 0,
    };
  }

  const hadHttp = /^https?:\/\//i.test(raw);
  if (!hadHttp) {
    raw = 'https://' + raw;
  }

  try {
    const urlObj = new URL(raw);
    const removedParams: string[] = [];

    const keys = Array.from(urlObj.searchParams.keys());
    for (const key of keys) {
      if (key.startsWith('utm_') || TRACKING_PARAMS_TO_REMOVE.has(key.toLowerCase())) {
        removedParams.push(key);
        urlObj.searchParams.delete(key);
      }
    }

    let clean = urlObj.toString();
    // If the original didn't have protocol, optionally preserve appearance
    if (!hadHttp && clean.startsWith('https://')) {
      clean = clean.replace('https://', '');
    }

    const cleanLength = clean.length;
    return {
      cleanUrl: clean,
      removedParams,
      originalLength,
      cleanLength,
      charactersSaved: Math.max(0, originalLength - cleanLength),
    };
  } catch {
    return {
      cleanUrl: urlStr,
      removedParams: [],
      originalLength,
      cleanLength: originalLength,
      charactersSaved: 0,
    };
  }
}

// ---------------- Multi-Channel Batch Presets ----------------
export const CHANNEL_TEMPLATES = [
  {
    id: 'google_cpc',
    channelName: 'Google Ads (Search/PPC)',
    source: 'google',
    medium: 'cpc',
  },
  {
    id: 'meta_ads',
    channelName: 'Facebook & Instagram Ads',
    source: 'facebook',
    medium: 'paid-social',
  },
  {
    id: 'email_newsletter',
    channelName: 'Email Newsletter',
    source: 'newsletter',
    medium: 'email',
  },
  {
    id: 'linkedin_ads',
    channelName: 'LinkedIn Sponsored Content',
    source: 'linkedin',
    medium: 'paid-social',
  },
  {
    id: 'twitter_x',
    channelName: 'X / Twitter Post',
    source: 'twitter',
    medium: 'social',
  },
  {
    id: 'youtube',
    channelName: 'YouTube Description',
    source: 'youtube',
    medium: 'video',
  },
  {
    id: 'tiktok',
    channelName: 'TikTok Bio / Ad',
    source: 'tiktok',
    medium: 'social',
  },
  {
    id: 'affiliate',
    channelName: 'Affiliate & Partner Link',
    source: 'partner',
    medium: 'affiliate',
  },
];

/**
 * Generate multi-channel batch URLs
 */
export function generateBatchUtmUrls(
  baseUrl: string,
  campaignName: string,
  options: UtmBuildOptions = {}
): BatchUtmItem[] {
  const cleanBase = baseUrl.trim();
  if (!cleanBase) return [];

  return CHANNEL_TEMPLATES.map((tpl) => {
    const res = buildUtmUrl(
      {
        baseUrl: cleanBase,
        utmSource: tpl.source,
        utmMedium: tpl.medium,
        utmCampaign: campaignName || 'general-promo',
      },
      options
    );

    return {
      id: tpl.id,
      channelName: tpl.channelName,
      source: tpl.source,
      medium: tpl.medium,
      url: res.fullUrl,
    };
  });
}

// ---------------- Curated Presets ----------------
export const UTM_PRESETS = [
  {
    id: 'google_search',
    label: 'Google Search Ads (PPC)',
    description: 'Targeted Google Ads campaign with keywords and ad group term tracking',
    params: {
      baseUrl: 'https://toolverse.app/pricing',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'us-saas-core-search',
      utmTerm: 'developer-micro-tools',
      utmContent: 'expanded-text-ad-v2',
      utmId: 'gads-98421',
    },
  },
  {
    id: 'meta_carousel',
    label: 'Meta (Facebook & Instagram) Ad',
    description: 'Social feed carousel ad with creative variant content tag',
    params: {
      baseUrl: 'https://toolverse.app/tools',
      utmSource: 'facebook',
      utmMedium: 'paid-social',
      utmCampaign: 'autumn-flash-sale',
      utmContent: 'carousel-slide-3-dev-tools',
      utmId: 'fb-77310',
    },
  },
  {
    id: 'newsletter_blast',
    label: 'Weekly Newsletter CTA',
    description: 'Email newsletter header CTA button for product update release',
    params: {
      baseUrl: 'https://toolverse.app/developer/sql-formatter',
      utmSource: 'newsletter',
      utmMedium: 'email',
      utmCampaign: 'september-developer-digest',
      utmContent: 'cta-banner-top',
      utmTerm: 'v2-release',
    },
  },
  {
    id: 'linkedin_b2b',
    label: 'LinkedIn B2B Lead Gen',
    description: 'Sponsored post targeting engineering leaders and IT decision makers',
    params: {
      baseUrl: 'https://toolverse.app/privacy/password-generator',
      utmSource: 'linkedin',
      utmMedium: 'paid-social',
      utmCampaign: 'enterprise-security-kit-q3',
      utmContent: 'single-image-infographic',
    },
  },
  {
    id: 'partner_affiliate',
    label: 'Affiliate & Referral Partner',
    description: 'Custom referral partner link with affiliate ID and campaign tier',
    params: {
      baseUrl: 'https://toolverse.app',
      utmSource: 'tech-influencer-hub',
      utmMedium: 'affiliate',
      utmCampaign: 'creator-partner-program',
      utmTerm: 'aff-code-9021',
    },
  },
];

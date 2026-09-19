/**
 * ToolVerse UTM & Ad Tracking URL Cleaner Engine
 * High-performance URL sanitization, parameter categorization, deep inspection, and bulk cleaning.
 * Pure TypeScript with zero external dependencies.
 */

export interface CleanerOptions {
  stripUtm?: boolean;
  stripAdClickIds?: boolean;
  stripSocialTracking?: boolean;
  stripEmailCrm?: boolean;
  stripAnalytics?: boolean;
  stripAffiliate?: boolean;
  stripHash?: boolean;
  stripAllQueryParams?: boolean;
  customParamsToRemove?: string[];
  paramsToKeep?: string[];
}

export type TrackerCategory =
  | 'UTM Tag'
  | 'Ad Click ID'
  | 'Social Tracker'
  | 'Email / CRM'
  | 'Web Analytics'
  | 'Affiliate Tag'
  | 'Custom Filter';

export interface ParameterDetail {
  key: string;
  value: string;
  action: 'removed' | 'kept';
  category?: TrackerCategory;
  reason: string;
}

export interface DetailedCleanResult {
  originalUrl: string;
  cleanUrl: string;
  isValidUrl: boolean;
  parametersAnalyzed: ParameterDetail[];
  removedParams: string[];
  keptParams: string[];
  originalLength: number;
  cleanLength: number;
  charactersSaved: number;
  percentSaved: number;
  domain: string;
  path: string;
  hash: string;
}

export interface BulkCleanItem {
  index: number;
  original: string;
  cleaned: string;
  removedCount: number;
  savedChars: number;
  status: 'cleaned' | 'already_clean' | 'invalid';
}

export interface BulkCleanResult {
  totalUrls: number;
  cleanedCount: number;
  alreadyCleanCount: number;
  invalidCount: number;
  totalParamsRemoved: number;
  totalCharactersSaved: number;
  items: BulkCleanItem[];
  allCleanedText: string;
}

// ---------------- TRACKING PARAMETER DICTIONARIES ----------------

export const UTM_PARAM_KEYS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_source_platform',
  'utm_creative_format',
  'utm_marketing_tactic',
  'utm_cid',
  'utm_reader',
  'utm_name',
  'utm_pubreferrer',
  'utm_swu',
  'utm_viz_id',
]);

export const AD_CLICK_PARAM_KEYS = new Set([
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
  's_kwcid',
  'sc_campaign',
  'sc_channel',
  'sc_content',
  'sc_medium',
  'sc_source',
  'sc_country',
  'qclid',
  'li_fat_id',
  'bing_id',
  'ad_id',
  'campaign_id',
  'adset_id',
]);

export const SOCIAL_PARAM_KEYS = new Set([
  'igshid',
  'ref_src',
  'ref_url',
  'share_id',
  'si',
  'epik',
  'cmpid',
  'source_id',
  'fb_action_ids',
  'fb_action_types',
  'fb_source',
  'fb_ref',
  'action_object_map',
  'action_type_map',
  'action_ref_map',
  'feature',
]);

export const EMAIL_CRM_PARAM_KEYS = new Set([
  'mc_cid',
  'mc_eid',
  '_hsenc',
  '_hsmi',
  'hsctatracking',
  'mkt_tok',
  'spreportid',
  'spjobid',
  'vero_id',
  'vero_conv',
  'wickedid',
  'zanpid',
  'ml_subscriber',
  'ml_subscriber_hash',
  'curator_id',
]);

export const ANALYTICS_PARAM_KEYS = new Set([
  '_ga',
  '_gl',
  '_openstat',
  'pk_campaign',
  'pk_kwd',
  'pk_source',
  'pk_medium',
  'pk_content',
  'pk_cid',
  'mtm_campaign',
  'mtm_source',
  'mtm_medium',
  'mtm_kwd',
  'mtm_content',
  'mtm_cid',
  'matomo_campaign',
  'piwik_campaign',
  'at_custom_1',
  'at_custom_2',
]);

export const AFFILIATE_PARAM_KEYS = new Set([
  'ascsubtag',
  'tag',
  'linkcode',
  'aff_fcid',
  'aff_fsk',
  'aff_platform',
  'sk',
  'click_id',
  'subid',
  'sub_id',
  'aff_id',
]);

/**
 * Identify parameter category
 */
export function identifyParamCategory(key: string): TrackerCategory | null {
  const lower = key.toLowerCase();
  if (lower.startsWith('utm_') || UTM_PARAM_KEYS.has(lower)) return 'UTM Tag';
  if (AD_CLICK_PARAM_KEYS.has(lower)) return 'Ad Click ID';
  if (SOCIAL_PARAM_KEYS.has(lower)) return 'Social Tracker';
  if (EMAIL_CRM_PARAM_KEYS.has(lower)) return 'Email / CRM';
  if (ANALYTICS_PARAM_KEYS.has(lower)) return 'Web Analytics';
  if (AFFILIATE_PARAM_KEYS.has(lower)) return 'Affiliate Tag';
  return null;
}

/**
 * Clean and deeply analyze a single URL
 */
export function cleanAndAnalyzeUrl(
  urlStr: string,
  options: CleanerOptions = {}
): DetailedCleanResult {
  const originalLength = urlStr.length;
  let raw = urlStr.trim();

  const stripUtm = options.stripUtm ?? true;
  const stripAdClickIds = options.stripAdClickIds ?? true;
  const stripSocialTracking = options.stripSocialTracking ?? true;
  const stripEmailCrm = options.stripEmailCrm ?? true;
  const stripAnalytics = options.stripAnalytics ?? true;
  const stripAffiliate = options.stripAffiliate ?? false;
  const stripHash = options.stripHash ?? false;
  const stripAllQueryParams = options.stripAllQueryParams ?? false;

  const customSet = new Set(
    (options.customParamsToRemove || []).map((k) => k.trim().toLowerCase()).filter(Boolean)
  );
  const keepSet = new Set(
    (options.paramsToKeep || []).map((k) => k.trim().toLowerCase()).filter(Boolean)
  );

  if (!raw) {
    return {
      originalUrl: '',
      cleanUrl: '',
      isValidUrl: false,
      parametersAnalyzed: [],
      removedParams: [],
      keptParams: [],
      originalLength: 0,
      cleanLength: 0,
      charactersSaved: 0,
      percentSaved: 0,
      domain: '',
      path: '',
      hash: '',
    };
  }

  const hadHttp = /^https?:\/\//i.test(raw);
  if (!hadHttp) {
    raw = 'https://' + raw;
  }

  try {
    const urlObj = new URL(raw);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;
    const hash = urlObj.hash;

    const parametersAnalyzed: ParameterDetail[] = [];
    const removedParams: string[] = [];
    const keptParams: string[] = [];

    // Collect all search params in original order
    const paramEntries: Array<[string, string]> = [];
    urlObj.searchParams.forEach((value, key) => {
      paramEntries.push([key, value]);
    });

    for (const [key, value] of paramEntries) {
      const lowerKey = key.toLowerCase();

      // Check keep whitelist first
      if (keepSet.has(lowerKey)) {
        keptParams.push(key);
        parametersAnalyzed.push({
          key,
          value,
          action: 'kept',
          reason: 'Preserved by whitelist',
        });
        continue;
      }

      // Check Strip All option
      if (stripAllQueryParams) {
        removedParams.push(key);
        parametersAnalyzed.push({
          key,
          value,
          action: 'removed',
          category: 'Custom Filter',
          reason: 'Stripped all query parameters',
        });
        urlObj.searchParams.delete(key);
        continue;
      }

      // Check custom blacklist
      if (customSet.has(lowerKey)) {
        removedParams.push(key);
        parametersAnalyzed.push({
          key,
          value,
          action: 'removed',
          category: 'Custom Filter',
          reason: 'Matched user custom filter',
        });
        urlObj.searchParams.delete(key);
        continue;
      }

      // Categorize and filter
      const category = identifyParamCategory(key);
      let shouldRemove = false;
      let reason = 'Functional parameter';

      if (category === 'UTM Tag' && stripUtm) {
        shouldRemove = true;
        reason = 'Standard UTM campaign tag';
      } else if (category === 'Ad Click ID' && stripAdClickIds) {
        shouldRemove = true;
        reason = 'Ad network click / conversion tracking ID';
      } else if (category === 'Social Tracker' && stripSocialTracking) {
        shouldRemove = true;
        reason = 'Social network referral / share identifier';
      } else if (category === 'Email / CRM' && stripEmailCrm) {
        shouldRemove = true;
        reason = 'Email marketing / CRM campaign token';
      } else if (category === 'Web Analytics' && stripAnalytics) {
        shouldRemove = true;
        reason = 'Analytics session / cross-domain tracker';
      } else if (category === 'Affiliate Tag' && stripAffiliate) {
        shouldRemove = true;
        reason = 'Affiliate / partner referral code';
      }

      if (shouldRemove) {
        removedParams.push(key);
        parametersAnalyzed.push({
          key,
          value,
          action: 'removed',
          category: category || 'Custom Filter',
          reason,
        });
        urlObj.searchParams.delete(key);
      } else {
        keptParams.push(key);
        parametersAnalyzed.push({
          key,
          value,
          action: 'kept',
          category: category || undefined,
          reason,
        });
      }
    }

    // Strip hash fragment if requested
    if (stripHash) {
      urlObj.hash = '';
    }

    let clean = urlObj.toString();
    if (!hadHttp && clean.startsWith('https://')) {
      clean = clean.replace('https://', '');
    }

    const cleanLength = clean.length;
    const charactersSaved = Math.max(0, originalLength - cleanLength);
    const percentSaved = originalLength > 0 ? Math.round((charactersSaved / originalLength) * 100) : 0;

    return {
      originalUrl: urlStr,
      cleanUrl: clean,
      isValidUrl: true,
      parametersAnalyzed,
      removedParams,
      keptParams,
      originalLength,
      cleanLength,
      charactersSaved,
      percentSaved,
      domain,
      path,
      hash,
    };
  } catch {
    return {
      originalUrl: urlStr,
      cleanUrl: urlStr,
      isValidUrl: false,
      parametersAnalyzed: [],
      removedParams: [],
      keptParams: [],
      originalLength,
      cleanLength: originalLength,
      charactersSaved: 0,
      percentSaved: 0,
      domain: '',
      path: '',
      hash: '',
    };
  }
}

/**
 * Bulk Clean Multi-Line URLs
 */
export function cleanBulkUrls(
  text: string,
  options: CleanerOptions = {}
): BulkCleanResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let cleanedCount = 0;
  let alreadyCleanCount = 0;
  let invalidCount = 0;
  let totalParamsRemoved = 0;
  let totalCharactersSaved = 0;

  const items: BulkCleanItem[] = lines.map((line, index) => {
    const res = cleanAndAnalyzeUrl(line, options);
    if (!res.isValidUrl) {
      invalidCount++;
      return {
        index: index + 1,
        original: line,
        cleaned: line,
        removedCount: 0,
        savedChars: 0,
        status: 'invalid',
      };
    }

    totalParamsRemoved += res.removedParams.length;
    totalCharactersSaved += res.charactersSaved;

    if (res.removedParams.length > 0 || (options.stripHash && res.charactersSaved > 0)) {
      cleanedCount++;
      return {
        index: index + 1,
        original: line,
        cleaned: res.cleanUrl,
        removedCount: res.removedParams.length,
        savedChars: res.charactersSaved,
        status: 'cleaned',
      };
    } else {
      alreadyCleanCount++;
      return {
        index: index + 1,
        original: line,
        cleaned: res.cleanUrl,
        removedCount: 0,
        savedChars: 0,
        status: 'already_clean',
      };
    }
  });

  const allCleanedText = items.map((i) => i.cleaned).join('\n');

  return {
    totalUrls: lines.length,
    cleanedCount,
    alreadyCleanCount,
    invalidCount,
    totalParamsRemoved,
    totalCharactersSaved,
    items,
    allCleanedText,
  };
}

// ---------------- PRESETS & SAMPLE LINKS ----------------

export const CLEANER_PRESETS = [
  {
    id: 'facebook_ad',
    label: 'Facebook Ad & Pixel Link',
    description: 'URL with fbclid, utm_source, utm_medium, utm_campaign, and product ID',
    url: 'https://store.example.com/products/wireless-headphones?id=8841&color=black&utm_source=facebook&utm_medium=paid-social&utm_campaign=black-friday-2025&fbclid=IwAR12XyZ_aBcDeFgHiJkLmNoPqRsTuVwXyZ12345#customer-reviews',
  },
  {
    id: 'google_search_ad',
    label: 'Google Ads & Gclid Search',
    description: 'URL with Google Ads click ID (gclid), gbraid, and keyword term tracking',
    url: 'https://saas.example.io/pricing?plan=team&billing=annual&utm_source=google&utm_medium=cpc&utm_campaign=search-brand-tier1&utm_term=saas+micro+tools&gclid=CjwKCAiA_SAMPLE_GCLID_1234567890abcdef&gbraid=0AAAAAD_TEST_GBRAID_98765',
  },
  {
    id: 'mailchimp_newsletter',
    label: 'Newsletter Email Click',
    description: 'Email newsletter click with Mailchimp mc_cid, mc_eid, and HubSpot tracking',
    url: 'https://blog.example.org/articles/database-indexing-guide?utm_source=newsletter&utm_medium=email&utm_campaign=weekly-digest-issue-42&utm_content=hero-cta&mc_cid=a1b2c3d4e5&mc_eid=f6g7h8i9j0&_hsenc=p2ANqtz-_sample_hsenc&_hsmi=12345678',
  },
  {
    id: 'social_share',
    label: 'Instagram & TikTok Share',
    description: 'Mobile social media share link with igshid and ttclid',
    url: 'https://news.example.com/story/tech-breakthrough-2025?category=science&igshid=YmMyMTA2M2Y=&ttclid=E_AB_123456789_SampleTikTokClickID',
  },
  {
    id: 'mixed_bulk',
    label: 'Bulk Batch (5 URLs)',
    description: '5 mixed marketing links to test multi-line batch cleaning',
    url: `https://example.com/page-1?id=101&utm_source=google&utm_medium=cpc&gclid=123
https://example.com/page-2?user=admin&utm_source=facebook&fbclid=456#top
https://example.com/page-3?article=news&mc_cid=789&mc_eid=abc
https://example.com/page-4?lang=en&igshid=xyz123&twclid=tweet99
https://example.com/already-clean-page?category=gadgets&page=2`,
  },
];

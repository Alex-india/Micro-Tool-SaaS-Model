/**
 * ToolVerse IP Address & Subnet Engine
 * Implements IPv4/IPv6 validation, classification (RFC 1918, Loopback, Link-Local, CGNAT),
 * CIDR subnet calculation, and curated offline fallback geolocation intelligence.
 * Pure TypeScript with zero external dependencies.
 */

export type IpVersion = 'IPv4' | 'IPv6';
export type IpClassification =
  | 'public'
  | 'private'
  | 'loopback'
  | 'link_local'
  | 'cgnat'
  | 'multicast'
  | 'reserved';

export interface SubnetCalculation {
  ip: string;
  prefix: number;
  netmask: string;
  wildcardMask: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableHost: string;
  lastUsableHost: string;
  totalHosts: number;
  usableHosts: number;
  ipClass: 'A' | 'B' | 'C' | 'D' | 'E';
  binaryNetmask: string;
}

export interface IpLookupResult {
  query: string;
  ip: string;
  type: IpVersion;
  classification: IpClassification;
  classificationName: string;
  isRoutable: boolean;
  hostname?: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  region: string;
  regionCode?: string;
  city: string;
  postal?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  org: string;
  asn?: string;
  asName?: string;
  isDatacenter: boolean;
  subnet?: SubnetCalculation;
}

// ---------------- VALIDATION HELPERS ----------------

export const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export const IPV6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

export function isValidIpv4(ip: string): boolean {
  return IPV4_REGEX.test((ip || '').trim());
}

export function isValidIpv6(ip: string): boolean {
  return IPV6_REGEX.test((ip || '').trim());
}

export function isValidIp(ip: string): boolean {
  return isValidIpv4(ip) || isValidIpv6(ip);
}

/**
 * Classifies an IP into public, private, loopback, link-local, etc.
 */
export function classifyIp(ip: string): { classification: IpClassification; name: string; isRoutable: boolean } {
  const clean = (ip || '').trim();

  if (isValidIpv4(clean)) {
    const parts = clean.split('.').map(Number);
    const [p0, p1] = parts;

    // Loopback: 127.0.0.0/8
    if (p0 === 127) {
      return { classification: 'loopback', name: 'Loopback Host (127.0.0.0/8)', isRoutable: false };
    }

    // RFC 1918 Private ranges:
    // 10.0.0.0/8
    if (p0 === 10) {
      return { classification: 'private', name: 'Private Network (RFC 1918 10.0.0.0/8)', isRoutable: false };
    }
    // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    if (p0 === 172 && p1 >= 16 && p1 <= 31) {
      return { classification: 'private', name: 'Private Network (RFC 1918 172.16.0.0/12)', isRoutable: false };
    }
    // 192.168.0.0/16
    if (p0 === 192 && p1 === 168) {
      return { classification: 'private', name: 'Private Network (RFC 1918 192.168.0.0/16)', isRoutable: false };
    }

    // Link-Local: 169.254.0.0/16
    if (p0 === 169 && p1 === 254) {
      return { classification: 'link_local', name: 'Link-Local / APIPA (169.254.0.0/16)', isRoutable: false };
    }

    // CGNAT: 100.64.0.0/10 (100.64.0.0 - 100.127.255.255)
    if (p0 === 100 && p1 >= 64 && p1 <= 127) {
      return { classification: 'cgnat', name: 'Carrier-Grade NAT (RFC 6598)', isRoutable: false };
    }

    // Multicast: 224.0.0.0/4
    if (p0 >= 224 && p0 <= 239) {
      return { classification: 'multicast', name: 'Multicast Group (224.0.0.0/4)', isRoutable: false };
    }

    // Reserved / Future: 0.0.0.0/8 or 240.0.0.0/4
    if (p0 === 0 || p0 >= 240) {
      return { classification: 'reserved', name: 'Reserved / Unusable (RFC 1112)', isRoutable: false };
    }

    return { classification: 'public', name: 'Public Internet (Global IPv4)', isRoutable: true };
  }

  if (isValidIpv6(clean)) {
    const lower = clean.toLowerCase();
    if (lower === '::1') {
      return { classification: 'loopback', name: 'IPv6 Loopback (::1)', isRoutable: false };
    }
    if (lower.startsWith('fe80:')) {
      return { classification: 'link_local', name: 'IPv6 Link-Local (fe80::/10)', isRoutable: false };
    }
    if (lower.startsWith('fc') || lower.startsWith('fd')) {
      return { classification: 'private', name: 'IPv6 Unique Local Address (fc00::/7)', isRoutable: false };
    }
    if (lower.startsWith('ff')) {
      return { classification: 'multicast', name: 'IPv6 Multicast (ff00::/8)', isRoutable: false };
    }

    return { classification: 'public', name: 'Public Internet (Global IPv6)', isRoutable: true };
  }

  return { classification: 'reserved', name: 'Unknown / Invalid', isRoutable: false };
}

// ---------------- CIDR / SUBNET CALCULATOR ----------------

/**
 * Calculates complete IPv4 subnet details from an IP and prefix length (0-32)
 */
export function calculateSubnetDetails(ip: string, prefix = 24): SubnetCalculation {
  const safePrefix = Math.max(0, Math.min(32, Math.floor(prefix)));
  const cleanIp = isValidIpv4(ip) ? ip.trim() : '192.168.1.0';

  const ipInt = ipv4ToInt(cleanIp);
  const maskInt = safePrefix === 0 ? 0 : (~0 << (32 - safePrefix)) >>> 0;
  const wildcardInt = (~maskInt) >>> 0;

  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const netmask = intToIpv4(maskInt);
  const wildcardMask = intToIpv4(wildcardInt);
  const networkAddress = intToIpv4(networkInt);
  const broadcastAddress = intToIpv4(broadcastInt);

  let totalHosts = Math.pow(2, 32 - safePrefix);
  let usableHosts = 0;
  let firstUsableHost = networkAddress;
  let lastUsableHost = broadcastAddress;

  if (safePrefix === 32) {
    totalHosts = 1;
    usableHosts = 1;
    firstUsableHost = networkAddress;
    lastUsableHost = networkAddress;
  } else if (safePrefix === 31) {
    // RFC 3021 point-to-point links
    totalHosts = 2;
    usableHosts = 2;
    firstUsableHost = networkAddress;
    lastUsableHost = broadcastAddress;
  } else {
    usableHosts = Math.max(0, totalHosts - 2);
    firstUsableHost = intToIpv4((networkInt + 1) >>> 0);
    lastUsableHost = intToIpv4((broadcastInt - 1) >>> 0);
  }

  // Class detection
  const firstOctet = Number(cleanIp.split('.')[0]);
  let ipClass: 'A' | 'B' | 'C' | 'D' | 'E' = 'C';
  if (firstOctet <= 126) ipClass = 'A';
  else if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'B';
  else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'C';
  else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'D';
  else ipClass = 'E';

  const binaryNetmask = maskInt
    .toString(2)
    .padStart(32, '0')
    .match(/.{1,8}/g)!
    .join('.');

  return {
    ip: cleanIp,
    prefix: safePrefix,
    netmask,
    wildcardMask,
    networkAddress,
    broadcastAddress,
    firstUsableHost,
    lastUsableHost,
    totalHosts,
    usableHosts,
    ipClass,
    binaryNetmask,
  };
}

function ipv4ToInt(ip: string): number {
  return (
    ip
      .split('.')
      .reduce((acc, octet) => ((acc << 8) + Number(octet)) >>> 0, 0) >>> 0
  );
}

function intToIpv4(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join('.');
}

// ---------------- FALLBACK GEOIP / STATIC DATABASE ----------------

export const WELL_KNOWN_IP_DB: Record<string, Partial<IpLookupResult>> = {
  '8.8.8.8': {
    country: 'United States',
    countryCode: 'US',
    flagEmoji: '🇺🇸',
    region: 'California',
    regionCode: 'CA',
    city: 'Mountain View',
    postal: '94043',
    latitude: 37.4223,
    longitude: -122.0848,
    timezone: 'America/Los_Angeles',
    isp: 'Google LLC',
    org: 'Google Public DNS',
    asn: 'AS15169',
    asName: 'GOOGLE',
    hostname: 'dns.google',
    isDatacenter: true,
  },
  '8.8.4.4': {
    country: 'United States',
    countryCode: 'US',
    flagEmoji: '🇺🇸',
    region: 'California',
    regionCode: 'CA',
    city: 'Mountain View',
    postal: '94043',
    latitude: 37.4223,
    longitude: -122.0848,
    timezone: 'America/Los_Angeles',
    isp: 'Google LLC',
    org: 'Google Public DNS',
    asn: 'AS15169',
    asName: 'GOOGLE',
    hostname: 'dns.google',
    isDatacenter: true,
  },
  '1.1.1.1': {
    country: 'Australia',
    countryCode: 'AU',
    flagEmoji: '🇦🇺',
    region: 'Queensland',
    regionCode: 'QLD',
    city: 'South Brisbane',
    postal: '4101',
    latitude: -27.4766,
    longitude: 153.0166,
    timezone: 'Australia/Brisbane',
    isp: 'Cloudflare, Inc.',
    org: 'APNIC and Cloudflare Anycast',
    asn: 'AS13335',
    asName: 'CLOUDFLARENET',
    hostname: 'one.one.one.one',
    isDatacenter: true,
  },
  '1.0.0.1': {
    country: 'Australia',
    countryCode: 'AU',
    flagEmoji: '🇦🇺',
    region: 'Queensland',
    regionCode: 'QLD',
    city: 'South Brisbane',
    postal: '4101',
    latitude: -27.4766,
    longitude: 153.0166,
    timezone: 'Australia/Brisbane',
    isp: 'Cloudflare, Inc.',
    org: 'APNIC and Cloudflare Anycast',
    asn: 'AS13335',
    asName: 'CLOUDFLARENET',
    hostname: 'one.one.one.one',
    isDatacenter: true,
  },
  '208.67.222.222': {
    country: 'United States',
    countryCode: 'US',
    flagEmoji: '🇺🇸',
    region: 'California',
    regionCode: 'CA',
    city: 'San Francisco',
    postal: '94107',
    latitude: 37.7697,
    longitude: -122.3933,
    timezone: 'America/Los_Angeles',
    isp: 'Cisco OpenDNS LLC',
    org: 'OpenDNS Anycast',
    asn: 'AS36692',
    asName: 'OPENDNS',
    hostname: 'resolver1.opendns.com',
    isDatacenter: true,
  },
  '9.9.9.9': {
    country: 'Switzerland',
    countryCode: 'CH',
    flagEmoji: '🇨🇭',
    region: 'Zurich',
    regionCode: 'ZH',
    city: 'Zurich',
    postal: '8001',
    latitude: 47.3769,
    longitude: 8.5417,
    timezone: 'Europe/Zurich',
    isp: 'Quad9',
    org: 'Quad9 Foundation',
    asn: 'AS19281',
    asName: 'QUAD9-AS-1',
    hostname: 'dns9.quad9.net',
    isDatacenter: true,
  },
  '2001:4860:4860::8888': {
    country: 'United States',
    countryCode: 'US',
    flagEmoji: '🇺🇸',
    region: 'California',
    regionCode: 'CA',
    city: 'Mountain View',
    postal: '94043',
    latitude: 37.4223,
    longitude: -122.0848,
    timezone: 'America/Los_Angeles',
    isp: 'Google LLC',
    org: 'Google Public DNS IPv6',
    asn: 'AS15169',
    asName: 'GOOGLE',
    hostname: 'dns.google',
    isDatacenter: true,
  },
};

/**
 * Generates flag emoji from 2-letter ISO country code
 */
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// ---------------- CURATED PRESETS ----------------

export const IP_PRESETS = [
  {
    id: 'google_dns',
    name: 'Google Public DNS (8.8.8.8)',
    ip: '8.8.8.8',
    description: 'Google Anycast DNS server in Mountain View, CA (AS15169)',
    expectedType: 'IPv4' as const,
  },
  {
    id: 'cloudflare_dns',
    name: 'Cloudflare Public DNS (1.1.1.1)',
    ip: '1.1.1.1',
    description: 'Fastest public DNS resolver run by Cloudflare & APNIC (AS13335)',
    expectedType: 'IPv4' as const,
  },
  {
    id: 'cisco_opendns',
    name: 'Cisco OpenDNS (208.67.222.222)',
    ip: '208.67.222.222',
    description: 'Cisco Umbrella secure enterprise recursive resolver (AS36692)',
    expectedType: 'IPv4' as const,
  },
  {
    id: 'quad9_dns',
    name: 'Quad9 Privacy DNS (9.9.9.9)',
    ip: '9.9.9.9',
    description: 'Swiss non-profit privacy & threat-blocking DNS (AS19281)',
    expectedType: 'IPv4' as const,
  },
  {
    id: 'google_ipv6',
    name: 'Google IPv6 DNS (2001:4860:4860::8888)',
    ip: '2001:4860:4860::8888',
    description: 'Google Public DNS native IPv6 recursive endpoint',
    expectedType: 'IPv6' as const,
  },
  {
    id: 'private_router',
    name: 'Private Router Gateway (192.168.1.1)',
    ip: '192.168.1.1',
    description: 'RFC 1918 private home router gateway (Non-routable over public internet)',
    expectedType: 'IPv4' as const,
  },
];

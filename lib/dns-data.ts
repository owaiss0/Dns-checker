export type DnsProvider = {
  id: string;
  name: string;
  ips: string;
  endpoint: string;
  category: string;
  notes: string;
  sourceUrl?: string;
  isCustom?: boolean;
  dnssec?: boolean;
  ecs?: boolean;
  logging?: string;
  owner?: string;
};

export type TestDomain = {
  domain: string;
  label: string;
};

export type DnsProbe = {
  domain: string;
  latency: number | null;
  ok: boolean;
  detail: string;
};

export type DnsResult = {
  provider: DnsProvider;
  probes: DnsProbe[];
  average: number | null;
  fastest: number | null;
  successRate: number;
  score: number;
};

export const dnsProviders: DnsProvider[] = [
  {
    id: "cloudflare",
    name: "Cloudflare",
    ips: "1.1.1.1, 1.0.0.1",
    endpoint: "https://cloudflare-dns.com/dns-query",
    category: "Speed",
    notes: "Global anycast resolver.",
    sourceUrl: "https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/",
    dnssec: true,
    ecs: false,
    logging: "Deleted after 24h",
    owner: "Cloudflare, Inc.",
  },
  {
    id: "cloudflare-security",
    name: "Cloudflare Security",
    ips: "1.1.1.2, 1.0.0.2",
    endpoint: "https://security.cloudflare-dns.com/dns-query",
    category: "Malware blocking",
    notes: "Cloudflare with malware filtering.",
    sourceUrl: "https://developers.cloudflare.com/1.1.1.1/setup/",
    dnssec: true,
    ecs: false,
    logging: "Deleted after 24h",
    owner: "Cloudflare, Inc.",
  },
  {
    id: "cloudflare-family",
    name: "Cloudflare Family",
    ips: "1.1.1.3, 1.0.0.3",
    endpoint: "https://family.cloudflare-dns.com/dns-query",
    category: "Family filter",
    notes: "Cloudflare with adult-content and malware filtering.",
    sourceUrl: "https://developers.cloudflare.com/1.1.1.1/setup/",
    dnssec: true,
    ecs: false,
    logging: "Deleted after 24h",
    owner: "Cloudflare, Inc.",
  },
  {
    id: "google",
    name: "Google Public DNS",
    ips: "8.8.8.8, 8.8.4.4",
    endpoint: "https://dns.google/dns-query",
    category: "Reliability",
    notes: "Large global public DNS network.",
    sourceUrl: "https://developers.google.com/speed/public-dns/docs/doh",
    dnssec: true,
    ecs: true,
    logging: "Temporary (24-48h)",
    owner: "Google LLC",
  },
  {
    id: "adguard-default",
    name: "AdGuard DNS",
    ips: "94.140.14.14, 94.140.15.15",
    endpoint: "https://dns.adguard-dns.com/dns-query",
    category: "Ads blocking",
    notes: "Blocks ads, trackers, and malicious domains.",
    sourceUrl: "https://adguard-dns.io/en/setup.html",
    dnssec: true,
    ecs: false,
    logging: "No Logs",
    owner: "AdGuard Software Ltd",
  },
  {
    id: "adguard-unfiltered",
    name: "AdGuard Unfiltered",
    ips: "94.140.14.140, 94.140.14.141",
    endpoint: "https://unfiltered.adguard-dns.com/dns-query",
    category: "Unfiltered",
    notes: "AdGuard resolver without filtering.",
    sourceUrl: "https://adguard-dns.io/en/setup.html",
    dnssec: true,
    ecs: false,
    logging: "No Logs",
    owner: "AdGuard Software Ltd",
  },
  {
    id: "adguard-family",
    name: "AdGuard Family",
    ips: "94.140.14.15, 94.140.15.16",
    endpoint: "https://family.adguard-dns.com/dns-query",
    category: "Family filter",
    notes: "Blocks adult content and enables safe search.",
    sourceUrl: "https://adguard-dns.io/en/setup.html",
    dnssec: true,
    ecs: false,
    logging: "No Logs",
    owner: "AdGuard Software Ltd",
  },
  {
    id: "controld-unfiltered",
    name: "Control D Free",
    ips: "76.76.2.0, 76.76.10.0",
    endpoint: "https://freedns.controld.com/p0",
    category: "Unfiltered",
    notes: "Free Control D resolver profile.",
    sourceUrl: "https://controld.com/free-dns",
    dnssec: true,
    ecs: false,
    logging: "No Logs",
    owner: "Windscribe Limited",
  },
  {
    id: "controld-malware",
    name: "Control D Malware",
    ips: "76.76.2.1, 76.76.10.1",
    endpoint: "https://freedns.controld.com/p1",
    category: "Malware blocking",
    notes: "Control D malware blocking profile.",
    sourceUrl: "https://controld.com/free-dns",
    dnssec: true,
    ecs: false,
    logging: "No Logs",
    owner: "Windscribe Limited",
  },
  {
    id: "controld-ads",
    name: "Control D Ads",
    ips: "76.76.2.2, 76.76.10.2",
    endpoint: "https://freedns.controld.com/p2",
    category: "Ads blocking",
    notes: "Control D ads and tracking blocking profile.",
    sourceUrl: "https://controld.com/free-dns",
    dnssec: true,
    ecs: false,
    logging: "No Logs",
    owner: "Windscribe Limited",
  },
  {
    id: "controld-family",
    name: "Control D Family",
    ips: "76.76.2.4, 76.76.10.4",
    endpoint: "https://freedns.controld.com/family",
    category: "Family filter",
    notes: "Control D family-safe profile.",
    sourceUrl: "https://controld.com/free-dns",
    dnssec: true,
    ecs: false,
    logging: "No Logs",
    owner: "Windscribe Limited",
  },
  {
    id: "controld-social",
    name: "Control D Social",
    ips: "76.76.2.3, 76.76.10.3",
    endpoint: "https://freedns.controld.com/p3",
    category: "Social blocking",
    notes: "Control D profile for social media blocking.",
    sourceUrl: "https://controld.com/free-dns",
    dnssec: true,
    ecs: false,
    logging: "No Logs",
    owner: "Windscribe Limited",
  },
  {
    id: "controld-uncensored",
    name: "Control D Uncensored",
    ips: "76.76.2.5, 76.76.10.5",
    endpoint: "https://freedns.controld.com/uncensored",
    category: "Unfiltered",
    notes: "Control D uncensored resolver profile.",
    sourceUrl: "https://controld.com/free-dns",
    dnssec: true,
    ecs: false,
    logging: "No Logs",
    owner: "Windscribe Limited",
  },
  {
    id: "cleanbrowsing-security",
    name: "CleanBrowsing Security",
    ips: "185.228.168.9, 185.228.169.9",
    endpoint: "https://doh.cleanbrowsing.org/doh/security-filter/",
    category: "Security",
    notes: "Blocks phishing and malicious domains.",
    sourceUrl: "https://cleanbrowsing.org/setup/",
    dnssec: true,
    ecs: false,
    logging: "No Logs",
    owner: "CleanBrowsing Inc.",
  },
  {
    id: "cleanbrowsing-adult",
    name: "CleanBrowsing Adult",
    ips: "185.228.168.10, 185.228.169.11",
    endpoint: "https://doh.cleanbrowsing.org/doh/adult-filter/",
    category: "Adult filter",
    notes: "Blocks adult content and malicious domains.",
    sourceUrl: "https://cleanbrowsing.org/setup/",
    dnssec: true,
    ecs: false,
    logging: "No Logs",
    owner: "CleanBrowsing Inc.",
  },
  {
    id: "cleanbrowsing-family",
    name: "CleanBrowsing Family",
    ips: "185.228.168.168, 185.228.169.168",
    endpoint: "https://doh.cleanbrowsing.org/doh/family-filter/",
    category: "Family filter",
    notes: "Family-safe filtering profile.",
    sourceUrl: "https://cleanbrowsing.org/setup/",
    dnssec: true,
    ecs: false,
    logging: "No Logs",
    owner: "CleanBrowsing Inc.",
  },
  {
    id: "opendns",
    name: "OpenDNS",
    ips: "208.67.222.222, 208.67.220.220",
    endpoint: "https://doh.opendns.com/dns-query",
    category: "Reliability",
    notes: "Cisco OpenDNS public resolver.",
    sourceUrl: "https://www.opendns.com/setupguide/",
    dnssec: true,
    ecs: true,
    logging: "Temporary Logs",
    owner: "Cisco Systems, Inc.",
  },
  {
    id: "opendns-familyshield",
    name: "OpenDNS FamilyShield",
    ips: "208.67.222.123, 208.67.220.123",
    endpoint: "https://doh.familyshield.opendns.com/dns-query",
    category: "Family filter",
    notes: "Cisco OpenDNS resolver with adult-content filtering.",
    sourceUrl: "https://www.opendns.com/setupguide/",
    dnssec: true,
    ecs: true,
    logging: "Temporary Logs",
    owner: "Cisco Systems, Inc.",
  },
  {
    id: "dns-sb",
    name: "DNS.SB",
    ips: "185.222.222.222, 45.11.45.11",
    endpoint: "https://doh.dns.sb/dns-query",
    category: "Privacy",
    notes: "Public privacy-focused DNS resolver.",
    sourceUrl: "https://dns.sb/guide/",
    dnssec: true,
    ecs: false,
    logging: "No Logs",
    owner: "SB Technologies",
  },
  {
    id: "dnsforge",
    name: "DNSforge",
    ips: "176.9.93.198, 176.9.1.117",
    endpoint: "https://dnsforge.de/dns-query",
    category: "Ads blocking",
    notes: "German public resolver with ad and tracking protection.",
    sourceUrl: "https://dnsforge.de/",
    dnssec: true,
    ecs: false,
    logging: "No Logs",
    owner: "Community Run (de)",
  },
];

export const topWebsites: TestDomain[] = [
  { label: "Google", domain: "google.com" },
  { label: "YouTube", domain: "youtube.com" },
  { label: "Facebook", domain: "facebook.com" },
  { label: "Instagram", domain: "instagram.com" },
  { label: "X", domain: "x.com" },
  { label: "Wikipedia", domain: "wikipedia.org" },
  { label: "Amazon", domain: "amazon.com" },
  { label: "Reddit", domain: "reddit.com" },
  { label: "Netflix", domain: "netflix.com" },
  { label: "Microsoft", domain: "microsoft.com" },
  { label: "Apple", domain: "apple.com" },
  { label: "TikTok", domain: "tiktok.com" },
  { label: "LinkedIn", domain: "linkedin.com" },
  { label: "WhatsApp", domain: "whatsapp.com" },
  { label: "Discord", domain: "discord.com" },
  { label: "Twitch", domain: "twitch.tv" },
  { label: "GitHub", domain: "github.com" },
  { label: "Stack Overflow", domain: "stackoverflow.com" },
  { label: "ChatGPT", domain: "chatgpt.com" },
  { label: "Office", domain: "office.com" },
];

export function normalizeDomain(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    .replace(/:\d+$/, "")
    .replace(/\.$/, "")
    .toLowerCase();
}

export function isValidDomain(domain: string) {
  if (domain.length < 1 || domain.length > 253) {
    return false;
  }

  return domain.split(".").every((label) => {
    return (
      label.length > 0 &&
      label.length <= 63 &&
      /^[a-z0-9-]+$/.test(label) &&
      !label.startsWith("-") &&
      !label.endsWith("-")
    );
  });
}

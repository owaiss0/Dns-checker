import { benchmarkProvider } from "@/lib/dns-probe";
import { dnsProviders, isValidDomain, normalizeDomain, topWebsites, type DnsProvider } from "@/lib/dns-data";

export const dynamic = "force-dynamic";

type BenchmarkBody = {
  domains?: unknown;
  customProviders?: unknown;
};

export async function POST(request: Request) {
  let body: BenchmarkBody;

  try {
    body = (await request.json()) as BenchmarkBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const requestedDomains = Array.isArray(body.domains) ? body.domains : [];
  const domains = Array.from(
    new Set(
      requestedDomains
        .filter((domain): domain is string => typeof domain === "string")
        .map(normalizeDomain)
        .filter(isValidDomain),
    ),
  ).slice(0, topWebsites.length);

  if (!domains.length) {
    return Response.json({ error: "Choose at least one valid domain to test." }, { status: 400 });
  }

  const rawCustom = Array.isArray(body.customProviders) ? body.customProviders : [];
  const validCustomProviders: DnsProvider[] = rawCustom
    .filter((p): p is Record<string, unknown> => p !== null && typeof p === "object" && !Array.isArray(p))
    .flatMap((p) => {
      const name = typeof p.name === "string" ? p.name.trim() : "";
      const endpoint = typeof p.endpoint === "string" ? p.endpoint.trim() : "";
      const ips = typeof p.ips === "string" ? p.ips.trim() : "";

      if (!name || !endpoint.startsWith("https://")) {
        return [];
      }

      return [{
        id: typeof p.id === "string" && p.id ? p.id.trim() : `custom-${Math.random().toString(36).substring(2, 9)}`,
        name: name.substring(0, 50),
        endpoint: endpoint,
        ips: ips ? ips.substring(0, 100) : "Custom DoH Resolver",
        category: typeof p.category === "string" && p.category ? p.category.trim().substring(0, 30) : "Custom",
        notes: typeof p.notes === "string" && p.notes ? p.notes.trim().substring(0, 200) : "Self-hosted or custom DoH provider.",
        isCustom: true,
      }];
    });

  const allProviders = [...dnsProviders, ...validCustomProviders];

  try {
    const results = await Promise.all(allProviders.map((provider) => benchmarkProvider(provider, domains)));
    results.sort((left, right) => left.score - right.score);

    return Response.json({
      testedAt: new Date().toISOString(),
      testedDomains: domains,
      results,
    });
  } catch {
    return Response.json({ error: "Failed running benchmark on server." }, { status: 500 });
  }
}

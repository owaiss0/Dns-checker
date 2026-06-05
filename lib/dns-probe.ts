import type { DnsProbe, DnsProvider, DnsResult } from "@/lib/dns-data";

function makeDnsQuery(domain: string, id: number) {
  const labels = domain.split(".");
  const questionLength = labels.reduce((total, label) => total + 1 + label.length, 1);
  const packet = new Uint8Array(12 + questionLength + 4);
  const view = new DataView(packet.buffer);

  view.setUint16(0, id);
  view.setUint16(2, 0x0100);
  view.setUint16(4, 1);

  let offset = 12;
  for (const label of labels) {
    packet[offset] = label.length;
    offset += 1;
    for (let index = 0; index < label.length; index += 1) {
      packet[offset] = label.charCodeAt(index);
      offset += 1;
    }
  }

  packet[offset] = 0;
  offset += 1;
  view.setUint16(offset, 1);
  offset += 2;
  view.setUint16(offset, 1);

  return packet;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function parseDnsResponse(buffer: ArrayBuffer, expectedId: number) {
  if (buffer.byteLength < 12) {
    return { ok: false, detail: "Short DNS response" };
  }

  const view = new DataView(buffer);
  const id = view.getUint16(0);
  const flags = view.getUint16(2);
  const answerCount = view.getUint16(6);
  const rcode = flags & 0x000f;

  if (id !== expectedId) {
    return { ok: false, detail: "Mismatched DNS response" };
  }

  if (rcode !== 0) {
    return { ok: false, detail: `DNS error code ${rcode}` };
  }

  if (answerCount < 1) {
    return { ok: false, detail: "No A record answer" };
  }

  return { ok: true, detail: `${answerCount} answer${answerCount === 1 ? "" : "s"}` };
}

async function probeOnce(provider: DnsProvider, domain: string): Promise<DnsProbe> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const id = Math.floor(Math.random() * 65535);
  const url = `${provider.endpoint}?dns=${toBase64Url(makeDnsQuery(domain, id))}`;
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      headers: { accept: "application/dns-message" },
      cache: "no-store",
      signal: controller.signal,
    });
    const latency = Math.round(performance.now() - startedAt);

    if (!response.ok) {
      return { domain, latency, ok: false, detail: `HTTP ${response.status}` };
    }

    const parsed = parseDnsResponse(await response.arrayBuffer(), id);
    return { domain, latency, ...parsed };
  } catch (error) {
    return {
      domain,
      latency: null,
      ok: false,
      detail: error instanceof Error && error.name === "AbortError" ? "Timed out" : "Unreachable",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function shouldRetry(probe: DnsProbe) {
  return !probe.ok && (probe.latency === null || probe.detail.startsWith("HTTP 5"));
}

async function probeProvider(provider: DnsProvider, domain: string): Promise<DnsProbe> {
  const first = await probeOnce(provider, domain);

  if (!shouldRetry(first)) {
    return first;
  }

  const second = await probeOnce(provider, domain);
  return second.ok ? { ...second, detail: `${second.detail} after retry` } : second;
}

export async function benchmarkProvider(provider: DnsProvider, domains: string[]): Promise<DnsResult> {
  const probes = await Promise.all(domains.map((domain) => probeProvider(provider, domain)));
  const successful = probes.filter((probe) => probe.ok && probe.latency !== null);
  const latencies = successful.map((probe) => probe.latency as number);
  const average = latencies.length
    ? Math.round(latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length)
    : null;
  const fastest = latencies.length ? Math.min(...latencies) : null;
  const successRate = Math.round((successful.length / probes.length) * 100);
  const spread = latencies.length > 1 ? Math.max(...latencies) - Math.min(...latencies) : 0;
  const score = average === null ? Number.MAX_SAFE_INTEGER : average + spread * 0.15 + (100 - successRate) * 20;

  return { provider, probes, average, fastest, successRate, score };
}

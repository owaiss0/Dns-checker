"use client";

import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Gauge,
  Info,
  ListChecks,
  Loader2,
  Network,
  Play,
  ShieldCheck,
  Trophy,
  Trash2,
  Share2,
  Globe,
  Server,
  Plus,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dnsProviders, isValidDomain, normalizeDomain, topWebsites, type DnsProvider, type DnsResult } from "@/lib/dns-data";
import { benchmarkProvider } from "@/lib/dns-probe";
import { DnsCharts } from "@/components/dns-charts";
import { cn } from "@/lib/utils";

type BenchmarkResponse = {
  testedAt: string;
  testedDomains: string[];
  results: DnsResult[];
  testMode?: "server" | "browser";
};

function formatLatency(value: number | null) {
  return value === null ? "Failed" : `${value} ms`;
}

function successVariant(successRate: number) {
  if (successRate === 100) {
    return "default";
  }

  if (successRate >= 80) {
    return "secondary";
  }

  return "destructive";
}

function getIpv4Addresses(ips: string) {
  return ips.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) ?? [];
}

function getStatusText(result: DnsResult) {
  if (result.successRate === 100 && result.average !== null) {
    return "Excellent";
  }

  if (result.successRate >= 80 && result.average !== null) {
    return "Good";
  }

  if (result.successRate > 0) {
    return "Partial";
  }

  return "Failed";
}

function makeReportText(benchmark: BenchmarkResponse) {
  return [
    `DNS Test Report - ${new Date(benchmark.testedAt).toLocaleString()}`,
    `Testing Mode: ${benchmark.testMode === "browser" ? "Browser (Client-side)" : "Server-side"}`,
    `Websites tested: ${benchmark.testedDomains.join(", ")}`,
    "",
    ...benchmark.results.map((result, index) => {
      const ipv4 = getIpv4Addresses(result.provider.ips);
      return [
        `${index + 1}. ${result.provider.name} ${result.provider.isCustom ? "(Custom)" : ""}`,
        `Category: ${result.provider.category}`,
        `Operator/Owner: ${result.provider.owner || "Unknown"}`,
        `DNSSEC Support: ${result.provider.dnssec ? "Yes" : "No"}`,
        `ECS Support: ${result.provider.ecs ? "Yes" : "No"}`,
        `Logging Policy: ${result.provider.logging || "Unspecified"}`,
        `IPv4: ${ipv4.length ? ipv4.join(", ") : "Not listed"}`,
        `Average: ${formatLatency(result.average)}`,
        `Fastest: ${formatLatency(result.fastest)}`,
        `Success: ${result.successRate}%`,
        `Status: ${getStatusText(result)}`,
        result.probes.length
          ? `Domain checks: ${result.probes
              .map((probe) => `${probe.domain} ${probe.ok ? "OK" : "FAIL"} ${formatLatency(probe.latency)} (${probe.detail})`)
              .join("; ")}`
          : "Domain checks: (Not loaded in shared summary)",
        "",
      ].join("\n");
    }),
  ].join("\n");
}

function makeDetailedMarkdownReport(benchmark: BenchmarkResponse) {
  const testedDate = new Date(benchmark.testedAt).toLocaleString();
  const modeText = benchmark.testMode === "browser" ? "Browser (Client-side)" : "Server-side";
  
  return [
    `# DNS Performance & Security Detailed Report`,
    `*Generated on: ${testedDate}* | *Mode: ${modeText}*`,
    `*Target Domains: ${benchmark.testedDomains.join(", ")}*`,
    ``,
    `## Leaderboard Summary`,
    `| Rank | Resolver | Owner | Average Latency | Fastest Probe | Success Rate | DNSSEC | ECS | Logging Policy |`,
    `|------|----------|-------|-----------------|---------------|--------------|--------|-----|----------------|`,
    ...benchmark.results.map((res, idx) => {
      const dnssec = res.provider.dnssec ? "✅ Yes" : "❌ No";
      const ecs = res.provider.ecs ? "✅ Yes" : "❌ No";
      return `| ${idx + 1} | **${res.provider.name}** | ${res.provider.owner || "Custom"} | ${formatLatency(res.average)} | ${formatLatency(res.fastest)} | ${res.successRate}% | ${dnssec} | ${ecs} | ${res.provider.logging || "N/A"} |`;
    }),
    ``,
    `## Detailed Resolver Analysis`,
    ...benchmark.results.map((res, idx) => {
      const ipv4 = getIpv4Addresses(res.provider.ips);
      return [
        `### ${idx + 1}. ${res.provider.name} (${res.provider.category})`,
        `- **Developer/Owner:** ${res.provider.owner || "Custom"}`,
        `- **DoH Endpoint:** \`${res.provider.endpoint}\``,
        `- **IPv4 Addresses:** ${ipv4.length ? ipv4.map(ip => `\`${ip}\``).join(", ") : "Not listed"}`,
        `- **Security Features:** DNSSEC: ${res.provider.dnssec ? "Supported" : "Not supported"} | ECS: ${res.provider.ecs ? "Supported/Enabled" : "Disabled (Better Privacy)"}`,
        `- **Privacy & Logging:** ${res.provider.logging || "Unspecified"}`,
        `- **Notes:** ${res.provider.notes}`,
        `- **Performance:** Average: **${formatLatency(res.average)}** | Fastest: **${formatLatency(res.fastest)}** | Success: **${res.successRate}%**`,
        res.probes.length ? [
          `#### Domain Probes Breakdown:`,
          `| Domain | Status | Latency | Details |`,
          `|--------|--------|---------|---------|`,
          ...res.probes.map(p => `| \`${p.domain}\` | ${p.ok ? "🟢 OK" : "🔴 FAIL"} | ${formatLatency(p.latency)} | ${p.detail} |`)
        ].join("\n") : ""
      ].filter(Boolean).join("\n");
    }),
  ].join("\n");
}

function serializeResults(bench: BenchmarkResponse): string {
  const compact = {
    t: new Date(bench.testedAt).getTime(),
    d: bench.testedDomains,
    m: bench.testMode || "server",
    r: bench.results.map((res) => ({
      i: res.provider.id,
      n: res.provider.name,
      u: res.provider.endpoint,
      ip: res.provider.ips,
      c: res.provider.category,
      nt: res.provider.notes,
      cs: res.provider.isCustom ? 1 : 0,
      a: res.average,
      f: res.fastest,
      s: res.successRate,
      sc: res.score,
    })),
  };
  const json = JSON.stringify(compact);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function deserializeResults(encoded: string): BenchmarkResponse | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(base64)));
    const compact = JSON.parse(json);

    return {
      testedAt: new Date(compact.t).toISOString(),
      testedDomains: compact.d,
      testMode: compact.m || "server",
      results: compact.r.map((res: {
        i: string;
        n: string;
        u: string;
        ip: string;
        c: string;
        nt: string;
        cs: number;
        a: number | null;
        f: number | null;
        s: number;
        sc: number;
      }) => {
        const matchedProvider = dnsProviders.find(p => p.id === res.i);
        return {
          provider: {
            id: res.i,
            name: res.n,
            endpoint: res.u,
            ips: res.ip,
            category: res.c,
            notes: res.nt,
            isCustom: res.cs === 1,
            dnssec: matchedProvider?.dnssec,
            ecs: matchedProvider?.ecs,
            logging: matchedProvider?.logging,
            owner: matchedProvider?.owner,
          },
          probes: [],
          average: res.a,
          fastest: res.f,
          successRate: res.s,
          score: res.sc,
        };
      }),
    };
  } catch (e) {
    console.error("Failed deserializing shared report", e);
    return null;
  }
}

export function DnsBenchmark() {
  const [selectedDomains, setSelectedDomains] = useState<string[]>(topWebsites.slice(0, 10).map((site) => site.domain));
  const [customDomain, setCustomDomain] = useState("");
  const [benchmark, setBenchmark] = useState<BenchmarkResponse | null>(null);
  const [error, setError] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");
  const [isPending, startTransition] = useTransition();

  // New states for open source enhancements
  const [customProviders, setCustomProviders] = useState<DnsProvider[]>([]);
  const [customName, setCustomName] = useState("");
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [customIps, setCustomIps] = useState("");
  const [customFormError, setCustomFormError] = useState("");
  const [testMode, setTestMode] = useState<"server" | "browser">("server");
  const [isSharedReport, setIsSharedReport] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  function toggleRow(providerId: string) {
    setExpandedRows((prev) =>
      prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId]
    );
  }

  // Load custom providers and share reports from localStorage / query URL on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem("custom_dns_providers");
        if (saved) {
          setCustomProviders(JSON.parse(saved) as DnsProvider[]);
        }
      } catch (e) {
        console.error("Failed loading custom providers from localStorage", e);
      }

      const params = new URLSearchParams(window.location.search);
      const reportParam = params.get("report");
      if (reportParam) {
        const shared = deserializeResults(reportParam);
        if (shared) {
          setBenchmark(shared);
          setHasStarted(true);
          setIsSharedReport(true);
          // Sync test mode with shared report if available
          if (shared.testMode) {
            setTestMode(shared.testMode);
          }
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const allProviders = useMemo(() => [...dnsProviders, ...customProviders], [customProviders]);
  const winner = benchmark?.results[0];
  const runnerUp = benchmark?.results.find((result) => result.provider.id !== winner?.provider.id && result.average !== null);
  const winnerIpv4 = winner ? getIpv4Addresses(winner.provider.ips) : [];
  const testedCount = benchmark?.testedDomains.length ?? selectedDomains.length;
  const providerCount = allProviders.length;
  const maxAverage = Math.max(1, ...(benchmark?.results.map((result) => result.average ?? 0) ?? [1]));

  const selectedSet = useMemo(() => new Set(selectedDomains), [selectedDomains]);

  function toggleDomain(domain: string) {
    setSelectedDomains((current) => {
      if (current.includes(domain)) {
        return current.filter((item) => item !== domain);
      }

      return [...current, domain];
    });
  }

  function selectAllDomains() {
    setSelectedDomains(topWebsites.map((site) => site.domain));
  }

  function clearDomains() {
    setSelectedDomains([]);
  }

  function addCustomDomain() {
    const normalized = normalizeDomain(customDomain);

    if (!isValidDomain(normalized)) {
      setError("Enter a valid custom domain, for example example.com.");
      return;
    }

    setError("");
    setSelectedDomains((current) => Array.from(new Set([...current, normalized])));
    setCustomDomain("");
  }

  // Handle adding custom DNS provider
  function handleAddCustomProvider() {
    setCustomFormError("");
    const name = customName.trim();
    const endpoint = customEndpoint.trim();
    const ips = customIps.trim();

    if (!name) {
      setCustomFormError("Please enter a name for the custom resolver.");
      return;
    }

    if (!endpoint || !endpoint.startsWith("https://")) {
      setCustomFormError("Please enter a valid DNS-over-HTTPS endpoint starting with https://");
      return;
    }

    const newProvider: DnsProvider = {
      id: `custom-${Math.random().toString(36).substring(2, 9)}`,
      name,
      endpoint,
      ips: ips || "Custom Resolver",
      category: "Custom",
      notes: "User-configured custom DNS-over-HTTPS provider.",
      isCustom: true,
    };

    const updated = [...customProviders, newProvider];
    setCustomProviders(updated);
    localStorage.setItem("custom_dns_providers", JSON.stringify(updated));

    // Clear inputs
    setCustomName("");
    setCustomEndpoint("");
    setCustomIps("");
  }

  // Handle removing custom DNS provider
  function handleRemoveCustomProvider(id: string) {
    const updated = customProviders.filter((p) => p.id !== id);
    setCustomProviders(updated);
    localStorage.setItem("custom_dns_providers", JSON.stringify(updated));
  }

  // Perform speed test
  function startBenchmark() {
    const domains = Array.from(new Set(selectedDomains.map(normalizeDomain).filter(isValidDomain)));

    if (!domains.length) {
      setError("Choose at least one website before starting the DNS test.");
      return;
    }

    setError("");
    setHasStarted(true);
    setBenchmark(null);
    setIsSharedReport(false);

    startTransition(async () => {
      if (testMode === "browser") {
        // Browser client-side probing mode
        try {
          const results = await Promise.all(
            allProviders.map(async (provider) => {
              return benchmarkProvider(provider, domains);
            })
          );
          results.sort((left, right) => left.score - right.score);

          setBenchmark({
            testedAt: new Date().toISOString(),
            testedDomains: domains,
            results,
            testMode: "browser",
          });
        } catch (e) {
          setError("Client-side DNS benchmark failed. Check your browser developer console.");
          console.error(e);
        }
      } else {
        // Server API mode
        try {
          const response = await fetch("/api/dns-benchmark", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ domains, customProviders }),
          });

          const data = await response.json();

          if (!response.ok) {
            setError(typeof data.error === "string" ? data.error : "DNS benchmark failed.");
            return;
          }

          setBenchmark({
            ...(data as BenchmarkResponse),
            testMode: "server",
          });
        } catch {
          setError("DNS benchmark failed. Check your connection and try again.");
        }
      }
    });
  }

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(""), 1600);
    } catch {
      setError("Copy failed. Your browser may be blocking clipboard access.");
    }
  }

  // Generate shareable link
  function generateShareLink() {
    if (!benchmark) return;
    try {
      const serialized = serializeResults(benchmark);
      const shareUrl = `${window.location.origin}${window.location.pathname}?report=${serialized}`;
      copyText(shareUrl, "share-link");
    } catch {
      setError("Failed to generate shareable link.");
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Shared Report Alert Banner */}
      {isSharedReport && (
        <Alert className="bg-primary/5 border-primary/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <div>
              <AlertTitle className="font-semibold text-primary flex items-center gap-1.5">
                <Share2 className="size-4" />
                Viewing Shared DNS Benchmark Report
              </AlertTitle>
              <AlertDescription className="text-muted-foreground mt-1">
                This speed test was run on {new Date(benchmark?.testedAt || "").toLocaleString()} in{" "}
                <strong>{benchmark?.testMode === "browser" ? "Browser Mode" : "Server Mode"}</strong>.
              </AlertDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete("report");
                window.history.replaceState({}, "", url.toString());
                setIsSharedReport(false);
                setBenchmark(null);
                setHasStarted(false);
              }}
              className="shrink-0"
            >
              Dismiss & Run New Test
            </Button>
          </div>
        </Alert>
      )}

      {/* Main Header Card */}
      <Card>
        <CardHeader className="gap-6 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <Badge variant="secondary" className="w-fit">
              DNS-over-HTTPS wire format benchmark
            </Badge>
            <CardTitle className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              <h1>DNS Speed Test and DNS Server Comparison</h1>
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-relaxed">
              Compare {providerCount} public and custom DNS providers using live DNS-over-HTTPS lookups. 
              Find the fastest DNS server and copy configuration addresses for your network.
            </CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[18rem]">
            <Card size="sm" className="bg-muted/40">
              <CardHeader className="p-4">
                <CardDescription className="text-xs">Active Resolvers</CardDescription>
                <CardTitle className="text-3xl font-extrabold">{providerCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card size="sm" className="bg-muted/40">
              <CardHeader className="p-4">
                <CardDescription className="text-xs">Test Targets</CardDescription>
                <CardTitle className="text-3xl font-extrabold">{testedCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </CardHeader>
      </Card>

      {/* Quick steps */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card size="sm" className="hover:shadow-sm transition-shadow">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <ListChecks className="size-5 text-primary" />
              1. Choose Settings
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Select websites, select Server/Browser test mode, or add custom DoH endpoints.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm" className="hover:shadow-sm transition-shadow">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <Play className="size-5 text-primary" />
              2. Run Speed Test
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Run parallel DNS checks to measure lookup average latencies and consistency.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm" className="hover:shadow-sm transition-shadow">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <Network className="size-5 text-primary" />
              3. Copy DNS Settings
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Configure the recommended IPv4 addresses directly in your router or device setup.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Settings & Testing Dashboard */}
      {/* Settings & Testing Dashboard */}
      <div className="relative flex flex-col lg:flex-row items-start gap-6 w-full">
        {/* Collapsible Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r bg-card/95 backdrop-blur-md p-6 shadow-xl transition-all duration-300 ease-in-out lg:sticky lg:top-20 lg:z-0 lg:flex lg:w-[22rem] lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden lg:w-0 lg:opacity-0"
          )}
        >
          {/* Mobile close button inside sidebar header */}
          <div className="flex items-center justify-between pb-4 mb-2 border-b lg:hidden">
            <span className="font-bold text-sm text-foreground flex items-center gap-2">
              ⚡ DNS Test Settings
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(false)}
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>

          {/* Sidebar content scrollable */}
          <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            {/* Main Controls Card */}
            <Card className="border-primary/10 bg-card/75 backdrop-blur-md shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold text-foreground">Configure Speed Test</CardTitle>
                <CardDescription className="text-xs">Setup test mode and websites to query.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Test Mode Selector Tabs */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Testing Mode</span>
                  <div className="flex rounded-lg bg-secondary p-1 gap-1 border">
                    <button
                      type="button"
                      onClick={() => setTestMode("server")}
                      disabled={isPending}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all cursor-pointer",
                        testMode === "server"
                          ? "bg-background text-foreground shadow border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Server className="size-3.5" /> Server Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestMode("browser")}
                      disabled={isPending}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all cursor-pointer",
                        testMode === "browser"
                          ? "bg-background text-foreground shadow border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Globe className="size-3.5" /> Browser Mode
                    </button>
                  </div>
                </div>

                {testMode === "browser" && (
                  <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-600 dark:text-amber-400">
                    <Info className="size-4 inline mr-1.5 mb-0.5" />
                    <strong>Browser Mode:</strong> Resolvers are queried directly from your browser. Note: Some resolvers may fail due to <strong>CORS restrictions</strong>.
                  </div>
                )}

                {/* Add Custom Domains */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Custom Target Domain</span>
                  <div className="flex gap-2">
                    <Input
                      value={customDomain}
                      onChange={(event) => setCustomDomain(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          addCustomDomain();
                        }
                      }}
                      placeholder="example.com"
                      className="h-9 text-sm"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addCustomDomain} className="h-9 px-3">
                      Add
                    </Button>
                  </div>
                </div>

                {/* Domains list */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Websites</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={selectAllDomains} className="text-xs text-primary hover:underline font-medium">
                        All 20
                      </button>
                      <span className="text-muted-foreground text-xs">|</span>
                      <button type="button" onClick={clearDomains} className="text-xs text-primary hover:underline font-medium">
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid max-h-[16rem] gap-1.5 overflow-y-auto pr-1 border rounded-lg p-2.5 bg-muted/20">
                    {topWebsites.map((site) => (
                      <label
                        key={site.domain}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-md border p-2 text-xs hover:bg-muted/55 transition-colors",
                          selectedSet.has(site.domain) && "bg-muted/30 border-primary/20"
                        )}
                      >
                        <Checkbox checked={selectedSet.has(site.domain)} onCheckedChange={() => toggleDomain(site.domain)} />
                        <span className="flex-1 font-semibold">{site.label}</span>
                        <span className="text-muted-foreground font-mono text-[10px]">{site.domain}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Added Custom Targets badges */}
                {selectedDomains.some((domain) => !topWebsites.some((site) => site.domain === domain)) ? (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Custom Targets</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDomains
                        .filter((domain) => !topWebsites.some((site) => site.domain === domain))
                        .map((domain) => (
                          <Badge key={domain} variant="outline" className="gap-1.5 text-xs py-0.5 px-2">
                            {domain}
                            <button type="button" onClick={() => toggleDomain(domain)} className="text-muted-foreground hover:text-foreground text-[10px]">
                              ✕
                            </button>
                          </Badge>
                        ))}
                    </div>
                  </div>
                ) : null}

                {/* Run Action */}
                <Button type="button" size="lg" className="w-full font-bold shadow-xs transition-transform duration-200 active:scale-98" onClick={startBenchmark} disabled={isPending}>
                  {isPending ? <Loader2 className="animate-spin size-4 mr-2" /> : <Play className="size-4 mr-2" />}
                  {isPending ? "Testing DNS queries..." : `Start DNS Test (${testMode === "browser" ? "Browser" : "Server"})`}
                </Button>
              </CardContent>
            </Card>

            {/* Accordion Consolidating DoH Resolvers and Guide */}
            <Accordion type="multiple" defaultValue={[]} className="space-y-4">
              {/* Custom DoH Resolvers Setup */}
              <AccordionItem value="custom-resolvers" className="border border-primary/10 rounded-lg bg-card/75 backdrop-blur-md px-4 shadow-xs">
                <AccordionTrigger className="hover:no-underline font-bold py-3 text-sm flex items-center justify-between text-foreground">
                  <span className="flex items-center gap-2">
                    <Plus className="size-4 text-primary" />
                    Custom DoH Resolvers
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-4 pt-1">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Resolver Name</span>
                      <Input
                        placeholder="My Private AdGuard"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="h-8.5 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">DoH Endpoint (HTTPS only)</span>
                      <Input
                        placeholder="https://dns.adguard-dns.com/dns-query"
                        value={customEndpoint}
                        onChange={(e) => setCustomEndpoint(e.target.value)}
                        className="h-8.5 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">IPv4 IP Addresses (optional)</span>
                      <Input
                        placeholder="94.140.14.14, 94.140.15.15"
                        value={customIps}
                        onChange={(e) => setCustomIps(e.target.value)}
                        className="h-8.5 text-xs"
                      />
                    </div>
                    {customFormError && (
                      <div className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3.5" />
                        {customFormError}
                      </div>
                    )}
                    <Button type="button" size="sm" className="w-full font-bold" onClick={handleAddCustomProvider}>
                      Add Resolver
                    </Button>
                  </div>

                  {customProviders.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Configured Resolvers</span>
                      <div className="space-y-1.5 max-h-[10rem] overflow-y-auto pr-1">
                        {customProviders.map((provider) => (
                          <div key={provider.id} className="flex items-center justify-between gap-2 p-2 border rounded-md bg-muted/15 text-xs">
                            <div className="truncate flex-1">
                              <span className="font-semibold text-foreground block truncate">{provider.name}</span>
                              <span className="text-[10px] text-muted-foreground truncate block font-mono">{provider.endpoint}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveCustomProvider(provider.id)}
                              className="size-7 hover:bg-destructive/10 hover:text-destructive shrink-0"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Test guidelines */}
              <AccordionItem value="benchmark-guide" className="border border-primary/10 rounded-lg bg-card/75 backdrop-blur-md px-4 shadow-xs">
                <AccordionTrigger className="hover:no-underline font-bold py-3 text-sm flex items-center justify-between text-foreground">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    Benchmark Guide
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-3 text-xs text-muted-foreground leading-relaxed pt-1">
                  <p>Every test is executed via active DNS-over-HTTPS wire format query payloads directly to resolver endpoints.</p>
                  <p><strong>Server Mode</strong> benchmarks speeds from the backend server. Ideal for general comparative stats.</p>
                  <p><strong>Browser Mode</strong> tests from your current browser client. Excellent for discovering the best provider for your physical location, though limited by browser CORS configurations.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Backdrop overlay for mobile */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* Right column dashboard dashboard */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Sidebar Toggle Trigger Bar */}
          <div className="flex items-center gap-3 bg-muted/30 border border-dashed rounded-lg p-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="h-8.5 px-3 flex items-center gap-1.5 border hover:bg-muted font-semibold text-xs transition-colors"
            >
              {isSidebarOpen ? (
                <>
                  <PanelLeftClose className="size-4" />
                  Hide Settings
                </>
              ) : (
                <>
                  <PanelLeft className="size-4" />
                  Show Settings
                </>
              )}
            </Button>
            <span className="text-[11px] text-muted-foreground font-medium">
              {isSidebarOpen ? "Maximize workspace by hiding the settings sidebar." : "Expand settings to configure resolvers and website targets."}
            </span>
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Problem</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {isPending ? (
            <Card className="animate-pulse">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  Benchmarking DNS Resolvers
                </CardTitle>
                <CardDescription>
                  Running tests for {providerCount} resolvers against {selectedDomains.length} domains in{" "}
                  <strong>{testMode === "browser" ? "Browser Mode" : "Server Mode"}</strong>...
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {!hasStarted && !benchmark ? (
            <Card className="border-dashed py-8">
              <CardHeader className="text-center">
                <CardContent className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 bg-muted rounded-full">
                    <Gauge className="size-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-xl font-bold">No Benchmark Run Yet</CardTitle>
                  <CardDescription className="max-w-md mx-auto">
                    Select target websites, configure custom resolvers if desired, and click &apos;Start DNS Test&apos; on the left to begin compiling rankings.
                  </CardDescription>
                </CardContent>
              </CardHeader>
            </Card>
          ) : null}

          {/* Speed test results summary */}
          {benchmark && winner ? (
            <div className="space-y-6">
              {/* Winner Showcase Card */}
              <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
                <Card className="border-primary/20 bg-primary/[0.02] shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Trophy className="size-48 text-primary" />
                  </div>
                  <CardHeader>
                    <Badge className="w-fit mb-1 bg-primary text-primary-foreground font-semibold">
                      Fastest Resolver
                    </Badge>
                    <CardTitle className="flex items-center gap-2 text-3xl font-extrabold">
                      <Trophy className="size-7 text-amber-500" />
                      Use {winner.provider.name}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm">
                      Recommending {winner.provider.name} ({winner.provider.category}) as it yielded the best score:{" "}
                      <strong>{formatLatency(winner.average)} average</strong> and a <strong>{winner.successRate}% success rate</strong>.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 relative z-10">
                    <div className="grid gap-3 grid-cols-3">
                      <Card size="sm" className="bg-background">
                        <CardHeader className="p-3">
                          <CardDescription className="text-[10px] uppercase font-bold">Average</CardDescription>
                          <CardTitle className="text-xl font-black">{formatLatency(winner.average)}</CardTitle>
                        </CardHeader>
                      </Card>
                      <Card size="sm" className="bg-background">
                        <CardHeader className="p-3">
                          <CardDescription className="text-[10px] uppercase font-bold">Fastest</CardDescription>
                          <CardTitle className="text-xl font-black">{formatLatency(winner.fastest)}</CardTitle>
                        </CardHeader>
                      </Card>
                      <Card size="sm" className="bg-background">
                        <CardHeader className="p-3">
                          <CardDescription className="text-[10px] uppercase font-bold">Reliability</CardDescription>
                          <CardTitle className="text-xl font-black">{winner.successRate}%</CardTitle>
                        </CardHeader>
                      </Card>
                    </div>

                    <Alert className="bg-background">
                      <Network className="size-4 text-primary" />
                      <AlertTitle className="font-semibold">Recommended DNS settings</AlertTitle>
                      <AlertDescription className="text-xs text-muted-foreground mt-1">
                        {winnerIpv4.length ? (
                          <span>
                            Set Primary DNS to <strong className="font-bold text-foreground">{winnerIpv4[0]}</strong>
                            {winnerIpv4[1] ? (
                              <>
                                {" "}and Secondary DNS to <strong className="font-bold text-foreground">{winnerIpv4[1]}</strong>.
                              </>
                            ) : null}
                          </span>
                        ) : (
                          <span>This resolver does not provide standardized IPv4 details. Use DoH endpoint.</span>
                        )}
                      </AlertDescription>
                    </Alert>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        onClick={() => copyText(winnerIpv4.join("\n"), `ipv4-${winner.provider.id}`)}
                        disabled={!winnerIpv4.length}
                        className="font-bold text-xs"
                      >
                        {copiedKey === `ipv4-${winner.provider.id}` ? <ClipboardCheck className="size-4" /> : <Copy className="size-4" />}
                        Copy IPs
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateShareLink}
                        className="font-semibold text-xs border bg-background"
                      >
                        {copiedKey === "share-link" ? <ClipboardCheck className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
                        {copiedKey === "share-link" ? "Link Copied!" : "Share Results"}
                      </Button>

                      {winner.provider.sourceUrl ? (
                        <Button type="button" variant="outline" asChild className="font-semibold text-xs bg-background">
                          <a href={winner.provider.sourceUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-4" />
                            Official docs
                          </a>
                        </Button>
                      ) : null}
                      
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => copyText(makeReportText(benchmark), "full-report")}
                        className="font-semibold text-xs text-muted-foreground hover:text-foreground"
                      >
                        {copiedKey === "full-report" ? <ClipboardCheck className="size-4" /> : <Copy className="size-4" />}
                        Copy Text Report
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => copyText(makeDetailedMarkdownReport(benchmark), "detailed-report")}
                        className="font-semibold text-xs text-muted-foreground hover:text-foreground"
                      >
                        {copiedKey === "detailed-report" ? <ClipboardCheck className="size-4 text-emerald-500" /> : <Copy className="size-4 text-muted-foreground" />}
                        Copy Markdown Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Winner notes */}
                <Card className="flex flex-col justify-between">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-bold">
                      <Gauge className="size-4.5 text-primary" />
                      Selection Details
                    </CardTitle>
                    <CardDescription className="text-xs">How this resolver was recommended.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs flex-1 flex flex-col justify-center">
                    <div>
                      <div className="font-semibold text-foreground">Score Calculation</div>
                      <p className="mt-1 text-muted-foreground">Favors resolvers with low average query latencies, minimal latency spread (consistency), and 100% success lookups.</p>
                    </div>
                    <Separator />
                    <div>
                      <div className="font-semibold text-foreground">Runner Up</div>
                      <p className="mt-1 text-muted-foreground">
                        {runnerUp
                          ? `${runnerUp.provider.name} with ${formatLatency(runnerUp.average)} average and ${runnerUp.successRate}% success.`
                          : "No suitable runner up resolver completed the tests."}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <div className="font-semibold text-foreground">Usage Notes</div>
                      <p className="mt-1 text-muted-foreground leading-relaxed">{winner.provider.notes}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Latency Comparison Chart */}
              <DnsCharts results={benchmark.results} />

              {/* Table Rankings List */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Leaderboard</CardTitle>
                  <CardDescription>
                    Sorted from fastest to slowest resolver from the test run at {new Date(benchmark.testedAt).toLocaleString()}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead>Resolver</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Average</TableHead>
                          <TableHead>Fastest</TableHead>
                          <TableHead>Success</TableHead>
                          <TableHead className="w-16">Copy</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {benchmark.results.map((result, index) => {
                          const progress = result.average === null ? 0 : Math.max(8, 100 - (result.average / maxAverage) * 70);
                          const isExpanded = expandedRows.includes(result.provider.id);
                          const ipv4 = getIpv4Addresses(result.provider.ips);

                          return (
                            <Fragment key={result.provider.id}>
                              <TableRow
                                onClick={() => toggleRow(result.provider.id)}
                                className={cn(
                                  "cursor-pointer hover:bg-muted/40 transition-colors select-none",
                                  index === 0 && "bg-primary/[0.01]",
                                  isExpanded && "bg-muted/30 border-b-0"
                                )}
                              >
                                <TableCell className="font-bold font-mono text-xs">
                                  <div className="flex items-center gap-1.5">
                                    {isExpanded ? <ChevronDown className="size-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />}
                                    {index + 1}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-foreground text-sm">{result.provider.name}</span>
                                    {result.provider.isCustom && (
                                      <span className="text-[9px] uppercase font-bold px-1 py-0.5 rounded bg-muted border text-muted-foreground leading-none">
                                        Custom
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5 max-w-[12rem] truncate" title={result.provider.ips}>
                                    {result.provider.ips}
                                  </div>
                                  <Progress value={progress} className="mt-2 h-1.5" />
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-[10px] font-semibold tracking-wide">
                                    {result.provider.category}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-bold text-sm">{formatLatency(result.average)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{formatLatency(result.fastest)}</TableCell>
                                <TableCell>
                                  <Badge variant={successVariant(result.successRate)} className="text-[10px] font-bold">
                                    {result.successRate}%
                                  </Badge>
                                </TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={!getIpv4Addresses(result.provider.ips).length}
                                    onClick={() => copyText(getIpv4Addresses(result.provider.ips).join("\n"), `row-${result.provider.id}`)}
                                    className="h-8 text-xs font-semibold px-2 hover:bg-muted"
                                  >
                                    {copiedKey === `row-${result.provider.id}` ? <ClipboardCheck className="size-3.5" /> : <Copy className="size-3.5" />}
                                    IPs
                                  </Button>
                                </TableCell>
                              </TableRow>

                              {/* Expanded Row for individual target latency records and configs */}
                              {isExpanded && (
                                <TableRow className="bg-muted/10 hover:bg-muted/10">
                                  <TableCell colSpan={7} className="p-4 border-t-0">
                                    <div className="space-y-4 animate-fade-in">
                                      {/* Configurations overview */}
                                      <div className="grid gap-3 md:grid-cols-3">
                                        <div className="rounded-lg border bg-card p-3 shadow-2xs">
                                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">IPv4 DNS addresses</div>
                                          <div className="mt-1 font-semibold text-xs truncate">{ipv4.length ? ipv4.join(", ") : "Not listed"}</div>
                                        </div>
                                        <div className="rounded-lg border bg-card p-3 shadow-2xs">
                                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">DoH endpoint</div>
                                          <div className="mt-1 truncate font-mono text-[10px]" title={result.provider.endpoint}>{result.provider.endpoint}</div>
                                        </div>
                                        <div className="rounded-lg border bg-card p-3 shadow-2xs">
                                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Official source</div>
                                          <div className="mt-1 font-semibold text-xs">
                                            {result.provider.sourceUrl ? (
                                              <a
                                                href={result.provider.sourceUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                                              >
                                                View docs
                                                <ExternalLink className="size-3" />
                                              </a>
                                            ) : (
                                              "Not linked"
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Security and Notes */}
                                      <div className="rounded-lg border bg-card p-3 text-xs text-muted-foreground shadow-2xs space-y-1">
                                        <div className="font-semibold text-foreground">Resolver Notes:</div>
                                        <p>{result.provider.notes}</p>
                                        <div className="flex gap-4 pt-1 text-[10px] font-semibold">
                                          <span>Operator: <span className="text-foreground">{result.provider.owner || "Custom"}</span></span>
                                          <span>DNSSEC: <span className="text-foreground">{result.provider.dnssec ? "Yes" : "No"}</span></span>
                                          <span>ECS: <span className="text-foreground">{result.provider.ecs ? "Enabled" : "Disabled"}</span></span>
                                        </div>
                                      </div>

                                      {/* Probe Results Table */}
                                      {result.probes && result.probes.length > 0 ? (
                                        <div className="overflow-x-auto rounded-lg border bg-card shadow-2xs">
                                          <Table>
                                            <TableHeader>
                                              <TableRow className="bg-muted/40">
                                                <TableHead className="text-[10px] font-bold uppercase tracking-wider h-8">Website Target</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase tracking-wider w-20 h-8">Status</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase tracking-wider w-24 h-8">Latency</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase tracking-wider h-8">Probe Detail</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {result.probes.map((probe) => (
                                                <TableRow key={`${result.provider.id}-${probe.domain}`} className="hover:bg-muted/10 h-8">
                                                  <TableCell className="font-semibold text-xs py-1.5">{probe.domain}</TableCell>
                                                  <TableCell className="py-1.5">
                                                    <Badge variant={probe.ok ? "default" : "destructive"} className="text-[9px] font-bold py-0.5 px-1 leading-none">
                                                      {probe.ok ? "OK" : "Failed"}
                                                    </Badge>
                                                  </TableCell>
                                                  <TableCell className="font-semibold text-xs py-1.5">{formatLatency(probe.latency)}</TableCell>
                                                  <TableCell className="text-muted-foreground text-xs py-1.5">{probe.detail}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      ) : (
                                        <div className="text-xs text-muted-foreground italic text-center py-2 bg-card border rounded-lg shadow-2xs">
                                          No domain probe records available (e.g. loaded via compact shared link).
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Websites Checked Showcase */}
              <Card>
                <CardHeader>
                  <CardTitle>Tested Domains</CardTitle>
                  <CardDescription>Domains resolved in this benchmark run.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1.5">
                  {benchmark.testedDomains.map((domain) => (
                    <Badge key={domain} variant="secondary" className="gap-1.5 font-medium text-xs">
                      <CheckCircle2 className="size-3 text-emerald-500" />
                      {domain}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Built-in and Custom Resolvers Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Active DNS Resolver Configurations</CardTitle>
              <CardDescription>Available endpoints currently registered in the speed test.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {allProviders.map((provider) => (
                <div key={provider.id} className="rounded-lg border p-3.5 bg-muted/5 flex flex-col justify-between hover:shadow-xs transition-shadow">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <span className="font-bold text-foreground text-sm truncate flex items-center gap-1.5">
                          {provider.name}
                          {provider.isCustom && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-muted border text-muted-foreground scale-90">
                              Custom
                            </span>
                          )}
                        </span>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{provider.ips}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px] tracking-wide shrink-0">
                        {provider.category}
                      </Badge>
                    </div>
                    <Separator className="my-2.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed h-12 overflow-hidden line-clamp-3">
                      {provider.notes}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3 mt-1.5 border-t border-dashed">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!getIpv4Addresses(provider.ips).length}
                      onClick={() => copyText(getIpv4Addresses(provider.ips).join("\n"), `provider-${provider.id}`)}
                      className="text-[10px] font-bold h-7.5 px-2.5 bg-background"
                    >
                      {copiedKey === `provider-${provider.id}` ? <ClipboardCheck className="size-3" /> : <Copy className="size-3" />}
                      Copy IPs
                    </Button>
                    {provider.sourceUrl ? (
                      <Button type="button" variant="ghost" size="sm" asChild className="text-[10px] font-semibold h-7.5 px-2.5 text-muted-foreground hover:text-foreground">
                        <a href={provider.sourceUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-3 mr-1" />
                          Official Docs
                        </a>
                      </Button>
                    ) : null}
                    {provider.isCustom && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCustomProvider(provider.id)}
                        className="text-[10px] font-bold h-7.5 px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive ml-auto"
                      >
                        <Trash2 className="size-3 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

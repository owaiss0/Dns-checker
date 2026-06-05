"use client";

import { useMemo } from "react";
import { type DnsResult } from "@/lib/dns-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

type DnsChartsProps = {
  results: DnsResult[];
};

export function DnsCharts({ results }: DnsChartsProps) {
  // Filter and sort successful results for the chart
  const chartData = useMemo(() => {
    return [...results]
      .filter((r) => r.average !== null)
      .sort((a, b) => (a.average || 0) - (b.average || 0));
  }, [results]);

  const maxLatency = useMemo(() => {
    const latencies = chartData.map((d) => d.average as number);
    return latencies.length ? Math.max(...latencies, 1) : 1;
  }, [chartData]);

  if (!chartData.length) {
    return null;
  }

  return (
    <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            Latency Comparison
          </CardTitle>
          <CardDescription>Average response times (lower is better).</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {chartData.map((result, index) => {
            const avg = result.average as number;
            // Calculate width percentage (cap at minimum 5% so it's always visible)
            const percentage = Math.max(5, (avg / maxLatency) * 100);
            
            // Color grade based on average latency
            let barColorClass = "bg-emerald-500 dark:bg-emerald-600";
            let textColorClass = "text-emerald-600 dark:text-emerald-400 font-semibold";
            if (avg > 40 && avg <= 80) {
              barColorClass = "bg-amber-500 dark:bg-amber-600";
              textColorClass = "text-amber-600 dark:text-amber-400 font-semibold";
            } else if (avg > 80) {
              barColorClass = "bg-rose-500 dark:bg-rose-600";
              textColorClass = "text-rose-600 dark:text-rose-400 font-semibold";
            }

            return (
              <div key={result.provider.id} className="group flex flex-col gap-1 sm:flex-row sm:items-center">
                {/* Name Label */}
                <div className="w-full sm:w-44 shrink-0 flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
                    <span className="text-xs text-muted-foreground mr-1.5 font-mono">#{index + 1}</span>
                    {result.provider.name}
                  </span>
                  {result.provider.isCustom && (
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-muted border text-muted-foreground scale-90">
                      Custom
                    </span>
                  )}
                </div>

                {/* Bar Area */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="h-6 flex-1 bg-secondary rounded-md overflow-hidden relative border flex items-center min-w-0">
                    {/* Animated Fill */}
                    <div
                      className={`h-full ${barColorClass} transition-all duration-700 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                    
                    {/* Hover tooltip/latency inside bar if space permits, else outside */}
                    {percentage > 25 && (
                      <span className="absolute left-2.5 text-[10px] text-white font-semibold pointer-events-none">
                        {avg} ms
                      </span>
                    )}
                  </div>

                  {/* Latency text on the right */}
                  <span className={`w-16 text-right text-sm shrink-0 ${textColorClass}`}>
                    {avg} ms
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-emerald-500" />
            <span>Fast (&lt; 40ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-amber-500" />
            <span>Average (40ms - 80ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-rose-500" />
            <span>Slow (&gt; 80ms)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

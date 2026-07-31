"use client";

import { useMemo, useState } from "react";
import { AreaChart } from "@/components/charts/AreaChart";
import { Gauge } from "@/components/charts/Gauge";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip, type Tone } from "@/components/ui/Chip";
import { KpiCard } from "@/components/ui/KpiCard";
import { Icon, type IconName } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/misc";
import { useApiData, type IntelligencePayload } from "@/lib/api";
import { fmtInt, fmtMoney, fmtPct } from "@/lib/format";

const EMPTY: IntelligencePayload = {
  facility: { name: "", facility_type: "", location: "" },
  engine: "", facility_health: 0, agent_health: {},
  kpis: { cost_reduction_pct: 0, roi_generated: 0, facility_health: 0, optimizations: 0 },
  correlations: [], anomaly_sources: [], anomaly_feed: [], collaboration: [], forecasts: [],
  recommendations: [], optimizations: 0,
};

const sevTone: Record<string, Tone> = { Red: "red", Amber: "amber", Blue: "blue" };
const agentColor: Record<string, string> = {
  Energy: "var(--color-primary)",
  Maintenance: "var(--color-alert-amber)",
  Occupancy: "var(--color-signal-green)",
  Security: "var(--color-alert-red)",
  Cost: "var(--color-violet)",
};
const agentIcon: Record<string, IconName> = {
  Energy: "bolt", Maintenance: "wrench", Occupancy: "users", Security: "shield", Cost: "dollar",
};

type Filter = "All" | "Anomalies" | "Forecasts" | "Correlations" | "Health";

export function Intelligence() {
  const { data, loading, error, refresh } = useApiData<IntelligencePayload>("/api/dashboards/intelligence", EMPTY);
  const [filter, setFilter] = useState<Filter>("All");
  const [explain, setExplain] = useState(false);
  const [expandedCorr, setExpandedCorr] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (filter === "All") return true;
    if (filter === "Anomalies") return true;
    return true;
  }, [filter]);

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading intelligence">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Icon name="brain" className="text-violet" size={32} />
        <div>
          <p className="text-body-md font-semibold text-ice-white">Engine unreachable</p>
          <p className="mt-1 text-body-sm text-steel-slate">{error} — is the backend running on :8000?</p>
        </div>
        <Button variant="secondary" onClick={refresh}>Retry</Button>
      </div>
    );
  }

  const { kpis, agent_health, forecasts, correlations, anomaly_feed, recommendations, collaboration } = data;

  return (
    <div>
      <PageIntro
        title="Facility Intelligence"
        subtitle="Synthesized by the Facility Intelligence Engine"
        agent={data.engine}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {(["All", "Anomalies", "Forecasts", "Correlations", "Health"] as Filter[]).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "primary" : "secondary"}
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setExplain((v) => !v)}>
              <Icon name="info" size={14} /> {explain ? "Hide" : "Explain"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Cost Reduction" value={fmtPct(kpis.cost_reduction_pct)} icon="dollar" delta="▼ 23% this quarter" deltaTone="green" sub="vs baseline spend" />
        <KpiCard label="ROI Generated" value={fmtMoney(kpis.roi_generated, true)} icon="trendingUp" delta="▲ 6.2x multiple" deltaTone="green" sub="Since program start" />
        <KpiCard label="Facility Health" value={`${kpis.facility_health}/100`} icon="cpu" delta="▲ 2" deltaTone="green" sub="Cross-agent score" />
        <KpiCard label="Optimizations Live" value={fmtInt(kpis.optimizations)} icon="sparkles" delta="+3 this week" deltaTone="steel" sub="Applied by AI agents" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className={filter === "Health" ? "ring-1 ring-violet/30" : ""}>
          <CardHeader title="Facility Health Score" subtitle="Violet arc · 30d trend" right={<Chip tone="violet">94/100</Chip>} />
          <div className="flex flex-wrap items-center gap-6">
            <Gauge value={data.facility_health} label="Health" size={150} color="var(--color-violet)" />
            <div className="min-w-[200px] flex-1 space-y-2.5">
              {Object.entries(agent_health).map(([agent, score]) => (
                <div key={agent} className="flex items-center gap-3 text-body-sm">
                  <span className="w-28 truncate text-steel-slate capitalize">{agent}</span>
                  <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-elevated-slate" role="img" aria-label={`${agent} ${score}`}>
                    <div className="h-full rounded-full" style={{ width: `${score}%`, background: agentColor[agent] ?? "var(--color-violet)" }} />
                  </div>
                  <span className="w-8 text-right font-mono text-caption text-ice-white">{score}</span>
                </div>
              ))}
            </div>
          </div>
          {explain && (
            <p className="mt-4 rounded-control border border-hairline-slate bg-elevated-slate p-3 text-body-sm text-steel-slate">
              Energy improved 4pts after the AHU schedule change on Jul 14. Security is the weakest domain —
              badge-duplication gaps were closed this week.
            </p>
          )}
        </Card>

        <Card className={filter === "Correlations" ? "ring-1 ring-violet/30" : ""}>
          <CardHeader title="Cross-Agent Correlations" subtitle="Detected by the Intelligence Engine" />
          <div className="space-y-3">
            {correlations.map((c) => (
              <div key={c.pair} className="rounded-control border border-hairline-slate bg-elevated-slate p-3.5">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 text-left"
                  onClick={() => setExpandedCorr(expandedCorr === c.pair ? null : c.pair)}
                  aria-expanded={expandedCorr === c.pair}
                >
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium text-ice-white">{c.pair}</p>
                    <p className="mt-0.5 text-caption text-steel-slate">confidence {c.confidence ?? "—"}</p>
                  </div>
                  <span className="shrink-0 font-mono text-body-md text-violet">
                    {typeof c.r === "number" ? `r=${c.r.toFixed(2)}` : "—"}
                  </span>
                </button>
                {expandedCorr === c.pair && (
                  <div className="mt-2 border-t border-hairline-slate pt-2">
                    <p className="text-body-sm text-steel-slate">{c.insight}</p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-caption text-primary">
                      <Icon name="sparkles" size={12} /> {c.action}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {visible && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className={filter === "Anomalies" ? "ring-1 ring-violet/30" : ""}>
              <CardHeader title="Anomaly Detection Feed" subtitle="Across all agents · last 24h" />
              <ul role="list" className="divide-y divide-hairline-slate">
                {anomaly_feed.length === 0 && <li className="py-8 text-center text-body-sm text-steel-slate">No anomalies — all systems nominal</li>}
                {anomaly_feed.map((a) => (
                  <li key={`${a.domain}-${a.timestamp}`} className="flex items-center gap-3 py-3">
                    <Chip tone={sevTone[a.severity] ?? "amber"}>{a.severity}</Chip>
                    <Chip tone="steel">{a.domain}</Chip>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-sm text-ice-white">{a.detail}</p>
                    </div>
                    <span className="shrink-0 font-mono text-caption text-steel-slate">{a.timestamp}</span>
                    <Chip tone={a.status === "Resolved" ? "green" : "steel"}>{a.status}</Chip>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className={filter === "Forecasts" ? "ring-1 ring-violet/30" : ""}>
              <CardHeader title="Operational Forecasts" subtitle="Energy · Occupancy · Maintenance" />
              <div className="space-y-4">
                {forecasts.map((f) => (
                  <div key={f.domain} className="rounded-control border border-hairline-slate bg-elevated-slate p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-body-sm font-medium text-ice-white">{f.domain} · {f.horizon}</p>
                      <span className="font-mono text-caption text-steel-slate">{f.confidence}</span>
                    </div>
                    <p className="mt-1 font-mono text-body-md text-violet">{f.headline}</p>
                    <div className="pt-2">
                      <AreaChart data={f.series} height={70} color={agentColor[f.domain] ?? "var(--color-violet)"} fill={agentColor[f.domain] ?? "var(--color-violet)"} showGrid={false} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader title="Recommendation Log" subtitle="Generated by the Facility Intelligence Engine" />
            <div className="-mx-4 overflow-x-auto px-4">
              <table className="w-full min-w-[640px] text-left text-body-sm">
                <thead>
                  <tr className="text-caption uppercase tracking-wide text-steel-slate">
                    <th className="py-2 pr-4 font-medium">ID</th>
                    <th className="py-2 pr-4 font-medium">Agent</th>
                    <th className="py-2 pr-4 font-medium">Recommendation</th>
                    <th className="py-2 pr-4 font-medium">Impact</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-slate">
                  {recommendations.slice(0, 5).map((r, i) => (
                    <tr key={r.title} className="text-steel-slate">
                      <td className="py-3 pr-4 font-mono text-caption">REC-{String(i + 1).padStart(3, "0")}</td>
                      <td className="py-3 pr-4"><Chip tone="violet">{r.agent}</Chip></td>
                      <td className="max-w-[320px] py-3 pr-4 text-ice-white">{r.title}</td>
                      <td className="py-3 pr-4 font-mono text-caption">{r.impact}</td>
                      <td className="py-3"><Chip tone={r.status === "Applied" ? "green" : "blue"}>{r.status}</Chip></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="mt-6">
            <CardHeader title="Agent Collaboration Map" subtitle="Recent interactions between agents and the engine" />
            <ul role="list" className="space-y-2.5">
              {collaboration.map((e) => (
                <li key={`${e.source}-${e.target}`} className="flex flex-wrap items-center gap-2 rounded-control border border-hairline-slate bg-elevated-slate px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-body-sm text-ice-white">
                    <span className="rounded-md bg-panel-slate p-1.5" style={{ color: agentColor[e.source] ?? "var(--color-violet)" }}>
                      <Icon name={agentIcon[e.source] ?? "sparkles"} size={14} />
                    </span>
                    {e.source}
                  </span>
                  <Icon name="chevronRight" size={14} className="text-steel-slate" />
                  <span className="text-body-sm text-steel-slate">{e.insight}</span>
                  <Icon name="chevronRight" size={14} className="text-steel-slate" />
                  <span className="inline-flex items-center gap-1.5 text-body-sm text-ice-white">
                    <span className="rounded-md bg-panel-slate p-1.5 text-violet">
                      <Icon name={e.target === "Intelligence" ? "brain" : (agentIcon[e.target] ?? "sparkles")} size={14} />
                    </span>
                    {e.target}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

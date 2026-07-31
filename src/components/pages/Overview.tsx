"use client";

import { AreaChart } from "@/components/charts/AreaChart";
import { Bars } from "@/components/charts/Bars";
import { Gauge } from "@/components/charts/Gauge";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip, type Tone } from "@/components/ui/Chip";
import { KpiCard } from "@/components/ui/KpiCard";
import { Icon, type IconName } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { useApiData, type OverviewPayload } from "@/lib/api";
import { fmtInt, fmtMoney, fmtPct, fmtTimeAgo } from "@/lib/format";

const EMPTY: OverviewPayload = {
  facility: { name: "", facility_type: "", location: "" },
  kpis: { energy_mwh: 0, cost_savings: 0, facility_health: 0, active_alerts: 0 },
  energy: {
    facility: { name: "", facility_type: "", location: "" },
    agent: "", total_today_kwh: 0, total_today_mwh: 0, cost_savings: 0, efficiency_score: 0,
    carbon_reduction_pct: 0, split: { hvac: 45, lighting: 28, equipment: 18, other: 9 },
    anomalies: [], anomaly_count_today: 0, forecast: [], peak_day: null, hourly: [],
  },
  maintenance: {
    facility: { name: "", facility_type: "", location: "" }, agent: "", assets_monitored: 0,
    maintenance_tickets: 0, predicted_failures: 0, downtime_reduction_pct: 0,
    health_distribution: { Excellent: 0, Good: 0, Warning: 0, Critical: 0 }, predicted: [],
  },
  occupancy: {
    facility: { name: "", facility_type: "", location: "" }, agent: "", occupancy_rate_pct: 0,
    active_visitors: 0, zones: [], forecast_bands: [], forecast_accuracy_pct: 0,
  },
  security: {
    facility: { name: "", facility_type: "", location: "" }, agent: "", events_today: 0,
    unauthorized_access: 0, active_visitors: 0, severity_counts: { Red: 0, Amber: 0, Blue: 0 },
    doors: { controlled_doors: 0, monitored_zones: 0 }, burst_hours: [], events: [],
  },
  intelligence: {
    facility: { name: "", facility_type: "", location: "" }, engine: "", facility_health: 0,
    agent_health: {}, kpis: { cost_reduction_pct: 0, roi_generated: 0, facility_health: 0, optimizations: 0 },
    correlations: [], anomaly_sources: [], anomaly_feed: [], collaboration: [], forecasts: [],
    recommendations: [], optimizations: 0,
  },
  alerts: [],
};

const sevTone: Record<string, Tone> = { Critical: "red", Warning: "amber", Info: "blue" };
const zoneColors = ["var(--color-primary)", "var(--color-signal-green)", "var(--color-alert-amber)", "var(--color-violet)"];

function HealthBanner({ health }: { health: number }) {
  const status = health >= 85 ? "Healthy" : health >= 70 ? "Watch" : "At risk";
  return (
    <Card className="mb-6">
      <div className="flex flex-wrap items-center gap-6">
        <Gauge value={health} label="Health Score" size={132} />
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2">
            <h2 className="text-body-md font-semibold text-ice-white">Facility Health</h2>
            <Chip tone={health >= 85 ? "green" : health >= 70 ? "amber" : "red"}>{status}</Chip>
            <span className="text-caption text-signal-green">▲ 2 this week</span>
          </div>
          <p className="mt-2 text-body-sm text-steel-slate">
            All six agents reporting normal. No systemic risk detected across energy, assets,
            occupancy, security, or cost domains.
          </p>
        </div>
        <div className="hidden items-center gap-5 md:flex">
          <div className="text-right">
            <div className="font-mono text-body-md text-ice-white">{fmtInt(2450)}</div>
            <div className="text-caption text-steel-slate">Assets monitored</div>
          </div>
          <div className="h-8 w-px bg-hairline-slate" />
          <div className="text-right">
            <div className="font-mono text-body-md text-signal-green">{fmtPct(23)}</div>
            <div className="text-caption text-steel-slate">Cost reduced</div>
          </div>
          <div className="h-8 w-px bg-hairline-slate" />
          <div className="text-right">
            <div className="font-mono text-body-md text-ice-white">{fmtMoney(1568000, true)}</div>
            <div className="text-caption text-steel-slate">ROI generated</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function Overview() {
  const { data, loading, error, refresh } = useApiData<OverviewPayload>("/api/dashboards/overview", EMPTY);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-36" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Icon name="alert" className="text-alert-red" size={32} />
        <div>
          <p className="text-body-md font-semibold text-ice-white">Failed to load telemetry</p>
          <p className="mt-1 text-body-sm text-steel-slate">{error} — is the backend running on :8000?</p>
        </div>
        <Button variant="secondary" onClick={refresh}>Retry</Button>
      </div>
    );
  }

  const { kpis, energy, maintenance, occupancy, security, intelligence, alerts } = data;
  const hourly = energy.hourly.map((h) => ({ label: h.label, value: h.electricity_kwh }));

  return (
    <div>
      <PageIntro
        title="Facility Operations"
        subtitle={`${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · Last updated ${new Date().toLocaleTimeString("en-US", { hour12: false })}`}
        agent="Facility Intelligence Engine"
        actions={
          <Button variant="secondary" size="sm" onClick={refresh}>
            <Icon name="refresh" size={14} /> Refresh
          </Button>
        }
      />

      <HealthBanner health={kpis.facility_health} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Energy" value={`${kpis.energy_mwh.toFixed(2)} MWh`} icon="bolt" delta="▲ 4%" deltaTone="green" sub={`▼ 4% vs baseline · ${fmtMoney(energy.cost_savings)} saved`} />
        <KpiCard label="Assets Monitored" value={fmtInt(maintenance.assets_monitored)} icon="wrench" delta="▲ 12 failures predicted" deltaTone="amber" sub={`${maintenance.maintenance_tickets} open tickets`} />
        <KpiCard label="Occupancy Rate" value={fmtPct(occupancy.occupancy_rate_pct)} icon="users" delta={`${fmtInt(occupancy.active_visitors)} visitors`} deltaTone="steel" sub="Forecast accuracy 84%" />
        <KpiCard label="Security Events" value={fmtInt(security.events_today)} icon="shield" delta={`${fmtInt(security.unauthorized_access)} unauthorized`} deltaTone="red" sub="142 doors monitored" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader
            title="Energy Consumption — Last 24h"
            subtitle="HVAC 45% · Lighting 28% · Equipment 18% · Other 9%"
          />
          <div className="pt-2">
            <AreaChart data={hourly} color="var(--color-primary)" highlight={(p) => p.value > 65} pointLabel={(p) => `${p.value} kWh`} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Active Alerts" subtitle={`${alerts.length} open`} right={
            <a href="/alerts" className="text-caption font-medium text-primary hover:underline">View all →</a>
          } />
          <ul role="list" className="divide-y divide-hairline-slate">
            {alerts.length === 0 && <li className="py-8 text-center text-body-sm text-steel-slate">All clear</li>}
            {alerts.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-3">
                <Chip tone={sevTone[a.severity] ?? "steel"}>{a.severity}</Chip>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm text-ice-white">{a.title}</p>
                  <p className="text-caption text-steel-slate">{a.agent} · {fmtTimeAgo(a.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="AI Recommendations" subtitle="Generated by the Facility Intelligence Engine" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {intelligence.recommendations.slice(0, 3).map((r, i) => (
            <div key={r.title} className="flex flex-col justify-between rounded-card border border-hairline-slate bg-elevated-slate p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-lg bg-panel-slate p-2 text-primary">
                  <Icon name={(["bolt", "wrench", "users", "shield", "dollar"] as IconName[])[i] ?? "sparkles"} size={16} />
                </span>
                <p className="text-body-sm text-ice-white">{r.title}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Chip tone={r.status === "Applied" ? "green" : "blue"}>{r.impact}</Chip>
                <Button variant="secondary" size="sm" onClick={() => toast(`Applied: ${r.title}`)}>Apply</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Zone Occupancy" subtitle="Today, 15:00" />
          <div className="space-y-4 pt-2">
            {occupancy.zones.map((z, i) => (
              <div key={z.zone} className="flex items-center gap-3 text-body-sm">
                <span className="w-32 truncate text-steel-slate">{z.zone}</span>
                <div className="relative h-6 flex-1 overflow-hidden rounded-control bg-elevated-slate">
                  <div className="h-full rounded-control" style={{ width: `${Math.min(100, z.utilization_pct)}%`, background: zoneColors[i] }} role="img" aria-label={`${z.zone} ${z.utilization_pct}%`} />
                </div>
                <span className="w-12 text-right font-mono text-caption text-ice-white">{Math.round(z.utilization_pct)}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Security Posture" subtitle="Last 24h" />
          <div className="pt-2">
            <Bars
              horizontal
              data={[
                { label: "Red", value: security.severity_counts.Red, color: "var(--color-alert-red)", display: `${security.severity_counts.Red} events` },
                { label: "Amber", value: security.severity_counts.Amber, color: "var(--color-alert-amber)", display: `${security.severity_counts.Amber} events` },
                { label: "Blue", value: security.severity_counts.Blue, color: "var(--color-primary)", display: `${security.severity_counts.Blue} events` },
              ]}
            />
            <div className="mt-4 flex items-center justify-between rounded-card border border-hairline-slate bg-elevated-slate px-4 py-3">
              <span className="text-caption text-steel-slate">Unauthorized attempts</span>
              <span className="font-mono text-body-md text-alert-red">{security.unauthorized_access}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent Facility Activity" />
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[720px] text-left text-body-sm">
            <thead>
              <tr className="text-caption uppercase tracking-wide text-steel-slate">
                <th className="py-2 pr-4 font-medium">Time</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Detail</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-slate">
              {alerts.slice(0, 5).map((a) => (
                <tr key={a.id} className="text-steel-slate">
                  <td className="py-3 pr-4 font-mono text-caption">{fmtTimeAgo(a.created_at)}</td>
                  <td className="py-3 pr-4 text-ice-white">{a.agent.replace(" Agent", "")}</td>
                  <td className="max-w-[280px] truncate py-3 pr-4">{a.title}</td>
                  <td className="py-3 pr-4"><Chip tone={sevTone[a.severity] ?? "steel"}>{a.severity}</Chip></td>
                  <td className="py-3"><Chip tone="violet">{a.agent}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

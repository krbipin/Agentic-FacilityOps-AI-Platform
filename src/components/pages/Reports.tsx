"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AreaChart } from "@/components/charts/AreaChart";
import { Bars } from "@/components/charts/Bars";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/icons";
import { KpiCard } from "@/components/ui/KpiCard";
import { TextField, SelectField } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { useApiData, type ReportsPayload } from "@/lib/api";
import { fmtInt, fmtMoney, fmtPct } from "@/lib/format";

const EMPTY: ReportsPayload = {
  facility: { name: "", facility_type: "", location: "" },
  period: "",
  generated_at: "",
  data_through: "",
  narrative: "",
  kpis: { cost_reduction_pct: 0, roi_generated: 0, facility_health: 0, optimizations: 0 },
  spend_trend: { this_quarter: 0, budget: 0, prior_year: 0 },
  scorecards: [],
  sustainability: { carbon_reduction_pct: 0, renewables_pct: 0, co2_trend: [] },
  insights: [],
  agent_performance: [],
  energy: { facility: { name: "", facility_type: "", location: "" }, agent: "", total_today_kwh: 0, total_today_mwh: 0, cost_savings: 0, efficiency_score: 0, efficiency_target: 85, carbon_reduction_pct: 0, hvac_efficiency_pct: 0, hvac_setpoint_c: 0, hvac_avg_temp_c: 0, hvac_run_hours: 0, co2_saved_kg: 0, split: { hvac: 0, lighting: 0, equipment: 0, other: 0 }, wastage_insights: [], change_vs_prev_pct: 0, change_vs_baseline_pct: 0, anomalies: [], anomaly_count_today: 0, forecast: [], peak_day: null, hourly: [] },
  maintenance: { facility: { name: "", facility_type: "", location: "" }, agent: "", assets_monitored: 0, maintenance_tickets: 0, predicted_failures: 0, downtime_reduction_pct: 0, health_distribution: { Excellent: 0, Good: 0, Warning: 0, Critical: 0 }, predicted: [], spend_mtd: 0, cost_avoided: 0, mttr_hours: 0, asset_classes: 0, new_this_week: 0, backlog: 0, attention: 0, improved: false },
  occupancy: { facility: { name: "", facility_type: "", location: "" }, agent: "", occupancy_rate_pct: 0, active_visitors: 0, zones: [], forecast_bands: [], forecast_accuracy_pct: 0, zone_timestamp: "", delta_vs_yesterday_pct: 0, crowding_alerts: [], heatmap: [], meeting_rooms: [], space_optimizations: [], today_total: 0 },
  security: { facility: { name: "", facility_type: "", location: "" }, agent: "", events_today: 0, unauthorized_access: 0, active_visitors: 0, severity_counts: { Red: 0, Amber: 0, Blue: 0 }, doors: { controlled_doors: 0, monitored_zones: 0 }, burst_hours: [], events: [], camera_uptime_pct: 0, cctv_events: [], visitors: [], security_recommendations: [] },
  cost: { facility: { name: "", facility_type: "", location: "" }, agent: "", total_spend: 0, total_budget: 0, cost_reduction_pct: 0, roi_generated: 0, optimizations: 0, distribution: {}, categories: [], facility_health: 0, savings: [], monthly_trend: [], vendor_spend: [], realized_savings: 0, roi_multiple: 0 },
  intelligence: { facility: { name: "", facility_type: "", location: "" }, engine: "", facility_health: 0, agent_health: {}, kpis: { cost_reduction_pct: 0, roi_generated: 0, facility_health: 0, optimizations: 0 }, correlations: [], anomaly_sources: [], anomaly_feed: [], collaboration: [], forecasts: [], recommendations: [], optimizations: 0, roi_multiple: 0, explanation: "" },
};

const DOMAIN_ROUTES: Record<string, string> = {
  Energy: "/energy",
  Maintenance: "/maintenance",
  Occupancy: "/occupancy",
  Security: "/security",
  Cost: "/cost",
};

export function Reports() {
  const { data, loading, error, refresh } = useApiData<ReportsPayload>("/api/dashboards/reports", EMPTY, 15000);
  const { toast } = useToast();
  const router = useRouter();
  const [scheduleOpen, setScheduleOpen] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading report">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
          <Skeleton className="h-40" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
        <Skeleton className="h-56" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Icon name="chart" className="text-violet" size={32} />
        <div>
          <p className="text-body-md font-semibold text-ice-white">Report unavailable</p>
          <p className="mt-1 text-body-sm text-steel-slate">{error} — check the backend service and try again.</p>
        </div>
        <Button variant="secondary" onClick={refresh}>Retry</Button>
      </div>
    );
  }

  const { kpis, spend_trend, scorecards, sustainability, insights, agent_performance } = data;
  const spendAllZero = spend_trend.this_quarter === 0 && spend_trend.budget === 0 && spend_trend.prior_year === 0;
  const carbon = sustainability.carbon_reduction_pct;
  const sustainSubtitle = carbon > 0
    ? `Carbon ↓ ${fmtPct(carbon)} · renewables ${fmtPct(sustainability.renewables_pct)}`
    : `Carbon ${fmtPct(carbon)} · renewables ${fmtPct(sustainability.renewables_pct)}`;

  return (
    <div>
      <PageIntro
        title="Executive Report"
        subtitle={`${data.period} · ${data.facility.name}`}
        agent="Facility Intelligence Engine"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => toast("PDF export not available in this demo", "info")}>
              <Icon name="download" size={14} /> Generate PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setScheduleOpen(true)}>
              <Icon name="calendar" size={14} /> Schedule delivery
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
        <Card className="p-card-padding">
          <CardHeader title="Executive Summary" subtitle="This quarter" />
          {data.narrative ? (
            <p className="font-headline-lg text-[1.5rem] leading-relaxed text-ice-white">{data.narrative}</p>
          ) : (
            <p className="text-body-sm text-steel-slate">No narrative available for this period.</p>
          )}
          <p className="mt-4 font-mono text-caption text-steel-slate">
            Spend {fmtMoney(spend_trend.this_quarter)} · Budget {fmtMoney(spend_trend.budget)} · Prior year {fmtMoney(spend_trend.prior_year)}
          </p>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <KpiCard label="Cost Reduction" value={fmtPct(kpis.cost_reduction_pct)} icon="dollar" delta="vs last month" deltaTone="green" sub="Operational spend" />
          <KpiCard label="ROI Generated" value={fmtMoney(kpis.roi_generated, true)} icon="trendingUp" delta={`${data.cost.roi_multiple.toFixed(1)}x`} deltaTone="green" sub="AI optimization value" />
          <KpiCard label="Facility Health" value={`${kpis.facility_health}/100`} icon="cpu" sub="Per-agent health sub-scores" valueTone="violet" />
          <KpiCard label="Optimizations" value={fmtInt(kpis.optimizations)} icon="sparkles" sub="Applied live" />
        </div>
      </div>

      <Card className="mt-6 p-card-padding">
        <CardHeader
          title="Spend vs Budget vs Prior Year"
          subtitle={`This quarter · operational spend down ${fmtPct(kpis.cost_reduction_pct)}`}
        />
        {spendAllZero ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Icon name="chart" className="text-steel-slate" size={28} />
            <p className="text-body-sm text-ice-white">No spend data for this period</p>
            <p className="text-caption text-steel-slate">Enter energy readings and assets to build the report.</p>
          </div>
        ) : (
          <div className="pt-2">
            <Bars
              height={200}
              max={Math.max(spend_trend.this_quarter, spend_trend.budget, spend_trend.prior_year) * 1.1}
              data={[
                { label: "This Q", value: spend_trend.this_quarter, color: "var(--color-signal-green)", display: fmtMoney(spend_trend.this_quarter, true) },
                { label: "Budget", value: spend_trend.budget, color: "var(--color-primary)", display: fmtMoney(spend_trend.budget, true) },
                { label: "Prior yr", value: spend_trend.prior_year, color: "var(--color-steel-slate)", display: fmtMoney(spend_trend.prior_year, true) },
              ]}
            />
            <p className="mt-2 flex items-center gap-1.5 text-caption text-signal-green">
              <Icon name="trendingDown" size={12} /> {fmtMoney(spend_trend.prior_year - spend_trend.this_quarter, true)} saved vs prior year
            </p>
          </div>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {scorecards.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-2 py-8 text-center">
            <Icon name="cpu" className="text-steel-slate" size={28} />
            <p className="text-body-sm text-ice-white">No domain scorecards available</p>
            <p className="text-caption text-steel-slate">Scorecards appear once agents have data to analyze.</p>
          </div>
        )}
        {scorecards.map((s) => (
          <Card key={s.domain} className="p-card-padding">
            <button
              type="button"
              onClick={() => router.push(DOMAIN_ROUTES[s.domain] ?? "/")}
              aria-label={`Open ${s.domain} dashboard`}
              className="w-full cursor-pointer text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">{s.domain}</span>
                <Chip tone="violet">{s.score}/100</Chip>
              </div>
              <div className="mt-2 font-kpi-value text-kpi-value max-md:text-kpi-value-mobile text-ice-white">{s.score}</div>
              <p className="mt-1 text-caption text-steel-slate">{s.note}</p>
            </button>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="p-card-padding">
          <CardHeader title="Sustainability" subtitle={sustainSubtitle} />
          {sustainability.co2_trend.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Icon name="chart" className="text-steel-slate" size={28} />
              <p className="text-body-sm text-ice-white">No CO₂ data for this period</p>
              <p className="text-caption text-steel-slate">Daily readings will appear here once energy data is recorded.</p>
            </div>
          ) : (
            <div className="pt-2">
              <AreaChart
                data={sustainability.co2_trend.map((p) => ({ label: p.date.slice(5), value: Math.round(p.co2_kg) }))}
                color="var(--color-signal-green)"
                fill="var(--color-signal-green)"
                pointLabel={(p) => `${fmtInt(p.value)} kg`}
              />
            </div>
          )}
          <div className="mt-4 flex items-center justify-between rounded-control border border-hairline-slate bg-elevated-slate px-4 py-3">
            <span className="text-caption text-steel-slate">CO₂-eq trend · latest 7 daily readings</span>
            <span className="font-mono text-body-md text-signal-green">{carbon > 0 ? `−${fmtPct(carbon)}` : fmtPct(carbon)}</span>
          </div>
        </Card>

        <Card className="p-card-padding">
          <CardHeader title="Executive Intelligence" subtitle="Plain-language insights" />
          <ul role="list" className="space-y-3">
            {insights.length === 0 && (
              <li className="flex flex-col items-center gap-2 py-8 text-center">
                <Icon name="sparkles" className="text-steel-slate" size={24} />
                <p className="text-caption text-steel-slate">No insights available this period.</p>
              </li>
            )}
            {insights.map((ins) => (
              <li key={ins} className="flex items-start gap-3 rounded-control border border-hairline-slate bg-elevated-slate p-4">
                <span className="mt-0.5 shrink-0 text-violet"><Icon name="sparkles" size={16} /></span>
                <p className="text-body-sm text-ice-white">{ins}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6 p-card-padding">
        <CardHeader title="Agent Performance" subtitle="Health scores across all agents" />
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[640px] text-left text-body-sm">
            <thead>
              <tr className="text-caption uppercase tracking-wide text-steel-slate">
                <th scope="col" className="py-2 pr-4 font-medium">Agent</th>
                <th scope="col" className="py-2 pr-4 font-medium">Health</th>
                <th scope="col" className="py-2 pr-4 font-medium">Cost reduction</th>
                <th scope="col" className="py-2 pr-4 font-medium">ROI</th>
                <th scope="col" className="py-2 font-medium">Downtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-slate">
              {agent_performance.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-caption text-steel-slate">No agent data available.</td>
                </tr>
              )}
              {agent_performance.map((a) => (
                <tr key={a.agent} className="text-steel-slate">
                  <td className="py-3 pr-4 text-ice-white">{a.agent}</td>
                  <td className="py-3 pr-4"><Chip tone="violet">{a.health}/100</Chip></td>
                  <td className="py-3 pr-4 font-mono text-caption">{a.cost_reduction}</td>
                  <td className="py-3 pr-4 font-mono text-caption">{a.roi}</td>
                  <td className="py-3 font-mono text-caption">{a.downtime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-6 text-caption text-steel-slate">
        Prepared by FacilityOps AI · Generated {data.generated_at.slice(0, 10)} · data through {data.data_through.slice(0, 10)}
      </p>

      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule Report Delivery"
        footer={
          <>
            <Button variant="secondary" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={() => { setScheduleOpen(false); toast("Delivery scheduling not connected in this demo", "info"); }}>
              Schedule
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Recipients" defaultValue="alex.morgan@facilityops.ai" />
          <SelectField label="Cadence" defaultValue="Weekly — Mondays">
            <option>Daily</option>
            <option>Weekly — Mondays</option>
            <option>Monthly — 1st</option>
          </SelectField>
          <fieldset>
            <legend className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">Channels</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Email", "Teams"].map((c) => (
                <label key={c} className="inline-flex cursor-pointer items-center gap-1.5 rounded-control border border-hairline-slate px-3 py-1.5 text-caption text-ice-white">
                  <input type="checkbox" defaultChecked className="accent-[var(--color-primary)]" /> {c}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Modal>
    </div>
  );
}

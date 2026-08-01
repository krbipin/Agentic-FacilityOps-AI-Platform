"use client";

import { AreaChart } from "@/components/charts/AreaChart";
import { Donut, DonutLegend } from "@/components/charts/Donut";
import { Gauge } from "@/components/charts/Gauge";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { KpiCard } from "@/components/ui/KpiCard";
import { Icon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { useApiData, type EnergyPayload } from "@/lib/api";
import { fmtInt, fmtMoney, fmtPct } from "@/lib/format";

const EMPTY: EnergyPayload = {
  facility: { name: "", facility_type: "", location: "" },
  agent: "", total_today_kwh: 0, total_today_mwh: 0, cost_savings: 0, efficiency_score: 0, efficiency_target: 85,
  carbon_reduction_pct: 0, hvac_efficiency_pct: 0, hvac_setpoint_c: 0, hvac_avg_temp_c: 0,
  hvac_run_hours: 0, co2_saved_kg: 0, split: { hvac: 0, lighting: 0, equipment: 0, other: 0 },
  wastage_insights: [], change_vs_prev_pct: 0, change_vs_baseline_pct: 0,
  anomalies: [], anomaly_count_today: 0, forecast: [], peak_day: null, hourly: [],
};

const SPLIT_COLORS = {
  hvac: "var(--color-primary)",
  lighting: "var(--color-signal-green)",
  equipment: "var(--color-alert-amber)",
  other: "var(--color-steel-slate)",
};

const deltaLabel = (pct: number, suffix: string) =>
  `${pct <= 0 ? "▼" : "▲"} ${Math.abs(pct).toFixed(1)}% ${suffix}`;
const deltaTone = (pct: number) => (pct <= 0 ? "green" : "red");

export function Energy() {
  const { data, loading, error, refresh } = useApiData<EnergyPayload>("/api/dashboards/energy", EMPTY, 15000);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-9 w-72" />
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
        <p className="text-body-md font-semibold text-ice-white">Failed to load energy telemetry</p>
        <Button variant="secondary" onClick={refresh}>Retry</Button>
      </div>
    );
  }

  const actual = data.hourly.map((h) => ({ label: h.label, value: h.electricity_kwh }));
  const forecast = data.forecast.map((f) => ({ label: f.weekday, value: f.electricity_kwh }));
  const split = data.split;
  const donutSegments = [
    { label: "HVAC", value: split.hvac, color: SPLIT_COLORS.hvac },
    { label: "Lighting", value: split.lighting, color: SPLIT_COLORS.lighting },
    { label: "Equipment", value: split.equipment, color: SPLIT_COLORS.equipment },
    { label: "Other", value: split.other, color: SPLIT_COLORS.other },
  ];
  const todayKwh = (split.hvac / 100) * data.total_today_kwh;
  const legend = [
    { label: "HVAC", value: `${Math.round(todayKwh)} kWh`, color: SPLIT_COLORS.hvac, pct: split.hvac },
    { label: "Lighting", value: `${Math.round(data.total_today_kwh * split.lighting / 100)} kWh`, color: SPLIT_COLORS.lighting, pct: split.lighting },
    { label: "Equipment", value: `${Math.round(data.total_today_kwh * split.equipment / 100)} kWh`, color: SPLIT_COLORS.equipment, pct: split.equipment },
    { label: "Other", value: `${Math.round(data.total_today_kwh * split.other / 100)} kWh`, color: SPLIT_COLORS.other, pct: split.other },
  ];

  return (
    <div>
      <PageIntro
        title="Energy Intelligence"
        subtitle="Deep-dive into consumption, distribution and efficiency"
        agent={data.agent}
        actions={<Button variant="secondary" size="sm" onClick={refresh}><Icon name="refresh" size={14} /> Refresh</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Energy" value={`${data.total_today_mwh.toFixed(2)} MWh`} icon="bolt" delta={deltaLabel(data.change_vs_prev_pct, "vs yesterday")} deltaTone={deltaTone(data.change_vs_prev_pct)} sub={`${fmtInt(data.total_today_kwh)} kWh today`} />
        <KpiCard label="Cost Savings" value={fmtMoney(data.cost_savings)} icon="dollar" delta={deltaLabel(data.change_vs_baseline_pct, "vs baseline")} deltaTone={deltaTone(data.change_vs_baseline_pct)} sub="This month to date" />
        <KpiCard label="Efficiency Score" value={fmtPct(data.efficiency_score)} icon="gauge" sub={
          <span className="block">
            Target {fmtPct(data.efficiency_target)}
            <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-elevated-slate">
              <span className="block h-full rounded-full bg-signal-green" style={{ width: `${Math.min(100, (data.efficiency_score / data.efficiency_target) * 100)}%` }} />
            </span>
          </span>
        } />
        <KpiCard label="Carbon Reduction" value={fmtPct(data.carbon_reduction_pct)} icon="activity" sub={`CO₂-eq ${(data.co2_saved_kg / 1000).toFixed(1)} t saved`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader title="Consumption vs Forecast" subtitle="Actual (24h) · dashed forecast (7d) · red markers = AI anomalies" />
          <div className="pt-2">
            <AreaChart
              data={actual}
              secondary={{ data: forecast, color: "var(--color-violet)" }}
              highlight={(p) => data.anomalies.some((a) => Math.abs(a.electricity_kwh - p.value) < 0.6)}
              pointLabel={(p) => `${p.value} kWh`}
            />
          </div>
          <div className="mt-3 flex items-center gap-4 text-caption text-steel-slate">
            <span className="inline-flex items-center gap-1.5"><span className="h-1 w-4 rounded bg-primary" /> Actual</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded border-t-2 border-dashed border-violet" /> Forecast</span>
            <span className="ml-auto">{data.anomaly_count_today} anomaly{data.anomaly_count_today === 1 ? "" : "ies"} detected today</span>
          </div>
        </Card>

        <Card>
          <CardHeader title="Energy Distribution" subtitle="Share of total consumption" />
          <div className="flex flex-col items-center gap-5 pt-2 sm:flex-row">
            <Donut segments={donutSegments} centerValue={fmtPct(100)} centerLabel="Today" size={150} />
            <div className="w-full flex-1"><DonutLegend items={legend} /></div>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="HVAC Efficiency" subtitle="Setpoint vs actual" />
          <div className="flex items-center gap-6 pt-2">
            <Gauge value={data.hvac_efficiency_pct} label="HVAC efficiency" size={120} />
            <div className="flex-1">
              <div className="flex items-start gap-2 rounded-card border border-alert-amber/30 bg-alert-amber/10 p-3">
                <Icon name="alert" className="mt-0.5 shrink-0 text-alert-amber" size={16} />
                <p className="text-body-sm text-ice-white">
                  {data.wastage_insights[0]
                    ? `${data.wastage_insights[0].title} — potential savings `
                    : "No active wastage insights right now."}
                  {data.wastage_insights[0] && (
                    <span className="font-mono text-signal-green">{data.wastage_insights[0].impact}</span>
                  )}
                </p>
              </div>
              <div className="mt-3 space-y-2 text-body-sm text-steel-slate">
                <div className="flex justify-between"><span>Setpoint</span><span className="font-mono text-ice-white">{data.hvac_setpoint_c.toFixed(1)}°C</span></div>
                <div className="flex justify-between"><span>Actual avg</span><span className="font-mono text-ice-white">{data.hvac_avg_temp_c.toFixed(1)}°C</span></div>
                <div className="flex justify-between"><span>Run hours today</span><span className="font-mono text-ice-white">{data.hvac_run_hours.toFixed(1)} h</span></div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Wastage Insights" subtitle="Energy Agent recommendations" />
          <ul role="list" className="divide-y divide-hairline-slate">
            {data.wastage_insights.map((w) => (
              <li key={w.title} className="flex items-center gap-3 py-3">
                <Icon name="bolt" className="shrink-0 text-primary" size={16} />
                <span className="min-w-0 flex-1 text-body-sm text-ice-white">{w.title}</span>
                <Chip tone="amber">{w.status}</Chip>
                <span className="font-mono text-caption text-signal-green">{w.impact}</span>
                <Button variant="secondary" size="sm" onClick={() => toast(`Applied: ${w.title}`)}>Apply</Button>
              </li>
            ))}
            {data.wastage_insights.length === 0 && (
              <li className="py-4 text-caption text-steel-slate">No wastage insights right now.</li>
            )}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Energy Usage — Last 24h" subtitle="Hourly telemetry" />
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[640px] text-left text-body-sm">
            <thead>
              <tr className="text-caption uppercase tracking-wide text-steel-slate">
                <th className="py-2 pr-4 font-medium">Time</th>
                <th className="py-2 pr-4 font-medium">Electricity (kWh)</th>
                <th className="py-2 pr-4 font-medium">HVAC (kWh)</th>
                <th className="py-2 pr-4 font-medium">Water (L)</th>
                <th className="py-2 font-medium">Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-slate">
              {data.hourly.map((h) => {
                const flagged = data.anomalies.some((a) => Math.abs(a.electricity_kwh - h.electricity_kwh) < 0.6);
                return (
                  <tr key={`${h.label}-${h.electricity_kwh}`} className="text-steel-slate">
                    <td className="py-2.5 pr-4 font-mono text-caption">{h.label}</td>
                    <td className="py-2.5 pr-4 font-mono text-ice-white">{h.electricity_kwh.toFixed(1)}</td>
                    <td className="py-2.5 pr-4 font-mono">{h.hvac_kwh.toFixed(1)}</td>
                    <td className="py-2.5 pr-4 font-mono">{h.water_l.toFixed(1)}</td>
                    <td className="py-2.5">{flagged ? <Chip tone="red">Anomaly</Chip> : <span className="text-caption text-steel-slate">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

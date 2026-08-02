"use client";

import { AreaChart } from "@/components/charts/AreaChart";
import { Heatmap } from "@/components/charts/Heatmap";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip, type Tone } from "@/components/ui/Chip";
import { KpiCard } from "@/components/ui/KpiCard";
import { Icon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { useApiData, type OccupancyPayload } from "@/lib/api";
import { fmtInt, fmtPct } from "@/lib/format";

const EMPTY: OccupancyPayload = {
  facility: { name: "", facility_type: "", location: "" }, agent: "", occupancy_rate_pct: 0,
  active_visitors: 0, zones: [], forecast_bands: [], forecast_accuracy_pct: 0,
  zone_timestamp: "", delta_vs_yesterday_pct: 0, today_total: 0, heatmap: [],
  crowding_alerts: [], meeting_rooms: [], space_optimizations: [],
};

const deltaLabel = (pct: number, suffix: string) =>
  `${pct <= 0 ? "▼" : "▲"} ${Math.abs(pct).toFixed(1)}% ${suffix}`;

const utilColor = (pct: number) =>
  pct > 90 ? "var(--color-alert-red)" : pct >= 75 ? "var(--color-alert-amber)" : pct >= 60 ? "var(--color-primary)" : "var(--color-signal-green)";

const utilTone = (pct: number): Tone => (pct > 90 ? "red" : pct >= 75 ? "amber" : pct >= 60 ? "blue" : "green");

export function Occupancy() {
  const { data, loading, error, refresh } = useApiData<OccupancyPayload>("/api/dashboards/occupancy", EMPTY, 15000);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-64" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Icon name="alert" className="text-alert-red" size={32} />
        <div>
          <p className="text-body-md font-semibold text-ice-white">Failed to load occupancy telemetry</p>
          <p className="mt-1 text-body-sm text-steel-slate">{error} — check the backend service and try again.</p>
        </div>
        <Button variant="secondary" onClick={refresh}>Retry</Button>
      </div>
    );
  }

  const totalCapacity = data.zones.reduce((s, z) => s + z.capacity, 0);
  const totalCount = data.zones.reduce((s, z) => s + z.count, 0);
  const seatsPct = totalCapacity ? Math.round((totalCount / totalCapacity) * 100) : 0;

  const days = [...new Set(data.heatmap.map((c) => c.day))];
  const hours = [...new Set(data.heatmap.map((c) => c.hour))].sort((a, b) => a - b);
  const heatCells = data.heatmap.map((c) => ({ day: c.day, hour: c.hour, value: c.density }));
  const hourRange = hours.length ? `${hours[0]}:00–${hours[hours.length - 1]}:00` : null;
  const peakForecast = data.zones.reduce((m, z) => Math.max(m, z.forecast_count), 0);
  const crowdingSub = data.crowding_alerts.length
    ? (() => {
        const names = data.crowding_alerts.slice(0, 3).map((c) => c.zone).join(" · ");
        return data.crowding_alerts.length > 3 ? `${names} +${data.crowding_alerts.length - 3} more` : names;
      })()
    : "No crowded zones right now";

  return (
    <div>
      <PageIntro
        title="Occupancy Intelligence"
        subtitle="Space utilization, density and capacity forecasting"
        agent={data.agent}
        actions={<Button variant="secondary" size="sm" onClick={refresh}><Icon name="refresh" size={14} /> Refresh</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Occupancy Rate" value={fmtPct(data.occupancy_rate_pct)} icon="users" delta={deltaLabel(data.delta_vs_yesterday_pct, "vs yesterday")} deltaTone={data.delta_vs_yesterday_pct > 0 ? "amber" : "green"} sub={`Across ${data.zones.length} zones`} />
        <KpiCard label="Active Visitors" value={fmtInt(data.active_visitors)} icon="activity" delta="On site now" deltaTone="green" sub={`${fmtInt(data.today_total)} check-ins today`} />
        <KpiCard label="Seats Utilized" value={`${fmtInt(totalCount)} / ${fmtInt(totalCapacity)}`} icon="grid" delta={fmtPct(seatsPct)} deltaTone="steel" sub="Across all zones" />
        <KpiCard label="Crowding Alerts" value={fmtInt(data.crowding_alerts.length)} icon="alert" delta={data.crowding_alerts.length ? "Requires attention" : "All clear"} deltaTone={data.crowding_alerts.length ? "amber" : "green"} sub={crowdingSub} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <Card className="p-card-padding">
          <CardHeader title="Building Density" subtitle={`7-day occupancy heatmap${hourRange ? ` (${hourRange})` : ""}`} />
          {heatCells.length > 0 ? (
            <>
              <div className="overflow-x-auto pt-2">
                <Heatmap cells={heatCells} days={days} hours={hours} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-steel-slate">
                <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm bg-primary" /> Low</span>
                <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm bg-signal-green" /> Moderate</span>
                <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm bg-alert-amber" /> High</span>
                <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm bg-alert-red" /> Crowded</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Icon name="chart" className="text-steel-slate" size={28} />
              <p className="text-body-sm text-ice-white">No heatmap data available yet</p>
              <p className="text-caption text-steel-slate">The Occupancy Agent has not recorded zone readings for this facility.</p>
            </div>
          )}
        </Card>

        <Card className="p-card-padding">
          <CardHeader title="Zone Occupancy" subtitle={`Today · ${data.zone_timestamp}`} />
          <div className="space-y-4 pt-2">
            {data.zones.map((z) => (
              <div key={z.zone} className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-body-sm sm:gap-x-3">
                <span className="w-24 shrink-0 truncate text-steel-slate sm:w-32">{z.zone}</span>
                <div className="relative h-6 min-w-[64px] flex-1 overflow-hidden rounded-control bg-elevated-slate">
                  <div className="h-full rounded-control" style={{ width: `${z.utilization_pct}%`, background: utilColor(z.utilization_pct) }} role="img" aria-label={`${z.zone} ${z.utilization_pct}%`} />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-caption text-ice-white sm:w-12 sm:text-body-sm">{Math.round(z.utilization_pct)}%</span>
                <Chip tone={utilTone(z.utilization_pct)} className="ml-auto sm:ml-0">{z.count}/{z.capacity}</Chip>
              </div>
            ))}
            {data.zones.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Icon name="grid" className="text-steel-slate" size={28} />
                <p className="text-body-sm text-ice-white">No zone readings yet</p>
                <p className="text-caption text-steel-slate">Zone utilization will appear once occupancy data is recorded.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-card-padding">
        <CardHeader title="Capacity Forecast" subtitle={`Per-zone forecast · ${fmtPct(data.forecast_accuracy_pct)} accuracy`} />
        <div className="pt-2">
          <AreaChart
            data={data.zones.map((z) => ({ label: z.zone.slice(0, 10), value: z.forecast_count }))}
            color="var(--color-signal-green)"
            fill="var(--color-signal-green)"
            highlight={(p) => peakForecast > 0 && p.value === peakForecast}
            pointLabel={(p) => `${p.value}`}
          />
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="p-card-padding">
          <CardHeader title="Meeting Room Utilization" subtitle="Today" />
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[480px] text-left text-body-sm">
              <thead>
                <tr className="text-caption uppercase tracking-wide text-steel-slate">
                  <th scope="col" className="py-2 pr-4 font-medium">Room</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Capacity</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Avg. utilization</th>
                  <th scope="col" className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-slate">
                {data.meeting_rooms.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-caption text-steel-slate">No meeting room data available.</td>
                  </tr>
                )}
                {data.meeting_rooms.map((r) => (
                  <tr key={r.name} className="text-steel-slate">
                    <td className="py-2.5 pr-4 text-ice-white">{r.name}</td>
                    <td className="py-2.5 pr-4 font-mono text-caption">{r.capacity}</td>
                    <td className="py-2.5 pr-4 font-mono">{r.utilization_pct}%</td>
                    <td className="py-2.5"><Chip tone={r.status.toLowerCase().includes("booked") ? "blue" : "green"}>{r.status}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-card-padding">
          <CardHeader title="Space Optimization" subtitle="Occupancy Agent recommendations" />
          <ul role="list" className="divide-y divide-hairline-slate">
            {data.space_optimizations.length === 0 && (
              <li className="flex flex-col items-center gap-2 py-10 text-center">
                <Icon name="check" className="text-signal-green" size={28} />
                <p className="text-body-sm text-ice-white">No optimization suggestions right now</p>
                <p className="text-caption text-steel-slate">The Occupancy Agent will recommend changes when it spots underused space.</p>
              </li>
            )}
            {data.space_optimizations.map((r) => (
              <li key={r.title} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <Icon name="users" className="shrink-0 text-primary" size={16} />
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm text-ice-white">{r.title}</p>
                  <p className="text-caption text-steel-slate">{r.status}</p>
                </div>
                <Chip tone="green">{r.impact}</Chip>
                <Button variant="secondary" size="sm" onClick={() => toast(`Applied: ${r.title}`)}>Apply</Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

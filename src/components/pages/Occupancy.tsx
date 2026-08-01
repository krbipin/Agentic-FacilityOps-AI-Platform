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
        <p className="text-body-md font-semibold text-ice-white">Failed to load occupancy telemetry</p>
        <Button variant="secondary" onClick={refresh}>Retry</Button>
      </div>
    );
  }

  const totalCapacity = data.zones.reduce((s, z) => s + z.capacity, 0);
  const totalCount = data.zones.reduce((s, z) => s + z.count, 0);
  const seatsPct = Math.round((totalCount / totalCapacity) * 100);

  const days = [...new Set(data.heatmap.map((c) => c.day))];
  const hours = [...new Set(data.heatmap.map((c) => c.hour))].sort((a, b) => a - b);
  const heatCells = data.heatmap.map((c) => ({ day: c.day, hour: c.hour, value: c.density }));

  return (
    <div>
      <PageIntro
        title="Occupancy Intelligence"
        subtitle="Space utilization, density and capacity forecasting"
        agent={data.agent}
        actions={<Button variant="secondary" size="sm" onClick={refresh}><Icon name="refresh" size={14} /> Refresh</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Occupancy Rate" value={fmtPct(data.occupancy_rate_pct)} icon="users" delta={deltaLabel(data.delta_vs_yesterday_pct, "vs yesterday")} deltaTone="amber" sub="Near comfort ceiling" />
        <KpiCard label="Active Visitors" value={fmtInt(data.active_visitors)} icon="activity" delta="On site now" deltaTone="green" sub={`${fmtInt(data.today_total)} check-ins today`} />
        <KpiCard label="Seats Utilized" value={`${fmtInt(totalCount)} / ${fmtInt(totalCapacity)}`} icon="grid" delta={fmtPct(seatsPct)} deltaTone="steel" sub="Across all zones" />
        <KpiCard label="Crowding Alerts" value={fmtInt(data.crowding_alerts.length)} icon="alert" delta={data.crowding_alerts.length ? "Requires attention" : "All clear"} deltaTone={data.crowding_alerts.length ? "amber" : "green"} sub={data.crowding_alerts.length ? data.crowding_alerts.map((c) => c.zone).join(" · ") : "No crowded zones right now"} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader title="Building Density" subtitle="7-day occupancy heatmap (08:00–19:00)" />
          {heatCells.length > 0 ? (
            <div className="overflow-x-auto pt-2">
              <Heatmap cells={heatCells} days={days} hours={hours} />
            </div>
          ) : (
            <p className="py-8 text-center text-caption text-steel-slate">No heatmap data available yet.</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Zone Occupancy" subtitle={`Today · ${data.zone_timestamp}`} />
          <div className="space-y-4 pt-2">
            {data.zones.map((z) => (
              <div key={z.zone} className="flex items-center gap-3 text-body-sm">
                <span className="w-32 shrink-0 truncate text-steel-slate">{z.zone}</span>
                <div className="relative h-6 flex-1 overflow-hidden rounded-control bg-elevated-slate">
                  <div className="h-full rounded-control" style={{ width: `${z.utilization_pct}%`, background: utilColor(z.utilization_pct) }} role="img" aria-label={`${z.zone} ${z.utilization_pct}%`} />
                </div>
                <span className="w-12 text-right font-mono text-caption text-ice-white">{Math.round(z.utilization_pct)}%</span>
                <Chip tone={utilTone(z.utilization_pct)}>{z.count}/{z.capacity}</Chip>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Capacity Forecast" subtitle={`Next 7 days · forecast accuracy ${data.forecast_accuracy_pct}% · ± band`} />
        <div className="pt-2">
          <AreaChart
            data={data.zones.map((z) => ({ label: z.zone.slice(0, 10), value: z.forecast_count }))}
            color="var(--color-signal-green)"
            fill="var(--color-signal-green)"
            highlight={(p) => p.value === Math.max(...data.zones.map((z) => z.forecast_count))}
            pointLabel={(p) => `${p.value}`}
          />
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Meeting Room Utilization" subtitle="Today" />
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[480px] text-left text-body-sm">
              <thead>
                <tr className="text-caption uppercase tracking-wide text-steel-slate">
                  <th className="py-2 pr-4 font-medium">Room</th>
                  <th className="py-2 pr-4 font-medium">Capacity</th>
                  <th className="py-2 pr-4 font-medium">Avg. utilization</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-slate">
                {data.meeting_rooms.map((r) => (
                  <tr key={r.name} className="text-steel-slate">
                    <td className="py-2.5 pr-4 text-ice-white">{r.name}</td>
                    <td className="py-2.5 pr-4 font-mono text-caption">{r.capacity}</td>
                    <td className="py-2.5 pr-4 font-mono">{r.utilization_pct}%</td>
                    <td className="py-2.5"><Chip tone={r.status.toLowerCase().includes("booked") ? "blue" : "green"}>{r.status}</Chip></td>
                  </tr>
                ))}
              </tbody>
              {data.meeting_rooms.length === 0 && (
                <tbody>
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-caption text-steel-slate">No meeting room data available.</td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Space Optimization" subtitle="Occupancy Agent recommendations" />
          <ul role="list" className="divide-y divide-hairline-slate">
            {data.space_optimizations.map((r) => (
              <li key={r.title} className="flex flex-wrap items-center gap-3 py-3">
                <Icon name="users" className="shrink-0 text-primary" size={16} />
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm text-ice-white">{r.title}</p>
                  <p className="text-caption text-steel-slate">{r.status}</p>
                </div>
                <Chip tone="green">{r.impact}</Chip>
                <Button variant="secondary" size="sm" onClick={() => toast(`Applied: ${r.title}`)}>Apply</Button>
              </li>
            ))}
            {data.space_optimizations.length === 0 && (
              <li className="py-4 text-caption text-steel-slate">No space optimization suggestions right now.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}

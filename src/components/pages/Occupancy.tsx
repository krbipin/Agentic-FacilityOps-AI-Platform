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
};

const utilColor = (pct: number) =>
  pct > 90 ? "var(--color-alert-red)" : pct >= 75 ? "var(--color-alert-amber)" : pct >= 60 ? "var(--color-primary)" : "var(--color-signal-green)";

const utilTone = (pct: number): Tone => (pct > 90 ? "red" : pct >= 75 ? "amber" : pct >= 60 ? "blue" : "green");

export function Occupancy() {
  const { data, loading, error, refresh } = useApiData<OccupancyPayload>("/api/dashboards/occupancy", EMPTY);
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

  // Synthetic 24h heatmap from zone counts (density peaks at office hours).
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);
  const heatCells = days.flatMap((day, di) =>
    hours.map((h) => {
      const isWeekend = di >= 5;
      const office = h >= 9 && h <= 18 && !isWeekend;
      const value = data.zones[0] ? (office ? 0.35 + ((h - 8) / 11) * 0.55 : 0.08) : 0;
      return { day, hour: h, value };
    }),
  );

  return (
    <div>
      <PageIntro
        title="Occupancy Intelligence"
        subtitle="Space utilization, density and capacity forecasting"
        agent={data.agent}
        actions={<Button variant="secondary" size="sm" onClick={refresh}><Icon name="refresh" size={14} /> Refresh</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Occupancy Rate" value={fmtPct(data.occupancy_rate_pct)} icon="users" delta="▲ 5% vs yesterday" deltaTone="amber" sub="Near comfort ceiling" />
        <KpiCard label="Active Visitors" value={fmtInt(data.active_visitors)} icon="activity" delta="▲ 18" deltaTone="green" sub="Currently on site" />
        <KpiCard label="Seats Utilized" value={`${fmtInt(totalCount)} / ${fmtInt(totalCapacity)}`} icon="grid" delta={fmtPct(seatsPct)} deltaTone="steel" sub="Across all zones" />
        <KpiCard label="Crowding Alerts" value="2" icon="alert" delta="Requires attention" deltaTone="amber" sub="Office 5 · Parking L1" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader title="Building Density" subtitle="7-day occupancy heatmap (08:00–19:00)" />
          <div className="overflow-x-auto pt-2">
            <Heatmap cells={heatCells} days={days} hours={hours} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Zone Occupancy" subtitle="Today · 15:00" />
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
                {[
                  ["Boardroom B", 12, 71, "Available"],
                  ["Conf 3A", 8, 64, "Booked 14:00"],
                  ["Focus Pod 1", 2, 52, "Available"],
                  ["Training Room", 24, 58, "Booked 10:00"],
                  ["Quiet Room 4", 4, 33, "Available"],
                ].map(([room, cap, util, status]) => (
                  <tr key={room as string} className="text-steel-slate">
                    <td className="py-2.5 pr-4 text-ice-white">{room}</td>
                    <td className="py-2.5 pr-4 font-mono text-caption">{cap}</td>
                    <td className="py-2.5 pr-4 font-mono">{util}%</td>
                    <td className="py-2.5"><Chip tone={(status as string).includes("Booked") ? "blue" : "green"}>{status}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Space Optimization" subtitle="Occupancy Agent recommendations" />
          <ul role="list" className="divide-y divide-hairline-slate">
            {[
              { title: "Consolidate floors 4–5 to floor 3", impact: "$4.5k/mo", detail: "Free 22% space" },
              { title: "Convert 3 underused desks to focus pods", impact: "1.5× usage", detail: "Desk 412–414" },
              { title: "Pre-release Boardroom B if unbooked by 10:00", impact: "+6 bookings", detail: "Daily rule" },
            ].map((r) => (
              <li key={r.title} className="flex flex-wrap items-center gap-3 py-3">
                <Icon name="users" className="shrink-0 text-primary" size={16} />
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm text-ice-white">{r.title}</p>
                  <p className="text-caption text-steel-slate">{r.detail}</p>
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

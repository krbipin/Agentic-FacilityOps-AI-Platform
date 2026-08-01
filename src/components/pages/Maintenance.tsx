"use client";

import { Bars } from "@/components/charts/Bars";
import { Donut, DonutLegend } from "@/components/charts/Donut";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip, type Tone } from "@/components/ui/Chip";
import { KpiCard } from "@/components/ui/KpiCard";
import { Icon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/misc";
import { useApiData, type MaintenancePayload, type WorkOrderItem } from "@/lib/api";
import { fmtInt, fmtMoney } from "@/lib/format";

const EMPTY: MaintenancePayload = {
  facility: { name: "", facility_type: "", location: "" }, agent: "", assets_monitored: 0,
  maintenance_tickets: 0, predicted_failures: 0, downtime_reduction_pct: 0,
  health_distribution: { Excellent: 0, Good: 0, Warning: 0, Critical: 0 }, predicted: [],
  spend_mtd: 0, cost_avoided: 0, mttr_hours: 0, asset_classes: 0, new_this_week: 0,
  backlog: 0, attention: 0, improved: false,
};

const statusTone: Record<string, Tone> = { Excellent: "green", Good: "blue", Warning: "amber", Critical: "red" };
const statusColor = {
  Excellent: "var(--color-signal-green)",
  Good: "var(--color-primary)",
  Warning: "var(--color-alert-amber)",
  Critical: "var(--color-alert-red)",
};

const prioTone: Record<string, Tone> = { P1: "red", P2: "amber", P3: "blue" };

export function Maintenance() {
  const { data, loading, error, refresh } = useApiData<MaintenancePayload>("/api/dashboards/maintenance", EMPTY, 15000);
  const wo = useApiData<WorkOrderItem[]>("/api/work-orders?limit=6", [], 15000);

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_3fr]">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Icon name="alert" className="text-alert-red" size={32} />
        <p className="text-body-md font-semibold text-ice-white">Failed to load maintenance telemetry</p>
        <Button variant="secondary" onClick={refresh}>Retry</Button>
      </div>
    );
  }

  const dist = data.health_distribution;
  const donut = [
    { label: "Excellent", value: dist.Excellent, color: statusColor.Excellent },
    { label: "Good", value: dist.Good, color: statusColor.Good },
    { label: "Warning", value: dist.Warning, color: statusColor.Warning },
    { label: "Critical", value: dist.Critical, color: statusColor.Critical },
  ];

  return (
    <div>
      <PageIntro
        title="Predictive Maintenance"
        subtitle="Asset health, predicted failures and the live ticket backlog"
        agent={data.agent}
        actions={
          <Button variant="secondary" size="sm" onClick={refresh}>
            <Icon name="refresh" size={14} /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Assets Monitored" value={fmtInt(data.assets_monitored)} icon="cpu" delta={`▲ ${data.new_this_week} added`} deltaTone="steel" sub={`Across ${data.asset_classes} asset classes`} />
        <KpiCard label="Maintenance Tickets" value={fmtInt(data.maintenance_tickets)} icon="clipboard" delta={`▲ ${data.backlog}`} deltaTone="red" sub="Backlog in queue" />
        <KpiCard label="Predicted Failures" value={fmtInt(data.predicted_failures)} icon="alert" delta={`▲ ${data.attention}`} deltaTone="amber" sub="Need attention" />
        <KpiCard label="Downtime Reduction" value={`${data.downtime_reduction_pct}%`} icon="check" delta={data.improved ? "▼ improved" : "▲ declined"} deltaTone="green" sub="YoY comparison" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_3fr]">
        <Card>
          <CardHeader title="Equipment Health" subtitle={`${fmtInt(data.assets_monitored)} assets`} />
          <div className="flex flex-col items-center gap-5 pt-2 sm:flex-row">
            <Donut segments={donut} centerValue={fmtInt(data.assets_monitored)} centerLabel="assets" size={150} />
            <div className="w-full flex-1">
              <DonutLegend
                items={[
                  { label: "Excellent", value: `${dist.Excellent}%`, color: statusColor.Excellent, pct: dist.Excellent },
                  { label: "Good", value: `${dist.Good}%`, color: statusColor.Good, pct: dist.Good },
                  { label: "Warning", value: `${dist.Warning}%`, color: statusColor.Warning, pct: dist.Warning },
                  { label: "Critical", value: `${dist.Critical}%`, color: statusColor.Critical, pct: dist.Critical },
                ]}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Predicted Failures" subtitle="Top assets at risk · Maintenance Agent" />
          <ul role="list" className="divide-y divide-hairline-slate">
            {data.predicted.slice(0, 5).map((p) => (
              <li key={p.asset_id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm text-ice-white">
                    {p.name} <span className="font-mono text-caption text-steel-slate">{p.asset_id}</span>
                  </p>
                  <p className="text-caption text-steel-slate">{p.asset_type}</p>
                </div>
                <Chip tone={statusTone[p.status] ?? "steel"}>{p.status}</Chip>
                <span className="font-mono text-body-md text-alert-red">{p.risk}%</span>
                <span className="w-20 text-caption text-steel-slate">Est. {p.days_to_failure}d</span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">Schedule</Button>
                  <Button variant="ghost" size="sm">Investigate</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Health Distribution" subtitle="Fleet status by severity" />
        <div className="pt-2">
          <Bars
            horizontal
            data={[
              { label: "Excellent", value: dist.Excellent, color: statusColor.Excellent, display: `${dist.Excellent}%` },
              { label: "Good", value: dist.Good, color: statusColor.Good, display: `${dist.Good}%` },
              { label: "Warning", value: dist.Warning, color: statusColor.Warning, display: `${dist.Warning}%` },
              { label: "Critical", value: dist.Critical, color: statusColor.Critical, display: `${dist.Critical}%` },
            ]}
          />
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader title="Recent Work Orders" subtitle="Live from the work order queue" />
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[560px] text-left text-body-sm">
              <thead>
                <tr className="text-caption uppercase tracking-wide text-steel-slate">
                  <th className="py-2 pr-4 font-medium">Ticket</th>
                  <th className="py-2 pr-4 font-medium">Asset</th>
                  <th className="py-2 pr-4 font-medium">Issue</th>
                  <th className="py-2 pr-4 font-medium">Priority</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-slate">
                {wo.data.slice(0, 5).map((w) => (
                  <tr key={w.id} className="text-steel-slate">
                    <td className="py-3 pr-4 font-mono text-caption text-primary">{w.id}</td>
                    <td className="py-3 pr-4 text-ice-white">{w.asset_name}</td>
                    <td className="py-3 pr-4">{w.title}</td>
                    <td className="py-3 pr-4"><Chip tone={prioTone[w.priority] ?? "steel"}>{w.priority}</Chip></td>
                    <td className="py-3"><Chip tone={w.status === "Completed" ? "green" : w.status === "In Progress" ? "blue" : "steel"}>{w.status}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Maintenance Cost" subtitle="Month to date" />
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between rounded-card border border-hairline-slate bg-elevated-slate px-4 py-3">
              <span className="text-body-sm text-steel-slate">Spend MTD</span>
              <span className="font-mono text-body-md text-ice-white">{fmtMoney(data.spend_mtd)}</span>
            </div>
            <div className="flex items-center justify-between rounded-card border border-signal-green/30 bg-signal-green/10 px-4 py-3">
              <span className="text-body-sm text-steel-slate">Cost avoided via prediction</span>
              <span className="font-mono text-body-md text-signal-green">{fmtMoney(data.cost_avoided)}</span>
            </div>
            <div className="flex items-center justify-between rounded-card border border-hairline-slate bg-elevated-slate px-4 py-3">
              <span className="text-body-sm text-steel-slate">Average MTTR</span>
              <span className="font-mono text-body-md text-ice-white">{data.mttr_hours.toFixed(1)} h</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

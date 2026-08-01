"use client";

import { Donut, DonutLegend } from "@/components/charts/Donut";
import { AreaChart } from "@/components/charts/AreaChart";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { KpiCard } from "@/components/ui/KpiCard";
import { Icon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { useApiData, type CostPayload } from "@/lib/api";
import { fmtInt, fmtMoney } from "@/lib/format";

const EMPTY: CostPayload = {
  facility: { name: "", facility_type: "", location: "" }, agent: "", total_spend: 0, total_budget: 0,
  cost_reduction_pct: 0, roi_generated: 0, optimizations: 0, distribution: {}, categories: [], facility_health: 0,
  savings: [], monthly_trend: [], vendor_spend: [], realized_savings: 0, roi_multiple: 0,
};

const DIST_COLORS = {
  Energy: "var(--color-primary)",
  Maintenance: "var(--color-signal-green)",
  "Security Ops": "var(--color-alert-amber)",
  Administrative: "var(--color-violet)",
};

export function Cost() {
  const { data, loading, error, refresh } = useApiData<CostPayload>("/api/dashboards/cost", EMPTY, 15000);
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
        <p className="text-body-md font-semibold text-ice-white">Failed to load cost telemetry</p>
        <Button variant="secondary" onClick={refresh}>Retry</Button>
      </div>
    );
  }

  const dist = data.distribution;
  const donut = Object.entries(dist).map(([label, value]) => ({
    label,
    value,
    color: (DIST_COLORS as Record<string, string>)[label] ?? "var(--color-steel-slate)",
  }));

  const overBudget = data.categories.find((c) => c.over_budget);
  const trend = data.monthly_trend.map((p) => ({ label: p.month, value: p.amount }));

  return (
    <div>
      <PageIntro
        title="Cost Optimization"
        subtitle="Operational expenditure, savings and ROI"
        agent={data.agent}
        actions={
          <Button variant="secondary" size="sm" onClick={refresh}>
            <Icon name="refresh" size={14} /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Cost Reduction" value={`${data.cost_reduction_pct}%`} icon="dollar" delta="▼ YoY" deltaTone="green" sub="Compared to last year" />
        <KpiCard label="ROI Generated" value={fmtMoney(data.roi_generated, true)} icon="chart" delta={`${data.roi_multiple}x multiple`} deltaTone="green" sub="Since program start" />
        <KpiCard label="Facility Health" value={`${data.facility_health}/100`} icon="brain" sub="Cross-agent score" />
        <KpiCard label="Optimizations Live" value={fmtInt(data.optimizations)} icon="sparkles" sub="Applied by AI agents" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_3fr]">
        <Card>
          <CardHeader title="Cost Distribution" subtitle="This month" />
          <div className="flex flex-col items-center gap-5 pt-2 sm:flex-row">
            <Donut segments={donut} centerValue={fmtMoney(data.total_spend, true)} centerLabel="Total" size={150} />
            <div className="w-full flex-1">
              <DonutLegend
                items={donut.map((s) => ({ ...s, pct: s.value, value: fmtMoney(data.total_spend * s.value / 100) }))}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Budget Compliance" subtitle="Spend vs budget · this month" />
          <div className="space-y-4 pt-2">
            {data.categories.map((c) => (
              <div key={c.category} className="flex items-center gap-3 text-body-sm">
                <span className="w-28 shrink-0 text-steel-slate">{c.category}</span>
                <div className="relative h-6 flex-1 overflow-hidden rounded-control bg-elevated-slate">
                  <div
                    className="h-full rounded-control"
                    style={{ width: `${Math.min(100, (c.amount / c.budget) * 100)}%`, background: c.over_budget ? "var(--color-alert-red)" : "var(--color-signal-green)" }}
                    role="img"
                    aria-label={`${c.category} ${c.amount} of ${c.budget}`}
                  />
                </div>
                <span className="w-28 text-right font-mono text-caption text-ice-white">{fmtMoney(c.amount)}</span>
                {c.over_budget && <Chip tone="red">OVER</Chip>}
              </div>
            ))}
          </div>
          <p className="mt-4 text-caption text-steel-slate">
            Total {fmtMoney(data.total_spend)} of {fmtMoney(data.total_budget)} budget{overBudget && (
              <> · <span className="text-alert-red">{overBudget.category} {fmtMoney(overBudget.amount - overBudget.budget)} over</span></>
            )}
          </p>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Savings Opportunities" subtitle="Cost Optimization Agent" />
        <ul role="list" className="divide-y divide-hairline-slate">
          {data.savings.length === 0 && (
            <li className="py-8 text-center text-body-sm text-steel-slate">No savings opportunities right now</li>
          )}
          {data.savings.map((s) => (
            <li key={s.title} className="flex flex-wrap items-center gap-3 py-3">
              <Icon name="dollar" className="shrink-0 text-signal-green" size={16} />
              <span className="min-w-0 flex-1 text-body-sm text-ice-white">{s.title}</span>
              <span className="font-mono text-caption text-signal-green">{s.impact}</span>
              <Chip tone={s.status === "Applied" ? "green" : "blue"}>{s.status}</Chip>
              <Button variant="secondary" size="sm" onClick={() => toast(`Applied: ${s.title}`)}>Apply</Button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Cost Trend" subtitle={`Monthly operational spend vs budget · ${data.cost_reduction_pct}% YoY`} />
        <div className="pt-2">
          {trend.length === 0 ? (
            <p className="py-8 text-center text-body-sm text-steel-slate">No monthly trend data yet</p>
          ) : (
            <AreaChart
              data={trend}
              color="var(--color-signal-green)"
              fill="var(--color-signal-green)"
            />
          )}
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Vendor Spend" subtitle="Top vendors" />
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[480px] text-left text-body-sm">
              <thead>
                <tr className="text-caption uppercase tracking-wide text-steel-slate">
                  <th className="py-2 pr-4 font-medium">Vendor</th>
                  <th className="py-2 pr-4 font-medium">Category</th>
                  <th className="py-2 pr-4 font-medium">Spend</th>
                  <th className="py-2 font-medium">Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-slate">
                {data.vendor_spend.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-body-sm text-steel-slate">No vendor spend data</td>
                  </tr>
                )}
                {data.vendor_spend.map((v) => (
                  <tr key={v.name} className="text-steel-slate">
                    <td className="py-2.5 pr-4 text-ice-white">{v.name}</td>
                    <td className="py-2.5 pr-4">{v.category}</td>
                    <td className="py-2.5 pr-4 font-mono text-caption">{fmtMoney(v.spend)}</td>
                    <td className="py-2.5"><span className={`text-caption ${v.trend_pct > 0 ? "text-alert-red" : "text-signal-green"}`}>{v.trend_pct > 0 ? "+" : ""}{v.trend_pct}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="ROI Summary" subtitle="AI recommendations applied this quarter" />
          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { value: `${data.optimizations}`, label: "Optimizations" },
              { value: fmtMoney(data.realized_savings, true), label: "Realized savings" },
              { value: `${data.roi_multiple}x`, label: "Return multiple" },
            ].map((s) => (
              <div key={s.label} className="rounded-card border border-hairline-slate bg-elevated-slate p-4 text-center">
                <div className="font-kpi-value text-kpi-value text-signal-green">{s.value}</div>
                <div className="mt-1 text-caption text-steel-slate">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-body-sm text-steel-slate">
            Every applied recommendation is tracked with projected vs realized impact. Realized savings are
            reconciled monthly against utility and vendor invoices.
          </p>
        </Card>
      </div>
    </div>
  );
}

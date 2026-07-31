"use client";

import { Bars } from "@/components/charts/Bars";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip, type Tone } from "@/components/ui/Chip";
import { KpiCard } from "@/components/ui/KpiCard";
import { Icon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/misc";
import { useApiData, type SecurityPayload } from "@/lib/api";
import { fmtInt, fmtTimeAgo } from "@/lib/format";

const EMPTY: SecurityPayload = {
  facility: { name: "", facility_type: "", location: "" }, agent: "", events_today: 0,
  unauthorized_access: 0, active_visitors: 0, severity_counts: { Red: 0, Amber: 0, Blue: 0 },
  doors: { controlled_doors: 0, monitored_zones: 0 }, burst_hours: [], events: [],
};

const sevTone: Record<string, Tone> = { Red: "red", Amber: "amber", Blue: "blue" };
const sevColor = { Red: "var(--color-alert-red)", Amber: "var(--color-alert-amber)", Blue: "var(--color-primary)" };

export function Security() {
  const { data, loading, error, refresh } = useApiData<SecurityPayload>("/api/dashboards/security", EMPTY);

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
        <p className="text-body-md font-semibold text-ice-white">Failed to load security telemetry</p>
        <Button variant="secondary" onClick={refresh}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <PageIntro
        title="Security Monitoring"
        subtitle="Access control, incidents and visitor tracking"
        agent={data.agent}
        actions={<Button variant="secondary" size="sm" onClick={refresh}><Icon name="refresh" size={14} /> Refresh</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Security Events" value={fmtInt(data.events_today)} icon="alert" delta="Last 24h" deltaTone="steel" sub="All severities" />
        <KpiCard label="Unauthorized Access" value={fmtInt(data.unauthorized_access)} icon="shield" delta="High priority" deltaTone="red" sub="Blocked & flagged" />
        <KpiCard label="Active Visitors" value={fmtInt(data.active_visitors)} icon="users" delta="On site now" deltaTone="green" sub="Check-ins today" />
        <KpiCard label="Doors Secured" value={`${data.doors.controlled_doors} / ${data.doors.controlled_doors}`} icon="lock" delta="All online" deltaTone="green" sub="Camera uptime 99.98%" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_3fr]">
        <Card>
          <CardHeader title="Incident Feed" subtitle="Most severe first · today" />
          <ul role="list" className="divide-y divide-hairline-slate">
            {data.events.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <Chip tone={sevTone[e.severity] ?? "steel"}>{e.severity}</Chip>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm text-ice-white">{e.title}</p>
                  <p className="text-caption text-steel-slate">{e.location} · {fmtTimeAgo(e.timestamp)}</p>
                </div>
                <Chip tone={e.status === "Open" ? "red" : e.status === "Investigating" ? "amber" : "green"}>{e.status}</Chip>
                <Button variant="ghost" size="sm">Investigate</Button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Access Events — 24h" subtitle="Door access volume by severity" />
          <div className="pt-2">
            <Bars
              data={[
                { label: "Red", value: data.severity_counts.Red, color: sevColor.Red },
                { label: "Amber", value: data.severity_counts.Amber, color: sevColor.Amber },
                { label: "Blue", value: data.severity_counts.Blue, color: sevColor.Blue },
              ]}
            />
          </div>
          <div className="mt-4 rounded-card border border-hairline-slate bg-elevated-slate px-4 py-3">
            <p className="text-caption uppercase tracking-wide text-steel-slate">AI burst detection</p>
            <p className="mt-1 text-body-sm text-ice-white">
              Event-frequency spike detected at {data.burst_hours.length ? `${data.burst_hours.map((h) => `${h}:00`).join(", ")}` : "no burst hours"} — Security Agent IsolationForest.
            </p>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="CCTV Event Analysis" subtitle="AI-analyzed feeds" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { tag: "Person loitering · Dock B", conf: 91 },
            { tag: "Badge duplicate · Server Room A", conf: 87 },
            { tag: "Unattended package · Lobby", conf: 74 },
          ].map((c) => (
            <div key={c.tag} className="flex aspect-video flex-col justify-end rounded-card border border-hairline-slate bg-elevated-slate p-3">
              <div className="flex items-center justify-between">
                <Icon name="eye" className="text-primary" size={16} />
                <span className="font-mono text-caption text-violet">{c.conf}%</span>
              </div>
              <p className="mt-2 text-body-sm text-ice-white">{c.tag}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Visitor Tracking" subtitle="Today" />
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[520px] text-left text-body-sm">
              <thead>
                <tr className="text-caption uppercase tracking-wide text-steel-slate">
                  <th className="py-2 pr-4 font-medium">Visitor</th>
                  <th className="py-2 pr-4 font-medium">Company</th>
                  <th className="py-2 pr-4 font-medium">Purpose</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-slate">
                {[
                  ["R. Sharma", "Schneider Electric", "HVAC audit", "Checked in"],
                  ["L. Nguyen", "Siemens", "Firmware update", "On site"],
                  ["P. Costa", "KONE", "Elevator PM", "On site"],
                  ["A. Kim", "Dell", "Rack install", "Checked out"],
                  ["M. Osei", "Grundfos", "Pump calibration", "Checked out"],
                ].map(([name, company, purpose, status]) => (
                  <tr key={name} className="text-steel-slate">
                    <td className="py-2.5 pr-4 text-ice-white">{name}</td>
                    <td className="py-2.5 pr-4">{company}</td>
                    <td className="py-2.5 pr-4">{purpose}</td>
                    <td className="py-2.5"><Chip tone={status === "On site" ? "blue" : "green"}>{status}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Security Recommendations" subtitle="Security Agent" />
          <ul role="list" className="divide-y divide-hairline-slate">
            {[
              { title: "Require 2FA on Server Room A access", impact: "High impact" },
              { title: "Resolve badge-duplication alert pattern", impact: "Reduces false positives" },
              { title: "Enable night camera preset on Dock B", impact: "Improves coverage" },
            ].map((r) => (
              <li key={r.title} className="flex items-center gap-3 py-3">
                <Icon name="shield" className="shrink-0 text-primary" size={16} />
                <span className="min-w-0 flex-1 text-body-sm text-ice-white">{r.title}</span>
                <Chip tone="blue">{r.impact}</Chip>
                <Button variant="ghost" size="sm">Enable</Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { Bars } from "@/components/charts/Bars";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip, type Tone } from "@/components/ui/Chip";
import { KpiCard } from "@/components/ui/KpiCard";
import { Icon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { useApiData, type SecurityPayload } from "@/lib/api";
import { fmtInt, fmtTimeAgo } from "@/lib/format";

const EMPTY: SecurityPayload = {
  facility: { name: "", facility_type: "", location: "" }, agent: "", events_today: 0,
  unauthorized_access: 0, active_visitors: 0, severity_counts: { Red: 0, Amber: 0, Blue: 0 },
  doors: { controlled_doors: 0, monitored_zones: 0 }, burst_hours: [], events: [],
  camera_uptime_pct: 0, cctv_events: [], visitors: [], security_recommendations: [],
};

const sevTone: Record<string, Tone> = { Red: "red", Amber: "amber", Blue: "blue" };
const sevColor = { Red: "var(--color-alert-red)", Amber: "var(--color-alert-amber)", Blue: "var(--color-primary)" };
const sevRank: Record<string, number> = { Red: 0, Amber: 1, Blue: 2 };

export function Security() {
  const { data, loading, error, refresh } = useApiData<SecurityPayload>("/api/dashboards/security", EMPTY, 15000);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_3fr]">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-56" />
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
          <p className="text-body-md font-semibold text-ice-white">Failed to load security telemetry</p>
          <p className="mt-1 text-body-sm text-steel-slate">{error} — check the backend service and try again.</p>
        </div>
        <Button variant="secondary" onClick={refresh}>Retry</Button>
      </div>
    );
  }

  const sortedEvents = [...data.events].sort(
    (a, b) =>
      (sevRank[a.severity] ?? 9) - (sevRank[b.severity] ?? 9) ||
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const severityBars = [
    { label: "Red", value: data.severity_counts.Red, color: sevColor.Red, display: `${data.severity_counts.Red} event${data.severity_counts.Red === 1 ? "" : "s"}` },
    { label: "Amber", value: data.severity_counts.Amber, color: sevColor.Amber, display: `${data.severity_counts.Amber} event${data.severity_counts.Amber === 1 ? "" : "s"}` },
    { label: "Blue", value: data.severity_counts.Blue, color: sevColor.Blue, display: `${data.severity_counts.Blue} event${data.severity_counts.Blue === 1 ? "" : "s"}` },
  ];

  return (
    <div>
      <PageIntro
        title="Security Monitoring"
        subtitle="Access control, incidents and visitor tracking"
        agent={data.agent}
        actions={<Button variant="secondary" size="sm" onClick={refresh}><Icon name="refresh" size={14} /> Refresh</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Security Events" value={fmtInt(data.events_today)} icon="alert" delta="Last 24h" deltaTone="steel" sub="All severities" />
        <KpiCard label="Unauthorized Access" value={fmtInt(data.unauthorized_access)} icon="shield" delta="High priority" deltaTone="red" sub="Blocked & flagged" />
        <KpiCard label="Active Visitors" value={fmtInt(data.active_visitors)} icon="users" delta="On site now" deltaTone="green" sub="Check-ins today" />
        <KpiCard label="Doors Secured" value={`${data.doors.controlled_doors} / ${data.doors.monitored_zones}`} icon="lock" delta={data.doors.controlled_doors === data.doors.monitored_zones ? "All online" : "Partial outage"} deltaTone={data.doors.controlled_doors === data.doors.monitored_zones ? "green" : "red"} sub={`Camera uptime ${data.camera_uptime_pct}%`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_3fr]">
        <Card className="p-card-padding">
          <CardHeader title="Incident Feed" subtitle="Most severe first · today" />
          <ul role="list" className="divide-y divide-hairline-slate">
            {sortedEvents.length === 0 && (
              <li className="flex flex-col items-center gap-2 py-10 text-center">
                <Icon name="check" className="text-signal-green" size={28} />
                <p className="text-body-sm text-ice-white">No security events — all clear</p>
                <p className="text-caption text-steel-slate">Access control and monitoring report normal activity.</p>
              </li>
            )}
            {sortedEvents.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <Chip tone={sevTone[e.severity] ?? "steel"}>{e.severity}</Chip>
                <div className="min-w-0 flex-1 basis-56">
                  <p className="truncate text-body-sm text-ice-white">{e.title}</p>
                  <p className="text-caption text-steel-slate">{e.location} · {fmtTimeAgo(e.timestamp)}</p>
                </div>
                <Chip tone={e.status === "Open" ? "red" : e.status === "Investigating" ? "amber" : "green"}>{e.status}</Chip>
                <Button variant="ghost" size="sm" onClick={() => toast(`Investigating ${e.title}…`, "info")}>Investigate</Button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-card-padding">
          <CardHeader title="Access Events — 24h" subtitle="Door access volume by severity" />
          <div className="pt-2">
            <Bars horizontal data={severityBars} />
          </div>
          <div className="mt-4 rounded-card border border-hairline-slate bg-elevated-slate px-4 py-3">
            <p className="text-caption uppercase tracking-wide text-steel-slate">AI burst detection</p>
            <p className="mt-1 text-body-sm text-ice-white">
              {data.burst_hours.length
                ? `Event-frequency spike detected at ${data.burst_hours.map((h) => `${h}:00`).join(", ")} — flagged by AI burst detection.`
                : "No anomalous event bursts in the last 24h."}
            </p>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-card-padding">
        <CardHeader title="CCTV Event Analysis" subtitle="Motion & loitering flags · today" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.cctv_events.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-2 rounded-card border border-hairline-slate bg-elevated-slate p-8 text-center">
              <Icon name="eye" className="text-steel-slate" size={28} />
              <p className="text-body-sm text-ice-white">No CCTV events detected</p>
              <p className="text-caption text-steel-slate">No motion, loitering or camera events in the last 24h.</p>
            </div>
          )}
          {data.cctv_events.slice(0, 6).map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-card border border-hairline-slate bg-elevated-slate p-3">
              <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-control bg-abyss-navy">
                <Icon name="eye" className="text-primary" size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-body-sm text-ice-white">{c.title}</p>
                  <span className="shrink-0 font-mono text-caption" style={{ color: (sevColor as Record<string, string>)[c.severity] ?? "var(--color-violet)" }}>{c.severity}</span>
                </div>
                <p className="mt-0.5 truncate text-caption text-steel-slate">{c.location} · {fmtTimeAgo(c.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="p-card-padding">
          <CardHeader title="Visitor Tracking" subtitle="Today" />
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[520px] text-left text-body-sm">
              <thead>
                <tr className="text-caption uppercase tracking-wide text-steel-slate">
                  <th scope="col" className="py-2 pr-4 font-medium">Visitor</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Company</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Purpose</th>
                  <th scope="col" className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-slate">
                {data.visitors.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-body-sm text-steel-slate">No visitors checked in today</td>
                  </tr>
                )}
                {data.visitors.map((v) => (
                  <tr key={v.name} className="text-steel-slate">
                    <td className="py-2.5 pr-4 text-ice-white">{v.name}</td>
                    <td className="py-2.5 pr-4">{v.company}</td>
                    <td className="max-w-[220px] truncate py-2.5 pr-4">{v.purpose}</td>
                    <td className="py-2.5"><Chip tone={v.status === "On site" ? "blue" : "green"}>{v.status}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-card-padding">
          <CardHeader title="Security Recommendations" subtitle="Security Agent" />
          <ul role="list" className="divide-y divide-hairline-slate">
            {data.security_recommendations.length === 0 && (
              <li className="flex flex-col items-center gap-2 py-10 text-center">
                <Icon name="shield" className="text-steel-slate" size={28} />
                <p className="text-body-sm text-ice-white">No recommendations right now</p>
                <p className="text-caption text-steel-slate">The Security Agent has no hardening suggestions to surface.</p>
              </li>
            )}
            {data.security_recommendations.map((r) => (
              <li key={r.title} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <Icon name="shield" className="shrink-0 text-primary" size={16} />
                <span className="min-w-0 flex-1 basis-56 text-body-sm text-ice-white">{r.title}</span>
                <Chip tone={r.status === "Applied" ? "green" : "blue"}>{r.impact}</Chip>
                <Button variant="ghost" size="sm" onClick={() => toast(`Enabled: ${r.title}`, "success")}>Enable</Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

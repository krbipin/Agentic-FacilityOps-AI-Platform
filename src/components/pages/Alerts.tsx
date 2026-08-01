"use client";

import { useMemo, useState } from "react";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip, type Tone } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/icons";
import { TextField, SelectField } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { patch, useApiData, type AlertsPayload } from "@/lib/api";
import { fmtTimeAgo } from "@/lib/format";

const EMPTY: AlertsPayload = {
  facility: { name: "", facility_type: "", location: "" },
  summary: { total: 0, open: 0, acknowledged: 0, resolved: 0 },
  alerts: [],
  escalation_policy: [],
};

const sevTone: Record<string, Tone> = { Critical: "red", Warning: "amber", Info: "blue" };
const statusTone: Record<string, Tone> = { Open: "red", Acknowledged: "amber", Resolved: "green" };
const CHANNELS = ["Email", "SMS", "Teams", "Slack"];

export function Alerts() {
  const { data, loading, error, refresh } = useApiData<AlertsPayload>("/api/dashboards/alerts", EMPTY, 15000);
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [sev, setSev] = useState("All");
  const [status, setStatus] = useState("All");
  const [agent, setAgent] = useState("All");
  const [read, setRead] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<(typeof EMPTY.alerts)[number] | null>(null);
  const [escalating, setEscalating] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const agents = useMemo(() => {
    const s = new Set(data.alerts.map((a) => a.agent));
    return ["All", ...Array.from(s).sort()];
  }, [data.alerts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.alerts.filter((a) => {
      if (q && !`${a.title} ${a.message} ${a.agent} ${a.alert_type} ${a.channels.join(" ")}`.toLowerCase().includes(q)) return false;
      if (sev !== "All" && a.severity !== sev) return false;
      if (status !== "All" && a.status !== status) return false;
      if (agent !== "All" && a.agent !== agent) return false;
      return true;
    });
  }, [data.alerts, search, sev, status, agent]);

  const sevCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of data.alerts) c[a.severity] = (c[a.severity] ?? 0) + 1;
    return c;
  }, [data.alerts]);

  const setStatusNow = async (id: number, next: "Open" | "Acknowledged" | "Resolved") => {
    setBusy(id);
    try {
      await patch(`/api/alerts/${id}`, { status: next });
      toast(`Alert ${next.toLowerCase()}`, "success");
      refresh();
    } catch {
      toast("Update failed", "error");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading alerts">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Icon name="bell" className="text-alert-amber" size={32} />
        <div>
          <p className="text-body-md font-semibold text-ice-white">Alerts unavailable</p>
          <p className="mt-1 text-body-sm text-steel-slate">{error} — is the backend running on :8000?</p>
        </div>
        <Button variant="secondary" onClick={refresh}>Retry</Button>
      </div>
    );
  }

  const { summary } = data;

  return (
    <div>
      <PageIntro
        title="Alerts & Notifications"
        subtitle="Orchestrated by the Alert & Automation Module"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setRead(new Set(data.alerts.map((a) => a.id))); toast("All alerts marked read"); }}>
              <Icon name="check" size={14} /> Mark all read
            </Button>
            <a href="/settings"><Button variant="secondary" size="sm"><Icon name="sliders" size={14} /> Configure channels →</Button></a>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Open", value: summary.open, tone: "text-alert-red" as const, icon: "alert" as const },
          { label: "Acknowledged", value: summary.acknowledged, tone: "text-alert-amber" as const, icon: "check" as const },
          { label: "Resolved (24h)", value: summary.resolved, tone: "text-signal-green" as const, icon: "check" as const },
        ].map((s) => (
          <div key={s.label} className="rounded-card bg-panel-slate glow-border panel-glow p-card-padding">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">{s.label}</span>
              <Icon name={s.icon} size={16} className={s.tone} />
            </div>
            <div className={`mt-1 font-kpi-value text-kpi-value ${s.tone}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["Critical", "Warning", "Info"] as const).map((s) => (
          <Chip key={s} tone={sevTone[s]}>{s} {sevCounts[s] ?? 0}</Chip>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader title="Alert List" subtitle={`${filtered.length} of ${data.alerts.length} alerts`} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px_180px]">
          <TextField label="Search" placeholder="Title, zone, agent…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <SelectField label="Severity" value={sev} onChange={(e) => setSev(e.target.value)}>
            <option value="All">All</option>
            <option>Critical</option>
            <option>Warning</option>
            <option>Info</option>
          </SelectField>
          <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All</option>
            <option>Open</option>
            <option>Acknowledged</option>
            <option>Resolved</option>
          </SelectField>
          <SelectField label="Agent" value={agent} onChange={(e) => setAgent(e.target.value)}>
            {agents.map((a) => <option key={a}>{a}</option>)}
          </SelectField>
        </div>

        <ul role="list" className="mt-5 divide-y divide-hairline-slate">
          {filtered.length === 0 && (
            <li className="py-10 text-center text-body-sm text-steel-slate">No alerts match filters</li>
          )}
          {filtered.slice(0, 40).map((a) => {
            const unread = a.status === "Open" && !read.has(a.id);
            return (
              <li key={a.id} className={`flex flex-col gap-2 border-l-2 py-3 pl-4 pr-1 ${unread ? "border-primary" : "border-transparent"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone={sevTone[a.severity] ?? "steel"}>{a.severity}</Chip>
                  <button type="button" className="min-w-0 text-left" onClick={() => setSelected(a)} aria-label={`View alert: ${a.title}`}>
                    <span className="text-body-sm font-medium text-ice-white">{a.title}</span>
                  </button>
                  <Chip tone={statusTone[a.status] ?? "steel"}>{a.status}</Chip>
                </div>
                <p className="text-caption text-steel-slate">
                  {a.agent} · {a.alert_type} · <span className="font-mono">{fmtTimeAgo(a.created_at)}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-caption text-steel-slate">Sent:</span>
                  {a.channels.length === 0 ? (
                    <Chip tone="steel">—</Chip>
                  ) : (
                    a.channels.map((c) => (
                      <span key={c} className="inline-flex items-center gap-1 rounded-full border border-hairline-slate px-2 py-0.5 text-caption text-ice-white">
                        <Icon name="check" size={10} className="text-signal-green" /> {c}
                      </span>
                    ))
                  )}
                  <span className="flex-1" />
                  {a.status !== "Acknowledged" && (
                    <Button size="sm" variant="secondary" loading={busy === a.id} onClick={() => setStatusNow(a.id, "Acknowledged")}>
                      <Icon name="check" size={13} /> Acknowledge
                    </Button>
                  )}
                  {a.status !== "Resolved" && (
                    <Button size="sm" variant="secondary" loading={busy === a.id} onClick={() => setStatusNow(a.id, "Resolved")}>
                      <Icon name="check" size={13} /> Resolve
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setEscalating(true)}>
                    <Icon name="alert" size={13} /> Escalate
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(a)}>
                    View
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? selected.title : ""}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Chip tone={sevTone[selected.severity] ?? "steel"}>{selected.severity}</Chip>
              <Chip tone={statusTone[selected.status] ?? "steel"}>{selected.status}</Chip>
              <Chip tone="steel">{selected.agent}</Chip>
            </div>
            <p className="text-body-sm text-steel-slate">{selected.message}</p>
            <div>
              <h3 className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">Escalation timeline</h3>
              <ol className="mt-2 space-y-2 border-l border-hairline-slate pl-4">
                <li className="text-caption text-steel-slate"><span className="font-mono text-ice-white">{fmtTimeAgo(selected.created_at)}</span> — Alert created</li>
                <li className="text-caption text-steel-slate"><span className="font-mono text-ice-white">+1 min</span> — Email to ops ({selected.channels.includes("Email") ? "sent" : "queued"})</li>
                <li className="text-caption text-steel-slate"><span className="font-mono text-ice-white">+5 min</span> — SMS to on-call ({selected.channels.includes("SMS") ? "sent" : "not configured"})</li>
                {data.escalation_policy.length === 0 && (
                  <li className="text-caption text-steel-slate">No escalation policy configured</li>
                )}
                {data.escalation_policy.map((e) => (
                  <li key={e.level} className="text-caption text-steel-slate">
                    <span className="font-mono text-ice-white">+{e.delay}</span> — {e.level} ({e.role}) via {e.channels.join(", ")}
                  </li>
                ))}
              </ol>
            </div>
            <p className="font-mono text-caption text-steel-slate">alert_id {selected.id} · created_at {selected.created_at}</p>
          </div>
        )}
      </Modal>

      <Modal
        open={escalating}
        onClose={() => setEscalating(false)}
        title="Escalate Alert"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEscalating(false)}>Cancel</Button>
            <Button onClick={() => { setEscalating(false); toast("Escalated via Email → Level 2 manager", "success"); }}>
              Escalate
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <SelectField label="Escalation level" defaultValue="Level 1 — on-call">
            {data.escalation_policy.length === 0 ? (
              <option>Level 1 — on-call</option>
            ) : (
              data.escalation_policy.map((e) => (
                <option key={e.level}>{e.level} — {e.role}</option>
              ))
            )}
          </SelectField>
          <fieldset>
            <legend className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">Notify via</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {CHANNELS.map((c) => (
                <label key={c} className="inline-flex cursor-pointer items-center gap-1.5 rounded-control border border-hairline-slate px-3 py-1.5 text-caption text-ice-white">
                  <input type="checkbox" defaultChecked={c === "Email" || c === "SMS"} className="accent-[var(--color-primary)]" /> {c}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Modal>
    </div>
  );
}

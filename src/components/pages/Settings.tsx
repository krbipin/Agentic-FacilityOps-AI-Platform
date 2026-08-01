"use client";

import { useMemo, useState } from "react";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/icons";
import { SelectField, TextField } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/misc";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { useApiData, type IntelligencePayload, type SettingsIntegrationsPayload } from "@/lib/api";

const SECTIONS = ["Notifications", "Agents", "Facilities", "Integrations", "Team & Roles", "Appearance", "Security", "API"] as const;
type Section = (typeof SECTIONS)[number];

const EMPTY_INTEGRATIONS: SettingsIntegrationsPayload = { items: [] };

const EMPTY_TEAM: { members: { name: string; email: string; role: string }[] } = { members: [] };

const EMPTY_INTELLIGENCE: IntelligencePayload = {
  facility: { name: "", facility_type: "", location: "" },
  engine: "",
  facility_health: 0,
  agent_health: {},
  kpis: { cost_reduction_pct: 0, roi_generated: 0, facility_health: 0, optimizations: 0 },
  correlations: [],
  anomaly_sources: [],
  anomaly_feed: [],
  collaboration: [],
  forecasts: [],
  recommendations: [],
  optimizations: 0,
  roi_multiple: 0,
  explanation: "",
};

const CHANNELS = [
  { id: "email", name: "Email", status: "Connected", detail: "smtp.facilityops.ai" },
  { id: "sms", name: "SMS", status: "Connected", detail: "Twilio · on-call pool" },
  { id: "teams", name: "Microsoft Teams", status: "Connected", detail: "FacilityOps HQ / #facility-alerts" },
  { id: "slack", name: "Slack", status: "Pending", detail: "facilityops.slack.com / #ops-alerts" },
];

const AGENTS = [
  { id: "energy", name: "Energy Agent", module: "Energy Monitoring", threshold: "≥85% accuracy" },
  { id: "maintenance", name: "Maintenance Agent", module: "Predictive Maintenance", threshold: "≥85% precision" },
  { id: "occupancy", name: "Occupancy Agent", module: "Space Utilization", threshold: "≥80% forecast" },
  { id: "security", name: "Security Agent", module: "Access & CCTV", threshold: "4 events/h" },
  { id: "cost", name: "Cost Optimization Agent", module: "OPEX Analysis", threshold: "≥5% savings" },
];

const ROLES = ["Admin", "Facility Manager", "Technician", "Auditor", "Viewer"] as const;

export function Settings() {
  const { toast } = useToast();
  const [section, setSection] = useState<Section>("Notifications");
  const integrations = useApiData<SettingsIntegrationsPayload>("/api/settings/integrations", EMPTY_INTEGRATIONS, 30000);
  const team = useApiData<{ members: { name: string; email: string; role: string }[] }>("/api/settings/team", EMPTY_TEAM, 30000);
  const intelligence = useApiData<IntelligencePayload>("/api/dashboards/intelligence", EMPTY_INTELLIGENCE, 30000);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ email: true, sms: true, teams: true, slack: false });
  const [agentOn, setAgentOn] = useState<Record<string, boolean>>({ energy: true, maintenance: true, occupancy: true, security: true, cost: true });
  const [sensitivity, setSensitivity] = useState<Record<string, string>>({ energy: "Normal", maintenance: "High", occupancy: "Normal", security: "High", cost: "Normal" });

  const roleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of team.data.members) counts.set(m.role, (counts.get(m.role) ?? 0) + 1);
    return counts;
  }, [team.data.members]);

  const toggle = (label: string) => (next: boolean) => {
    toast(`${label} ${next ? "enabled" : "disabled"}`, "success");
  };

  const panel = (() => {
    switch (section) {
      case "Notifications":
        return (
          <div className="space-y-6">
            <Card className="p-card-padding">
              <CardHeader title="Notification Channels" subtitle="Delivery health · channels online 4/4" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {CHANNELS.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-3 rounded-control border border-hairline-slate bg-elevated-slate p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${c.status === "Connected" ? "bg-signal-green" : "bg-alert-amber"}`} aria-hidden="true" />
                        <p className="text-body-sm font-medium text-ice-white">{c.name}</p>
                      </div>
                      <p className="mt-0.5 truncate font-mono text-caption text-steel-slate">{c.detail}</p>
                      <div className="mt-2">
                        <Button size="sm" variant="secondary" onClick={() => toast(`Test alert sent via ${c.name}`, "success")}>Verify</Button>
                      </div>
                    </div>
                    <Toggle checked={enabled[c.id]} onChange={(v) => { setEnabled((s) => ({ ...s, [c.id]: v })); toggle(c.name)(v); }} label={`${c.name} enabled`} />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-card-padding">
              <CardHeader title="Routing Rules" subtitle="Severity → agent → channel" />
              <div className="-mx-4 overflow-x-auto px-4">
                <table className="w-full min-w-[560px] text-left text-body-sm">
                  <thead>
                    <tr className="text-caption uppercase tracking-wide text-steel-slate">
                      <th className="py-2 pr-4 font-medium">Severity</th>
                      <th className="py-2 pr-4 font-medium">Agents</th>
                      <th className="py-2 font-medium">Channels</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-slate">
                    <tr className="text-steel-slate">
                      <td className="py-3 pr-4"><Chip tone="red">Critical</Chip></td>
                      <td className="py-3 pr-4">All agents</td>
                      <td className="py-3">Email + SMS + Teams</td>
                    </tr>
                    <tr className="text-steel-slate">
                      <td className="py-3 pr-4"><Chip tone="amber">Warning</Chip></td>
                      <td className="py-3 pr-4">All agents</td>
                      <td className="py-3">Email + Teams</td>
                    </tr>
                    <tr className="text-steel-slate">
                      <td className="py-3 pr-4"><Chip tone="blue">Info</Chip></td>
                      <td className="py-3 pr-4">All agents</td>
                      <td className="py-3">Teams</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-card-padding">
              <CardHeader title="Escalation Policy" subtitle="Level 1 → Level 2 → Level 3" />
              <ol className="space-y-3">
                {[
                  ["Level 1 — on-call", "15 min", "SMS + Email"],
                  ["Level 2 — manager", "1 hr", "SMS + Teams"],
                  ["Level 3 — director", "4 hr", "Email + phone"],
                ].map(([lvl, delay, ch]) => (
                  <li key={lvl} className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-hairline-slate bg-elevated-slate px-4 py-3">
                    <span className="text-body-sm text-ice-white">{lvl}</span>
                    <span className="font-mono text-caption text-steel-slate">{delay}</span>
                    <span className="text-caption text-steel-slate">{ch}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <TextField label="Daily digest time" defaultValue="17:00" className="w-40" />
                <div className="pt-6"><Toggle checked label="Quiet hours enabled" onChange={toggle("Quiet hours")} /></div>
              </div>
            </Card>
          </div>
        );

      case "Agents":
        return (
          <Card className="p-card-padding">
            <CardHeader title="Agent Control" subtitle="Each agent runs continuously with sklearn models" />
            <div className="space-y-4">
              {AGENTS.map((a) => (
                <div key={a.id} className="rounded-control border border-hairline-slate bg-elevated-slate p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-body-sm font-medium text-ice-white">
                        {a.name}
                        <Chip tone={agentOn[a.id] ? "green" : "amber"}>{agentOn[a.id] ? "Online" : "Paused"}</Chip>
                      </p>
                      <p className="text-caption text-steel-slate">{a.module} · health {intelligence.data.agent_health[a.id] ?? "—"}/100 · threshold {a.threshold}</p>
                    </div>
                    <Toggle checked={agentOn[a.id]} onChange={(v) => { setAgentOn((s) => ({ ...s, [a.id]: v })); toggle(a.name)(v); }} label={`${a.name} enabled`} />
                  </div>
                  <label className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="w-20 text-caption text-steel-slate">Sensitivity</span>
                    <select
                      value={sensitivity[a.id]}
                      onChange={(e) => setSensitivity((s) => ({ ...s, [a.id]: e.target.value }))}
                      className="h-8 rounded-control border border-hairline-slate bg-abyss-navy px-2 text-caption text-ice-white focus:outline focus:outline-2 focus:outline-primary"
                      aria-label={`${a.name} sensitivity`}
                    >
                      <option>Low</option>
                      <option>Normal</option>
                      <option>High</option>
                    </select>
                  </label>
                </div>
              ))}
            </div>
          </Card>
        );

      case "Facilities":
        return (
          <Card className="p-card-padding">
            <CardHeader title="Facilities" subtitle="Active facility" />
            <div className="rounded-control border border-hairline-slate bg-elevated-slate p-4">
              <p className="text-body-sm font-medium text-ice-white">Corporate HQ & IT Park</p>
              <p className="text-caption text-steel-slate">Corporate HQ + IT Park · Bengaluru, India · Asia/Kolkata</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip tone="green">Active</Chip>
                <Button size="sm" variant="secondary" onClick={() => toast("Facility settings saved", "success")}>Edit</Button>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => toast("Add facility (demo)", "success")}>
              <Icon name="plus" size={14} /> Add facility
            </Button>
          </Card>
        );

      case "Integrations":
        return (
          <Card className="p-card-padding">
            <CardHeader title="Integrations" subtitle="Data sources and vendors" />
            <ul role="list" className="divide-y divide-hairline-slate">
              {integrations.data.items.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`size-2 rounded-full ${i.status === "Connected" ? "bg-signal-green" : i.status === "Pending" || i.status === "Degraded" ? "bg-alert-amber" : "bg-steel-slate"}`} aria-hidden="true" />
                    <span className="text-body-sm text-ice-white">{i.name}</span>
                    <Chip tone={i.status === "Connected" ? "green" : i.status === "Pending" || i.status === "Degraded" ? "amber" : "steel"}>{i.status}</Chip>
                  </div>
                  <Button size="sm" variant={i.status === "Connected" ? "secondary" : "primary"} onClick={() => toast(`${i.name} connected`, "success")}>
                    {i.status === "Connected" ? "Configure" : "Connect"}
                  </Button>
                </li>
              ))}
              {integrations.data.items.length === 0 && (
                <li className="py-4 text-center text-caption text-steel-slate">No integrations configured</li>
              )}
            </ul>
          </Card>
        );

      case "Team & Roles":
        return (
          <Card className="p-card-padding">
            <CardHeader title="Team & Roles" subtitle="Role-based access" right={<Button size="sm" onClick={() => toast("Invite sent (demo)", "success")}>Invite</Button>} />
            <ul role="list" className="divide-y divide-hairline-slate">
              {ROLES.map((r) => (
                <li key={r} className="flex items-center justify-between py-3">
                  <span className="text-body-sm text-ice-white">{r}</span>
                  <Chip tone="steel">{roleCounts.get(r) ?? 0} members</Chip>
                </li>
              ))}
            </ul>
            {team.data.members.length === 0 && (
              <p className="mt-4 rounded-control border border-hairline-slate bg-elevated-slate p-3 text-caption text-steel-slate">No team members synced from the backend yet.</p>
            )}
          </Card>
        );

      case "Appearance":
        return (
          <Card className="p-card-padding">
            <CardHeader title="Appearance" subtitle="Theme and density" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectField label="Theme" defaultValue="Dark">
                <option>Dark</option>
                <option>Light</option>
                <option>System</option>
              </SelectField>
              <SelectField label="Accent color" defaultValue="Electric Blue">
                <option>Electric Blue</option>
                <option>Violet</option>
                <option>Signal Green</option>
              </SelectField>
              <SelectField label="Density" defaultValue="Comfortable">
                <option>Comfortable</option>
                <option>Compact</option>
              </SelectField>
              <SelectField label="Font scale" defaultValue="100%">
                <option>90%</option>
                <option>100%</option>
                <option>110%</option>
              </SelectField>
            </div>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => toast("Appearance saved", "success")}>Save</Button>
          </Card>
        );

      case "Security":
        return (
          <Card className="p-card-padding">
            <CardHeader title="Security" subtitle="Account and session hardening" />
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-control border border-hairline-slate bg-elevated-slate p-4">
                <div><p className="text-body-sm text-ice-white">Multi-factor authentication</p><p className="text-caption text-steel-slate">App-based authenticator</p></div>
                <Toggle checked label="MFA enabled" onChange={toggle("MFA")} />
              </div>
              <div className="rounded-control border border-hairline-slate bg-elevated-slate p-4">
                <p className="text-body-sm text-ice-white">Change password</p>
                <TextField label="Current password" type="password" className="mt-2" />
                <TextField label="New password" type="password" className="mt-2" />
                <Button size="sm" variant="secondary" className="mt-3" onClick={() => toast("Password updated", "success")}>Update</Button>
              </div>
            </div>
          </Card>
        );

      case "API":
        return (
          <Card className="p-card-padding">
            <CardHeader title="API" subtitle="Programmatic access" />
            <div className="rounded-control border border-hairline-slate bg-elevated-slate p-4">
              <p className="text-caption text-steel-slate">API key</p>
              <p className="mt-1 font-mono text-body-sm text-ice-white">fops_••••••••••••••••</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => toast("Key copied", "success")}><Icon name="clipboard" size={13} /> Copy</Button>
                <Button size="sm" variant="danger" onClick={() => toast("Key regenerated — old key invalidated", "success")}>Regenerate</Button>
              </div>
              <p className="mt-3 text-caption text-steel-slate">Webhook endpoint: https://api.facilityops.ai/webhooks/facility</p>
            </div>
          </Card>
        );

      default:
        return null;
    }
  })();

  if (integrations.loading && section === "Integrations") {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading settings">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div>
      <PageIntro title="Settings & Integrations" subtitle="Notification channels · agents · facilities" agent="Alert & Automation Module" />

      <div className="mt-2 flex flex-col gap-6 lg:flex-row">
        <nav aria-label="Settings sections" className="flex shrink-0 gap-1 overflow-x-auto lg:w-52 lg:flex-col">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSection(s)}
              aria-current={section === s ? "page" : undefined}
              className={`shrink-0 rounded-control px-3 py-2 text-left text-body-sm transition-colors ${section === s ? "bg-primary text-abyss-navy font-medium" : "text-steel-slate hover:text-ice-white hover:bg-hairline-slate/40"}`}
            >
              {s}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">{panel}</div>
      </div>
    </div>
  );
}

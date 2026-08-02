"use client";

import { useEffect, useMemo, useState } from "react";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip, type Tone } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/icons";
import { SelectField, TextField } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/misc";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import {
  activateFacility,
  fetcher,
  useApiData,
  type FacilityItem,
  type IntelligencePayload,
  type SettingsAgentItem,
  type SettingsAgentsPayload,
  type SettingsIntegrationsPayload,
} from "@/lib/api";
import { FacilityModal } from "@/components/ui/FacilityModal";

const SECTIONS = ["Notifications", "Agents", "Facilities", "Integrations", "Team & Roles", "Appearance", "Security", "API"] as const;
type Section = (typeof SECTIONS)[number];

const EMPTY_INTEGRATIONS: SettingsIntegrationsPayload = { items: [] };

const EMPTY_TEAM: { members: { name: string; email: string; role: string }[] } = { members: [] };

const EMPTY_FACILITIES: { items: FacilityItem[] } = { items: [] };

const ROLES = ["Admin", "Facility Manager", "Technician", "Auditor", "Viewer"] as const;

const ROUTING_RULES = [
  { severity: "Critical" as const, agents: "All agents", channels: "Email + SMS + Teams" },
  { severity: "Warning" as const, agents: "All agents", channels: "Email + Teams" },
  { severity: "Info" as const, agents: "All agents", channels: "Teams" },
];

const ESCALATION_LEVELS = [
  { level: "Level 1 — on-call", delay: "15 min", channels: "SMS + Email" },
  { level: "Level 2 — manager", delay: "1 hr", channels: "SMS + Teams" },
  { level: "Level 3 — director", delay: "4 hr", channels: "Email + phone" },
];

function statusTone(status: string): Tone {
  if (status === "Connected") return "green";
  if (status === "Pending" || status === "Degraded") return "amber";
  return "steel";
}

function statusDot(status: string): string {
  if (status === "Connected") return "bg-signal-green";
  if (status === "Pending" || status === "Degraded") return "bg-alert-amber";
  return "bg-steel-slate";
}

function PanelSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading settings panel">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-64" />
      <Skeleton className="h-40" />
    </div>
  );
}

function PanelError({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="mt-1 text-body-sm text-steel-slate">{error} — check the backend service and try again.</p>;
}

function AgentsPanel() {
  const { toast } = useToast();
  const [agentThresh, setAgentThresh] = useState<SettingsAgentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentHealth, setAgentHealth] = useState<Record<string, number>>({});
  const [agentOn, setAgentOn] = useState<Record<string, boolean>>({});
  const [sensitivity, setSensitivity] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetcher<SettingsAgentsPayload>("/api/settings/agents"), fetcher<IntelligencePayload>("/api/dashboards/intelligence")])
      .then(([a, intel]) => {
        if (cancelled) return;
        setAgentThresh(a.agents);
        setAgentHealth(intel.agent_health);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Request failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="p-card-padding">
      <CardHeader title="Agent Control" subtitle="Each agent runs continuously · thresholds from backend config" />
      <PanelError error={error} />
      {loading ? (
        <PanelSkeleton />
      ) : agentThresh.length === 0 ? (
        <p className="rounded-control border border-hairline-slate bg-elevated-slate p-4 text-caption text-steel-slate">
          No agent configuration synced from the backend yet.
        </p>
      ) : (
        <div className="space-y-4">
          {agentThresh.map((a) => (
            <div key={a.id} className="rounded-control border border-hairline-slate bg-elevated-slate p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-body-sm font-medium text-ice-white">
                    {a.name}
                    <Chip tone={agentOn[a.id] !== false ? "green" : "amber"}>{agentOn[a.id] !== false ? "Online" : "Paused"}</Chip>
                  </p>
                  <p className="mt-0.5 text-caption text-steel-slate">{a.module} · health {agentHealth[a.id] ?? "—"}/100 · threshold {a.threshold}</p>
                </div>
                <Toggle
                  checked={agentOn[a.id] !== false}
                  onChange={(v) => {
                    setAgentOn((s) => ({ ...s, [a.id]: v }));
                    toast("Agent control is local-only — agents run continuously in the backend");
                  }}
                  label={`${a.name} enabled`}
                />
              </div>
              <label className="mt-3 flex flex-wrap items-center gap-3">
                <span className="w-20 text-caption text-steel-slate">Sensitivity</span>
                <select
                  value={sensitivity[a.id] ?? "Normal"}
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
      )}
    </Card>
  );
}

export function Settings() {
  const { toast } = useToast();
  const [section, setSection] = useState<Section>("Notifications");
  const [facilityOpen, setFacilityOpen] = useState(false);
  const integrations = useApiData<SettingsIntegrationsPayload>("/api/settings/integrations", EMPTY_INTEGRATIONS, 30000);
  const team = useApiData<{ members: { name: string; email: string; role: string }[] }>("/api/settings/team", EMPTY_TEAM, 30000);
  const facilities = useApiData<{ items: FacilityItem[] }>("/api/facilities", EMPTY_FACILITIES, 30000);

  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  const roleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of team.data.members) counts.set(m.role, (counts.get(m.role) ?? 0) + 1);
    return counts;
  }, [team.data.members]);

  const activateFacilityInSettings = async (id: number) => {
    try {
      const f = await activateFacility(id);
      toast(`Active facility set to ${f.name}`, "success");
      facilities.refresh();
    } catch {
      toast("Failed to switch facility", "error");
    }
  };

  const panel = (() => {
    switch (section) {
      case "Notifications":
        return (
          <div className="space-y-6">
            <Card className="p-card-padding">
              <CardHeader
                title="Notification Channels"
                subtitle={`Delivery health · ${integrations.data.items.filter((i) => i.kind === "Notifications").length} channels · ${integrations.data.items.filter((i) => i.kind === "Notifications" && i.status === "Connected").length} connected`}
              />
              <PanelError error={integrations.error} />
              {integrations.loading ? (
                <PanelSkeleton />
              ) : integrations.data.items.filter((i) => i.kind === "Notifications").length === 0 ? (
                <p className="rounded-control border border-hairline-slate bg-elevated-slate p-4 text-caption text-steel-slate">
                  No notification channels configured in the backend yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {integrations.data.items
                    .filter((i) => i.kind === "Notifications")
                    .map((c) => (
                      <div key={c.id} className="flex items-start justify-between gap-3 rounded-control border border-hairline-slate bg-elevated-slate p-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`size-2 shrink-0 rounded-full ${statusDot(c.status)}`} aria-hidden="true" />
                            <p className="text-body-sm font-medium text-ice-white">{c.name}</p>
                            <Chip tone={statusTone(c.status)}>{c.status}</Chip>
                          </div>
                          <p className="mt-0.5 truncate font-mono text-caption text-steel-slate">{c.detail}</p>
                          <div className="mt-2">
                            <Button size="sm" variant="secondary" onClick={() => toast("Test alerts aren't wired in this demo — delivery status reflects backend config")}>
                              Verify
                            </Button>
                          </div>
                        </div>
                        <Toggle
                          checked={enabled[c.id] ?? c.status === "Connected"}
                          onChange={(v) => {
                            setEnabled((s) => ({ ...s, [c.id]: v }));
                            toast(`${c.name} ${v ? "enabled" : "disabled"} (local only — delivery runs in the backend)`);
                          }}
                          label={`${c.name} enabled`}
                        />
                      </div>
                    ))}
                </div>
              )}
            </Card>

            <Card className="p-card-padding">
              <CardHeader title="Routing Rules" subtitle="Severity → agent → channel" />
              <div className="-mx-4 overflow-x-auto px-4">
                <table className="w-full min-w-[560px] text-left text-body-sm">
                  <thead>
                    <tr className="text-caption uppercase tracking-wide text-steel-slate">
                      <th scope="col" className="py-2 pr-4 font-medium">Severity</th>
                      <th scope="col" className="py-2 pr-4 font-medium">Agents</th>
                      <th scope="col" className="py-2 font-medium">Channels</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-slate">
                    {ROUTING_RULES.map((r) => (
                      <tr key={r.severity} className="text-steel-slate">
                        <td className="py-3 pr-4"><Chip tone={r.severity === "Critical" ? "red" : r.severity === "Warning" ? "amber" : "blue"}>{r.severity}</Chip></td>
                        <td className="py-3 pr-4">{r.agents}</td>
                        <td className="py-3">{r.channels}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-card-padding">
              <CardHeader title="Escalation Policy" subtitle="Level 1 → Level 2 → Level 3" />
              <ol className="space-y-3">
                {ESCALATION_LEVELS.map((l) => (
                  <li key={l.level} className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-hairline-slate bg-elevated-slate px-4 py-3">
                    <span className="text-body-sm text-ice-white">{l.level}</span>
                    <span className="font-mono text-caption text-steel-slate">{l.delay}</span>
                    <span className="text-caption text-steel-slate">{l.channels}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <TextField label="Daily digest time" defaultValue="17:00" className="w-40" />
                <div className="pt-6">
                  <Toggle
                    checked
                    label="Quiet hours enabled"
                    onChange={() => toast("Quiet hours is a local-only preference — scheduling isn't wired in this demo")}
                  />
                </div>
              </div>
            </Card>
          </div>
        );

      case "Agents":
        return <AgentsPanel />;

      case "Facilities":
        return (
          <Card className="p-card-padding">
            <CardHeader title="Facilities" subtitle="Active facility" />
            <PanelError error={facilities.error} />
            {facilities.loading ? (
              <PanelSkeleton />
            ) : (
              <>
                <ul role="list" className="divide-y divide-hairline-slate">
                  {facilities.data.items.map((f) => {
                    const isActive = f.is_active;
                    return (
                      <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 text-body-sm font-medium text-ice-white">
                            <span className="truncate">{f.name}</span>
                            {isActive && <Chip tone="green">Active</Chip>}
                          </p>
                          <p className="text-caption text-steel-slate">{f.facility_type} · {f.location}</p>
                        </div>
                        {!isActive && (
                          <Button size="sm" variant="secondary" onClick={() => activateFacilityInSettings(f.id)}>
                            Set active
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {facilities.data.items.length === 0 && (
                  <p className="rounded-control border border-hairline-slate bg-elevated-slate p-4 text-caption text-steel-slate">
                    No facilities yet — add one to start collecting data.
                  </p>
                )}
                <Button variant="secondary" size="sm" className="mt-4" onClick={() => setFacilityOpen(true)}>
                  <Icon name="plus" size={14} /> Add facility
                </Button>
                <FacilityModal
                  open={facilityOpen}
                  onClose={() => setFacilityOpen(false)}
                  onCreated={() => facilities.refresh()}
                />
              </>
            )}
          </Card>
        );

      case "Integrations": {
        const kinds = [...new Set(integrations.data.items.map((i) => i.kind))];
        return (
          <Card className="p-card-padding">
            <CardHeader title="Integrations" subtitle="Data sources and vendors · status from the backend" />
            <PanelError error={integrations.error} />
            {integrations.loading ? (
              <PanelSkeleton />
            ) : integrations.data.items.length === 0 ? (
              <p className="rounded-control border border-hairline-slate bg-elevated-slate p-4 text-caption text-steel-slate">
                No integrations configured in the backend yet.
              </p>
            ) : (
              <div className="space-y-6">
                {kinds.map((kind) => (
                  <div key={kind}>
                    <p className="text-caption uppercase tracking-wide text-steel-slate">{kind}</p>
                    <ul role="list" className="mt-2 divide-y divide-hairline-slate">
                      {integrations.data.items
                        .filter((i) => i.kind === kind)
                        .map((i) => (
                          <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <span className={`size-2 shrink-0 rounded-full ${statusDot(i.status)}`} aria-hidden="true" />
                              <span className="truncate text-body-sm text-ice-white">{i.name}</span>
                              <Chip tone={statusTone(i.status)}>{i.status}</Chip>
                              <span className="w-full truncate font-mono text-caption text-steel-slate sm:w-auto">{i.detail}</span>
                            </div>
                            <Button
                              size="sm"
                              variant={i.status === "Connected" ? "secondary" : "primary"}
                              onClick={() => toast(`${i.name} connect flow isn't wired in this demo — its status comes from the backend`)}
                            >
                              {i.status === "Connected" ? "Configure" : "Connect"}
                            </Button>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      }

      case "Team & Roles":
        return (
          <Card className="p-card-padding">
            <CardHeader
              title="Team & Roles"
              subtitle="Role-based access"
              right={<Button size="sm" onClick={() => toast("Invites aren't wired in this demo — members are seeded from the backend")}>Invite</Button>}
            />
            <PanelError error={team.error} />
            {team.loading ? (
              <PanelSkeleton />
            ) : (
              <>
                <ul role="list" className="divide-y divide-hairline-slate">
                  {ROLES.map((r) => (
                    <li key={r} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <span className="text-body-sm text-ice-white">{r}</span>
                      <Chip tone="steel">{roleCounts.get(r) ?? 0} members</Chip>
                    </li>
                  ))}
                </ul>
                {team.data.members.length > 0 && (
                  <div className="mt-4">
                    <p className="text-caption uppercase tracking-wide text-steel-slate">Members</p>
                    <ul role="list" className="mt-2 divide-y divide-hairline-slate">
                      {team.data.members.map((m) => (
                        <li key={m.email} className="flex flex-wrap items-center justify-between gap-2 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-body-sm text-ice-white">{m.name}</p>
                            <p className="truncate font-mono text-caption text-steel-slate">{m.email}</p>
                          </div>
                          <Chip tone="blue">{m.role}</Chip>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {team.data.members.length === 0 && (
                  <p className="mt-4 rounded-control border border-hairline-slate bg-elevated-slate p-3 text-caption text-steel-slate">No team members synced from the backend yet.</p>
                )}
              </>
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
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => toast("Appearance is a local preference — the topbar theme toggle applies the active theme")}>
              Save
            </Button>
          </Card>
        );

      case "Security":
        return (
          <Card className="p-card-padding">
            <CardHeader title="Security" subtitle="Account and session hardening" />
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-hairline-slate bg-elevated-slate p-4">
                <div className="min-w-0">
                  <p className="text-body-sm text-ice-white">Multi-factor authentication</p>
                  <p className="text-caption text-steel-slate">Managed by Clerk — sign-in security is handled at the auth layer</p>
                </div>
                <Toggle checked label="MFA enabled" onChange={() => toast("MFA is managed by Clerk — this toggle is a demo preview")} />
              </div>
              <div className="rounded-control border border-hairline-slate bg-elevated-slate p-4">
                <p className="text-body-sm text-ice-white">Change password</p>
                <p className="mt-1 text-caption text-steel-slate">Handled by Clerk — this form is a demo preview.</p>
                <TextField label="Current password" type="password" className="mt-3" />
                <TextField label="New password" type="password" className="mt-2" />
                <Button size="sm" variant="secondary" className="mt-3" onClick={() => toast("Password changes are handled by Clerk — not wired in this demo")}>
                  Update
                </Button>
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
              <p className="mt-1 font-mono text-body-sm text-ice-white">fops_•••••••••••••••• (demo)</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => toast("Demo API key — not a real credential")}>
                  <Icon name="clipboard" size={13} /> Copy
                </Button>
                <Button size="sm" variant="danger" onClick={() => toast("API key management isn't wired in this demo")}>
                  Regenerate
                </Button>
              </div>
              <p className="mt-3 text-caption text-steel-slate">Webhook delivery is not active in this demo — programmatic access is future work.</p>
            </div>
          </Card>
        );

      default:
        return null;
    }
  })();

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

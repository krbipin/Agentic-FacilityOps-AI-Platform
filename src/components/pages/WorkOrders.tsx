"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip, type Tone } from "@/components/ui/Chip";
import { Drawer } from "@/components/ui/Drawer";
import { Icon } from "@/components/ui/icons";
import { TextField, SelectField } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { fetcher, patch, type WorkOrderItem } from "@/lib/api";

const COLUMNS: { key: string; label: string; tone: Tone }[] = [
  { key: "Open", label: "Open", tone: "red" },
  { key: "In Progress", label: "In Progress", tone: "blue" },
  { key: "Scheduled", label: "Scheduled", tone: "amber" },
  { key: "Completed", label: "Completed", tone: "green" },
];

const priorityTone: Record<string, Tone> = { P1: "red", P2: "amber", P3: "blue" };

function isOverdue(wo: WorkOrderItem): boolean {
  if (!wo.due_date || wo.status === "Completed") return false;
  return new Date(wo.due_date) < new Date();
}

export function WorkOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<WorkOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WorkOrderItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [autoCreate, setAutoCreate] = useState(false);
  const [notes, setNotes] = useState("");
  const [completeOpen, setCompleteOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetcher<WorkOrderItem[]>("/api/work-orders")
      .then((d) => {
        if (!cancelled) setOrders(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    fetcher<WorkOrderItem[]>("/api/work-orders")
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const move = useCallback(async (wo: WorkOrderItem, next: string) => {
    const prev = orders;
    setOrders((cur) => cur.map((o) => (o.id === wo.id ? { ...o, status: next } : o)));
    try {
      await patch(`/api/work-orders/${wo.id}`, { status: next });
      toast(`${wo.id} → ${next}`, "success");
    } catch {
      setOrders(prev);
      toast("Move failed", "error");
    }
  }, [orders, toast]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { Open: 0, "In Progress": 0, Scheduled: 0, Completed: 0 };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const aiOrders = useMemo(() => orders.filter((o) => o.source === "AI-predicted"), [orders]);

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading work orders">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96" />)}</div>
      </div>
    );
  }

  const selectedLive = selected ? orders.find((o) => o.id === selected.id) ?? selected : null;

  return (
    <div>
      <PageIntro
        title="Work Orders"
        subtitle={`${orders.length} tickets · 12 predicted failures flagged`}
        agent="Maintenance Agent"
        actions={
          <>
            <label className="inline-flex cursor-pointer items-center gap-2 text-caption text-steel-slate">
              Auto-create from predictions
              <input
                type="checkbox"
                checked={autoCreate}
                onChange={(e) => {
                  setAutoCreate(e.target.checked);
                  toast(e.target.checked ? "12 draft tickets generated" : "Auto-create disabled", "success");
                }}
                className="size-4 accent-[var(--color-primary)]"
              />
            </label>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Icon name="plus" size={14} /> New work order
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Open", value: counts.Open, tone: "text-alert-red" as const },
          { label: "In Progress", value: counts["In Progress"], tone: "text-primary" as const },
          { label: "Scheduled", value: counts.Scheduled, tone: "text-alert-amber" as const },
          { label: "Completed", value: counts.Completed, tone: "text-signal-green" as const },
        ].map((s) => (
          <div key={s.label} className="rounded-card bg-panel-slate glow-border panel-glow p-card-padding">
            <div className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">{s.label}</div>
            <div className={`mt-1 font-kpi-value text-kpi-value ${s.tone}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key);
          return (
            <Card key={col.key} className="flex flex-col">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="flex items-center gap-2 font-section-header text-section-header uppercase tracking-wider text-steel-slate">
                  <span className="size-2 rounded-full" style={{ background: `var(--color-${col.tone === "blue" ? "primary" : col.tone === "red" ? "alert-red" : col.tone === "amber" ? "alert-amber" : "signal-green"}` }} aria-hidden="true" />
                  {col.label}
                </span>
                <Chip tone="steel">{colOrders.length}</Chip>
              </div>
              <div className="flex-1 space-y-3">
                {colOrders.length === 0 && (
                  <p className="py-8 text-center text-caption text-steel-slate">No tickets — drag to rebalance</p>
                )}
                {colOrders.slice(0, 20).map((wo) => (
                  <button
                    key={wo.id}
                    type="button"
                    onClick={() => setSelected(wo)}
                    className={`w-full rounded-control border bg-elevated-slate p-3.5 text-left transition-colors hover:border-steel-slate/50 ${isOverdue(wo) ? "border-alert-red/40" : "border-hairline-slate"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-caption text-steel-slate">{wo.id}</span>
                      <span className={`flex items-center gap-1 font-mono text-caption ${isOverdue(wo) ? "text-alert-red" : "text-steel-slate"}`}>
                        {isOverdue(wo) && <span className="size-1.5 animate-pulse rounded-full bg-alert-red" aria-hidden="true" />}
                        Due {wo.due_date ?? "—"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-body-sm font-medium text-ice-white">{wo.asset_name} · {wo.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Chip tone={priorityTone[wo.priority] ?? "steel"}>{wo.priority}</Chip>
                      <Chip tone={wo.source === "AI-predicted" ? "violet" : "steel"}>{wo.source === "AI-predicted" ? "AI-predicted" : "Manual"}</Chip>
                      {wo.confidence != null && <span className="font-mono text-caption text-violet">{Math.round(wo.confidence)}%</span>}
                      <span className="flex-1" />
                      {wo.assignee ? (
                        <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 font-mono text-caption text-primary" title={wo.assignee}>
                          {wo.assignee.slice(0, 2).toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-caption text-steel-slate">Unassigned</span>
                      )}
                    </div>
                    {col.key !== "Completed" && col.key !== "In Progress" && (
                      <div className="mt-2 flex gap-1.5">
                        <span className="rounded-control border border-hairline-slate px-2 py-0.5 text-caption text-steel-slate" onClick={(e) => { e.stopPropagation(); move(wo, "In Progress"); }}>→ Start</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 p-card-padding">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-section-header text-section-header uppercase tracking-wider text-steel-slate">Prediction-backed orders</h3>
          <Chip tone="violet">{aiOrders.length} from AI predictions</Chip>
        </div>
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[560px] text-left text-body-sm">
            <thead>
              <tr className="text-caption uppercase tracking-wide text-steel-slate">
                <th className="py-2 pr-4 font-medium">ID</th>
                <th className="py-2 pr-4 font-medium">Asset</th>
                <th className="py-2 pr-4 font-medium">Issue</th>
                <th className="py-2 pr-4 font-medium">Confidence</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-slate">
              {aiOrders.slice(0, 12).map((wo) => (
                <tr key={wo.id} className="text-steel-slate">
                  <td className="py-2.5 pr-4 font-mono text-caption">{wo.id}</td>
                  <td className="py-2.5 pr-4 text-ice-white">{wo.asset_name}</td>
                  <td className="py-2.5 pr-4">{wo.title}</td>
                  <td className="py-2.5 pr-4 font-mono text-caption text-violet">{wo.confidence != null ? `${Math.round(wo.confidence)}%` : "—"}</td>
                  <td className="py-2.5"><Chip tone={statusToneFor(wo.status)}>{wo.status}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Drawer open={!!selectedLive} onClose={() => setSelected(null)} title={selectedLive ? `${selectedLive.id} · ${selectedLive.asset_name}` : "Work order"}>
        {selectedLive && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={priorityTone[selectedLive.priority] ?? "steel"}>{selectedLive.priority}</Chip>
              <Chip tone={selectedLive.source === "AI-predicted" ? "violet" : "steel"}>{selectedLive.source === "AI-predicted" ? "AI-predicted" : "Manual"}</Chip>
              <Chip tone={statusToneFor(selectedLive.status)}>{selectedLive.status}</Chip>
            </div>
            <p className="text-body-md text-ice-white">{selectedLive.title}</p>
            <div className="grid grid-cols-2 gap-3 text-body-sm">
              <div className="rounded-control border border-hairline-slate bg-elevated-slate p-3">
                <p className="text-caption text-steel-slate">Status</p>
                <SelectField label="Status" value={selectedLive.status} onChange={(e) => { move(selectedLive, e.target.value); setSelected({ ...selectedLive, status: e.target.value }); }}>
                  {["Open", "In Progress", "Scheduled", "Completed"].map((s) => <option key={s}>{s}</option>)}
                </SelectField>
              </div>
              <div className="rounded-control border border-hairline-slate bg-elevated-slate p-3">
                <p className="text-caption text-steel-slate">Assignee</p>
                <p className="mt-0.5 font-mono text-ice-white">{selectedLive.assignee ?? "Unassigned"}</p>
              </div>
              <div className="rounded-control border border-hairline-slate bg-elevated-slate p-3">
                <p className="text-caption text-steel-slate">Due</p>
                <p className="mt-0.5 font-mono text-ice-white">{selectedLive.due_date ?? "—"}</p>
              </div>
              <div className="rounded-control border border-hairline-slate bg-elevated-slate p-3">
                <p className="text-caption text-steel-slate">Est. hours</p>
                <p className="mt-0.5 font-mono text-ice-white">{selectedLive.estimated_hours}</p>
              </div>
            </div>

            <div>
              <h3 className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">Timeline</h3>
              <ol className="mt-2 space-y-2 border-l border-hairline-slate pl-4">
                <li className="text-caption text-steel-slate"><span className="font-mono text-ice-white">Created</span> — auto by Maintenance Agent</li>
                {selectedLive.status === "In Progress" || selectedLive.status === "Completed" ? (
                  <li className="text-caption text-steel-slate"><span className="font-mono text-ice-white">Started</span> — work began</li>
                ) : null}
                {selectedLive.status === "Completed" ? (
                  <li className="text-caption text-signal-green"><span className="font-mono text-ice-white">Completed</span> — ticket closed</li>
                ) : null}
              </ol>
            </div>

            <div>
              <h3 className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">Notes</h3>
              <TextField label="Add note" placeholder="Technician note…" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <p className="mt-3 rounded-control border border-hairline-slate bg-elevated-slate p-3 text-caption text-steel-slate">
                <span className="font-medium text-violet">Maintenance Agent:</span> recommend replacing bearing during this visit.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => toast(`${selectedLive.id} saved`, "success")}><Icon name="check" size={13} /> Save</Button>
              {selectedLive.status !== "Completed" && (
                <Button size="sm" variant="secondary" onClick={() => { setCompleteOpen(true); }}><Icon name="check" size={13} /> Complete</Button>
              )}
              {selectedLive.status === "Completed" && (
                <Button size="sm" variant="secondary" onClick={() => move(selectedLive, "Open")}>Reopen</Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Work Order"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => { setCreateOpen(false); toast("Work order created (demo)", "success"); refresh(); }}>Create</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <SelectField label="Asset" defaultValue="AST-1042">
            <option value="AST-1042">AST-1042 · AHU-4</option>
            <option value="AST-2031">AST-2031 · Elev-4</option>
            <option value="AST-3044">AST-3044 · VRF-12</option>
          </SelectField>
          <TextField label="Issue type" placeholder="Vibration excessive" />
          <SelectField label="Priority" defaultValue="P2">
            <option>P1</option>
            <option>P2</option>
            <option>P3</option>
          </SelectField>
          <SelectField label="Assignee" defaultValue="">
            <option value="">Unassigned</option>
            <option>SM</option>
            <option>JD</option>
            <option>AP</option>
            <option>KS</option>
          </SelectField>
          <TextField label="Due date" defaultValue="2026-08-07" />
        </div>
      </Modal>

      <Modal
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        title="Complete Work Order"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCompleteOpen(false)}>Cancel</Button>
            <Button
              disabled={!notes.trim()}
              onClick={() => {
                if (selectedLive) move(selectedLive, "Completed");
                setCompleteOpen(false);
                setNotes("");
              }}
            >
              Complete
            </Button>
          </>
        }
      >
        <p className="mb-3 text-body-sm text-steel-slate">A completion note is required.</p>
        <TextField label="Completion note" placeholder="Work performed…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Modal>
    </div>
  );
}

function statusToneFor(status: string): Tone {
  if (status === "Completed") return "green";
  if (status === "In Progress") return "blue";
  if (status === "Scheduled") return "amber";
  return "red";
}

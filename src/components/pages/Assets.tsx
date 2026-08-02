"use client";

import { useCallback, useEffect, useState } from "react";
import { Gauge } from "@/components/charts/Gauge";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip, type Tone } from "@/components/ui/Chip";
import { Drawer } from "@/components/ui/Drawer";
import { Icon } from "@/components/ui/icons";
import { TextField, SelectField } from "@/components/ui/Input";
import { AssetModal } from "@/components/ui/AssetModal";
import { Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/Toast";
import { createWorkOrder, fetcher, useApiData, type AssetItem, type AssetDetail, type AssetStatusPayload } from "@/lib/api";

const EMPTY_STATUS: AssetStatusPayload = {
  facility: { name: "", facility_type: "", location: "" },
  total: 0, statuses: { Excellent: 0, Good: 0, Warning: 0, Critical: 0 },
  distribution_pct: { Excellent: 0, Good: 0, Warning: 0, Critical: 0 },
  asset_types: [],
};

const statusTone: Record<string, Tone> = { Excellent: "green", Good: "blue", Warning: "amber", Critical: "red" };
const PER_PAGE = 25;

const todayStr = () => new Date().toISOString().slice(0, 10);

export function Assets() {
  const status = useApiData<AssetStatusPayload>("/api/dashboards/assets", EMPTY_STATUS, 30000);
  const typeOptions = ["All", ...status.data.asset_types];
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<AssetItem[]>([]);
  const [total, setTotal] = useState(0);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [woLoading, setWoLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      const params = new URLSearchParams({ limit: String(PER_PAGE), offset: String(page * PER_PAGE) });
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (type !== "All") params.set("asset_type", type);
      if (statusFilter !== "All") params.set("status", statusFilter);
      fetcher<{ total: number; items: AssetItem[] }>(`/api/assets?${params.toString()}`)
        .then((d) => {
          if (!cancelled) {
            setItems(d.items);
            setTotal(d.total);
          }
        })
        .finally(() => {
          if (!cancelled) setItemsLoading(false);
        });
    };
    run();
    const id = window.setInterval(run, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [debouncedSearch, type, statusFilter, page]);

  const refreshItems = useCallback(() => {
    setItemsLoading(true);
    const params = new URLSearchParams({ limit: String(PER_PAGE), offset: String(page * PER_PAGE) });
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (type !== "All") params.set("asset_type", type);
    if (statusFilter !== "All") params.set("status", statusFilter);
    fetcher<{ total: number; items: AssetItem[] }>(`/api/assets?${params.toString()}`)
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
      })
      .finally(() => setItemsLoading(false));
  }, [debouncedSearch, type, statusFilter, page]);

  const openDetail = useCallback((id: string) => {
    setDetailLoading(true);
    setDetail(null);
    fetcher<AssetDetail>(`/api/assets/${id}`)
      .then(setDetail)
      .finally(() => setDetailLoading(false));
  }, []);

  const scheduleWorkOrder = async () => {
    if (!detail) return;
    setWoLoading(true);
    try {
      const due = detail.days_to_failure != null
        ? new Date(Date.now() + detail.days_to_failure * 86400000).toISOString().slice(0, 10)
        : undefined;
      const wo = await createWorkOrder({
        asset_id: detail.id,
        title: `Predictive maintenance — ${detail.name}`,
        priority: detail.status === "Critical" ? "P1" : "P2",
        source: "Predictive",
        due_date: due,
      });
      toast(`Work order ${wo.id} created`, "success");
    } catch {
      toast("Failed to create work order", "error");
    } finally {
      setWoLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setType("All");
    setStatusFilter("All");
    setPage(0);
  };

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const distribution = [
    { label: "Excellent", value: status.data.statuses.Excellent, color: "var(--color-signal-green)" },
    { label: "Good", value: status.data.statuses.Good, color: "var(--color-primary)" },
    { label: "Warning", value: status.data.statuses.Warning, color: "var(--color-alert-amber)" },
    { label: "Critical", value: status.data.statuses.Critical, color: "var(--color-alert-red)" },
  ];

  if (status.loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading assets">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-12" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
        </div>
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Icon name="cpu" className="text-alert-amber" size={32} />
        <div>
          <p className="text-body-md font-semibold text-ice-white">Assets unavailable</p>
          <p className="mt-1 text-body-sm text-steel-slate">{status.error} — check the backend service and try again.</p>
        </div>
        <Button variant="secondary" onClick={status.refresh}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <PageIntro
        title="Assets"
        subtitle={`${status.data.total.toLocaleString()} assets monitored by the Maintenance Agent`}
        agent="Maintenance Agent"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => toast("CSV import not configured in demo", "info")}>
              <Icon name="download" size={14} /> Import CSV
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={14} /> Add asset
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-card bg-panel-slate glow-border panel-glow p-card-padding">
          <div className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">Total Assets</div>
          <div className="mt-1 font-kpi-value text-kpi-value max-md:text-kpi-value-mobile text-ice-white">{status.data.total.toLocaleString()}</div>
        </div>
        {distribution.map((d) => (
          <div key={d.label} className="rounded-card bg-panel-slate glow-border panel-glow p-card-padding">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">{d.label}</span>
              <span className="size-2.5 rounded-full" style={{ background: d.color }} aria-hidden="true" />
            </div>
            <div className="mt-1 font-kpi-value text-kpi-value max-md:text-kpi-value-mobile text-ice-white">{status.data.statuses[d.label as keyof typeof status.data.statuses].toLocaleString()}</div>
            <div className="mt-1 text-caption text-steel-slate">{status.data.distribution_pct[d.label as keyof typeof status.data.distribution_pct]}% of fleet</div>
          </div>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader title="Asset Register" subtitle={`Showing ${items.length} of ${total.toLocaleString()} assets`} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px]">
          <TextField label="Search" placeholder="Name or ID…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
          <SelectField label="Type" value={type} onChange={(e) => { setType(e.target.value); setPage(0); }}>
            {typeOptions.map((t) => <option key={t}>{t}</option>)}
          </SelectField>
          <SelectField label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
            <option value="All">All</option>
            <option>Excellent</option>
            <option>Good</option>
            <option>Warning</option>
            <option>Critical</option>
          </SelectField>
        </div>

        <div className="mt-5">
          {itemsLoading ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading assets">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
            </div>
          ) : (
            <div className="-mx-4 overflow-x-auto px-4">
              <table className="w-full min-w-[860px] text-left text-body-sm">
                <thead>
                  <tr className="text-caption uppercase tracking-wide text-steel-slate">
                    <th scope="col" className="py-2 pr-4 font-medium">ID</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Name</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Type</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Location</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Status</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Health</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Last maint.</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Next due</th>
                    <th scope="col" className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-slate">
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10">
                        <div className="flex flex-col items-center gap-2 text-center">
                          <Icon name="cpu" className="text-steel-slate" size={28} />
                          <p className="text-body-sm text-ice-white">No assets match filters</p>
                          <p className="text-caption text-steel-slate">Try adjusting your search or filters.</p>
                          <Button size="sm" variant="secondary" onClick={clearFilters}>Clear filters</Button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {items.map((a) => (
                    <tr key={a.id} className={`text-steel-slate ${a.status === "Critical" ? "border-l-2 border-alert-red" : a.status === "Warning" ? "border-l-2 border-alert-amber" : ""}`}>
                      <td className="py-3 pr-4 font-mono text-caption">{a.id}</td>
                      <td className="py-3 pr-4 font-medium text-ice-white">{a.name}</td>
                      <td className="py-3 pr-4">{a.asset_type}</td>
                      <td className="py-3 pr-4">{a.location}</td>
                      <td className="py-3 pr-4"><Chip tone={statusTone[a.status] ?? "steel"}>{a.status}</Chip></td>
                      <td className="py-3 pr-4 font-mono text-caption">{a.health_score}/100</td>
                      <td className="py-3 pr-4 font-mono text-caption">{a.last_maintenance}</td>
                      <td className="py-3 pr-4 font-mono text-caption">
                        {a.next_due ? (
                          <span className="inline-flex flex-wrap items-center gap-1.5">
                            {a.next_due}
                            {a.next_due < todayStr() && <Chip tone="amber">Overdue</Chip>}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-3">
                        <Button size="sm" variant="ghost" onClick={() => openDetail(a.id)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-caption text-steel-slate">Page {page + 1} of {pages}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <Icon name="chevronLeft" size={14} /> Prev
            </Button>
            <Button size="sm" variant="secondary" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>
              Next <Icon name="chevronRight" size={14} />
            </Button>
          </div>
        </div>
      </Card>

      <Drawer open={!!detail || detailLoading} onClose={() => setDetail(null)} title={detail ? `${detail.name} · ${detail.id}` : "Loading asset…"}>
        {detailLoading && <Skeleton className="h-40" />}
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Gauge value={detail.health_score} label="Health" size={110} />
              <div className="space-y-1">
                <Chip tone={statusTone[detail.status] ?? "steel"}>{detail.status}</Chip>
                <p className="text-caption text-steel-slate">{detail.asset_type} · {detail.location}</p>
                <p className="font-mono text-caption text-steel-slate">Useful life {detail.useful_life_pct}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-body-sm sm:grid-cols-2">
              {[
                ["Manufacturer", detail.manufacturer],
                ["Installed", detail.install_date],
                ["Last maintenance", detail.last_maintenance],
                ["Next due", detail.next_due ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-control border border-hairline-slate bg-elevated-slate p-3">
                  <p className="text-caption text-steel-slate">{k}</p>
                  <p className="mt-0.5 font-mono text-ice-white">{v}</p>
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-label-caps text-label-caps text-steel-slate uppercase tracking-wide">Maintenance history</h3>
              <ul role="list" className="mt-2 divide-y divide-hairline-slate">
                {detail.maintenance_history.slice(0, 5).map((m, i) => (
                  <li key={i} className="py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-body-sm text-ice-white">{m.issue_type}</p>
                      <span className="shrink-0 font-mono text-caption text-steel-slate">${m.cost.toLocaleString()}</span>
                    </div>
                    <p className="text-caption text-steel-slate">{m.maintenance_date} · {m.technician} · {m.status}</p>
                  </li>
                ))}
                {detail.maintenance_history.length === 0 && <li className="py-4 text-caption text-steel-slate">No maintenance records</li>}
              </ul>
            </div>

            {detail.days_to_failure != null || detail.predicted_risk != null ? (
              <div className="rounded-control border border-alert-amber/30 bg-alert-amber/5 p-4">
                <p className="flex items-center gap-2 text-body-sm font-medium text-alert-amber">
                  <Icon name="alert" size={14} /> Predicted failure {detail.days_to_failure != null ? `in ~${detail.days_to_failure} days` : "imminent"}
                </p>
                <p className="mt-1 font-mono text-caption text-steel-slate">confidence {detail.predicted_risk != null ? `${Math.round(detail.predicted_risk)}%` : "—"} · Maintenance Agent</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" loading={woLoading} onClick={scheduleWorkOrder}>
                    <Icon name="clipboard" size={13} /> Schedule work order
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => toast("Prediction dismiss not available — agent-managed", "info")}>Dismiss</Button>
                </div>
              </div>
            ) : (
              <p className="rounded-control border border-hairline-slate bg-elevated-slate p-4 text-caption text-steel-slate">No active failure prediction for this asset.</p>
            )}
          </div>
        )}
      </Drawer>

      <AssetModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          refreshItems();
          status.refresh();
        }}
      />
    </div>
  );
}

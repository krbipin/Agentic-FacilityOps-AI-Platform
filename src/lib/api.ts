import { useCallback, useEffect, useState } from "react";

export async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export interface FacilityInfo {
  name: string;
  facility_type: string;
  location: string;
}

export interface EnergySplit {
  hvac: number;
  lighting: number;
  equipment: number;
  other: number;
}

export interface EnergyAnomaly {
  timestamp: string;
  electricity_kwh: number;
  hvac_kwh: number;
  lift_pct: number;
}

export interface EnergyForecastDay {
  date: string;
  weekday: string;
  electricity_kwh: number;
  is_peak: boolean;
}

export interface HourlyPoint {
  hour: number;
  label: string;
  electricity_kwh: number;
  hvac_kwh: number;
  lighting_kwh: number;
  equipment_kwh: number;
  water_l: number;
}

export interface EnergyPayload {
  facility: FacilityInfo;
  agent: string;
  total_today_kwh: number;
  total_today_mwh: number;
  cost_savings: number;
  efficiency_score: number;
  efficiency_target: number;
  carbon_reduction_pct: number;
  hvac_efficiency_pct: number;
  hvac_setpoint_c: number;
  hvac_avg_temp_c: number;
  hvac_run_hours: number;
  co2_saved_kg: number;
  split: EnergySplit;
  wastage_insights: WastageInsight[];
  change_vs_prev_pct: number;
  change_vs_baseline_pct: number;
  anomalies: EnergyAnomaly[];
  anomaly_count_today: number;
  forecast: EnergyForecastDay[];
  peak_day: EnergyForecastDay | null;
  hourly: HourlyPoint[];
}

export interface PredictedFailure {
  asset_id: string;
  name: string;
  asset_type: string;
  risk: number;
  status: string;
  health_score: number;
  days_to_failure: number;
}

export interface MaintenancePayload {
  facility: FacilityInfo;
  agent: string;
  assets_monitored: number;
  maintenance_tickets: number;
  predicted_failures: number;
  downtime_reduction_pct: number;
  health_distribution: Record<"Excellent" | "Good" | "Warning" | "Critical", number>;
  predicted: PredictedFailure[];
  spend_mtd: number;
  cost_avoided: number;
  mttr_hours: number;
  asset_classes: number;
  new_this_week: number;
  backlog: number;
  attention: number;
  improved: boolean;
}

export interface OccupancyZone {
  zone: string;
  count: number;
  capacity: number;
  utilization_pct: number;
  forecast_count: number;
  forecast_band: number;
}

export interface OccupancyPayload {
  facility: FacilityInfo;
  agent: string;
  occupancy_rate_pct: number;
  active_visitors: number;
  zones: OccupancyZone[];
  forecast_bands: { zone: string; date: string; low: number; high: number }[];
  forecast_accuracy_pct: number;
  zone_timestamp: string;
  delta_vs_yesterday_pct: number;
  crowding_alerts: CrowdingAlert[];
  heatmap: HeatmapCell[];
  meeting_rooms: MeetingRoom[];
  space_optimizations: RecommendationItem[];
  today_total: number;
}

export interface SecurityEventItem {
  id: number;
  event_type: string;
  severity: string;
  title: string;
  location: string;
  timestamp: string;
  status: string;
}

export interface SecurityPayload {
  facility: FacilityInfo;
  agent: string;
  events_today: number;
  unauthorized_access: number;
  active_visitors: number;
  severity_counts: { Red: number; Amber: number; Blue: number };
  doors: { controlled_doors: number; monitored_zones: number };
  burst_hours: number[];
  events: SecurityEventItem[];
  camera_uptime_pct: number;
  cctv_events: SecurityEventItem[];
  visitors: VisitorItem[];
  security_recommendations: RecommendationItem[];
}

export interface CostCategory {
  category: string;
  amount: number;
  budget: number;
  over_budget: boolean;
  variance_pct: number;
  next_month_forecast: number;
  trend_pct: number;
}

export interface CostPayload {
  facility: FacilityInfo;
  agent: string;
  total_spend: number;
  total_budget: number;
  cost_reduction_pct: number;
  roi_generated: number;
  optimizations: number;
  distribution: Record<string, number>;
  categories: CostCategory[];
  facility_health: number;
  savings: RecommendationItem[];
  monthly_trend: MonthlyTrendPoint[];
  vendor_spend: VendorSpend[];
  realized_savings: number;
  roi_multiple: number;
}

export interface RecommendationItem {
  id?: number;
  agent: string;
  title: string;
  impact: string;
  status: string;
}

export interface WastageInsight {
  title: string;
  impact: string;
  status: string;
}

export interface MeetingRoom {
  name: string;
  capacity: number;
  utilization_pct: number;
  status: string;
  booked_at: string | null;
}

export interface CrowdingAlert {
  zone: string;
  level: string;
}

export interface HeatmapCell {
  day: string;
  hour: number;
  density: number;
}

export interface VisitorItem {
  name: string;
  company: string;
  purpose: string;
  status: string;
}

export interface VendorSpend {
  name: string;
  category: string;
  spend: number;
  trend_pct: number;
}

export interface MonthlyTrendPoint {
  month: string;
  amount: number;
}

export interface EscalationLevel {
  level: string;
  role: string;
  delay: string;
  channels: string[];
}

export interface IntelligenceCorrelation {
  pair: string;
  r?: number;
  computed_r?: number;
  confidence?: string;
  insight?: string;
  action?: string;
}

export interface IntelligenceAnomaly {
  severity: string;
  domain: string;
  detail: string;
  timestamp: string;
  status: string;
}

export interface IntelligenceCollaboration {
  source: string;
  target: string;
  insight: string;
}

export interface ForecastCard {
  domain: string;
  horizon: string;
  headline: string;
  confidence: string;
  series: { label: string; value: number }[];
}

export interface IntelligencePayload {
  facility: FacilityInfo;
  engine: string;
  facility_health: number;
  agent_health: Record<string, number>;
  kpis: { cost_reduction_pct: number; roi_generated: number; facility_health: number; optimizations: number };
  correlations: IntelligenceCorrelation[];
  anomaly_sources: { source: string; detail: string }[];
  anomaly_feed: IntelligenceAnomaly[];
  collaboration: IntelligenceCollaboration[];
  forecasts: ForecastCard[];
  recommendations: RecommendationItem[];
  optimizations: number;
  roi_multiple: number;
  explanation: string;
}

export interface OverviewPayload {
  facility: FacilityInfo;
  kpis: {
    energy_mwh: number;
    cost_savings: number;
    facility_health: number;
    active_alerts: number;
  };
  energy: EnergyPayload;
  maintenance: MaintenancePayload;
  occupancy: OccupancyPayload;
  security: SecurityPayload;
  intelligence: IntelligencePayload;
  alerts: { id: number; severity: string; title: string; agent: string; created_at: string }[];
}

export interface AlertsPayload {
  facility: FacilityInfo;
  summary: { total: number; open: number; acknowledged: number; resolved: number };
  alerts: {
    id: number;
    alert_type: string;
    severity: string;
    title: string;
    message: string;
    agent: string;
    status: string;
    channels: string[];
    created_at: string;
  }[];
  escalation_policy: EscalationLevel[];
}

export interface ReportsPayload {
  facility: FacilityInfo;
  period: string;
  generated_at: string;
  data_through: string;
  narrative: string;
  kpis: { cost_reduction_pct: number; roi_generated: number; facility_health: number; optimizations: number };
  spend_trend: { this_quarter: number; budget: number; prior_year: number };
  scorecards: { domain: string; score: number; note: string }[];
  sustainability: { carbon_reduction_pct: number; renewables_pct: number; co2_trend: { date: string; co2_kg: number }[] };
  insights: string[];
  agent_performance: { agent: string; health: number; cost_reduction: string; roi: string; downtime: string }[];
  energy: EnergyPayload;
  maintenance: MaintenancePayload;
  occupancy: OccupancyPayload;
  security: SecurityPayload;
  cost: CostPayload;
  intelligence: IntelligencePayload;
}

export interface WorkOrderItem {
  id: string;
  asset_id: string;
  asset_name: string;
  title: string;
  priority: string;
  source: string;
  status: string;
  assignee: string | null;
  due_date: string | null;
  estimated_hours: number;
  confidence: number | null;
  created_at: string;
}

export interface AssetItem {
  id: string;
  name: string;
  asset_type: string;
  location: string;
  status: string;
  health_score: number;
  install_date: string;
  manufacturer: string;
  useful_life_pct: number;
  last_maintenance: string;
  next_due: string | null;
}

export interface AssetMaintenance {
  issue_type: string;
  maintenance_date: string;
  cost: number;
  technician: string;
  status: string;
}

export interface AssetDetail extends AssetItem {
  maintenance_history: AssetMaintenance[];
  days_to_failure: number | null;
  predicted_risk: number | null;
}

export interface AssetStatusPayload {
  facility: FacilityInfo;
  total: number;
  statuses: Record<"Excellent" | "Good" | "Warning" | "Critical", number>;
  distribution_pct: Record<"Excellent" | "Good" | "Warning" | "Critical", number>;
  asset_types: string[];
}

export interface AgentStatus {
  id: string;
  name: string;
  module: string;
  status: string;
  last_run: string;
  health: number;
}

export interface IntegrationItem {
  id: string;
  name: string;
  kind: string;
  status: string;
  detail: string;
}

export interface SettingsIntegrationsPayload {
  items: IntegrationItem[];
}

export interface CopilotAgentsPayload {
  agents: { name: string; status: string; insight: string }[];
  facility_health: number;
  correlations: IntelligenceCorrelation[];
}

export function useApiData<T>(path: string | null, fallback: T, intervalMs?: number) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState<boolean>(!!path);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    const run = () => {
      fetcher<T>(path)
        .then((d) => {
          if (!cancelled) {
            setData(d);
            setError(null);
          }
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : "Request failed");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    run();
    const id = intervalMs ? window.setInterval(run, intervalMs) : undefined;
    return () => {
      cancelled = true;
      if (id !== undefined) window.clearInterval(id);
    };
  }, [path, intervalMs]);

  const refresh = useCallback(() => {
    if (!path) return;
    setLoading(true);
    fetcher<T>(path)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Request failed"))
      .finally(() => setLoading(false));
  }, [path]);

  return { data, loading, error, refresh };
}

export function patch<T>(path: string, body: unknown): Promise<T> {
  return fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((res) => {
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json() as Promise<T>;
  });
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((res) => {
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json() as Promise<T>;
  });
}

export interface FacilityItem {
  id: number;
  name: string;
  facility_type: string;
  location: string;
  is_active: boolean;
}

export interface CreateFacilityBody {
  name: string;
  facility_type: string;
  location: string;
}

export interface CreateAssetBody {
  name: string;
  asset_type: string;
  location: string;
  status?: string;
  health_score?: number;
  manufacturer?: string;
  useful_life_pct?: number;
  install_date?: string;
  last_maintenance?: string;
  next_due?: string | null;
}

export interface CreateEnergyReadingBody {
  electricity_kwh: number;
  hvac_kwh?: number;
  lighting_kwh?: number;
  equipment_kwh?: number;
  water_l?: number;
  timestamp?: string;
}

export function fetchFacilities(): Promise<{ items: FacilityItem[] }> {
  return fetcher<{ items: FacilityItem[] }>("/api/facilities");
}

export function createFacility(body: CreateFacilityBody): Promise<FacilityItem> {
  return post<FacilityItem>("/api/facilities", body);
}

export function activateFacility(id: number): Promise<FacilityItem> {
  return post<FacilityItem>(`/api/facilities/${id}/activate`, {});
}

export function createAsset(body: CreateAssetBody): Promise<AssetItem> {
  return post<AssetItem>("/api/assets", body);
}

export function createWorkOrder(body: { asset_id: string; title: string; priority: string; source: string; due_date?: string }): Promise<WorkOrderItem> {
  return post<WorkOrderItem>("/api/work-orders", body);
}

export function createEnergyReading(body: CreateEnergyReadingBody): Promise<{
  id: number;
  timestamp: string;
  electricity_kwh: number;
}> {
  return post("/api/energy", body);
}

/**
 * ML Backend API Client
 * Connects to the FastAPI backend running at localhost:8000
 */

const ML_API_BASE = import.meta.env.VITE_ML_API_URL || "http://127.0.0.1:8000";

// ─── Types ──────────────────────────────────────────────────

export interface ForecastResponse {
    dates: string[];
    predictions: number[];
    lower: number[];
    upper: number[];
    message?: string;
}

export interface ClusterPoint {
    patient_id: string;
    lat: number;
    lng: number;
}

export interface Cluster {
    id: string;
    points: ClusterPoint[];
    size: number;
    center: { lat: number; lng: number };
    riskLevel: "Low" | "Medium" | "High";
}

export interface ClustersResponse {
    clusters: Cluster[];
    message?: string;
}

export interface Anomaly {
    date: string;
    count: number;
    severity: "Medium" | "High";
}

export interface AnomaliesResponse {
    anomalies: Anomaly[];
    stats: {
        total_days: number;
        anomaly_days: number;
        mean_daily_cases: number;
        std_daily_cases: number;
    };
    message?: string;
}

export interface RValueEntry {
    date: string;
    r_value: number;
    status: "Growing" | "Stable" | "Declining";
}

export interface RValueResponse {
    r_values: RValueEntry[];
    current_r: number;
    current_status: "Growing" | "Stable" | "Declining";
    window_days: number;
    current_month_cases?: number;
    same_month_last_year_cases?: number;
    multiplier?: number | string;
    max_monsoon_cases?: number;
    message?: string;
}

export interface SituationReportResponse {
    report: string;
    source: "gemini" | "structured";
}

// ─── API Functions ──────────────────────────────────────────

/** Check if the ML Backend is online */
export async function checkHealth(): Promise<boolean> {
    try {
        const res = await fetch(`${ML_API_BASE}/`, { method: "GET" });
        return res.ok;
    } catch {
        return false;
    }
}

async function fetchML<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(endpoint, ML_API_BASE);
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") {
                url.searchParams.set(k, String(v));
            }
        });
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `ML API error: ${res.status}`);
    }
    return res.json();
}

/** Prophet forecast for daily case counts */
export function getForecast(disease?: string, days = 30, state?: string, city?: string, ward?: string) {
    return fetchML<ForecastResponse>("/forecast", { disease: disease || "", days, state: state || "", city: city || "", ward: ward || "" });
}

/** DBSCAN spatial clusters */
export function getClusters(disease?: string, eps = 0.05, minSamples = 3) {
    return fetchML<ClustersResponse>("/clusters", { disease: disease || "", eps, min_samples: minSamples });
}

/** Isolation Forest anomaly detection */
export function getAnomalies(disease?: string, contamination = 0.1, state?: string, city?: string, ward?: string) {
    return fetchML<AnomaliesResponse>("/anomalies", { disease: disease || "", contamination, state: state || "", city: city || "", ward: ward || "" });
}

/** Effective reproduction number (Rt) */
export function getRValue(disease?: string, window = 7, state?: string, city?: string, ward?: string) {
    return fetchML<RValueResponse>("/r-value", { disease: disease || "", window, state: state || "", city: city || "", ward: ward || "" });
}

/** Gemini-powered situation report */
export function getSituationReport(disease?: string) {
    return fetchML<SituationReportResponse>("/situation-report", { disease: disease || "" });
}

// ─── Stage 13: New API functions ────────────────────────────

export interface RValueBreakdownEntry {
    disease: string;
    r_value: number | null;
    status: string;
    case_count: number;
}

export interface RValueBreakdownResponse {
    breakdown: RValueBreakdownEntry[];
    city: string;
    window_days: number;
    message?: string;
}

export interface SIRSimulationResponse {
    days: number[];
    susceptible: number[];
    infected: number[];
    recovered: number[];
    R0: number;
    R0_post_intervention: number;
    peak_day: number;
    peak_infections: number;
    total_infected_end: number;
    parameters: {
        beta: number;
        gamma: number;
        N: number;
        disease: string;
        description: string;
    };
}

export interface InterventionRecommendation {
    strategy: string;
    effectiveness_pct: number;
    cost_level: string;
    disease: string;
    city: string;
    sir_baseline: {
        peak_day: number;
        peak_infections: number;
        total_infected: number;
        R0: number;
    };
    sir_with_intervention: {
        peak_day: number;
        peak_infections: number;
        total_infected: number;
        R0_post: number;
    };
    impact: {
        cases_averted: number;
        peak_reduction: number;
        peak_delay_days: number;
    };
    gemini_recommendation?: string;
    source: string;
}

/** Prophet forecast with nowcasting adjustment */
export function getForecastNowcast(disease?: string, days = 30, state?: string, city?: string, ward?: string) {
    return fetchML<ForecastResponse & { nowcast_adjusted: boolean; reporting_delay_days: number }>(
        "/forecast-nowcast", { disease: disease || "", days, state: state || "", city: city || "", ward: ward || "" }
    );
}

/** Per-disease R-value breakdown */
export function getRValueBreakdown(city?: string, window = 7) {
    return fetchML<RValueBreakdownResponse>("/r-value-breakdown", { city: city || "", window });
}

/** SIR compartmental model simulation */
export function getSIRSimulation(
    disease = "Dengue",
    ward?: string,
    days = 90,
    interventionDay?: number,
    interventionEffectiveness = 0,
) {
    return fetchML<SIRSimulationResponse>("/sir-simulate", {
        disease,
        ward: ward || "",
        days,
        ...(interventionDay !== undefined ? { intervention_day: interventionDay } : {}),
        intervention_effectiveness: interventionEffectiveness,
    });
}

/** POST recommend-intervention (rule-based + SIR + Gemini) */
export async function getRecommendedIntervention(
    disease: string,
    currentCases: number,
    city?: string,
    currentRValue?: number,
): Promise<InterventionRecommendation> {
    const res = await fetch(`${ML_API_BASE}/recommend-intervention`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            disease,
            current_cases: currentCases,
            city: city || null,
            current_r_value: currentRValue || null,
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `ML API error: ${res.status}`);
    }
    return res.json();
}

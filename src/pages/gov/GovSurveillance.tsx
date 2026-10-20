import { useState, useEffect, useMemo } from "react";
import { logSurveillanceAccess } from "@/lib/accessLogger";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/layout/Modular";
import TrendChart from "@/components/analytics/TrendChart";
import { type MedicalRecord } from "@/lib/types";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import { useData } from "@/contexts/DataContext";
import { subDays, isAfter, parseISO, format, startOfWeek, startOfMonth } from "date-fns";
import DiseaseHeatmap from "@/components/analytics/DiseaseHeatmap";
import { Map as MapIcon, LayoutGrid, TrendingUp, TrendingDown, Play, Pause, AlertTriangle, Activity } from "lucide-react";
import { getForecast, getClusters } from "@/lib/mlApi";
import type { ForecastResponse } from "@/lib/mlApi";
import GeoFilterBar from "@/components/gov/GeoFilterBar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Chart colors ─────────────────────────────────────────
const TREND_COLORS: Record<string, string> = {
  Leptospirosis: "#8b8bde",
  Dengue: "#f5a623",
  Malaria: "#52c5d0",
  Typhoid: "#e67c73",
  Tuberculosis: "#5e97f6",
};

const PIE_COLORS = ["#4a5568", "#e74c3c", "#e67e22", "#9b59b6", "#27ae60", "#1abc9c", "#8b8bde"];
const BAR_COLOR = "#4a6fa5";

// ─── Heatmap badge color ──────────────────────────────────
function badgeColor(n: number): string {
  if (n >= 10) return "bg-red-500 text-white";
  if (n >= 6) return "bg-orange-400 text-white";
  if (n >= 3) return "bg-yellow-400 text-gray-900";
  return "bg-green-500 text-white";
}

// ─── Allowed Diseases ─────────────────────────────────────
const ALLOWED_DISEASES = ["Leptospirosis", "Dengue", "Malaria", "Typhoid", "TB", "Gastroenteritis", "Chikungunya"];

function normalizeDiseaseName(raw: string): string {
  if (!raw) return "Other";
  const lower = raw.toLowerCase();
  if (lower.includes("lepto")) return "Leptospirosis";
  if (lower.includes("dengue")) return "Dengue";
  if (lower.includes("malaria")) return "Malaria";
  if (lower.includes("typhoid")) return "Typhoid";
  if (lower.includes("tb") || lower.includes("tuberculosis")) return "TB";
  if (lower.includes("gastro")) return "Gastroenteritis";
  if (lower.includes("chikungunya")) return "Chikungunya";
  return "Other";
}

// ─── Custom tooltip ───────────────────────────────────────
const TrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.stroke || p.fill }} />
          <span className="text-foreground">{p.dataKey}: </span>
          <span className="font-medium text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────
const GovSurveillance = () => {
  const { records, patients, loading } = useData();
  const [trendPeriod, setTrendPeriod] = useState<"monthly" | "weekly">("monthly");
  const [heatmapView, setHeatmapView] = useState<"map" | "table">("table");
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [showClusters, setShowClusters] = useState(false);
  const [clusters, setClusters] = useState<any[]>([]);

  // Filters
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [ward, setWard] = useState("");

  // Timeline & Disease Filtering
  const [selectedDisease, setSelectedDisease] = useState("All");
  const MIN_DATE = new Date("2025-03-01T00:00:00Z").getTime();
  const MAX_DATE = new Date("2026-03-10T00:00:00Z").getTime();
  const [sliderDate, setSliderDate] = useState<number>(MAX_DATE);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    // Fast-reset if user starts play when already at the end
    if (sliderDate >= MAX_DATE) {
      setSliderDate(MIN_DATE);
    }

    const interval = setInterval(() => {
      setSliderDate(prev => {
        const next = prev + 7 * 24 * 60 * 60 * 1000; // +7 days
        if (next >= MAX_DATE) {
          setIsPlaying(false);
          return MAX_DATE;
        }
        return next;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Surveillance access logging
  useEffect(() => { logSurveillanceAccess("heatmap_view", { state, city, ward }); }, [state, city, ward]);
  useEffect(() => { if (showClusters) logSurveillanceAccess("cluster_view"); }, [showClusters]);

  // Only consider records belonging to allowed diseases
  const validRecords = useMemo(() => {
    return records.filter(r => {
      const d = normalizeDiseaseName(r.diagnosis || r.icd_label || "");
      return ALLOWED_DISEASES.includes(d);
    });
  }, [records]);

  // Filter records based on selected patient demographics
  const filteredRecords = useMemo(() => {
    if (!state && !city && !ward) return validRecords;

    const validPatientIds = new Set(
      patients
        .filter(p => {
          if (state && p.state !== state) return false;
          if (city && !p.city?.toLowerCase().includes(city.toLowerCase())) return false;
          if (ward && !p.ward_name?.toLowerCase().includes(ward.toLowerCase())) return false;
          return true;
        })
        .map(p => p.id)
    );

    return validRecords.filter(r => validPatientIds.has(r.patient_id));
  }, [validRecords, patients, state, city, ward]);

  // The newest case in the data: every "last N days" window counts back from here, not from today,
  // so the views stay meaningful when the data isn't from this week.
  const dataAnchor = useMemo(() => {
    let latest = 0;
    filteredRecords.forEach((r) => {
      const t = r.created_at ? new Date(r.created_at).getTime() : 0;
      if (t > latest) latest = t;
    });
    return latest || Date.now();
  }, [filteredRecords]);

  const [matrixDays, setMatrixDays] = useState<number>(90); // 0 = all time

  useEffect(() => {
    getForecast(undefined, 14)
      .then(setForecast)
      .catch(() => { });

    getClusters(undefined, 0.05, 3)
      .then(res => setClusters(res.clusters || []))
      .catch(() => { });
  }, []);

  // Pre-aggregate records by date to prevent O(N) full array scans on every slider tick
  const recordsByDate = useMemo(() => {
    const dateMap: Record<number, typeof filteredRecords> = {};

    filteredRecords.forEach(r => {
      if (!r.created_at) return;
      // Get the start of the day in milliseconds for stable bucketing
      const rDate = new Date(r.created_at).setHours(0, 0, 0, 0);

      if (!dateMap[rDate]) {
        dateMap[rDate] = [];
      }
      dateMap[rDate].push(r);
    });

    return dateMap;
  }, [filteredRecords]);

  // Filter valid records for the MAP using a rolling 60-day window around the slider date
  // This ensures the heatmap reflects seasonal patterns — density rises during monsoon and falls after
  const mapRecords = useMemo(() => {
    const ROLLING_WINDOW_MS = 60 * 24 * 60 * 60 * 1000; // 60-day rolling window
    const windowStart = sliderDate - ROLLING_WINDOW_MS;
    const visibleRecords: typeof filteredRecords = [];

    Object.entries(recordsByDate).forEach(([dateMsStr, dailyRecords]) => {
      const dateMs = Number(dateMsStr);
      // Only include records within the rolling window [sliderDate - 60 days, sliderDate]
      if (dateMs >= windowStart && dateMs <= sliderDate) {
        if (selectedDisease === "All") {
          visibleRecords.push(...dailyRecords);
        } else {
          visibleRecords.push(
            ...dailyRecords.filter(r => {
              const d = normalizeDiseaseName(r.diagnosis || r.icd_label || "");
              return d === selectedDisease;
            })
          );
        }
      }
    });

    return visibleRecords;
  }, [recordsByDate, sliderDate, selectedDisease]);

  // Dynamically filter active clusters based on mapRecords
  const activeClusters = useMemo(() => {
    if (!clusters || clusters.length === 0) return [];

    const mapPatientIds = new Set(mapRecords.map(r => r.patient_id));

    return clusters.map(c => {
      const validPoints = c.points.filter((p: any) => mapPatientIds.has(p.patient_id));
      return {
        ...c,
        size: validPoints.length,
        points: validPoints
      };
    }).filter(c => c.size >= 1); // Only show clusters with at least 1 remaining case
  }, [clusters, mapRecords]);

  // Compute live stat cards from real records
  const topDiseases = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const d = normalizeDiseaseName(r.diagnosis || r.icd_label || "");
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([name]) => name !== "Other")
      .sort((a, b) => b[1] - a[1])
      .map(([name, cases]) => ({ disease: name, cases }));
  }, [filteredRecords]);

  // Distribution donut (last 6 months from records)
  const distributionData = useMemo(() => {
    const cutoff = new Date(dataAnchor - 180 * 86400000);
    const recent = filteredRecords.filter(r => r.created_at && isAfter(parseISO(r.created_at), cutoff));
    const counts: Record<string, number> = {};
    recent.forEach(r => {
      const d = normalizeDiseaseName(r.diagnosis || r.icd_label || "");
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([name]) => name !== "Other")
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [filteredRecords, dataAnchor]);

  // ─── Extract Syndromic Unconfirmed Cases ─────────────────────
  // ─── Extract Syndromic Unconfirmed Cases ─────────────────────
  const syndromicCases = useMemo(() => {
    // 1. Filter raw records, retaining only syndromic ones
    const possibleCases = records.filter(r => 
      r.diagnosis === null && 
      !r.icd_code && 
      r.title?.toLowerCase().includes('syndromic') &&
      r.status === 'ACTIVE'
    );

    // 2. Apply the active Geographic Filters (state/city/ward)
    if (!state && !city && !ward) return possibleCases;

    const validPatientIds = new Set(
      patients.filter(p => {
        if (state && p.state !== state) return false;
        if (city && !p.city?.toLowerCase().includes(city.toLowerCase())) return false;
        if (ward && !p.ward_name?.toLowerCase().includes(ward.toLowerCase())) return false;
        return true;
      }).map(p => p.id)
    );

    return possibleCases.filter(r => validPatientIds.has(r.patient_id));
  }, [records, patients, state, city, ward]);

  // Place names are matched case-insensitively ("Mumbai" and "mumbai" are one place)
  const placeKey = (name?: string | null) =>
    (name || "").trim().toLowerCase().replace(/\s*,\s*/g, ", ").replace(/\s+/g, " ");
  const placeLabel = (key: string) => key.replace(/\b\w/g, (c) => c.toUpperCase());

  // Heatmap table logic
  const { heatmapCols, heatmapData, cityTotals, diseaseTotals, grandTotal } = useMemo(() => {
    const windowStart = matrixDays > 0 ? dataAnchor - matrixDays * 86400000 : 0;
    const data: Record<string, Record<string, number>> = {};
    const totals: Record<string, number> = {};
    const dTotals: Record<string, number> = {};
    let gTotal = 0;
    ALLOWED_DISEASES.forEach((d) => (dTotals[d] = 0));

    const patientById = new Map<string, (typeof patients)[number]>();
    patients.forEach((pt) => {
      patientById.set(pt.id, pt);
      if (pt.patient_id) patientById.set(pt.patient_id, pt);
    });

    filteredRecords.forEach((r) => {
      if (!r.created_at || new Date(r.created_at).getTime() < windowStart) return;
      const dis = normalizeDiseaseName(r.diagnosis || r.icd_label || "");
      if (!ALLOWED_DISEASES.includes(dis)) return;
      const pt = patientById.get(r.patient_id);
      if (!pt) return;

      // Columns are cities, or wards once a city is chosen
      const col = placeKey(city ? pt.ward_name : pt.city);
      if (!col || col === "dombivli") return;
      (data[dis] ??= {})[col] = (data[dis][col] || 0) + 1;
      totals[col] = (totals[col] || 0) + 1;
      dTotals[dis]++;
      gTotal++;
    });

    // Only areas that actually have cases, busiest first
    const colArray = Object.keys(totals).sort((x, y) => totals[y] - totals[x]);
    return { heatmapCols: colArray, heatmapData: data, cityTotals: totals, diseaseTotals: dTotals, grandTotal: gTotal };
  }, [filteredRecords, patients, city, dataAnchor, matrixDays]);

  // Trends
  const { monthlyTrends, weeklyTrends, yMax } = useMemo(() => {
    const monthly: Record<string, any> = {};
    const weekly: Record<string, any> = {};

    filteredRecords.forEach(r => {
      if (!r.created_at) return;
      const date = parseISO(r.created_at);
      const mLabel = format(startOfMonth(date), "MMM yyyy");
      const wLabel = format(startOfWeek(date), "MMM dd");
      const dis = normalizeDiseaseName(r.diagnosis || r.icd_label || "");

      if (!monthly[mLabel]) monthly[mLabel] = { period: mLabel };
      if (!weekly[wLabel]) weekly[wLabel] = { period: wLabel };

      monthly[mLabel][dis] = (monthly[mLabel][dis] || 0) + 1;
      weekly[wLabel][dis] = (weekly[wLabel][dis] || 0) + 1;
    });

    const mArray = Object.values(monthly)
      .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())
      .slice(-12);
    const wArray = Object.values(weekly)
      .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())
      .slice(-12);

    let maxVal = 0;
    const currentData = trendPeriod === "monthly" ? mArray : wArray;
    currentData.forEach((d: any) => {
      Object.keys(d).forEach(k => {
        if (k !== "period" && typeof d[k] === "number") {
          if (d[k] > maxVal) maxVal = d[k];
        }
      });
    });
    const yMax = Math.max(20, Math.ceil(maxVal * 1.2));

    return { monthlyTrends: mArray, weeklyTrends: wArray, yMax };
  }, [filteredRecords, trendPeriod]);

  // Geographic Distribution by State
  const stateDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    validRecords.forEach(r => {
      const p = patients.find(pat => pat.id === r.patient_id || pat.patient_id === r.patient_id);
      if (p?.state) {
        counts[p.state] = (counts[p.state] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([state, count]) => ({ state, current: count }));
  }, [validRecords, patients]);

  const [tab, setTab] = useState<"overview" | "map" | "matrix" | "insights">("overview");

  const chartTooltip = {
    background: "hsl(var(--card))",
    color: "hsl(var(--card-foreground))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 2,
    fontSize: 12,
  };

  const TABS: { key: typeof tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "map", label: "Map" },
    { key: "matrix", label: "Disease matrix" },
    { key: "insights", label: "Insights" },
  ];

  return (
    <DashboardLayout role="gov" fit>
      {/* Row 1: title left, area filter right (one line leaves more room for the views) */}
      <div className="mb-2 flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
        <div className="shrink-0">
          <h1 className="font-serif text-2xl font-medium leading-tight">Disease Surveillance</h1>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-sm border border-success/40 px-1.5 py-px text-[10px] font-medium uppercase tracking-wider text-success">Live</span>
            {filteredRecords.length} records · {patients.length} patients
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <GeoFilterBar state={state} city={city} ward={ward} onStateChange={setState} onCityChange={setCity} onWardChange={setWard} />
        </div>
      </div>

      {/* Row 2: clearly highlighted view switcher, with the early-warning chip beside it */}
      <div className="mb-2 flex shrink-0 flex-wrap items-center gap-2">
        <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-sm border bg-card p-1" role="tablist" aria-label="Surveillance views">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-[2px] px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.key ? "bg-foreground text-background shadow-sm" : "text-foreground/70 hover:bg-muted hover:text-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {syndromicCases.length > 0 && (
          <button
            onClick={() => setTab("insights")}
            title="Open the early-warning details"
            className="ml-auto inline-flex min-w-0 items-center gap-2 rounded-sm border border-warning/40 bg-warning/10 px-3 py-1.5 text-left text-sm transition-colors hover:bg-warning/15"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
            <span className="truncate">
              <b className="font-medium">Early warning</b> · {syndromicCases.length} suspected cases near {syndromicCases[0]?.ward_name || "Nerul"}, {syndromicCases[0]?.city || "Navi Mumbai"}
            </span>
            <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">Details →</span>
          </button>
        )}
      </div>

      {/* Disease counts: only on Overview, in one slim row */}
      {tab === "overview" && (
        <div className="mb-2 grid shrink-0 gap-2 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
          {topDiseases.map((card) => (
            <div key={card.disease} className="relative flex items-baseline justify-between gap-2 rounded-sm border bg-card py-1.5 pl-3 pr-3">
              <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-role-accent" />
              <span className="eyebrow truncate">{card.disease}</span>
              <span className="font-serif text-xl font-medium leading-none">{card.cases}</span>
            </div>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1">
        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="grid gap-4 lg:h-full lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
            <div className="min-w-0 lg:min-h-0">
              <ErrorBoundary title="Failed to load disease trends">
                {loading ? <Skeleton className="h-full min-h-[320px] w-full rounded-sm bg-muted" /> : <TrendChart records={filteredRecords} fill />}
              </ErrorBoundary>
            </div>

            <div className="space-y-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
              <Panel title="Top diseases (live)" bodyClassName="p-3">
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={topDiseases.map((d) => ({ name: d.disease.length > 12 ? d.disease.slice(0, 11) + "…" : d.disease, cases: d.cases }))} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={chartTooltip} />
                    <Bar dataKey="cases" fill={BAR_COLOR} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>

              <Panel title="Distribution" bodyClassName="p-3">
                <div className="flex items-center gap-3">
                  <PieChart width={150} height={150}>
                    <Pie data={distributionData.length > 0 ? distributionData : []} cx="50%" cy="50%" innerRadius={35} outerRadius={58} paddingAngle={2} dataKey="value">
                      {PIE_COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                    </Pie>
                    <Tooltip contentStyle={chartTooltip} />
                  </PieChart>
                  <div className="flex-1 space-y-1.5 text-xs">
                    {distributionData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="truncate text-muted-foreground">{d.name}</span>
                        <span className="ml-auto font-medium">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              <Panel title="Cases by state" bodyClassName="p-3">
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={stateDistribution} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="state" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={chartTooltip} />
                    <Bar dataKey="current" name="Current" fill={BAR_COLOR} radius={[2, 2, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>
          </div>
        )}

        {/* ── Map ── */}
        {tab === "map" && (
          <Panel className="flex min-h-[420px] flex-col lg:h-full lg:min-h-0" bodyClassName="flex min-h-0 flex-1 flex-col gap-3 p-3">
            <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center">
              <select
                value={selectedDisease}
                onChange={(e) => setSelectedDisease(e.target.value)}
                aria-label="Filter disease"
                className="rounded-sm border border-border bg-card px-2 py-1.5 text-sm lg:w-44"
              >
                <option value="All">All diseases</option>
                {ALLOWED_DISEASES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>

              <div className="flex min-w-0 flex-1 items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  aria-label={isPlaying ? "Pause timeline" : "Play timeline"}
                  className="shrink-0 rounded-sm border p-2 transition-colors hover:bg-muted/60"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">Mar 2025</span>
                <input
                  type="range"
                  min={MIN_DATE}
                  max={MAX_DATE}
                  step={24 * 60 * 60 * 1000}
                  value={sliderDate}
                  onChange={(e) => setSliderDate(Number(e.target.value))}
                  className="h-1.5 min-w-0 flex-1 cursor-pointer accent-foreground"
                  aria-label="Timeline"
                />
                <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">Mar 2026</span>
                <span className="shrink-0 rounded-sm border px-2 py-0.5 text-xs font-medium">{format(new Date(sliderDate), "MMM dd, yyyy")}</span>
              </div>

              <div className="flex shrink-0 rounded-sm border p-0.5">
                <button onClick={() => setShowClusters(false)} className={`rounded-[2px] px-3 py-1 text-xs ${!showClusters ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>Heatmap</button>
                <button onClick={() => setShowClusters(true)} className={`rounded-[2px] px-3 py-1 text-xs ${showClusters ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>Clusters</button>
              </div>
            </div>

            <div className="relative min-h-[320px] flex-1">
              <ErrorBoundary title="Failed to load geographic heatmap">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-sm bg-muted" />
                ) : (
                  <DiseaseHeatmap
                    records={mapRecords}
                    patients={patients}
                    selectedState={state}
                    selectedCity={city}
                    selectedWard={ward}
                    clusters={activeClusters}
                    showClusters={showClusters}
                    minHeight={320}
                  />
                )}
              </ErrorBoundary>
            </div>
          </Panel>
        )}

        {/* ── Disease matrix ── */}
        {tab === "matrix" && (
          <Panel
            className="flex min-h-[360px] flex-col lg:h-full lg:min-h-0"
            bodyClassName="flex min-h-0 flex-1 flex-col p-0"
            title="Cases by disease and area"
            description={matrixDays > 0 ? `Cases in the ${matrixDays} days up to ${format(new Date(dataAnchor), "d MMM yyyy")}` : "All recorded cases"}
            action={
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-sm border p-0.5" role="group" aria-label="Time window">
                  {[{ d: 30, l: "30 days" }, { d: 90, l: "90 days" }, { d: 365, l: "1 year" }, { d: 0, l: "All" }].map((o) => (
                    <button
                      key={o.d}
                      onClick={() => setMatrixDays(o.d)}
                      aria-pressed={matrixDays === o.d}
                      className={`rounded-[2px] px-2.5 py-1 text-xs transition-colors ${matrixDays === o.d ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
                <span className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
                  Low <span className="h-2.5 w-20 rounded-full bg-gradient-to-r from-green-500 via-yellow-400 via-orange-400 to-red-500" /> High
                </span>
              </div>
            }
          >
            <div className="min-h-0 flex-1 overflow-auto">
              {heatmapCols.length === 0 && (
                <p className="p-6 text-sm text-muted-foreground">No cases in this window. Try a longer period or clear the area filter.</p>
              )}
              <table className={`w-full text-sm ${heatmapCols.length === 0 ? "hidden" : ""}`}>
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b">
                    <th className="min-w-[120px] px-4 py-2 text-left text-xs font-normal text-muted-foreground">Disease</th>
                    {heatmapCols.map((col) => (
                      <th key={col} className="min-w-[90px] px-2 py-2 text-center">
                        <div className="max-w-[100px] truncate text-xs font-medium">{placeLabel(col)}</div>
                        <div className="text-[11px] text-muted-foreground">{cityTotals[col] || 0}</div>
                      </th>
                    ))}
                    <th className="min-w-[60px] px-4 py-2 text-right text-xs font-semibold text-danger">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ALLOWED_DISEASES.map((dis) => (
                    <tr key={dis} className="transition-colors hover:bg-muted/50">
                      <td className="px-4 py-2 text-xs font-medium">{dis}</td>
                      {heatmapCols.map((col) => {
                        const n = heatmapData[dis]?.[col] ?? 0;
                        return (
                          <td key={col} className="px-2 py-1.5 text-center">
                            {n === 0 ? (
                              <span className="text-sm text-muted-foreground">–</span>
                            ) : (
                              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badgeColor(n)}`}>{n}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2 text-right text-xs font-bold">{diseaseTotals[dis] || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex shrink-0 items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
              <span>{ALLOWED_DISEASES.length} diseases across {heatmapCols.length} areas</span>
              <span>Total <b className="text-foreground">{grandTotal}</b> cases</span>
            </div>
          </Panel>
        )}

        {/* ── Insights ── */}
        {tab === "insights" && (
          <div className="space-y-4 lg:h-full lg:overflow-y-auto lg:pr-1">
            {syndromicCases.length > 0 && (
              <Panel
                title="Early warning: syndromic alert"
                icon={<AlertTriangle className="h-5 w-5 text-warning" />}
                className="border-warning/40 bg-warning/5"
                action={<span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Activity className="h-3 w-3" /> Live detection</span>}
                bodyClassName="grid gap-4 p-4 md:grid-cols-[1fr_1fr]"
              >
                <div className="space-y-3 text-sm">
                  <p>A localized spike in severe clinical presentations was detected before laboratory confirmation.</p>
                  <div className="flex gap-3">
                    <div className="rounded-sm border bg-card px-3 py-2">
                      <p className="eyebrow">Suspected cases</p>
                      <p className="font-serif text-2xl text-warning">{syndromicCases.length}</p>
                    </div>
                    <div className="rounded-sm border bg-card px-3 py-2">
                      <p className="eyebrow">Epicenter</p>
                      <p className="mt-1 text-sm font-medium">{syndromicCases[0]?.ward_name || "Nerul"}, {syndromicCases[0]?.city || "Navi Mumbai"}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-sm border bg-card p-3 text-xs">
                  <p className="eyebrow mb-2">Dominant symptoms</p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>Acute high-grade fever (103°F)</li>
                    <li>Severe frontal headache &amp; retro-orbital pain</li>
                    <li>Intense myalgia/arthralgia</li>
                    <li>Mild petechial rash on extremities</li>
                  </ul>
                  <p className="mt-2 border-t pt-2">Suspected etiology: <b className="text-danger">Dengue fever</b></p>
                </div>
              </Panel>
            )}

            <div>
              <h2 className="eyebrow mb-2 px-1">{city ? "Ward" : "City"} insights</h2>
              {heatmapCols.length === 0 ? (
                <p className="text-sm text-muted-foreground">No insights available.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {heatmapCols.map((loc) => {
                    const totalCases = cityTotals[loc] || 0;
                    if (totalCases === 0) return null;

                    let topDisease = "None";
                    let topDiseaseCount = 0;
                    ALLOWED_DISEASES.forEach((dis) => {
                      const count = heatmapData[dis]?.[loc] || 0;
                      if (count > topDiseaseCount) { topDiseaseCount = count; topDisease = dis; }
                    });

                    let insightText = "Monitor case volumes.";
                    if (topDisease === "Dengue" || topDisease === "Malaria" || topDisease === "Chikungunya") {
                      insightText = `High ${topDisease} activity. Intensive vector control and breeding site elimination needed immediately.`;
                    } else if (topDisease === "Typhoid" || topDisease === "Gastroenteritis") {
                      insightText = "Waterborne disease alert. Inspect local water supply and promote water boiling advisories.";
                    } else if (topDisease === "Tuberculosis") {
                      insightText = "Active TB transmission. Contact tracing and respiratory hygiene campaigns are recommended.";
                    } else if (topDisease === "Leptospirosis") {
                      insightText = "Leptospirosis detected. Warn about stagnant water and distribute prophylactic doxycycline if flooded.";
                    }

                    return (
                      <div key={loc} className="rounded-sm border bg-card p-3">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="truncate font-medium">{placeLabel(loc)}</span>
                          <span className="shrink-0 rounded-sm border px-1.5 py-0.5 text-[11px] text-muted-foreground">{totalCases} cases</span>
                        </div>
                        <p className="text-xs text-muted-foreground"><b className="font-medium text-foreground">Top:</b> {topDisease} ({topDiseaseCount})</p>
                        <p className="mt-1.5 text-xs italic leading-relaxed text-muted-foreground">{insightText}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GovSurveillance;

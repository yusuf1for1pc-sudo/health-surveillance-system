import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useData } from "@/contexts/DataContext";
import { format, subDays, isAfter, parseISO } from "date-fns";
import { DEMO_MODE, fetchDemoData } from "@/lib/demoConfig";
import type { DiseaseMetric, TrendDataPoint, RegionDataPoint } from "@/lib/types";
import DiseaseHeatmap from "@/components/gov/DiseaseHeatmap";
import type { HeatmapData } from "@/components/gov/DiseaseHeatmap";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "#f59e0b",
  "#8b5cf6",
  "#10b981",
  "#06b6d4",
  "#ec4899",
  "#6366f1",
  "#84cc16",
];

const dateRanges = ["Last 7 days", "Last 30 days", "Last 90 days", "Last 6 months", "Last 1 year"];

// ─── Demo data types ────────────────────────────────────
interface DistributionData {
  diseaseMetrics: DiseaseMetric[];
  regionData: RegionDataPoint[];
}

const GovSurveillance = () => {
  const { records, patients } = useData();
  const [dateRange, setDateRange] = useState("Last 6 months");

  // ─── Demo data state ──────────────────────────────────
  const [demoTrends, setDemoTrends] = useState<TrendDataPoint[]>([]);
  const [demoDist, setDemoDist] = useState<DistributionData | null>(null);
  const [demoHeatmap, setDemoHeatmap] = useState<HeatmapData | null>(null);
  const [demoLoading, setDemoLoading] = useState(DEMO_MODE);

  useEffect(() => {
    if (!DEMO_MODE) return;
    let cancelled = false;

    (async () => {
      try {
        const [trends, dist, heatmap] = await Promise.all([
          fetchDemoData<TrendDataPoint[]>("/demo-data/trends.json"),
          fetchDemoData<DistributionData>("/demo-data/distribution.json"),
          fetchDemoData<HeatmapData>("/demo-data/heatmap.json"),
        ]);
        if (!cancelled) {
          setDemoTrends(trends);
          setDemoDist(dist);
          setDemoHeatmap(heatmap);
        }
      } catch (err) {
        console.error("Failed to load demo data:", err);
      } finally {
        if (!cancelled) setDemoLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ─── Live Aggregation Logic (when DEMO_MODE is off) ────

  const filteredRecords = useMemo(() => {
    if (DEMO_MODE) return [];
    const now = new Date();
    let daysToSubtract = 180;
    if (dateRange === "Last 7 days") daysToSubtract = 7;
    if (dateRange === "Last 30 days") daysToSubtract = 30;
    if (dateRange === "Last 90 days") daysToSubtract = 90;
    if (dateRange === "Last 1 year") daysToSubtract = 365;

    const cutoff = subDays(now, daysToSubtract);
    return records.filter(r => r.created_at && isAfter(parseISO(r.created_at), cutoff));
  }, [records, dateRange]);

  const liveDiseaseMetrics = useMemo(() => {
    if (DEMO_MODE) return [];
    const counts: Record<string, { cases: number, code: string }> = {};
    filteredRecords.forEach(r => {
      const label = r.icd_label || r.diagnosis || "Unknown";
      if (!counts[label]) counts[label] = { cases: 0, code: r.icd_code || "?" };
      counts[label].cases++;
    });

    return Object.entries(counts)
      .map(([disease, { cases, code }]) => ({ disease, cases, icd_code: code, trend_percent: 0 }))
      .sort((a, b) => b.cases - a.cases);
  }, [filteredRecords]);

  const liveTrendData = useMemo(() => {
    if (DEMO_MODE) return [];
    const data: Record<string, Record<string, number>> = {};

    filteredRecords.forEach(r => {
      const date = parseISO(r.created_at);
      const key = format(date, "MMM yyyy");
      const label = r.icd_label || "Other";
      if (!data[key]) data[key] = {};
      if (!data[key][label]) data[key][label] = 0;
      data[key][label]++;
    });

    return Object.entries(data).map(([month, diseases]) => ({
      month,
      ...diseases
    }));
  }, [filteredRecords]);

  const liveRegionData = useMemo(() => {
    if (DEMO_MODE) return [];
    const counts: Record<string, number> = {};

    filteredRecords.forEach(r => {
      const patient = patients.find(p => p.id === r.patient_id || p.patient_id === r.patient_id);
      const region = patient?.city || patient?.state || "Unknown";
      counts[region] = (counts[region] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([region, cases]) => ({ region, cases, prev: 0 }))
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 10);
  }, [filteredRecords, patients]);

  // ─── Resolve final data ────────────────────────────────
  const diseaseMetrics = DEMO_MODE ? (demoDist?.diseaseMetrics ?? []) : liveDiseaseMetrics;
  const trendData = DEMO_MODE ? demoTrends : liveTrendData;
  const regionData = DEMO_MODE ? (demoDist?.regionData ?? []) : liveRegionData;

  const pieData = diseaseMetrics.slice(0, 6).map((d) => ({
    name: d.disease,
    value: d.cases,
  }));

  if (demoLoading) {
    return (
      <DashboardLayout role="gov">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground animate-pulse">Loading demo data…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="gov">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <PageHeader title="Disease Surveillance" description="Monitor disease trends and patterns" />
        <div className="flex items-center gap-2">
          {DEMO_MODE && (
            <span className="text-xs bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded-full font-medium">
              DEMO
            </span>
          )}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-9 rounded-lg border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:w-44"
          >
            {dateRanges.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {diseaseMetrics.length === 0 ? (
          <div className="col-span-full py-8 text-center text-muted-foreground bg-card rounded-xl border border-dashed">
            No data available for this period.
          </div>
        ) : (
          diseaseMetrics.slice(0, 4).map((d) => (
            <div key={d.disease} className="bg-card rounded-xl p-4 sm:p-5 card-shadow">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{d.disease}</p>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-xl sm:text-2xl font-semibold text-foreground">{d.cases}</p>
                <span className="text-xs text-muted-foreground">{d.icd_code}</span>
              </div>
              {d.trend_percent !== 0 && (
                <p className={`text-xs mt-1 ${d.trend_percent > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {d.trend_percent > 0 ? '↑' : '↓'} {Math.abs(d.trend_percent)}%
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Line chart – Disease cases over time */}
        <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow lg:col-span-2">
          <h3 className="text-sm font-medium text-foreground mb-4">Disease Trends</h3>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {Object.keys(trendData[0] || {}).filter(k => k !== 'month').slice(0, 5).map((key, idx) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart – Cases by ICD code */}
        <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow">
          <h3 className="text-sm font-medium text-foreground mb-4">Top Diseases</h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diseaseMetrics.slice(0, 7)} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="icd_code" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} interval={0} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="cases" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Cases" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart – Disease Distribution */}
        <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow">
          <h3 className="text-sm font-medium text-foreground mb-4">Distribution</h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart – Cases by Region */}
        <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow lg:col-span-2">
          <h3 className="text-sm font-medium text-foreground mb-4">Geographic Distribution (State/Region)</h3>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="region" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="cases" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Current" />
                <Bar dataKey="prev" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Previous" opacity={0.4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Disease Heatmap */}
      {DEMO_MODE && demoHeatmap && (
        <div className="mt-4 sm:mt-6">
          <DiseaseHeatmap data={demoHeatmap} />
        </div>
      )}

      {/* Anonymization notice */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          {DEMO_MODE
            ? "Demo mode: Displaying simulated surveillance data for demonstration purposes."
            : "Real-time surveillance data. All patient identities are anonymized."}
        </p>
      </div>
    </DashboardLayout>
  );
};

export default GovSurveillance;

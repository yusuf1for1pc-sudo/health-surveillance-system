import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { Panel, PanelGrid } from "@/components/layout/Modular";
import { Activity, AlertTriangle, BarChart3, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { getForecast, getRValue, getAnomalies, getRValueBreakdown } from "@/lib/mlApi";
import type { ForecastResponse, RValueResponse, AnomaliesResponse, RValueBreakdownResponse } from "@/lib/mlApi";
import { useData } from "@/contexts/DataContext";
import GeoFilterBar from "@/components/gov/GeoFilterBar";
import { logSurveillanceAccess } from "@/lib/accessLogger";

const GovWorkspace = () => {
  const { records, patients } = useData();
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [rValue, setRValue] = useState<RValueResponse | null>(null);
  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null);
  const [rBreakdown, setRBreakdown] = useState<RValueBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Geo filters
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [ward, setWard] = useState("");
  const [debouncedCity, setDebouncedCity] = useState("");
  const [debouncedWard, setDebouncedWard] = useState("");

  // Debounce city/ward inputs
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCity(city), 500);
    return () => clearTimeout(t);
  }, [city]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedWard(ward), 500);
    return () => clearTimeout(t);
  }, [ward]);

    // Manual trigger for heavy ML calculations
    const fetchMLData = () => {
        setLoading(true);
        setError(null);
        logSurveillanceAccess("dashboard_load", { state, city: debouncedCity, ward: debouncedWard });
        const s = state || undefined;
        const c = debouncedCity || undefined;
        const w = debouncedWard || undefined;
        Promise.allSettled([
            getForecast(undefined, 14, s, c, w),
            getRValue(undefined, 7, s, c, w),
            getAnomalies(undefined, 0.1, s, c, w),
            getRValueBreakdown(c),
        ])
            .then(([f, r, a, rb]) => {
                if (f.status === "fulfilled") setForecast(f.value);
                if (r.status === "fulfilled") setRValue(r.value);
                if (a.status === "fulfilled") setAnomalies(a.value);
                if (rb.status === "fulfilled") setRBreakdown(rb.value);
                if (f.status === "rejected" && r.status === "rejected" && a.status === "rejected") {
                    setError("ML backend not reachable. Ensure the FastAPI server is running.");
                }
            })
            .finally(() => setLoading(false));
    };

    // Run once on initial open
    useEffect(() => {
        fetchMLData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  // Build chart data from forecast
  const forecastChart = forecast
    ? forecast.dates.map((d, i) => ({
      date: d.slice(5), // MM-DD
      predicted: forecast.predictions[i],
      lower: forecast.lower[i],
      upper: forecast.upper[i],
    }))
    : [];

  const rTone = rValue && rValue.current_r != null
    ? Number(rValue.current_r) > 1.2 ? "alert" : Number(rValue.current_r) > 1.0 ? "warn" : "good"
    : "default";
  const rText = rTone === "alert" ? "text-danger" : rTone === "warn" ? "text-warning" : rTone === "good" ? "text-success" : "";
  const showSeasonal = !!(rValue && rValue.multiplier && Number(rValue.multiplier) >= 5);

  return (
    <DashboardLayout role="gov" fit>
      <PageHeader compact title="Government Dashboard" description="Public health surveillance overview powered by ML" />

      {error && (
        <div className="mb-3 shrink-0 rounded-sm border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          {error}
        </div>
      )}

      {/* Filter + the page's main action, in one slim row */}
      <div className="mb-3 shrink-0">
        <GeoFilterBar
          state={state}
          city={city}
          ward={ward}
          onStateChange={setState}
          onCityChange={setCity}
          onWardChange={setWard}
          actions={
            <button
              onClick={fetchMLData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              {loading ? "Computing…" : "Load ML Insights"}
            </button>
          }
        />
      </div>

      {/* KPI row: one compact line of four */}
      <div className="mb-3 grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
        <StatCard title="Total Patients" value={patients.length} icon={<Activity className="h-5 w-5" />} />
        <StatCard
          title="R-Value (Rt)"
          tone={rTone as any}
          value={loading ? "..." : (rValue && rValue.current_r != null ? Number(rValue.current_r).toFixed(2) : "N/A")}
          subtitle={loading ? "Computing..." : (rValue ? rValue.current_status : "Data not loaded")}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Anomaly Days"
          value={loading ? "..." : (anomalies ? anomalies.stats.anomaly_days : "N/A")}
          subtitle={loading ? "Computing..." : (anomalies ? "last 30 days" : "Data not loaded")}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          title="Seasonal spike"
          tone={showSeasonal ? "alert" : "default"}
          value={loading ? "..." : (rValue && rValue.multiplier ? `${rValue.multiplier}×` : "N/A")}
          subtitle={loading ? "Computing..." : (rValue ? "above baseline" : "Data not loaded")}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      <PanelGrid className="lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_480px] lg:grid-rows-[minmax(0,1fr)]">
        {/* Left: forecast (fills the height) with the Rt breakdown underneath */}
        <div className="flex min-h-0 flex-col gap-3">
          <Panel
            title="Case forecast · next 14 days"
            description="Prophet model with a 95% confidence band"
            className="flex min-h-[300px] flex-1 flex-col lg:min-h-0"
            bodyClassName="min-h-0 flex-1 p-3"
          >
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground animate-pulse">Loading forecast from ML backend...</div>
            ) : forecastChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="forecastColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(tick) => tick.split("-")[1]} minTickGap={15} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", color: "hsl(var(--card-foreground))", border: "1px solid hsl(var(--border))", borderRadius: 2, fontSize: 12 }} itemStyle={{ fontWeight: 500 }} />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.08} name="Upper Bound" />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--card))" fillOpacity={0.9} name="Lower Bound" />
                  <Area type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#forecastColor)" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 0 }} name="Predicted Cases" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No forecast data available.</div>
            )}
          </Panel>

          {rValue && rValue.current_r != null && (
            <Panel className="shrink-0" bodyClassName="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-5">
              <div className="shrink-0">
                <p className="eyebrow">Effective reproduction number</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`font-serif text-4xl font-medium leading-none ${rText}`}>{Number(rValue.current_r).toFixed(2)}</span>
                  <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${rText}`}>{rValue.current_status}</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 border-t pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="eyebrow">Per disease</p>
                  <span className="text-[10px] text-muted-foreground">{rBreakdown ? rBreakdown.city : "Loading…"}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {rBreakdown ? rBreakdown.breakdown.map((d) => (
                    <span key={d.disease} className="inline-flex items-center gap-2 rounded-sm border bg-muted/40 px-2 py-1 text-xs">
                      {d.disease}
                      {d.r_value != null ? (
                        <b className={Number(d.r_value) > 1.2 ? "text-danger" : Number(d.r_value) > 1.0 ? "text-warning" : "text-success"}>{Number(d.r_value).toFixed(2)}</b>
                      ) : <span className="text-muted-foreground">N/A</span>}
                    </span>
                  )) : <span className="text-xs text-muted-foreground animate-pulse">Loading breakdown...</span>}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  <span className="text-success">●</span> below 1.0 declining &nbsp; <span className="text-warning">●</span> 1.0–1.2 monitor &nbsp; <span className="text-danger">●</span> above 1.2 growing
                </p>
              </div>
            </Panel>
          )}
        </div>

        {/* Right: what needs attention, scrolls on its own */}
        <div className="space-y-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          {showSeasonal && rValue && (
            <Panel
              title="Unusual seasonal activity"
              description="Leptospirosis · out-of-season surge"
              className="border-danger/40 bg-danger/5"
              bodyClassName="space-y-3 p-3"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-4xl font-medium leading-none text-danger">{rValue.multiplier}×</span>
                <span className="eyebrow">above seasonal baseline</span>
              </div>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">This month</dt><dd className="font-medium">{rValue.current_month_cases} cases</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Same month last year</dt><dd>{rValue.same_month_last_year_cases} cases</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Expected</dt><dd>5 – 10 cases</dd></div>
                {rValue.max_monsoon_cases !== undefined && (
                  <div className="flex justify-between"><dt className="text-muted-foreground">Monsoon peak 2025</dt><dd>{rValue.max_monsoon_cases} cases</dd></div>
                )}
              </dl>
            </Panel>
          )}

          <Panel title="Detected anomalies" description={anomalies ? `Avg ${anomalies.stats.mean_daily_cases}/day · σ ${anomalies.stats.std_daily_cases}` : undefined} bodyClassName="p-0">
            {anomalies && anomalies.anomalies.length > 0 ? (
              <ul className="divide-y">
                {anomalies.anomalies.slice(0, 8).map((a, i) => (
                  <li key={i} className="flex items-center gap-3 px-3 py-2">
                    <span className={`h-8 w-0.5 shrink-0 ${a.severity === "High" ? "bg-danger" : "bg-warning"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{a.count} cases</span>
                      <span className="block text-xs text-muted-foreground">{a.date}</span>
                    </span>
                    <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${a.severity === "High" ? "border-danger/40 text-danger" : "border-warning/40 text-warning"}`}>{a.severity}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-3 text-sm text-muted-foreground">{loading ? "Computing…" : "No anomalies detected."}</p>
            )}
          </Panel>

          <Panel title="Active interventions" bodyClassName="space-y-2 p-3">
            <div className="relative overflow-hidden rounded-sm border p-3">
              <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-success" />
              <div className="mb-1 flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium leading-tight">Vector Control &amp; Fogging</h4>
                <span className="rounded-sm border border-success/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success">Active</span>
              </div>
              <p className="mb-1.5 text-xs text-muted-foreground">Targeting high-risk Dengue clusters in Ward A and Ward B.</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Deployed 2 days ago</span>
                <span className="inline-flex items-center gap-1 font-medium text-success"><TrendingDown className="h-3 w-3" /> Rt -0.15</span>
              </div>
            </div>
            <Link to="/gov/simulator" className="block rounded-sm border border-dashed px-3 py-2 text-center text-xs text-muted-foreground transition-colors hover:text-foreground">
              + Analyze new strategy in the simulator
            </Link>
          </Panel>
        </div>
      </PanelGrid>
    </DashboardLayout>
  );
};

export default GovWorkspace;

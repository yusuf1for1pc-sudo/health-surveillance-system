import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { Activity, AlertTriangle, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
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
          setError("ML backend not reachable. Ensure the FastAPI server is running on port 8000.");
        }
      })
      .finally(() => setLoading(false));
  }, [state, debouncedCity, debouncedWard]);

  // Build chart data from forecast
  const forecastChart = forecast
    ? forecast.dates.map((d, i) => ({
      date: d.slice(5), // MM-DD
      predicted: forecast.predictions[i],
      lower: forecast.lower[i],
      upper: forecast.upper[i],
    }))
    : [];

  // R-value color
  const rColor = rValue && rValue.current_r != null
    ? Number(rValue.current_r) > 1.2
      ? "text-rose-600"
      : Number(rValue.current_r) > 1.0
        ? "text-amber-600"
        : "text-emerald-600"
    : "";

  const activeCases = patients.filter(p => (p.status || "ACTIVE") === "ACTIVE" || p.status === "CRITICAL").length;

  return (
    <DashboardLayout role="gov">
      <PageHeader title="Government Dashboard" description="Public health surveillance overview powered by ML" />

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-700">
          ⚠️ {error}
        </div>
      )}

      {/* ── Geo Filters ── */}
      <div className="mb-6">
        <GeoFilterBar
          state={state}
          city={city}
          ward={ward}
          onStateChange={setState}
          onCityChange={setCity}
          onWardChange={setWard}
        />
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          title="Active Cases"
          value={activeCases}
          subtitle="ACTIVE + CRITICAL"
          icon={<Activity className="w-5 h-5" />}
        />
        <StatCard
          title="R-Value (Rt)"
          value={loading ? "..." : (rValue && rValue.current_r != null ? Number(rValue.current_r).toFixed(2) : "N/A")}
          subtitle={rValue ? rValue.current_status : "Loading..."}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Anomaly Days"
          value={loading ? "..." : (anomalies ? anomalies.stats.anomaly_days : 0)}
          subtitle={anomalies ? `anomalous days — last 30 days` : "Loading..."}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          title="Leptospirosis Spike"
          value={loading ? "..." : (rValue && rValue.multiplier ? `${rValue.multiplier}×` : "N/A")}
          subtitle="above seasonal baseline"
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      {/* ── Epidemiological Alert ── */}
      {rValue && rValue.multiplier && Number(rValue.multiplier) >= 5 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 mb-6 shadow-sm overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />
          <div className="flex items-start gap-4">
            <div className="bg-rose-100 p-2.5 rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-rose-900 tracking-tight">UNUSUAL SEASONAL ACTIVITY</h3>
                <span className="text-xs font-bold px-2.5 py-1 bg-rose-200 text-rose-800 rounded uppercase tracking-wider">
                  Out-of-season Surge
                </span>
              </div>
              <p className="text-rose-800 font-medium mb-3">Leptospirosis — March 2026</p>

              <div className="bg-white/60 rounded-lg p-4 border border-rose-100 grid md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-sm text-rose-900">
                  <li className="flex justify-between border-b border-rose-100/50 pb-1">
                    <span className="text-rose-700">This month:</span>
                    <span className="font-bold">{rValue.current_month_cases} cases</span>
                  </li>
                  <li className="flex justify-between border-b border-rose-100/50 pb-1">
                    <span className="text-rose-700">March 2025:</span>
                    <span className="font-medium">{rValue.same_month_last_year_cases} cases</span>
                  </li>
                  <li className="flex justify-between pb-1">
                    <span className="text-rose-700">Expected range:</span>
                    <span className="font-medium text-rose-600">5 – 10 cases</span>
                  </li>
                </ul>

                <div className="flex flex-col justify-center space-y-3 pl-0 md:pl-4 md:border-l border-rose-200">
                  <div>
                    <span className="text-2xl font-black text-rose-600 leading-none">{rValue.multiplier}×</span>
                    <p className="text-xs font-semibold text-rose-800 uppercase tracking-wide mt-1">above seasonal baseline</p>
                  </div>

                  {rValue.max_monsoon_cases !== undefined && (
                    <div className="bg-rose-100/50 p-2 rounded border border-rose-100">
                      <p className="text-xs text-rose-900 leading-tight">
                        <span className="font-bold block mb-0.5 text-rose-700">EXCEEDS MONSOON PEAK</span>
                        Peak monsoon 2025: {rValue.max_monsoon_cases} cases
                        <br />
                        Current (Dry Season): {rValue.current_month_cases} cases
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── R-Value Indicator & Breakdown ── */}
      {rValue && rValue.current_r != null && (
        <div className="bg-card rounded-xl p-5 card-shadow mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">System-Wide Effective Reproduction Number</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-5xl font-bold tracking-tighter ${rColor}`}>
                  {Number(rValue.current_r).toFixed(2)}
                </span>
                <span className={`text-sm font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${Number(rValue.current_r) > 1.2 ? "bg-rose-50 border-rose-200 text-rose-700" :
                  Number(rValue.current_r) > 1.0 ? "bg-amber-50 border-amber-200 text-amber-700" :
                    "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}>
                  {rValue.current_status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 max-w-sm leading-relaxed">
                {Number(rValue.current_r) > 1.0
                  ? "Average cases are growing. Immediate public health intervention is recommended to bring Rt below 1.0."
                  : "Disease spread is currently contained and declining."}
              </p>
            </div>

            {/* Legend */}
            <div className="flex sm:flex-col gap-3 text-xs text-muted-foreground bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" /> &lt;1.0 Declining
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" /> 1.0 - 1.2 Stable/Monitor
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" /> &gt;1.2 Growing/Alert
              </div>
            </div>
          </div>

          {/* Per disease R-value breakdown — wired to /r-value-breakdown */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Per-Disease Rt Breakdown</h4>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">{rBreakdown ? rBreakdown.city : "Loading..."}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {rBreakdown ? rBreakdown.breakdown.map(d => (
                <div key={d.disease} className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-md min-w-[140px] flex-1 sm:flex-none">
                  <span className="text-xs font-medium text-slate-700">{d.disease}</span>
                  {d.r_value != null ? (
                    <span className={`text-xs font-bold ${Number(d.r_value) > 1.2 ? "text-rose-600" : Number(d.r_value) > 1.0 ? "text-amber-600" : "text-emerald-600"
                      }`}>{Number(d.r_value).toFixed(2)}</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">N/A</span>
                  )}
                </div>
              )) : (
                <div className="flex flex-1 min-w-[140px] items-center justify-center bg-slate-50 border border-slate-100 border-dashed rounded-md py-2 opacity-60">
                  <span className="text-xs text-slate-400 animate-pulse">Loading breakdown...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* ── Prophet Forecast Chart ── */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium text-foreground">Prophet Case Forecast (14 Days)</h2>
              {forecastChart.length > 0 && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {new Date(new Date().getFullYear(), parseInt(forecastChart[0].date.split("-")[0]) - 1).toLocaleString('default', { month: 'long' })}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground bg-white px-2 py-0.5 rounded border">95% Confidence Interval</span>
          </div>
          <div className="bg-card rounded-xl p-4 sm:p-5 card-shadow h-[400px]">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground animate-pulse text-sm">
                Loading forecast from ML backend...
              </div>
            ) : forecastChart.length > 0 ? (
              <div className="h-full w-full min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="forecastColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis
                      dataKey="date"
                      className="text-xs"
                      tickFormatter={(tick) => tick.split("-")[1]}
                      minTickGap={15}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)' }}
                      itemStyle={{ fontWeight: 500 }}
                    />
                    <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.08} name="Upper Bound" />
                    <Area type="monotone" dataKey="lower" stroke="none" fill="white" fillOpacity={0.8} name="Lower Bound" />
                    <Area type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#forecastColor)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0 }} name="Predicted Cases" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                No forecast data available.
              </div>
            )}
          </div>
        </div>

        {/* ── Intervention Tracker ── */}
        <div className="flex flex-col">
          <h2 className="text-lg font-medium text-foreground mb-3">Active Interventions</h2>
          <div className="bg-card rounded-xl p-5 card-shadow flex-1 flex flex-col">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800 font-medium">Tracking deployed field strategies and their real-time impact on the R-value.</p>
            </div>
            <div className="space-y-3 flex-1">
              {/* Placeholder intervention item */}
              <div className="p-3 border rounded-lg bg-white shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-semibold text-slate-800 leading-tight">Vector Control & Fogging</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded uppercase tracking-wide">Active</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Targeting high-risk Dengue clusters in Ward A and Ward B.</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Deployed 2 days ago</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Rt -0.15
                  </span>
                </div>
              </div>

              <div className="p-3 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center py-6">
                <p className="text-xs text-slate-400 text-center mb-2">No other active interventions.</p>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  + Analyze New Strategy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Anomaly Highlights ── */}
      {anomalies && anomalies.anomalies.length > 0 && (
        <>
          <h2 className="text-lg font-medium text-foreground mb-3">Detected Anomalies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {anomalies.anomalies.slice(0, 6).map((a, i) => (
              <div
                key={i}
                className={`bg-card rounded-xl p-4 card-shadow border-l-4 ${a.severity === "High" ? "border-l-rose-500" : "border-l-amber-400"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{a.date}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.severity === "High"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                      }`}
                  >
                    {a.severity}
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground mt-1">{a.count} cases</p>
                <p className="text-xs text-muted-foreground">
                  Avg: {anomalies.stats.mean_daily_cases} · Std: {anomalies.stats.std_daily_cases}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default GovWorkspace;

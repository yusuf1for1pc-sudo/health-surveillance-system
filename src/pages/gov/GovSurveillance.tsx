import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useData } from "@/contexts/DataContext";
import { subDays, isAfter, parseISO } from "date-fns";
import {
  mockPatients as demoPatients,
  mockRecords as demoRecords,
  HEATMAP_DATA,
  STATE_DISTRIBUTION,
  STAT_CARDS,
  TOP_DISEASE_STATS,
  mockTrendData,
  mockWeeklyTrendData,
} from "../../lib/mockData";
import DiseaseHeatmap from "@/components/analytics/DiseaseHeatmap";
import { Map as MapIcon, LayoutGrid, TrendingUp, TrendingDown } from "lucide-react";

// ─── Chart colors ─────────────────────────────────────────
const TREND_COLORS: Record<string, string> = {
  Influenza: "#8b8bde",
  "COVID-19": "#e8605a",
  Dengue: "#f5a623",
  Tuberculosis: "#4ecb71",
  Malaria: "#52c5d0",
};
const PIE_COLORS = ["#4a5568", "#e74c3c", "#e67e22", "#9b59b6", "#27ae60", "#1abc9c"];
const BAR_COLOR = "#4a6fa5";
const BAR_PREV_COLOR = "#93a8c4";

// ─── Heatmap badge color ──────────────────────────────────
function badgeColor(n: number): string {
  if (n >= 14) return "bg-red-500 text-white";
  if (n >= 10) return "bg-orange-400 text-white";
  if (n >= 6) return "bg-yellow-400 text-gray-900";
  if (n >= 3) return "bg-lime-400 text-gray-900";
  return "bg-green-500 text-white";
}

// ─── Heatmap cities & diseases ────────────────────────────
const HEATMAP_CITIES = ["Mumbai", "Nashik", "Solapur", "Thane", "Nagpur", "Aurangabad", "Pune"];
const HEATMAP_DISEASES = [
  "Influenza A", "Migraine", "Bronchitis", "Infectious gastro", "URTI",
  "Diabetes", "Lipid Disorder", "Dengue fever", "Typhoid", "Malaria",
  "Gastroenteritis", "Hypertension",
];

// ─── Custom tooltip ───────────────────────────────────────
const TrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.stroke }} />
          <span className="text-gray-600">{p.dataKey}: </span>
          <span className="font-medium text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────
const GovSurveillance = () => {
  const { records: supaRecords, patients: supaPatients } = useData();
  const [trendPeriod, setTrendPeriod] = useState<"monthly" | "weekly">("monthly");
  const [timePeriod] = useState("Last 6 months");
  const [heatmapView, setHeatmapView] = useState<"map" | "table">("table");

  // Merge Supabase + demo data
  const patients = useMemo(() => {
    const ids = new Set(supaPatients.map(p => p.id));
    return [...supaPatients, ...demoPatients.filter(p => !ids.has(p.id))];
  }, [supaPatients]);

  const records = useMemo(() => {
    const ids = new Set(supaRecords.map(r => r.id));
    return [...supaRecords, ...demoRecords.filter(r => !ids.has(r.id))];
  }, [supaRecords]);

  // Distribution donut (last 6 months from records)
  const distributionData = useMemo(() => {
    const cutoff = subDays(new Date(), 180);
    const recent = records.filter(r => r.created_at && isAfter(parseISO(r.created_at), cutoff));
    const counts: Record<string, number> = {};
    recent.forEach(r => {
      const label = r.icd_label || r.diagnosis || "Other";
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [records]);

  // Heatmap totals
  const cityTotals = useMemo(() =>
    HEATMAP_CITIES.reduce((acc, city) => {
      acc[city] = HEATMAP_DISEASES.reduce((s, d) => s + (HEATMAP_DATA[city]?.[d] ?? 0), 0);
      return acc;
    }, {} as Record<string, number>),
    []
  );
  const diseaseTotals = useMemo(() =>
    HEATMAP_DISEASES.reduce((acc, dis) => {
      acc[dis] = HEATMAP_CITIES.reduce((s, c) => s + (HEATMAP_DATA[c]?.[dis] ?? 0), 0);
      return acc;
    }, {} as Record<string, number>),
    []
  );
  const grandTotal = Object.values(diseaseTotals).reduce((s, v) => s + v, 0);

  return (
    <DashboardLayout role="gov">
      <div className="min-h-screen bg-gray-50">
        {/* ─── Header ──────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Disease Surveillance</h1>
            <p className="text-sm mt-0.5">
              <span className="text-blue-500">Monitor disease trends</span>
              <span className="text-gray-400"> and </span>
              <span className="text-blue-500">patterns</span>
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-semibold border border-amber-400 text-amber-600 px-2 py-0.5 rounded">
              DEMO
            </span>
            <select className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white text-gray-600 focus:outline-none">
              <option>Last 6 months</option>
              <option>Last 30 days</option>
              <option>Last year</option>
            </select>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* ─── Stat cards ──────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_CARDS.map((card) => (
              <div key={card.disease} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className={`text-xs font-semibold mb-1 ${card.disease === "Influenza A" ? "text-blue-500" :
                  card.disease === "Dengue Fever" ? "text-yellow-500" :
                    card.disease === "COVID-19" ? "text-red-500" : "text-green-500"
                  }`}>
                  {card.disease}
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-gray-800">{card.cases}</span>
                  <span className="text-xs text-gray-400 mb-1">{card.icd_code}</span>
                </div>
                <div className={`text-xs mt-1 flex items-center gap-1 ${card.trend_up ? "text-green-500" : "text-red-500"}`}>
                  {card.trend_up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {card.trend_up ? "↑" : "↓"}{Math.abs(card.trend_percent)}%
                </div>
              </div>
            ))}
          </div>

          {/* ─── Disease Trends line chart ────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-blue-500">Disease Trends</h3>
              <div className="flex bg-gray-100 rounded-md p-0.5">
                <button
                  onClick={() => setTrendPeriod("monthly")}
                  className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${trendPeriod === "monthly" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setTrendPeriod("weekly")}
                  className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${trendPeriod === "weekly" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Weekly
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendPeriod === "monthly" ? mockTrendData : mockWeeklyTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <Tooltip content={<TrendTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                />
                {Object.keys(TREND_COLORS).map(disease => (
                  <Line
                    key={disease}
                    type="monotone"
                    dataKey={disease}
                    stroke={TREND_COLORS[disease]}
                    strokeWidth={2}
                    dot={{ r: 3, fill: TREND_COLORS[disease], strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ─── Top Diseases bar + Distribution donut ───── */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Top Diseases */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-blue-500 mb-4">Top Diseases</h3>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={TOP_DISEASE_STATS} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="icd_code" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0/0.1)", fontSize: 12 }}
                    formatter={(v: any, _: any, p: any) => [v, p.payload.disease]}
                  />
                  <Bar dataKey="cases" fill={BAR_COLOR} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Distribution donut */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-blue-500 mb-4">Distribution</h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={distributionData.length > 0 ? distributionData : [
                        { name: "Influenza A", value: 34 },
                        { name: "Dengue Fever", value: 27 },
                        { name: "COVID-19", value: 15 },
                        { name: "Malaria", value: 12 },
                        { name: "Tuberculosis", value: 7 },
                        { name: "Typhoid Fever", value: 5 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={true}
                    >
                      {PIE_COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "none", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 text-xs flex-1">
                  {["Influenza A", "Dengue Fever", "COVID-19", "Malaria", "Tuberculosis", "Typhoid Fever"].map((name, i) => (
                    <div key={name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-gray-500 text-[11px]">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Geographic Distribution bar chart ───────── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-blue-500 mb-4">Geographic Distribution (State/Region)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={STATE_DISTRIBUTION} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="state"
                  tick={({ x, y, payload }: any) => (
                    <text x={x} y={y + 10} textAnchor="middle" fontSize={10} fill="#3b82f6">{payload.value}</text>
                  )}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", fontSize: 12 }} />
                <Bar dataKey="current" name="Current" fill={BAR_COLOR} radius={[3, 3, 0, 0]} barSize={14} />
                <Bar dataKey="prev" name="Previous" fill={BAR_PREV_COLOR} radius={[3, 3, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ─── Disease Heatmap (w/ Map/Table toggle) ───── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header row with toggle */}
            <div className="flex items-start justify-between p-5 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {heatmapView === "table" ? "Disease Heatmap" : "Geographic Map"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {heatmapView === "table"
                    ? "Cases by disease × city (Maharashtra)"
                    : "Real-time geographic heatmap of reported cases"}
                </p>
              </div>
              {/* Toggle icons */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setHeatmapView("map")}
                  title="Map View"
                  className={`p-2 rounded-full transition-all ${heatmapView === "map"
                    ? "bg-white shadow text-gray-700"
                    : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  <MapIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setHeatmapView("table")}
                  title="Table View"
                  className={`p-2 rounded-full transition-all ${heatmapView === "table"
                    ? "bg-white shadow text-gray-700"
                    : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>

            {heatmapView === "map" ? (
              /* ── Leaflet Map ── */
              <div className="h-[480px] relative">
                <DiseaseHeatmap records={records} patients={patients} />
              </div>
            ) : (
              /* ── Disease × City heatmap table ── */
              <div className="px-5 pb-5">
                {/* Low → High gradient legend */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-gray-500">Low</span>
                  <div className="h-3 w-32 rounded-full bg-gradient-to-r from-green-500 via-lime-400 via-yellow-400 via-orange-400 to-red-500" />
                  <span className="text-xs text-gray-500">High</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left text-gray-500 font-normal text-xs pb-3 pr-4 min-w-[110px]">Disease</th>
                        {HEATMAP_CITIES.map(city => (
                          <th key={city} className="text-center pb-1 px-2 min-w-[90px]">
                            <div className="text-blue-500 font-medium text-xs">{city}</div>
                            <div className="text-gray-400 text-[11px]">{cityTotals[city]}</div>
                          </th>
                        ))}
                        <th className="text-right font-semibold text-red-500 text-xs pb-3 pl-4 min-w-[50px]">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {HEATMAP_DISEASES.map(dis => (
                        <tr key={dis} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-2.5 pr-4 text-gray-700 text-xs font-medium truncate max-w-[110px]">
                            {dis.length > 14 ? dis.slice(0, 13) + "…" : dis}
                          </td>
                          {HEATMAP_CITIES.map(city => {
                            const n = HEATMAP_DATA[city]?.[dis] ?? 0;
                            return (
                              <td key={city} className="py-2 px-2 text-center">
                                {n === 0 ? (
                                  <span className="text-gray-400 text-sm">–</span>
                                ) : (
                                  <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold ${badgeColor(n)}`}>
                                    {n}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2 pl-4 text-right text-xs font-bold text-gray-700">
                            {diseaseTotals[dis]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {HEATMAP_DISEASES.length} diseases across {HEATMAP_CITIES.length} cities
                  </span>
                  <span className="text-xs font-medium text-gray-600">
                    Total: <span className="text-gray-800 font-semibold">{grandTotal}</span> cases
                  </span>
                </div>

                {/* Demo note */}
                <p className="text-center text-xs text-blue-400 mt-4">
                  Demo mode: Displaying simulated surveillance data for demonstration purposes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GovSurveillance;

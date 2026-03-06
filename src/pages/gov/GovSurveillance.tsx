import { useState, useEffect, useMemo } from "react";
import { logSurveillanceAccess } from "@/lib/accessLogger";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
import { Map as MapIcon, LayoutGrid, TrendingUp, TrendingDown } from "lucide-react";
import { getForecast, getClusters } from "@/lib/mlApi";
import type { ForecastResponse } from "@/lib/mlApi";
import GeoFilterBar from "@/components/gov/GeoFilterBar";

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
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.stroke || p.fill }} />
          <span className="text-gray-600">{p.dataKey}: </span>
          <span className="font-medium text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────
const GovSurveillance = () => {
  const { records, patients } = useData();
  const [trendPeriod, setTrendPeriod] = useState<"monthly" | "weekly">("monthly");
  const [heatmapView, setHeatmapView] = useState<"map" | "table">("table");
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [showClusters, setShowClusters] = useState(false);
  const [clusters, setClusters] = useState<any[]>([]);

  // Filters
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [ward, setWard] = useState("");

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
        .map(p => p.patient_id || p.id)
    );

    return validRecords.filter(r => validPatientIds.has(r.patient_id));
  }, [validRecords, patients, state, city, ward]);

  useEffect(() => {
    getForecast(undefined, 14)
      .then(setForecast)
      .catch(() => { });

    getClusters(undefined, 0.05, 3)
      .then(res => setClusters(res.clusters || []))
      .catch(() => { });
  }, []);

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
    const cutoff = subDays(new Date(), 180);
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
  }, [filteredRecords]);

  // Heatmap table logic
  const { heatmapCols, heatmapData, cityTotals, diseaseTotals, grandTotal } = useMemo(() => {
    // Determine columns: if city is selected, show wards. Otherwise show cities.
    const cols = new Set<string>();
    patients.forEach(p => {
      if (city && p.city?.toLowerCase() === city.toLowerCase() && p.ward_name) cols.add(p.ward_name);
      else if (!city && p.city) cols.add(p.city);
    });
    const colArray = Array.from(cols).sort();

    const data: Record<string, Record<string, number>> = {};
    const cTotals: Record<string, number> = {};
    const dTotals: Record<string, number> = {};
    let gTotal = 0;

    colArray.forEach(c => cTotals[c] = 0);
    ALLOWED_DISEASES.forEach(d => dTotals[d] = 0);

    filteredRecords.forEach(r => {
      const dis = normalizeDiseaseName(r.diagnosis || r.icd_label || "");
      if (!ALLOWED_DISEASES.includes(dis)) return;

      const p = patients.find(pat => pat.id === r.patient_id || pat.patient_id === r.patient_id);
      if (!p) return;

      const colKey = city ? p.ward_name : p.city;
      if (colKey && colArray.includes(colKey)) {
        if (!data[dis]) data[dis] = {};
        data[dis][colKey] = (data[dis][colKey] || 0) + 1;
        cTotals[colKey]++;
        dTotals[dis]++;
        gTotal++;
      }
    });

    return { heatmapCols: colArray, heatmapData: data, cityTotals: cTotals, diseaseTotals: dTotals, grandTotal: gTotal };
  }, [filteredRecords, patients, city]);

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
            <span className="text-xs font-semibold border border-emerald-400 text-emerald-600 px-2 py-0.5 rounded">
              LIVE
            </span>
            <span className="text-xs text-gray-400">{filteredRecords.length} records · {patients.length} total patients</span>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* ─── Filters ──────────────────────────────────── */}
          <div className="mb-6 mt-4">
            <GeoFilterBar
              state={state}
              city={city}
              ward={ward}
              onStateChange={setState}
              onCityChange={setCity}
              onWardChange={setWard}
            />
          </div>

          {/* ─── Stat cards ──────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {topDiseases.map((card, i) => {
              const colors = ["text-blue-500", "text-yellow-500", "text-red-500", "text-green-500"];
              return (
                <div key={card.disease} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className={`text-xs font-semibold mb-1 ${colors[i % colors.length]}`}>
                    {card.disease.length > 25 ? card.disease.slice(0, 24) + "…" : card.disease}
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold text-gray-800">{card.cases}</span>
                  </div>
                  <div className="text-xs mt-1 flex items-center gap-1 text-gray-400">
                    From live records
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── Disease Trends line chart ────────────────── */}
          <div className="mb-6">
            <TrendChart records={filteredRecords} />
          </div>

          {/* ─── Top Diseases bar + Distribution donut ───── */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Top Diseases */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-blue-500 mb-4">Top Diseases (Live)</h3>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={topDiseases.map(d => ({ name: d.disease.length > 12 ? d.disease.slice(0, 11) + '…' : d.disease, cases: d.cases }))} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0/0.1)", fontSize: 12 }}
                  />
                  <Bar dataKey="cases" fill={BAR_COLOR} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Distribution donut */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-blue-500 mb-4">Distribution</h3>
              <div className="flex items-center gap-4">
                <PieChart width={200} height={200}>
                  <Pie
                    data={distributionData.length > 0 ? distributionData : []}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}% `}
                    labelLine={true}
                  >
                    {PIE_COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "none", fontSize: 12 }} />
                </PieChart>
                <div className="space-y-2 text-xs flex-1">
                  {distributionData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-gray-500 text-[11px]">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Geographic Distribution bar chart ───────── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-blue-500">Geographic Distribution (State)</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stateDistribution} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} barGap={2}>
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
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ─── Disease Heatmap (w/ Map/Table toggle) ───── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header row with toggle */}
            <div className="flex items-start justify-between p-5 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {heatmapView === "table" ? "Disease Matrix" : "Geographic Map"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {heatmapView === "table"
                    ? "Cases by disease × area"
                    : "Real-time geographic heatmap and active clusters"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Map Layer Toggle (only visible on map view) */}
                {heatmapView === "map" && (
                  <div className="flex items-center gap-2 bg-gray-50 border rounded-lg p-1">
                    <button
                      onClick={() => setShowClusters(false)}
                      className={`text-xs px-3 py-1 rounded-md transition-colors ${!showClusters ? "bg-white shadow-sm font-semibold text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Gradient Heatmap
                    </button>
                    <button
                      onClick={() => setShowClusters(true)}
                      className={`text-xs px-3 py-1 rounded-md transition-colors ${showClusters ? "bg-white shadow-sm font-semibold text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Active Clusters (DBSCAN)
                    </button>
                  </div>
                )}

                {/* View Mode Toggle */}
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
            </div>

            {heatmapView === "map" ? (
              /* ── Leaflet Map ── */
              <div className="h-[480px] relative w-full p-4">
                <DiseaseHeatmap
                  records={filteredRecords}
                  patients={patients}
                  selectedState={state}
                  selectedCity={city}
                  selectedWard={ward}
                  clusters={clusters}
                  showClusters={showClusters}
                />
              </div>
            ) : (
              /* ── Disease × City heatmap table ── */
              <div className="px-5 pb-5 w-full">
                {/* Low → High gradient legend */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-gray-500">Low</span>
                  <div className="h-3 w-32 rounded-full bg-gradient-to-r from-green-500 via-yellow-400 via-orange-400 to-red-500" />
                  <span className="text-xs text-gray-500">High</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left text-gray-500 font-normal text-xs pb-3 pr-4 min-w-[110px]">Disease</th>
                        {heatmapCols.map(col => (
                          <th key={col} className="text-center pb-1 px-2 min-w-[90px]">
                            <div className="text-blue-500 font-medium text-xs truncate max-w-[100px]">{col}</div>
                            <div className="text-gray-400 text-[11px]">{cityTotals[col] || 0}</div>
                          </th>
                        ))}
                        <th className="text-right font-semibold text-red-500 text-xs pb-3 pl-4 min-w-[50px]">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {ALLOWED_DISEASES.map(dis => (
                        <tr key={dis} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-2.5 pr-4 text-gray-700 text-xs font-medium truncate max-w-[110px]">
                            {dis.length > 14 ? dis.slice(0, 13) + "…" : dis}
                          </td>
                          {heatmapCols.map(col => {
                            const n = heatmapData[dis]?.[col] ?? 0;
                            return (
                              <td key={col} className="py-2 px-2 text-center">
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
                            {diseaseTotals[dis] || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {ALLOWED_DISEASES.length} diseases across {heatmapCols.length} areas
                  </span>
                  <span className="text-xs font-medium text-gray-600">
                    Total: <span className="text-gray-800 font-semibold">{grandTotal}</span> cases
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ─── Geographic Insights ──────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-[400px] flex flex-col">
            <h3 className="text-sm font-semibold text-blue-500 mb-4 flex-shrink-0">
              {city ? "Ward" : "City"} Insights
            </h3>

            {heatmapCols.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                No insights available.
              </div>
            ) : (
              <div className="flex-1 overflow-auto space-y-3 pr-2">
                {heatmapCols.map(loc => {
                  const totalPatients = cityTotals[loc] || 0;
                  if (totalPatients === 0) return null;

                  // Find top disease for this location
                  let topDisease = "None";
                  let topDiseaseCount = 0;
                  ALLOWED_DISEASES.forEach(dis => {
                    const count = heatmapData[dis]?.[loc] || 0;
                    if (count > topDiseaseCount) {
                      topDiseaseCount = count;
                      topDisease = dis;
                    }
                  });

                  // Simple rules-based insight text
                  let insightText = `Monitor case volumes.`;
                  if (topDisease === "Dengue" || topDisease === "Malaria" || topDisease === "Chikungunya") {
                    insightText = `High ${topDisease} activity. Intensive vector control and breeding site elimination needed immediately.`;
                  } else if (topDisease === "Typhoid" || topDisease === "Gastroenteritis") {
                    insightText = `Waterborne disease alert. Inspect local water supply and promote water boiling advisories.`;
                  } else if (topDisease === "Tuberculosis") {
                    insightText = `Active TB transmission. Contact tracing and respiratory hygiene campaigns are recommended.`;
                  } else if (topDisease === "Leptospirosis") {
                    insightText = `Leptospirosis detected. Issue warnings regarding stagnant water and distribute prophylactic doxycycline if flooded.`;
                  }

                  return (
                    <div key={loc} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-slate-800">{loc}</span>
                        <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-slate-200 font-medium">
                          {totalPatients} Patients
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">
                          <strong className="text-slate-700">Top Disease:</strong> {topDisease} ({topDiseaseCount} cases)
                        </span>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-white p-2 rounded border border-slate-50 italic">
                          " {insightText} "
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout >
  );
};

export default GovSurveillance;

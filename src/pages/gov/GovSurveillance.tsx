import { useState, useMemo, lazy, Suspense } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from "recharts";
import { useData } from "@/contexts/DataContext";
import { subDays, isAfter, parseISO } from "date-fns";
import AlertsPanel from "@/components/analytics/AlertsPanel";
import DiseaseHeatmap from "@/components/analytics/DiseaseHeatmap";
import TrendChart from "@/components/analytics/TrendChart";
import { mockPatients as demoPatients, mockRecords as demoRecords } from "@/lib/mockData";

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

const GovSurveillance = () => {
  const { records: supaRecords, patients: supaPatients } = useData();

  // Merge Supabase data with demo data (ensures heatmap always has geo data for demo)
  const patients = useMemo(() => {
    const ids = new Set(supaPatients.map(p => p.id));
    return [...supaPatients, ...demoPatients.filter(p => !ids.has(p.id))];
  }, [supaPatients]);

  const records = useMemo(() => {
    const ids = new Set(supaRecords.map(r => r.id));
    return [...supaRecords, ...demoRecords.filter(r => !ids.has(r.id))];
  }, [supaRecords]);

  // 1. Disease Metrics (Cases by ICD Label/Disease for Pie Chart)
  // Default to last 6 months for the overview pie chart
  const diseaseMetrics = useMemo(() => {
    const cutoff = subDays(new Date(), 180);
    const recentRecords = records.filter(r => r.created_at && isAfter(parseISO(r.created_at), cutoff));

    const counts: Record<string, { cases: number, code: string }> = {};
    recentRecords.forEach(r => {
      const label = r.icd_label || r.diagnosis || "Unknown";
      if (!counts[label]) counts[label] = { cases: 0, code: r.icd_code || "?" };
      counts[label].cases++;
    });

    return Object.entries(counts)
      .map(([disease, { cases, code }]) => ({ disease, cases, icd_code: code }))
      .sort((a, b) => b.cases - a.cases);
  }, [records]);

  return (
    <DashboardLayout role="gov">
      <div className="space-y-6">
        <PageHeader
          title="National Disease Surveillance"
          description="Real-time monitoring of disease outbreaks and public health risks."
        />

        {/* Top: Heatmap & Alerts */}
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          <div className="md:col-span-2 lg:col-span-3 h-[500px] border rounded-lg overflow-hidden bg-card relative shadow-sm">
            <DiseaseHeatmap records={records} patients={patients} />
          </div>

          <div className="md:col-span-1 lg:col-span-1 h-[500px]">
            <AlertsPanel alerts={[]} />
          </div>
        </div>

        {/* Middle: Trend Analysis & Distribution */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Advanced Trend Chart (Weekly/Monthly + Spikes) */}
          <TrendChart records={records} title="Disease Trends & Anomalies" />

          {/* Disease Distribution Circle */}
          <div className="p-6 border rounded-lg bg-card shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold mb-2">Case Distribution (Last 6 Months)</h3>
            <p className="text-sm text-muted-foreground mb-4">Breakdown of reported cases by disease type.</p>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diseaseMetrics}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="cases"
                    nameKey="disease"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {diseaseMetrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 500 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {diseaseMetrics.slice(0, 6).map((item, index) => (
                <div key={item.disease} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate">{item.disease} ({item.cases})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GovSurveillance;

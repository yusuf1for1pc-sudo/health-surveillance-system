import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { Activity, AlertTriangle, BarChart3 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { DEMO_MODE, fetchDemoData } from "@/lib/demoConfig";

// ─── Fallback data (used when DEMO_MODE is off) ──────────
const fallbackTrend = [
  { week: "W1", cases: 980 },
  { week: "W2", cases: 1050 },
  { week: "W3", cases: 1120 },
  { week: "W4", cases: 1180 },
  { week: "W5", cases: 1210 },
  { week: "W6", cases: 1247 },
];

interface WorkspaceData {
  stats: { activeCases: string; activeAlerts: number; reportsGenerated: number };
  miniTrend: { week: string; cases: number }[];
}

const GovWorkspace = () => {
  const [data, setData] = useState<WorkspaceData | null>(
    DEMO_MODE ? null : {
      stats: { activeCases: "1,247", activeAlerts: 3, reportsGenerated: 28 },
      miniTrend: fallbackTrend,
    }
  );

  useEffect(() => {
    if (!DEMO_MODE) return;
    let cancelled = false;

    fetchDemoData<WorkspaceData>("/demo-data/workspace.json")
      .then(d => { if (!cancelled) setData(d); })
      .catch(err => {
        console.error("Failed to load workspace demo data:", err);
        if (!cancelled) setData({
          stats: { activeCases: "1,247", activeAlerts: 3, reportsGenerated: 28 },
          miniTrend: fallbackTrend,
        });
      });

    return () => { cancelled = true; };
  }, []);

  if (!data) {
    return (
      <DashboardLayout role="gov">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground animate-pulse">Loading…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="gov">
      <div className="flex items-center gap-2 mb-1">
        <PageHeader title="Government Dashboard" description="Public health surveillance overview" />
        {DEMO_MODE && (
          <span className="text-xs bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded-full font-medium">
            DEMO
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard title="Active Cases" value={data.stats.activeCases} subtitle="Across all regions" icon={<Activity className="w-5 h-5" />} />
        <StatCard title="Active Alerts" value={data.stats.activeAlerts} subtitle="Requires attention" icon={<AlertTriangle className="w-5 h-5" />} />
        <StatCard title="Reports Generated" value={data.stats.reportsGenerated} subtitle="This month" icon={<BarChart3 className="w-5 h-5" />} />
      </div>

      <h2 className="text-lg font-medium text-foreground mb-4">Disease Trends (6 Weeks)</h2>
      <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow">
        <div className="h-52 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.miniTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="week" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="cases" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} name="Total Cases" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GovWorkspace;

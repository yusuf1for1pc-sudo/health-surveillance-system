import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { Activity, AlertTriangle, BarChart3 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const miniTrend = [
  { week: "W1", cases: 980 },
  { week: "W2", cases: 1050 },
  { week: "W3", cases: 1120 },
  { week: "W4", cases: 1180 },
  { week: "W5", cases: 1210 },
  { week: "W6", cases: 1247 },
];

const GovWorkspace = () => (
  <DashboardLayout role="gov">
    <PageHeader title="Government Dashboard" description="Public health surveillance overview" />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
      <StatCard title="Active Cases" value="1,247" subtitle="Across all regions" icon={<Activity className="w-5 h-5" />} />
      <StatCard title="Active Alerts" value={3} subtitle="Requires attention" icon={<AlertTriangle className="w-5 h-5" />} />
      <StatCard title="Reports Generated" value={28} subtitle="This month" icon={<BarChart3 className="w-5 h-5" />} />
    </div>

    <h2 className="text-lg font-medium text-foreground mb-4">Disease Trends (6 Weeks)</h2>
    <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow">
      <div className="h-52 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={miniTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
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

export default GovWorkspace;

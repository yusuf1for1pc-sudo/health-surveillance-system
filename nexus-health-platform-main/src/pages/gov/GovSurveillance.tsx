import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const trendData = [
  { month: "Sep", influenza: 120, covid: 200, dengue: 45, tb: 30 },
  { month: "Oct", influenza: 180, covid: 160, dengue: 80, tb: 35 },
  { month: "Nov", influenza: 250, covid: 130, dengue: 120, tb: 40 },
  { month: "Dec", influenza: 310, covid: 110, dengue: 140, tb: 50 },
  { month: "Jan", influenza: 340, covid: 95, dengue: 150, tb: 60 },
  { month: "Feb", influenza: 342, covid: 89, dengue: 156, tb: 67 },
];

const icdData = [
  { code: "J09", label: "Influenza", cases: 342 },
  { code: "U07", label: "COVID-19", cases: 89 },
  { code: "A90", label: "Dengue", cases: 156 },
  { code: "A15", label: "TB", cases: 67 },
  { code: "A09", label: "Gastroenteritis", cases: 43 },
  { code: "B34", label: "Viral Infection", cases: 28 },
];

const locationData = [
  { region: "North", cases: 320, prev: 280 },
  { region: "South", cases: 210, prev: 190 },
  { region: "East", cases: 180, prev: 220 },
  { region: "West", cases: 150, prev: 170 },
  { region: "Central", cases: 290, prev: 250 },
];

const GovSurveillance = () => (
  <DashboardLayout role="gov">
    <PageHeader title="Disease Surveillance" description="Monitor disease trends and patterns" />

    {/* Summary cards */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {[
        { disease: "Influenza A", cases: 342, trend: "+12%" },
        { disease: "COVID-19", cases: 89, trend: "-5%" },
        { disease: "Dengue", cases: 156, trend: "+28%" },
        { disease: "Tuberculosis", cases: 67, trend: "-3%" },
      ].map((d) => (
        <div key={d.disease} className="bg-card rounded-xl p-4 sm:p-5 card-shadow">
          <p className="text-xs sm:text-sm text-muted-foreground">{d.disease}</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-xl sm:text-2xl font-semibold text-foreground">{d.cases}</p>
            <span className={`text-xs sm:text-sm font-medium ${d.trend.startsWith("+") ? "text-destructive" : "text-accent-foreground"}`}>
              {d.trend}
            </span>
          </div>
        </div>
      ))}
    </div>

    {/* Charts grid */}
    <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Line chart – Disease cases over time */}
      <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow lg:col-span-2">
        <h3 className="text-sm font-medium text-foreground mb-4">Disease Cases Over Time</h3>
        <div className="h-56 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="influenza" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Influenza" />
              <Line type="monotone" dataKey="covid" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="COVID-19" />
              <Line type="monotone" dataKey="dengue" stroke="#f59e0b" strokeWidth={2} dot={false} name="Dengue" />
              <Line type="monotone" dataKey="tb" stroke="#8b5cf6" strokeWidth={2} dot={false} name="TB" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar chart – Cases by ICD code */}
      <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow">
        <h3 className="text-sm font-medium text-foreground mb-4">Cases by ICD Code</h3>
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={icdData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="code" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="cases" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Area chart – Location trends */}
      <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow">
        <h3 className="text-sm font-medium text-foreground mb-4">Cases by Region</h3>
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={locationData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="region" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="cases" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Current" />
              <Bar dataKey="prev" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Previous" opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default GovSurveillance;

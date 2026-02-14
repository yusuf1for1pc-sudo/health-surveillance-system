import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { AlertTriangle } from "lucide-react";

const alerts = [
  { title: "Dengue Outbreak — Region East", severity: "High", date: "2026-02-12", description: "156 cases reported in the past 7 days. Recommend increased vector control measures." },
  { title: "Influenza Spike — Metropolitan Area", severity: "Medium", date: "2026-02-10", description: "30% increase in influenza cases compared to last month." },
  { title: "TB Case Cluster — District 5", severity: "Low", date: "2026-02-05", description: "Small cluster of 5 cases identified. Contact tracing initiated." },
];

const severityColors: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-accent text-accent-foreground",
  Low: "bg-muted text-muted-foreground",
};

const GovAlerts = () => (
  <DashboardLayout role="gov">
    <PageHeader title="Health Alerts" description="Active outbreak and disease alerts" />
    <div className="space-y-4">
      {alerts.map((alert, i) => (
        <div key={i} className="bg-card rounded-xl p-5 card-shadow">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h3 className="font-medium text-foreground">{alert.title}</h3>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColors[alert.severity]}`}>
              {alert.severity}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{alert.description}</p>
          <p className="text-xs text-muted-foreground mt-2">{alert.date}</p>
        </div>
      ))}
    </div>
  </DashboardLayout>
);

export default GovAlerts;

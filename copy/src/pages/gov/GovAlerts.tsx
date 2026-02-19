import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { AlertTriangle, Send } from "lucide-react";
import { DEMO_MODE, fetchDemoData } from "@/lib/demoConfig";
import { useToast } from "@/hooks/use-toast";

// ─── Fallback alerts (used when DEMO_MODE is off) ────────
const fallbackAlerts = [
  { title: "Dengue Outbreak — Region East", severity: "High", date: "2026-02-12", description: "156 cases reported in the past 7 days. Recommend increased vector control measures." },
  { title: "Influenza Spike — Metropolitan Area", severity: "Medium", date: "2026-02-10", description: "30% increase in influenza cases compared to last month." },
  { title: "TB Case Cluster — District 5", severity: "Low", date: "2026-02-05", description: "Small cluster of 5 cases identified. Contact tracing initiated." },
];

interface Alert {
  title: string;
  severity: string;
  date: string;
  description: string;
}

const severityColors: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-green-100 text-green-800",
};

const GovAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>(DEMO_MODE ? [] : fallbackAlerts);
  const [loading, setLoading] = useState(DEMO_MODE);
  const [sending, setSending] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!DEMO_MODE) return;
    let cancelled = false;

    fetchDemoData<Alert[]>("/demo-data/alerts.json")
      .then(data => { if (!cancelled) { setAlerts(data); setLoading(false); } })
      .catch(err => {
        console.error("Failed to load alerts demo data:", err);
        if (!cancelled) { setAlerts(fallbackAlerts); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, []);

  // ─── Send Alert handler ────────────────────────────────
  const handleSendAlert = async (alert: Alert, index: number) => {
    setSending(index);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (alert.severity === "High") {
      // High → popup notification to affected cities
      toast({
        title: "🚨 Emergency Alert Dispatched",
        description: `Popup notification sent to all health officials in affected regions for: ${alert.title}`,
        variant: "destructive",
      });
    } else if (alert.severity === "Medium") {
      // Medium → advisory (non-popup) notification
      toast({
        title: "📋 Advisory Sent",
        description: `Advisory notification dispatched for: ${alert.title}`,
      });
    }

    setSending(null);
  };

  if (loading) {
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
        <PageHeader title="Health Alerts" description="Active outbreak and disease alerts" />
        {DEMO_MODE && (
          <span className="text-xs bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded-full font-medium">
            DEMO
          </span>
        )}
      </div>
      <div className="space-y-4">
        {alerts.map((alert, i) => (
          <div key={i} className="bg-card rounded-xl p-5 card-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <h3 className="font-medium text-foreground">{alert.title}</h3>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColors[alert.severity] || severityColors.Low}`}>
                {alert.severity}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{alert.description}</p>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted-foreground">{alert.date}</p>
              {(alert.severity === "High" || alert.severity === "Medium") && (
                <button
                  onClick={() => handleSendAlert(alert, i)}
                  disabled={sending === i}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${alert.severity === "High"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                    } disabled:opacity-50`}
                >
                  <Send className="w-3 h-3" />
                  {sending === i ? "Sending…" : "Send Alert"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default GovAlerts;

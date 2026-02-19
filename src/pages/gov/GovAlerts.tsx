import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Mock Data matching screenshots ───────────────────────
const ALERTS = [
  {
    id: "1",
    type: "Outbreak Alert",
    disease: "Dengue",
    message: "Detected 58 cases of Dengue in Mumbai (Threshold: 50)",
    region: "Mumbai",
    severity: "HIGH",
    date: "2/19/2026",
    color: "bg-red-50 border-red-100",
    iconColor: "text-orange-500",
    badgeColor: "text-orange-600 bg-orange-50/50",
  },
  {
    id: "2",
    type: "Outbreak Alert",
    disease: "Malaria",
    message: "Detected 35 cases of Malaria in Mumbai (Threshold: 30)",
    region: "Mumbai",
    severity: "HIGH",
    date: "2/18/2026",
    color: "bg-orange-50 border-orange-100",
    iconColor: "text-orange-500",
    badgeColor: "text-orange-600 bg-orange-50/50",
  },
  {
    id: "3",
    type: "Monitoring",
    disease: "Flu",
    message: "Flu cases rising in Pune — 18 cases this week",
    region: "Pune",
    severity: "MEDIUM",
    date: "2/17/2026",
    color: "bg-yellow-50 border-yellow-100",
    iconColor: "text-yellow-500",
    badgeColor: "text-yellow-600 bg-yellow-50/50",
  },
];

const GovAlerts = () => {
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleSend = (id: string, type: string, disease: string, severity: string) => {
    setSentIds((prev) => new Set([...prev, id]));

    const isHigh = severity === "HIGH";

    // Styles for High Risk (Red) and Medium Risk (Yellow)
    // Using unstyled: true requires explicit background, border, shadow, text colors.
    const containerClasses = isHigh
      ? "bg-red-600 border-red-700 shadow-xl text-white"
      : "bg-yellow-50 border-yellow-200 shadow-lg text-yellow-900";

    const icon = isHigh ? "🚨" : "⚠️";
    const titleText = isHigh ? "Emergency Alert Dispatched" : "Advisory Sent";
    const descTextClass = isHigh ? "text-red-50" : "text-yellow-800";

    toast.dismiss();
    toast.custom((t) => (
      <div
        className={cn(
          "w-full max-w-sm rounded-lg p-4 flex flex-col gap-1 border",
          containerClasses
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl shrink-0">{icon}</span>
          <span className="font-bold text-sm leading-tight">{titleText}</span>
        </div>
        <p className={cn("text-xs pl-8 leading-snug opacity-95", descTextClass)}>
          {isHigh
            ? `Popup notification sent to all health officials in affected regions for: ${type}: ${disease}`
            : `Advisory notification dispatched for: ${type}: ${disease}`
          }
        </p>
      </div>
    ), { duration: 4000 });
  };

  return (
    <DashboardLayout role="gov">
      <div className="min-h-screen bg-gray-50/50">
        <div className="px-6 py-6 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900">Health Alerts</h1>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200">
              DEMO
            </span>
          </div>
          <p className="text-sm text-gray-400">Active outbreak and disease alerts</p>
        </div>

        <div className="px-6 space-y-4">
          {ALERTS.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "rounded-xl border p-5 transition-all",
                alert.color
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <AlertTriangle className={cn("h-5 w-5 mt-0.5 shrink-0", alert.iconColor)} />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-gray-900">
                      {alert.type}: {alert.disease}
                    </h3>
                    <p className="text-xs text-blue-600 leading-relaxed">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500">Affected Region: {alert.region}</p>
                  </div>
                </div>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", alert.badgeColor)}>
                  {alert.severity}
                </span>
              </div>

              <div className="flex items-center justify-between mt-6">
                <span className="text-xs text-gray-400">Reported: {alert.date}</span>
                <button
                  onClick={() => handleSend(alert.id, alert.type, alert.disease, alert.severity)}
                  disabled={sentIds.has(alert.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors shadow-sm",
                    sentIds.has(alert.id)
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  )}
                >
                  <Send className="h-3 w-3" />
                  {sentIds.has(alert.id) ? "Alert Sent" : "Send Alert"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GovAlerts;

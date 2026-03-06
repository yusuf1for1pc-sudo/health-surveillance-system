import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AlertTriangle, Send, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAnomalies, getRValue } from "@/lib/mlApi";
import type { AnomaliesResponse, RValueResponse } from "@/lib/mlApi";
import { logSurveillanceAccess } from "@/lib/accessLogger";

const GovAlerts = () => {
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null);
  const [rValue, setRValue] = useState<RValueResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    logSurveillanceAccess("alert_view");
    Promise.allSettled([getAnomalies(), getRValue()])
      .then(([a, r]) => {
        if (a.status === "fulfilled") setAnomalies(a.value);
        if (r.status === "fulfilled") setRValue(r.value);
      })
      .finally(() => setLoading(false));
  }, []);

  // Build alert list from live data
  const alerts = [];

  // R-value alerts
  if (rValue && rValue.current_r > 1.2) {
    alerts.push({
      id: "r-alert",
      type: "Reproduction Alert",
      disease: "System-Wide Average",
      message: `Effective reproduction number (Rt) is ${rValue.current_r.toFixed(2)} — disease is spreading exponentially. immediate intervention required.`,
      citation: "Calculated via EpiEstim (Erlang distribution) over a 7-day trailing window of incidence data.",
      region: "All Regions",
      severity: "HIGH" as const,
      date: new Date().toLocaleDateString(),
      color: "bg-red-50 border-red-100",
      iconColor: "text-red-500",
      badgeColor: "text-red-700 bg-red-100 border-red-200",
    });
  } else if (rValue && rValue.current_r > 1.0) {
    alerts.push({
      id: "r-warn",
      type: "Reproduction Watch",
      disease: "System-Wide Average",
      message: `Rt is ${rValue.current_r.toFixed(2)} — slightly above 1.0, active monitoring recommended.`,
      citation: "Calculated via EpiEstim (Erlang distribution) over a 7-day trailing window of incidence data.",
      region: "All Regions",
      severity: "MEDIUM" as const,
      date: new Date().toLocaleDateString(),
      color: "bg-amber-50 border-amber-100",
      iconColor: "text-amber-500",
      badgeColor: "text-amber-700 bg-amber-100 border-amber-200",
    });
  }

  // Anomaly alerts
  if (anomalies) {
    anomalies.anomalies.forEach((a, i) => {
      alerts.push({
        id: `anomaly-${i}`,
        type: "Statistical Anomaly",
        disease: "Case Spike Detected",
        message: `${a.count} cases reported on ${a.date}. This is significantly higher than the expected average.`,
        citation: `Detected using Isolation Forest (contamination=0.1). Avg instances: ${anomalies.stats.mean_daily_cases}/day (σ: ${anomalies.stats.std_daily_cases}).`,
        region: "System-wide",
        severity: a.severity === "High" ? ("HIGH" as const) : ("MEDIUM" as const),
        date: a.date,
        color: a.severity === "High" ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100",
        iconColor: a.severity === "High" ? "text-red-500" : "text-amber-500",
        badgeColor: a.severity === "High" ? "text-red-700 bg-red-100 border-red-200" : "text-amber-700 bg-amber-100 border-amber-200",
      });
    });
  }

  const handleSend = (id: string, type: string, disease: string, severity: string) => {
    setSentIds((prev) => new Set([...prev, id]));

    const isHigh = severity === "HIGH";
    const containerClasses = isHigh
      ? "bg-red-600 border-red-700 shadow-xl text-white"
      : "bg-amber-50 border-amber-200 shadow-lg text-amber-900";
    const icon = isHigh ? "🚨" : "⚠️";
    const titleText = isHigh ? "Emergency Alert Dispatched" : "Advisory Sent";
    const descTextClass = isHigh ? "text-red-50" : "text-amber-800";

    toast.dismiss();
    toast.custom(() => (
      <div className={cn("w-full max-w-sm rounded-lg p-4 flex flex-col gap-1 border", containerClasses)}>
        <div className="flex items-center gap-2">
          <span className="text-xl shrink-0">{icon}</span>
          <span className="font-bold text-sm leading-tight">{titleText}</span>
        </div>
        <p className={cn("text-xs pl-8 leading-snug opacity-95", descTextClass)}>
          {isHigh
            ? `Emergency notification sent to all health officials: ${type} — ${disease}`
            : `Advisory dispatched: ${type} — ${disease}`}
        </p>
      </div>
    ), { duration: 4000 });
  };

  return (
    <DashboardLayout role="gov">
      <div className="min-h-screen bg-transparent">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Health Alerts</h1>
            <span className="text-[10px] font-bold tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 uppercase shadow-sm">
              Live Feed
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Real-time machine learning anomaly detection and outbreak alerts based on multi-source data processing.
          </p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-500 gap-2">
              <Loader2 className="animate-spin h-5 w-5" />
              Analyzing live data streams...
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-8 text-center shadow-sm">
              <span className="text-4xl block mb-3">🛡️</span>
              <p className="font-semibold text-emerald-800 text-lg">No Active Alerts</p>
              <p className="text-sm text-emerald-600/80 mt-1 max-w-md mx-auto">
                All epidemiological indicators are currently operating within expected nominal ranges.
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn("rounded-xl border p-5 transition-all shadow-sm relative overflow-hidden group", alert.color)}
              >
                {/* Left side accent line */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", alert.severity === 'HIGH' ? 'bg-red-500' : 'bg-amber-400')} />

                <div className="flex items-start justify-between pl-2">
                  <div className="flex gap-4">
                    <div className={cn("p-2 rounded-lg bg-white shadow-sm mt-0.5 border", alert.severity === 'HIGH' ? 'border-red-100' : 'border-amber-100')}>
                      <AlertTriangle className={cn("h-5 w-5", alert.iconColor)} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {alert.type}: <span className="font-semibold text-slate-700">{alert.disease}</span>
                        </h3>
                        {/* Citation Tooltip */}
                        <div className="relative flex items-center group/tooltip cursor-help">
                          <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 transition-colors" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block w-56 p-2 bg-slate-800 text-slate-100 text-[10px] rounded-md shadow-xl z-50 text-center leading-relaxed before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-800">
                            {alert.citation}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl font-medium">{alert.message}</p>
                      <div className="flex gap-3">
                        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          {alert.region}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded border tracking-wider", alert.badgeColor)}>
                    {alert.severity}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-5 pt-4 pl-2 border-t border-black/5">
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    🕒 Detected: {alert.date}
                  </span>
                  <button
                    onClick={() => handleSend(alert.id, alert.type, alert.disease, alert.severity)}
                    disabled={sentIds.has(alert.id)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2 rounded-md text-xs font-bold transition-all shadow-sm active:scale-95",
                      sentIds.has(alert.id)
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                        : alert.severity === "HIGH"
                          ? "bg-red-600 hover:bg-red-700 text-white ring-2 ring-transparent hover:ring-red-200"
                          : "bg-slate-800 hover:bg-slate-900 text-white ring-2 ring-transparent hover:ring-slate-200"
                    )}
                  >
                    <Send className={cn("h-3.5 w-3.5", sentIds.has(alert.id) ? "opacity-50" : "")} />
                    {sentIds.has(alert.id) ? "Alert Dispatched" : "Broadcast Alert"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GovAlerts;

import { AlertTriangle, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Mock Data (matching GovAlerts page for consistency) ──
const ALERT_NOTIFICATIONS = [
    {
        id: "1",
        title: "Outbreak Alert: Dengue",
        message: "58 cases in Mumbai (Threshold: 50)",
        severity: "high",
        time: "2h ago",
    },
    {
        id: "2",
        title: "Outbreak Alert: Malaria",
        message: "35 cases in Mumbai (Threshold: 30)",
        severity: "high",
        time: "5h ago",
    },
    {
        id: "3",
        title: "Monitoring: Flu",
        message: "Rising cases in Pune",
        severity: "medium",
        time: "1d ago",
    },
];

const severityStyles = {
    high: "bg-red-50 dark:bg-red-500/15 border-red-100 dark:border-red-500/30 text-red-900 dark:text-red-300",
    medium: "bg-yellow-50 dark:bg-yellow-500/15 border-yellow-100 dark:border-yellow-500/30 text-yellow-900 dark:text-yellow-300",
    low: "bg-muted border-border text-foreground",
};

export default function AlertsPanel({ alerts = [] }: { alerts?: any[] }) {
    // Use internal mock if empty props
    const displayAlerts = alerts.length > 0 ? alerts : ALERT_NOTIFICATIONS;

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
                    Recent Alerts
                </h3>
                <span className="bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {displayAlerts.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {displayAlerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={cn(
                            "p-3 rounded-lg border text-xs transition-colors hover:shadow-sm cursor-default",
                            severityStyles[alert.severity as keyof typeof severityStyles] || severityStyles.low
                        )}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold truncate pr-2">{alert.title}</span>
                            <span className="text-[10px] opacity-60 shrink-0">{alert.time}</span>
                        </div>
                        <p className="opacity-80 leading-relaxed mb-1.5">{alert.message}</p>
                    </div>
                ))}
            </div>

            <div className="p-2 border-t border-border bg-muted/30 text-center">
                <button className="text-xs font-medium text-foreground hover:text-foreground transition-colors">
                    View All Alerts →
                </button>
            </div>
        </div>
    );
}

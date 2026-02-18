import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface Alert {
    id: string;
    title: string;
    message: string;
    severity: "low" | "medium" | "high" | "critical";
    region?: string;
    status: "active" | "resolved" | "ignored";
    created_at: string;
}

interface AlertsPanelProps {
    alerts: Alert[];
}

const severityConfig = {
    low: { icon: CheckCircle, bg: "bg-green-500/10", text: "text-green-600", badge: "bg-green-100 text-green-700" },
    medium: { icon: AlertTriangle, bg: "bg-yellow-500/10", text: "text-yellow-600", badge: "bg-yellow-100 text-yellow-700" },
    high: { icon: AlertTriangle, bg: "bg-orange-500/10", text: "text-orange-600", badge: "bg-orange-100 text-orange-700" },
    critical: { icon: XCircle, bg: "bg-red-500/10", text: "text-red-600", badge: "bg-red-100 text-red-700" },
};

// Mock alerts for demo (will come from Supabase `alerts` table later)
const mockAlerts: Alert[] = [
    {
        id: "1",
        title: "Outbreak Alert: Dengue",
        message: "Detected 58 cases of Dengue in Mumbai (Threshold: 50)",
        severity: "high",
        region: "Mumbai",
        status: "active",
        created_at: new Date().toISOString(),
    },
    {
        id: "2",
        title: "Outbreak Alert: Malaria",
        message: "Detected 35 cases of Malaria in Mumbai (Threshold: 30)",
        severity: "high",
        region: "Mumbai",
        status: "active",
        created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: "3",
        title: "Monitoring: Flu",
        message: "Flu cases rising in Pune — 18 cases this week",
        severity: "medium",
        region: "Pune",
        status: "active",
        created_at: new Date(Date.now() - 172800000).toISOString(),
    },
];

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
    const displayAlerts = alerts.length > 0 ? alerts : mockAlerts;
    const activeAlerts = displayAlerts.filter((a) => a.status === "active");

    return (
        <div className="space-y-3">
            {activeAlerts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    No active alerts
                </div>
            ) : (
                activeAlerts.map((alert) => {
                    const config = severityConfig[alert.severity];
                    const Icon = config.icon;
                    return (
                        <div
                            key={alert.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border ${config.bg}`}
                        >
                            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${config.text}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.badge}`}>
                                        {alert.severity.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                                {alert.region && (
                                    <p className="text-xs text-muted-foreground mt-1">📍 {alert.region}</p>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}

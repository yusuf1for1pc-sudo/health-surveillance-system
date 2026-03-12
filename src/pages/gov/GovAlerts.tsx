import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AlertTriangle, Send, Loader2, Info, Building2, MapPin, Users, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAnomalies, getRValue } from "@/lib/mlApi";
import type { AnomaliesResponse, RValueResponse } from "@/lib/mlApi";
import { logSurveillanceAccess } from "@/lib/accessLogger";

const GovAlerts = () => {
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null);
  const [rValue, setRValue] = useState<RValueResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [formData, setFormData] = useState({
    state: "",
    municipal: "",
    city: "",
    email: "",
  });

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

  // Sort alerts by date, newest first
  alerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleOpenDialog = (alert: any) => {
    setSelectedAlert(alert);
    setIsDialogOpen(true);
    // Reset form
    setFormData({ state: "", municipal: "", city: "", email: "" });
  };

  const handleSend = () => {
    if (!selectedAlert) return;
    
    setSentIds((prev) => new Set([...prev, selectedAlert.id]));
    setIsDialogOpen(false);

    const isHigh = selectedAlert.severity === "HIGH";
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
            ? `Emergency notification sent to designated authorities: ${selectedAlert.type} — ${selectedAlert.disease}`
            : `Advisory dispatched: ${selectedAlert.type} — ${selectedAlert.disease}`}
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
                    onClick={() => handleOpenDialog(alert)}
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

        {/* Broadcast Alert Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-indigo-600" />
                Broadcast Alert
              </DialogTitle>
              <DialogDescription>
                Distribute this {selectedAlert?.severity === 'HIGH' ? 'emergency alert' : 'advisory'} to targeted authorities and users.
              </DialogDescription>
            </DialogHeader>

            {selectedAlert && (
              <div className="mb-4 p-3 bg-slate-50 border rounded-lg flex items-start gap-3">
                <AlertTriangle className={cn("h-5 w-5 mt-0.5 shrink-0", selectedAlert.iconColor)} />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">{selectedAlert.type}: {selectedAlert.disease}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{selectedAlert.message}</p>
                </div>
              </div>
            )}

            <div className="grid gap-6 py-2">
              {/* Higher Authorities */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 border-b pb-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  Higher Authorities
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state" className="text-xs font-semibold text-slate-600">Select State</Label>
                  <Select value={formData.state} onValueChange={(val) => setFormData({ ...formData, state: val })}>
                    <SelectTrigger id="state" className="h-9">
                      <SelectValue placeholder="e.g. Maharashtra, Delhi..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MH">Maharashtra</SelectItem>
                      <SelectItem value="DL">Delhi</SelectItem>
                      <SelectItem value="KA">Karnataka</SelectItem>
                      <SelectItem value="TN">Tamil Nadu</SelectItem>
                      <SelectItem value="UP">Uttar Pradesh</SelectItem>
                      <SelectItem value="ALL">All States (Nationwide)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Local Authorities */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 border-b pb-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  Local Authorities
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="municipal" className="text-xs font-semibold text-slate-600">Municipal Corporation</Label>
                  <Select value={formData.municipal} onValueChange={(val) => setFormData({ ...formData, municipal: val })}>
                    <SelectTrigger id="municipal" className="h-9">
                      <SelectValue placeholder="e.g. BMC, NDMC..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BMC">Brihanmumbai Municipal Corporation (BMC)</SelectItem>
                      <SelectItem value="NDMC">New Delhi Municipal Council (NDMC)</SelectItem>
                      <SelectItem value="BBMP">Bruhat Bengaluru Mahanagara Palike (BBMP)</SelectItem>
                      <SelectItem value="GCC">Greater Chennai Corporation (GCC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Users & Citizens */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 border-b pb-2">
                  <Users className="h-4 w-4 text-slate-500" />
                  Citizens & Users
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city" className="text-xs font-semibold text-slate-600">Target City (Public Broadcast)</Label>
                  <Input 
                    id="city" 
                    placeholder="Enter city names to broadcast (e.g. Mumbai, Pune)" 
                    className="h-9"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>

              {/* Manual Email */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 border-b pb-2">
                  <Mail className="h-4 w-4 text-slate-500" />
                  Direct Contact
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-600">Manual Email ID</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter specific email address" 
                    className="h-9"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 md:justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSend} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Dispatch Alert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default GovAlerts;

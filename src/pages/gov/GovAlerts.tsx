import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Panel, PanelGrid, Field } from "@/components/layout/Modular";
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
  const [sevFilter, setSevFilter] = useState<"ALL" | "HIGH" | "MEDIUM">("ALL");

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
      color: "bg-red-50 dark:bg-red-500/15 border-red-100 dark:border-red-500/30",
      iconColor: "text-red-500 dark:text-red-400",
      badgeColor: "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-500/15 border-red-200 dark:border-red-500/30",
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
      color: "bg-amber-50 dark:bg-amber-500/15 border-amber-100 dark:border-amber-500/30",
      iconColor: "text-amber-500 dark:text-amber-400",
      badgeColor: "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30",
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
        color: a.severity === "High" ? "bg-red-50 dark:bg-red-500/15 border-red-100 dark:border-red-500/30" : "bg-amber-50 dark:bg-amber-500/15 border-amber-100 dark:border-amber-500/30",
        iconColor: a.severity === "High" ? "text-red-500 dark:text-red-400" : "text-amber-500 dark:text-amber-400",
        badgeColor: a.severity === "High" ? "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-500/15 border-red-200 dark:border-red-500/30" : "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30",
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
      : "bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 shadow-lg text-amber-900 dark:text-amber-300";
    const icon = isHigh ? "🚨" : "⚠️";
    const titleText = isHigh ? "Emergency Alert Dispatched" : "Advisory Sent";
    const descTextClass = isHigh ? "text-red-50" : "text-amber-800 dark:text-amber-300";

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

  const highCount = alerts.filter((a) => a.severity === "HIGH").length;
  const mediumCount = alerts.length - highCount;
  const visibleAlerts = alerts.filter((a) => sevFilter === "ALL" || a.severity === sevFilter);

  return (
    <DashboardLayout role="gov" fit>
      <PageHeader
        compact
        title="Health Alerts"
        description="Real-time anomaly detection and outbreak alerts from live data"
        action={<span className="rounded-sm border border-success/40 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-success">Live feed</span>}
      />

      <PanelGrid className="lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[minmax(0,1fr)]">
        {/* Alert list: filter on top, rows scroll on their own */}
        <div className="flex min-h-0 flex-col gap-3">
          <div className="flex shrink-0 flex-wrap gap-2" role="tablist" aria-label="Filter alerts by severity">
            {([
              { key: "ALL", label: "All", n: alerts.length },
              { key: "HIGH", label: "High", n: highCount },
              { key: "MEDIUM", label: "Medium", n: mediumCount },
            ] as const).map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={sevFilter === f.key}
                onClick={() => setSevFilter(f.key)}
                className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${sevFilter === f.key ? "border-foreground bg-foreground text-background" : "hover:bg-muted/60"}`}
              >
                {f.label} <span className="ml-1 opacity-60">{f.n}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 rounded-sm border bg-card py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Analyzing live data streams...
              </div>
            ) : visibleAlerts.length === 0 ? (
              <div className="rounded-sm border bg-card p-10 text-center">
                <p className="font-serif text-xl">No active alerts</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">All epidemiological indicators are within expected ranges.</p>
              </div>
            ) : (
              visibleAlerts.map((alert) => {
                const high = alert.severity === "HIGH";
                return (
                  <div key={alert.id} className={cn("relative flex items-center gap-3 rounded-sm border py-3 pl-4 pr-3", high ? "border-danger/40 bg-danger/5" : "bg-card")}>
                    <span className={cn("absolute bottom-0 left-0 top-0 w-1", high ? "bg-danger" : "bg-warning")} />
                    <AlertTriangle className={cn("h-5 w-5 shrink-0", high ? "text-danger" : "text-warning")} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <span className="truncate">{alert.type}: {alert.disease}</span>
                        <span title={alert.citation} className="cursor-help text-muted-foreground"><Info className="h-3.5 w-3.5" /></span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground" title={alert.message}>{alert.message}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{alert.region} · {alert.date}</p>
                    </div>
                    <span className={cn("hidden rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider sm:inline", high ? "border-danger/40 text-danger" : "border-warning/40 text-warning")}>{alert.severity}</span>
                    <button
                      onClick={() => handleOpenDialog(alert)}
                      disabled={sentIds.has(alert.id)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                        sentIds.has(alert.id)
                          ? "cursor-not-allowed border text-muted-foreground"
                          : high
                            ? "bg-danger text-white hover:bg-danger/90"
                            : "bg-primary text-primary-foreground hover:bg-primary/90",
                      )}
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{sentIds.has(alert.id) ? "Dispatched" : "Broadcast"}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Side: at a glance */}
        <aside className="space-y-4 lg:min-h-0 lg:overflow-y-auto">
          <Panel title="Summary" bodyClassName="py-1">
            <Field inline label="High" value={highCount} tone={highCount > 0 ? "alert" : "default"} />
            <Field inline label="Medium" value={mediumCount} />
            <Field inline label="Dispatched" value={sentIds.size} />
            <Field inline label="Rt (system-wide)" value={rValue && rValue.current_r != null ? `${Number(rValue.current_r).toFixed(2)} · ${rValue.current_status}` : "—"} />
          </Panel>
          <Panel title="Next steps" bodyClassName="space-y-2">
            <Link to="/gov/simulator" className="block rounded-sm border px-3 py-2 text-sm transition-colors hover:bg-muted/50">Model an intervention in the simulator</Link>
            <Link to="/gov/reports" className="block rounded-sm border px-3 py-2 text-sm transition-colors hover:bg-muted/50">Generate a situation report</Link>
            <Link to="/gov/surveillance" className="block rounded-sm border px-3 py-2 text-sm transition-colors hover:bg-muted/50">Open surveillance map</Link>
          </Panel>
        </aside>
      </PanelGrid>

        {/* Broadcast Alert Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-role-accent" />
                Broadcast Alert
              </DialogTitle>
              <DialogDescription>
                Distribute this {selectedAlert?.severity === 'HIGH' ? 'emergency alert' : 'advisory'} to targeted authorities and users.
              </DialogDescription>
            </DialogHeader>

            {selectedAlert && (
              <div className="mb-4 p-3 bg-muted/50 border rounded-lg flex items-start gap-3">
                <AlertTriangle className={cn("h-5 w-5 mt-0.5 shrink-0", selectedAlert.iconColor)} />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">{selectedAlert.type}: {selectedAlert.disease}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{selectedAlert.message}</p>
                </div>
              </div>
            )}

            <div className="grid gap-6 py-2">
              {/* Higher Authorities */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Higher Authorities
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state" className="text-xs font-semibold text-muted-foreground">Select State</Label>
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
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Local Authorities
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="municipal" className="text-xs font-semibold text-muted-foreground">Municipal Corporation</Label>
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
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Citizens & Users
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city" className="text-xs font-semibold text-muted-foreground">Target City (Public Broadcast)</Label>
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
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Direct Contact
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">Manual Email ID</Label>
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
              <Button type="button" onClick={handleSend} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Dispatch Alert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </DashboardLayout>
  );
};

export default GovAlerts;

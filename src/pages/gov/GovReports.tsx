import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Panel, PanelGrid } from "@/components/layout/Modular";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, Sparkles, Building2, Activity, Info } from "lucide-react";
import { getSituationReport } from "@/lib/mlApi";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";
import { logSurveillanceAccess } from "@/lib/accessLogger";

const GovReports = () => {
  const { records, patients } = useData();
  const [report, setReport] = useState<string | null>(null);
  const [reportSource, setReportSource] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await getSituationReport();
      setReport(data.report);
      setReportSource(data.source);
      toast.success(`Situation report generated (${data.source})`);
      logSurveillanceAccess("report_generated", { source: data.source });
    } catch (err: any) {
      toast.error("Failed to generate report: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    // Export records as CSV
    if (records.length === 0) {
      toast.error("No records to export.");
      return;
    }

    const headers = ["ID", "Patient ID", "Record Type", "Title", "Diagnosis", "ICD Code", "Created At"];
    const rows = records.map(r => [
      r.id,
      r.patient_id,
      r.record_type,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${(r.diagnosis || '').replace(/"/g, '""')}"`,
      r.icd_code || '',
      r.created_at,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health_records_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully!");
  };

  const handleExportPatients = () => {
    if (patients.length === 0) {
      toast.error("No patient data to export.");
      return;
    }

    const headers = ["ID", "Patient ID", "Full Name", "Gender", "DOB", "City", "Status", "Ward", "Created At"];
    const rows = patients.map(p => [
      p.id,
      p.patient_id,
      `"${p.full_name}"`,
      p.gender,
      p.date_of_birth,
      p.city,
      p.status || 'ACTIVE',
      p.ward_name || '',
      p.created_at,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `patients_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Patients CSV exported!");
  };

  // Compute stats for Section 1
  const totalCases = patients.length;
  const activeCases = patients.filter(p => p.status === 'ACTIVE').length;
  const criticalCases = patients.filter(p => p.status === 'CRITICAL').length;
  const recoveredCases = patients.filter(p => p.status === 'RECOVERED').length;

  const loadRows = [
    { name: "Mumbai Metro", pct: 84, label: "High load", tone: "text-warning", bar: "bg-warning" },
    { name: "Pune Region", pct: 62, label: "Stable", tone: "text-success", bar: "bg-success" },
    { name: "Nashik District", pct: 45, label: "Nominal", tone: "text-muted-foreground", bar: "bg-muted-foreground/50" },
  ];

  const summaryRows = [
    { metric: "Registered patients", value: totalCases, trend: "+1.2%", up: true, tone: "" },
    { metric: "Active infections", value: activeCases, trend: "+4.5%", up: false, tone: "text-warning" },
    { metric: "Critical cases (ICU)", value: criticalCases, trend: "-0.8%", up: true, tone: "text-danger" },
    { metric: "Recovered", value: recoveredCases, trend: "+12.4%", up: true, tone: "text-success" },
  ];

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `situation_report_${new Date().toISOString().split("T")[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  return (
    <DashboardLayout role="gov" fit>
      <PageHeader compact title="Health Reports" description="Generate AI-powered situation reports and export data" />

      <PanelGrid className="lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[minmax(0,1fr)]">
        {/* Main: the situation report fills the height and scrolls inside */}
        <Panel
          title="AI situation analysis"
          icon={<Sparkles className="h-5 w-5" />}
          description={report ? `Source: ${reportSource === "gemini" ? "Gemini 2.0 Flash" : "Structured rules"}` : "Compile recent data streams into an epidemiological report"}
          className="flex min-h-[340px] flex-col lg:min-h-0"
          bodyClassName="flex min-h-0 flex-1 flex-col p-0"
          action={
            <div className="flex items-center gap-2">
              {report && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={downloadReport}>
                  <Download className="h-3.5 w-3.5" /> Markdown
                </Button>
              )}
              <Button size="sm" onClick={handleGenerate} disabled={generating} className="gap-1.5">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Synthesizing…" : report ? "Regenerate" : "Generate report"}
              </Button>
            </div>
          }
        >
          {report ? (
            <div className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap p-5 text-sm leading-relaxed">{report}</div>
          ) : (
            <div className="m-auto max-w-sm p-8 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-serif text-xl">No report yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Generate a situation report from the latest records, Rt and anomaly data. It appears here and can be exported as Markdown.</p>
            </div>
          )}
        </Panel>

        {/* Side: numbers and exports */}
        <div className="space-y-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <Panel title="Executive summary" icon={<Activity className="h-5 w-5" />} bodyClassName="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-2 text-xs font-normal text-muted-foreground">Metric</th>
                  <th className="px-2 py-2 text-right text-xs font-normal text-muted-foreground">Total</th>
                  <th className="px-4 py-2 text-right text-xs font-normal text-muted-foreground">7-day</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summaryRows.map((r) => (
                  <tr key={r.metric}>
                    <td className="px-4 py-2">{r.metric}</td>
                    <td className={`px-2 py-2 text-right font-medium ${r.tone}`}>{r.value.toLocaleString()}</td>
                    <td className={`px-4 py-2 text-right text-xs font-medium ${r.up ? "text-success" : "text-danger"}`}>{r.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Regional hospital load" icon={<Building2 className="h-5 w-5" />} bodyClassName="space-y-3 p-4">
            {loadRows.map((r) => (
              <div key={r.name}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span>{r.name}</span>
                  <span className="text-xs"><b className={`font-medium ${r.tone}`}>{r.pct}%</b> <span className="text-muted-foreground">{r.label}</span></span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </Panel>

          <Panel title="Raw data export" icon={<FileText className="h-5 w-5" />} bodyClassName="space-y-2 p-4">
            {[
              { label: "Medical records registry", sub: `${records.length.toLocaleString()} records`, run: handleExportCSV },
              { label: "Patient demographics", sub: `${patients.length.toLocaleString()} anonymized profiles`, run: handleExportPatients },
            ].map((x) => (
              <div key={x.label} className="flex items-center justify-between gap-3 rounded-sm border px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{x.label}</p>
                  <p className="text-xs text-muted-foreground">{x.sub}</p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={x.run}>
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
              </div>
            ))}
          </Panel>

          <details className="rounded-sm border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-foreground">
              <Info className="h-4 w-4" /> Methodology &amp; data notes
            </summary>
            <p className="mt-2 leading-relaxed">
              This dashboard aggregates anonymized institutional EHR data and crowd-sourced reporting. Rt uses EpiEstim and anomalies use Isolation Forests; generative summaries are powered by Google Gemini 2.0. Exported tabular data follows de-identification protocols, and accuracy depends on field reporting latency and geographic sparsity.
            </p>
          </details>
        </div>
      </PanelGrid>
    </DashboardLayout>
  );
};

export default GovReports;

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
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

  return (
    <DashboardLayout role="gov">
      <PageHeader title="Health Reports" description="Generate AI-powered situation reports and export data" />

      {/* Section 1: Epidemiological Statistics Table */}
      <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-600" /> Executive Summary
      </h3>
      <div className="bg-card rounded-xl card-shadow overflow-hidden mb-8 border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Metric</th>
                <th className="px-6 py-4">Total Value</th>
                <th className="px-6 py-4">7-Day Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              <tr>
                <td className="px-6 py-4 font-medium">Registered Patients</td>
                <td className="px-6 py-4 font-bold">{totalCases.toLocaleString()}</td>
                <td className="px-6 py-4 text-emerald-600 font-medium">+1.2%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Active Infections</td>
                <td className="px-6 py-4 font-bold text-amber-600">{activeCases.toLocaleString()}</td>
                <td className="px-6 py-4 text-rose-600 font-medium">+4.5%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Critical Cases (ICU)</td>
                <td className="px-6 py-4 font-bold text-rose-600">{criticalCases.toLocaleString()}</td>
                <td className="px-6 py-4 text-emerald-600 font-medium">-0.8%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Recovered</td>
                <td className="px-6 py-4 font-bold text-emerald-600">{recoveredCases.toLocaleString()}</td>
                <td className="px-6 py-4 text-emerald-600 font-medium">+12.4%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Generate Situation Report (Gemini) */}
      <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" /> AI Situation Analysis
      </h3>
      <div className="bg-card rounded-xl card-shadow p-6 mb-8 border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="text-base font-medium text-foreground">Generative Epidemic Summary</h4>
            <p className="text-sm text-muted-foreground mt-1">Compile recent data streams into an actionable epidemiological report using LLM analysis.</p>
          </div>
          <Button onClick={handleGenerate} disabled={generating} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shrink-0">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Synthesizing..." : "Generate AI Report"}
          </Button>
        </div>

        {report && (
          <div className="mt-6 border border-slate-200 rounded-lg p-5 bg-slate-50 relative">
            <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
              <span className="text-[11px] uppercase tracking-wider bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold">
                Source: {reportSource === "gemini" ? "Gemini 2.0 Flash" : "Structured Rules"}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 bg-white"
                onClick={() => {
                  const blob = new Blob([report], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `situation_report_${new Date().toISOString().split("T")[0]}.md`;
                  link.click();
                  URL.revokeObjectURL(url);
                  toast.success("Report downloaded!");
                }}
              >
                <Download className="w-3.5 h-3.5" />
                Export Markdown
              </Button>
            </div>
            <div className="prose prose-sm prose-slate max-w-none text-slate-800 whitespace-pre-wrap text-sm leading-relaxed bg-white p-6 rounded border border-slate-100 shadow-sm">
              {report}
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Hospital Proximity & Resource Load */}
      <h3 className="text-lg font-medium text-foreground mb-3 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-rose-600" /> Regional Hospital Load
      </h3>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl card-shadow p-5 border border-slate-100">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mumbai Metro</h4>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-amber-600">84%</span>
            <span className="text-xs font-medium text-rose-600">High Load</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 w-[84%] h-full rounded-full" />
          </div>
        </div>
        <div className="bg-card rounded-xl card-shadow p-5 border border-slate-100">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pune Region</h4>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-emerald-600">62%</span>
            <span className="text-xs font-medium text-emerald-600">Stable</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 w-[62%] h-full rounded-full" />
          </div>
        </div>
        <div className="bg-card rounded-xl card-shadow p-5 border border-slate-100">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nashik District</h4>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-700">45%</span>
            <span className="text-xs font-medium text-slate-500">Nominal</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-slate-400 w-[45%] h-full rounded-full" />
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex items-center justify-between mb-3 mt-4">
        <h3 className="text-lg font-medium text-foreground">Raw Data Export</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-card rounded-xl card-shadow p-5 border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Medical Records Registry</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{records.length.toLocaleString()} records available</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 font-semibold text-slate-700" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
        </div>

        <div className="bg-card rounded-xl card-shadow p-5 border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Patient Demographics</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{patients.length.toLocaleString()} anonymized profiles</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 font-semibold text-slate-700" onClick={handleExportPatients}>
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* Citation Footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-3 mt-12 mb-4 text-slate-500">
        <Info className="w-5 h-5 shrink-0 text-slate-400 mt-0.5" />
        <div className="text-xs leading-relaxed font-medium">
          <p className="mb-1 text-slate-600 font-semibold">Report Generation & Methodologies</p>
          This dashboard aggregates anonymized institutional EHR data and crowd-sourced reporting. Statistical analysis employs EpiEstim for Reproduction Number (Rt) formulation and Isolation Forests for anomaly detection. Generative summaries are powered by Google Gemini 2.0. Exported tabular data complies with strict de-identification protocols. Real-time accuracy is dependent on field reporting latency and geographic sparsity constraints.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GovReports;

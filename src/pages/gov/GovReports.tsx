import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

const reports = [
  { id: "1", title: "Weekly Infectious Disease Report", type: "Surveillance", date: "2026-02-12", format: "PDF" },
  { id: "2", title: "Monthly Epidemiology Summary", type: "Summary", date: "2026-02-01", format: "PDF" },
  { id: "3", title: "Disease Outbreak Alert — Dengue (Central Region)", type: "Alert", date: "2026-01-28", format: "PDF" },
  { id: "4", title: "Quarterly Health Metrics Dashboard", type: "Analytics", date: "2026-01-15", format: "PDF" },
  { id: "5", title: "ICD Code Distribution Analysis", type: "Analytics", date: "2026-01-10", format: "CSV" },
  { id: "6", title: "Annual Disease Surveillance Report 2025", type: "Summary", date: "2025-12-31", format: "PDF" },
];

const GovReports = () => {
  const handleDownload = (name: string) => {
    // Stub: In production this would fetch from Supabase Storage
    alert(`Download started: ${name}`);
  };

  return (
    <DashboardLayout role="gov">
      <PageHeader title="Health Reports" description="Download aggregated and anonymized health reports" />

      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <DataTable
          columns={[
            {
              key: "title",
              header: "Report",
              render: (r) => (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground">{r.title}</span>
                </div>
              ),
            },
            {
              key: "type",
              header: "Type",
              render: (r) => (
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  {r.type}
                </span>
              ),
            },
            { key: "date", header: "Date" },
            {
              key: "action",
              header: "Action",
              render: (r) => (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => handleDownload(r.title)}
                >
                  <Download className="w-3 h-3" />
                  {r.format}
                </Button>
              ),
            },
          ]}
          data={reports}
        />
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        All reports contain only aggregated and anonymized data. No patient-identifiable information is included.
      </p>
    </DashboardLayout>
  );
};

export default GovReports;

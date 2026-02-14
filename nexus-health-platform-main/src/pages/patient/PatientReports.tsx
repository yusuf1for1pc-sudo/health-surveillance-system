import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";

const reports = [
  { title: "Complete Blood Count", lab: "Lisa Chen", date: "2026-02-08", result: "Normal" },
  { title: "Lipid Panel", lab: "Lisa Chen", date: "2025-12-20", result: "Review needed" },
  { title: "Urinalysis", lab: "James Rodriguez", date: "2025-10-15", result: "Normal" },
];

const PatientReports = () => (
  <DashboardLayout role="patient">
    <PageHeader title="Lab Reports" description="Your laboratory test results" />
    <DataTable
      columns={[
        { key: "title", header: "Test" },
        { key: "lab", header: "Lab Technician" },
        { key: "date", header: "Date" },
        { key: "result", header: "Result" },
      ]}
      data={reports}
    />
  </DashboardLayout>
);

export default PatientReports;

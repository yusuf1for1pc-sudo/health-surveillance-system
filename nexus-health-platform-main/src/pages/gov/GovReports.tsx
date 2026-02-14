import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";

const reports = [
  { title: "Monthly Disease Summary — January 2026", type: "Monthly Report", date: "2026-02-01" },
  { title: "Dengue Outbreak Analysis — East Region", type: "Outbreak Report", date: "2026-01-28" },
  { title: "Annual Health Statistics 2025", type: "Annual Report", date: "2026-01-15" },
];

const GovReports = () => (
  <DashboardLayout role="gov">
    <PageHeader title="Reports" description="Aggregated public health reports" />
    <DataTable
      columns={[
        { key: "title", header: "Report" },
        { key: "type", header: "Type" },
        { key: "date", header: "Date" },
      ]}
      data={reports}
    />
  </DashboardLayout>
);

export default GovReports;

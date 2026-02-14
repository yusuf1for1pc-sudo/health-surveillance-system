import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";

const patients = [
  { name: "Alice Johnson", phone: "+1 555-0101", lastVisit: "2026-02-10" },
  { name: "Bob Williams", phone: "+1 555-0102", lastVisit: "2026-02-08" },
  { name: "Carol Davis", phone: "+1 555-0103", lastVisit: "2026-01-28" },
];

const OrgPatients = () => (
  <DashboardLayout role="org">
    <PageHeader title="Patients" description="All patients registered under your organization" />
    <DataTable
      columns={[
        { key: "name", header: "Name" },
        { key: "phone", header: "Phone" },
        { key: "lastVisit", header: "Last Visit" },
      ]}
      data={patients}
    />
  </DashboardLayout>
);

export default OrgPatients;

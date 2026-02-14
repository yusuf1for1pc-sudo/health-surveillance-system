import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Building2, Users, Shield } from "lucide-react";

const recentOrgs = [
  { name: "City General Hospital", type: "Hospital", certificate: "verified" as const, status: "approved" as const },
  { name: "Sunrise Clinic", type: "Clinic", certificate: "pending" as const, status: "pending" as const },
  { name: "MedLab Diagnostics", type: "Laboratory", certificate: "verified" as const, status: "pending" as const },
  { name: "Greenfield Medical Center", type: "Hospital", certificate: "pending" as const, status: "rejected" as const },
];

const AdminWorkspace = () => {
  return (
    <DashboardLayout role="admin">
      <PageHeader title="Admin Dashboard" description="Platform overview and management" />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Organizations" value={42} subtitle="8 pending approval" icon={<Building2 className="w-5 h-5" />} />
        <StatCard title="Medical Staff" value={186} subtitle="Across all orgs" icon={<Users className="w-5 h-5" />} />
        <StatCard title="Patients" value="2,340" subtitle="Total registered" icon={<Shield className="w-5 h-5" />} />
      </div>
      <h2 className="text-lg font-medium text-foreground mb-4">Recent Organization Signups</h2>
      <DataTable
        columns={[
          { key: "name", header: "Organization" },
          { key: "type", header: "Type" },
          { key: "certificate", header: "Certificate", render: (item) => <StatusBadge status={item.certificate} /> },
          { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
        ]}
        data={recentOrgs}
      />
    </DashboardLayout>
  );
};

export default AdminWorkspace;

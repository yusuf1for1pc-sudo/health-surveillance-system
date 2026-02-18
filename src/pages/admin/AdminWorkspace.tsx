import { useData } from "@/contexts/DataContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Building2, Users, Shield } from "lucide-react";

const AdminWorkspace = () => {
  // Use global data context for instant loading
  const { organizations, patients, staff } = useData();

  // Derive stats from cached data
  const stats = {
    orgCount: organizations.length,
    pendingOrgCount: organizations.filter(o => o.status === 'pending').length,
    staffCount: staff.length, // Currently mock/local, but consistent
    patientCount: patients.length,
  };

  const recentOrgs = organizations.slice(0, 5);

  return (
    <DashboardLayout role="admin">
      <PageHeader title="Admin Dashboard" description="Platform overview and management" />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Organizations" value={stats.orgCount} subtitle={`${stats.pendingOrgCount} pending approval`} icon={<Building2 className="w-5 h-5" />} />
        <StatCard title="Medical Staff" value={stats.staffCount} subtitle="Across all orgs" icon={<Users className="w-5 h-5" />} />
        <StatCard title="Patients" value={stats.patientCount.toLocaleString()} subtitle="Total registered" icon={<Shield className="w-5 h-5" />} />
      </div>
      <h2 className="text-lg font-medium text-foreground mb-4">Recent Organization Signups</h2>
      <DataTable
        columns={[
          { key: "name", header: "Organization" },
          { key: "type", header: "Type" },
          { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
          { key: "created_at", header: "Registered", render: (item) => new Date(item.created_at).toLocaleDateString() },
        ]}
        data={recentOrgs}
      />
    </DashboardLayout>
  );
};

export default AdminWorkspace;

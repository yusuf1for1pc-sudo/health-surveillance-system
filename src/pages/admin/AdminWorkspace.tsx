import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Building2, Users, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";

const AdminWorkspace = () => {
  // Use global data context for instant loading
  const { organizations } = useData();
  const [counts, setCounts] = useState({ staff: 0, patients: 0, records: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      const [staffRes, patientRes, recordRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['doctor', 'lab_staff', 'org_admin']),
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('medical_records').select('id', { count: 'exact', head: true }),
      ]);

      setCounts({
        staff: staffRes.count ?? 0,
        patients: patientRes.count ?? 0,
        records: recordRes.count ?? 0,
      });
    };
    fetchCounts();
  }, []);

  const recentOrgs = organizations.slice(0, 5);

  return (
    <DashboardLayout role="admin">
      <PageHeader title="Admin Dashboard" description="Platform overview and management" />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Medical Staff" value={counts.staff} subtitle="Across all orgs" icon={<Users className="w-5 h-5" />} />
        <StatCard title="Patients" value={counts.patients} subtitle="Total registered" icon={<Shield className="w-5 h-5" />} />
        <StatCard title="Records" value={counts.records.toLocaleString()} subtitle="Total medical records" icon={<Shield className="w-5 h-5" />} />
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

import { Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DataTable from "@/components/dashboard/DataTable";
import { Users, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const StaffWorkspace = () => {
  const { patients, records } = useData();
  const { user } = useAuth();
  const [orgName, setOrgName] = useState<string>("");

  useEffect(() => {
    if (!user?.organization_id) return;
    supabase
      .from('organizations')
      .select('name')
      .eq('id', user.organization_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setOrgName(data.name);
      });
  }, [user?.organization_id]);

  // Only show patients this doctor has treated or registered
  const myPatients = useMemo(() => {
    if (!user) return [];

    const treatedPatientIds = new Set(
      records
        .filter(r => r.created_by === user.id)
        .map(r => r.patient_id)
    );

    return patients
      .filter(p => treatedPatientIds.has(p.id) || p.created_by === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [patients, records, user]);

  // Only records created by this doctor
  const myRecords = useMemo(() => {
    if (!user) return [];
    return records.filter(r => r.created_by === user.id);
  }, [records, user]);

  const recentPatients = myPatients.slice(0, 5).map(p => ({
    name: p.full_name,
    phone: p.phone,
    lastVisit: p.created_at.split("T")[0],
  }));

  return (
    <DashboardLayout role="staff">
      <PageHeader title="Staff Dashboard" description={orgName ? `${orgName} — Your patient and record overview` : "Your patient and record overview"} />
      <div className="grid sm:grid-cols-2 gap-6 mb-10">
        <StatCard title="My Patients" value={myPatients.length} subtitle={`${myPatients.filter(p => { const d = new Date(p.created_at); const week = new Date(); week.setDate(week.getDate() - 7); return d >= week; }).length} new this week`} icon={<Users className="w-6 h-6" />} />
        <StatCard title="My Records" value={myRecords.length} subtitle="Created by you" icon={<FileText className="w-6 h-6" />} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground tracking-tight">Recent Patients</h2>
        <div className="flex gap-3">
          <Link to="/staff/patients/create">
            <Button size="default" className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95">
              <Plus className="w-4 h-4 mr-2" />New Patient
            </Button>
          </Link>
          <Link to="/staff/records/create">
            <Button size="default" variant="outline" className="rounded-xl glass-card hover:bg-white/10 transition-all active:scale-95">
              <Plus className="w-4 h-4 mr-2" />New Record
            </Button>
          </Link>
        </div>
      </div>
      <DataTable
        columns={[
          { key: "name", header: "Name" },
          { key: "phone", header: "Phone" },
          { key: "lastVisit", header: "Last Visit" },
        ]}
        data={recentPatients}
      />
    </DashboardLayout>
  );
};

export default StaffWorkspace;

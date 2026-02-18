import { Link } from "react-router-dom";
import { useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DataTable from "@/components/dashboard/DataTable";
import { Users, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";

const StaffWorkspace = () => {
  const { patients, records } = useData();
  const { user } = useAuth();

  // Only show patients this doctor has treated or registered
  const myPatients = useMemo(() => {
    if (!user) return [];

    const treatedPatientIds = new Set(
      records
        .filter(r => r.created_by === user.id)
        .map(r => r.patient_id)
    );

    return patients.filter(
      p => treatedPatientIds.has(p.id) || p.created_by === user.id
    );
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
      <PageHeader title="Staff Dashboard" description="Your patient and record overview" />
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <StatCard title="My Patients" value={myPatients.length} subtitle={`${myPatients.filter(p => { const d = new Date(p.created_at); const week = new Date(); week.setDate(week.getDate() - 7); return d >= week; }).length} new this week`} icon={<Users className="w-5 h-5" />} />
        <StatCard title="My Records" value={myRecords.length} subtitle="Created by you" icon={<FileText className="w-5 h-5" />} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-foreground">Recent Patients</h2>
        <div className="flex gap-2">
          <Link to="/staff/patients/create"><Button size="sm"><Plus className="w-4 h-4 mr-1" />New Patient</Button></Link>
          <Link to="/staff/records/create"><Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" />New Record</Button></Link>
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

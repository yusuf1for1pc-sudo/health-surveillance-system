import { Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";

const StaffPatients = () => {
  const navigate = useNavigate();
  const { patients, records } = useData();
  const { user } = useAuth();

  // Only show patients this doctor has treated (created records for) or registered
  const myPatients = useMemo(() => {
    if (!user) return [];

    // Get patient IDs from records created by this doctor
    const treatedPatientIds = new Set(
      records
        .filter(r => r.created_by === user.id)
        .map(r => r.patient_id)
    );

    // Also include patients this doctor registered (created_by)
    return patients.filter(
      p => treatedPatientIds.has(p.id) || p.created_by === user.id
    );
  }, [patients, records, user]);

  const tableData = myPatients.map(p => {
    // Determine recheck status based on records
    const patientRecords = records.filter(r => r.patient_id === p.id);
    let recheckDue = false;

    if (patientRecords.length > 0) {
      const latestRecord = patientRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      const daysSinceRecord = Math.floor((new Date().getTime() - new Date(latestRecord.created_at).getTime()) / (1000 * 60 * 60 * 24));
      // Recheck if active/critical and last record > 7 days ago
      if (daysSinceRecord >= 7 && (p.status === 'ACTIVE' || p.status === 'CRITICAL')) {
        recheckDue = true;
      }
    }

    return {
      id: p.id,
      name: p.full_name,
      patientId: p.patient_id,
      phone: p.phone,
      gender: p.gender,
      dob: p.date_of_birth,
      status: p.status || 'ACTIVE',
      recheckDue
    };
  });

  return (
    <DashboardLayout role="staff">
      <PageHeader
        title="My Patients"
        description={`${myPatients.length} patients under your care`}
        action={<Link to="/staff/patients/create"><Button><Plus className="w-4 h-4 mr-2" />Add Patient</Button></Link>}
      />
      <DataTable
        columns={[
          {
            key: "name",
            header: "Name",
            render: (item: any) => (
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.name}</span>
                {item.recheckDue && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 border border-red-200">
                    Recheck Due
                  </span>
                )}
              </div>
            )
          },
          { key: "patientId", header: "Patient ID" },
          { key: "phone", header: "Phone" },
          {
            key: "status", header: "Status",
            render: (value) => {
              const colors: Record<string, string> = {
                'ACTIVE': 'bg-amber-100 text-amber-700 border-amber-200',
                'RECOVERED': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                'CRITICAL': 'bg-rose-100 text-rose-700 border-rose-200',
                'REFERRED': 'bg-purple-100 text-purple-700 border-purple-200',
              };
              const statusStr = String(value || 'ACTIVE');
              const colorClass = colors[statusStr] || 'bg-gray-100 text-gray-700 border-gray-200';
              return (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
                  {statusStr}
                </span>
              );
            }
          },
        ]}
        data={tableData}
        onRowClick={(item: any) => navigate(`/staff/patients/${item.id}`)}
      />
    </DashboardLayout>
  );
};

export default StaffPatients;

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

  const tableData = myPatients.map(p => ({
    id: p.id,
    name: p.full_name,
    patientId: p.patient_id,
    phone: p.phone,
    gender: p.gender,
    dob: p.date_of_birth,
  }));

  return (
    <DashboardLayout role="staff">
      <PageHeader
        title="My Patients"
        description={`${myPatients.length} patients under your care`}
        action={<Link to="/staff/patients/create"><Button><Plus className="w-4 h-4 mr-2" />Add Patient</Button></Link>}
      />
      <DataTable
        columns={[
          { key: "name", header: "Name" },
          { key: "patientId", header: "Patient ID" },
          { key: "phone", header: "Phone" },
          { key: "gender", header: "Gender" },
          { key: "dob", header: "Date of Birth" },
        ]}
        data={tableData}
        onRowClick={(item) => navigate(`/staff/patients/${item.id}`)}
      />
    </DashboardLayout>
  );
};

export default StaffPatients;

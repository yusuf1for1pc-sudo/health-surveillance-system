import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useData } from "@/contexts/DataContext";

const StaffPatients = () => {
  const navigate = useNavigate();
  const { patients } = useData();

  const tableData = patients.map(p => ({
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
        description={`${patients.length} patients under your care`}
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

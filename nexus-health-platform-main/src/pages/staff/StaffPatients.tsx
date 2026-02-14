import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const patients = [
  { id: "1", name: "Alice Johnson", phone: "+1 555-0101", gender: "Female", dob: "1985-03-12" },
  { id: "2", name: "Bob Williams", phone: "+1 555-0102", gender: "Male", dob: "1990-07-24" },
  { id: "3", name: "Carol Davis", phone: "+1 555-0103", gender: "Female", dob: "1978-11-05" },
  { id: "4", name: "David Kim", phone: "+1 555-0104", gender: "Male", dob: "1995-01-18" },
];

const StaffPatients = () => {
  const navigate = useNavigate();
  return (
    <DashboardLayout role="staff">
      <PageHeader
        title="My Patients"
        description="Patients under your care"
        action={<Link to="/staff/patients/create"><Button><Plus className="w-4 h-4 mr-2" />Add Patient</Button></Link>}
      />
      <DataTable
        columns={[
          { key: "name", header: "Name" },
          { key: "phone", header: "Phone" },
          { key: "gender", header: "Gender" },
          { key: "dob", header: "Date of Birth" },
        ]}
        data={patients}
        onRowClick={(item) => navigate(`/staff/patients/${item.id}`)}
      />
    </DashboardLayout>
  );
};

export default StaffPatients;

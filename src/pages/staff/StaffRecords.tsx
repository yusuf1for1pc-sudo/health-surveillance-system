import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";

const StaffRecords = () => {
  const navigate = useNavigate();
  const { records, patients } = useData();
  const { user } = useAuth();

  // Only show records created by this doctor
  const myRecords = records.filter(r => r.created_by === user?.id);

  const getPatientName = (patientId: string) => {
    const p = patients.find(pat => pat.id === patientId);
    return p ? p.full_name : "Unknown";
  };

  const tableData = myRecords.map(r => ({
    id: r.id,
    patient: getPatientName(r.patient_id),
    type: r.record_type,
    title: r.title,
    date: r.created_at.split("T")[0],
  }));

  return (
    <DashboardLayout role="staff">
      <PageHeader
        title="Medical Records"
        description={`${myRecords.length} records`}
        action={<Link to="/staff/records/create"><Button><Plus className="w-4 h-4 mr-2" />New Record</Button></Link>}
      />
      <DataTable
        columns={[
          { key: "patient", header: "Patient" },
          { key: "type", header: "Type" },
          { key: "title", header: "Title" },
          { key: "date", header: "Date" },
        ]}
        data={tableData}
        onRowClick={(item) => navigate(`/staff/records/${item.id}`)}
      />
    </DashboardLayout>
  );
};

export default StaffRecords;

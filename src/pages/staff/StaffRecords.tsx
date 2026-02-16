import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useData } from "@/contexts/DataContext";

const StaffRecords = () => {
  const navigate = useNavigate();
  const { records, patients } = useData();

  const getPatientName = (patientId: string) => {
    const p = patients.find(pat => pat.id === patientId);
    return p ? p.full_name : "Unknown";
  };

  const tableData = records.map(r => ({
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
        description={`${records.length} records total`}
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

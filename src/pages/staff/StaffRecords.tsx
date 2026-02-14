import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const records = [
  { id: "1", patient: "Alice Johnson", type: "Prescription", title: "Amoxicillin 500mg", date: "2026-02-10" },
  { id: "2", patient: "Bob Williams", type: "Lab Report", title: "Complete Blood Count", date: "2026-02-08" },
  { id: "3", patient: "Carol Davis", type: "Clinical Note", title: "Follow-up Visit", date: "2026-01-28" },
  { id: "4", patient: "Alice Johnson", type: "Lab Report", title: "Lipid Panel", date: "2026-01-20" },
];

const StaffRecords = () => {
  const navigate = useNavigate();
  return (
    <DashboardLayout role="staff">
      <PageHeader
        title="Medical Records"
        description="All records created by you"
        action={<Link to="/staff/records/create"><Button><Plus className="w-4 h-4 mr-2" />New Record</Button></Link>}
      />
      <DataTable
        columns={[
          { key: "patient", header: "Patient" },
          { key: "type", header: "Type" },
          { key: "title", header: "Title" },
          { key: "date", header: "Date" },
        ]}
        data={records}
        onRowClick={(item) => navigate(`/staff/records/${item.id}`)}
      />
    </DashboardLayout>
  );
};

export default StaffRecords;

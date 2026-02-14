import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const staffData = [
  { id: "1", name: "Dr. Emily Watson", type: "Doctor", certificate: "verified" as const, email: "e.watson@hospital.com" },
  { id: "2", name: "Dr. Michael Patel", type: "Doctor", certificate: "pending" as const, email: "m.patel@hospital.com" },
  { id: "3", name: "Lisa Chen", type: "Lab Staff", certificate: "verified" as const, email: "l.chen@hospital.com" },
  { id: "4", name: "James Rodriguez", type: "Lab Staff", certificate: "pending" as const, email: "j.rodriguez@hospital.com" },
];

const OrgStaff = () => {
  const navigate = useNavigate();
  return (
    <DashboardLayout role="org">
      <PageHeader
        title="Staff Members"
        description="Manage your medical staff"
        action={
          <Link to="/org/staff/create">
            <Button><Plus className="w-4 h-4 mr-2" />Add Staff</Button>
          </Link>
        }
      />
      <DataTable
        columns={[
          { key: "name", header: "Name" },
          { key: "type", header: "Type" },
          { key: "email", header: "Email" },
          { key: "certificate", header: "Certificate", render: (item) => <StatusBadge status={item.certificate} /> },
        ]}
        data={staffData}
        onRowClick={(item) => navigate(`/org/staff/${item.id}`)}
      />
    </DashboardLayout>
  );
};

export default OrgStaff;

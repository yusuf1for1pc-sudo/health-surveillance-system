import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";

const orgs = [
  { id: "1", name: "City General Hospital", type: "Hospital", certificate: "verified" as const, status: "approved" as const, staffCount: 34 },
  { id: "2", name: "Sunrise Clinic", type: "Clinic", certificate: "pending" as const, status: "pending" as const, staffCount: 8 },
  { id: "3", name: "MedLab Diagnostics", type: "Laboratory", certificate: "verified" as const, status: "approved" as const, staffCount: 12 },
  { id: "4", name: "Greenfield Medical Center", type: "Hospital", certificate: "pending" as const, status: "pending" as const, staffCount: 22 },
  { id: "5", name: "QuickCare Urgent Center", type: "Clinic", certificate: "verified" as const, status: "rejected" as const, staffCount: 5 },
];

const AdminOrganizations = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout role="admin">
      <PageHeader title="Organizations" description="Manage registered healthcare organizations" />
      <DataTable
        columns={[
          { key: "name", header: "Name" },
          { key: "type", header: "Type" },
          { key: "staffCount", header: "Staff" },
          { key: "certificate", header: "Certificate", render: (item) => <StatusBadge status={item.certificate} /> },
          { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
          {
            key: "actions", header: "Actions", render: (item) => (
              <div className="flex gap-2">
                {item.status === "pending" && (
                  <>
                    <Button size="sm" variant="default">Approve</Button>
                    <Button size="sm" variant="outline">Reject</Button>
                  </>
                )}
              </div>
            )
          },
        ]}
        data={orgs}
        onRowClick={(item) => navigate(`/admin/organizations/${item.id}`)}
      />
    </DashboardLayout>
  );
};

export default AdminOrganizations;

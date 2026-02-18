import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useData } from "@/contexts/DataContext";
import { RefreshCcw } from "lucide-react";

const AdminOrganizations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // Use global data context for caching
  const { organizations, loading, updateOrganizationStatus, refresh } = useData();

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateOrganizationStatus(id, newStatus);
      toast({
        title: `Organization ${newStatus}`,
        description: "The status has been updated successfully.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update status.",
      });
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <PageHeader title="Organizations" description="Manage registered healthcare organizations" />
        <Button variant="outline" size="sm" onClick={() => refresh()} disabled={loading}>
          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>
      <DataTable
        columns={[
          { key: "name", header: "Name" },
          { key: "type", header: "Type" },
          { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
          { key: "created_at", header: "Registered", render: (item) => new Date(item.created_at).toLocaleDateString() },
          {
            key: "actions", header: "Actions", render: (item) => (
              <div className="flex gap-2">
                {item.status === "pending" && (
                  <>
                    <Button size="sm" variant="default" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, 'approved'); }}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, 'rejected'); }}>Reject</Button>
                  </>
                )}
              </div>
            )
          },
        ]}
        data={organizations}
        isLoading={loading}
        onRowClick={(item) => navigate(`/admin/organizations/${item.id}`)}
      />
    </DashboardLayout>
  );
};

export default AdminOrganizations;

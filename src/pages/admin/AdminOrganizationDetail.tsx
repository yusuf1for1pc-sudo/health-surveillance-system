import { useParams, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Users, FileText } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/use-toast";

const AdminOrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { organizations, updateOrganizationStatus } = useData();

  const org = organizations.find(o => o.id === id);

  if (!org) {
    return (
      <DashboardLayout role="admin">
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-muted-foreground mb-4">Organization not found.</p>
          <Button variant="outline" onClick={() => navigate('/admin/organizations')}>
            Back to Organizations
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleUpdateStatus = async (newStatus: 'approved' | 'rejected') => {
    try {
      await updateOrganizationStatus(org.id, newStatus);
      toast({
        title: `Organization ${newStatus}`,
        description: "Status updated successfully.",
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
      <div className="mb-4">
        <Link to="/admin/organizations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Organizations
        </Link>
      </div>
      <PageHeader
        title={org.name}
        description={`${org.type} • Registered ${new Date(org.created_at).toLocaleDateString()}`}
        action={
          org.status === "pending" ? (
            <div className="flex gap-2">
              <Button onClick={() => handleUpdateStatus('approved')}>Approve</Button>
              <Button variant="outline" onClick={() => handleUpdateStatus('rejected')}>Reject</Button>
            </div>
          ) : undefined
        }
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-5 card-shadow flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <Users className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{0 /* Real staff count not explicitly linked yet, defaulting to 0 safely */}</p>
            <p className="text-sm text-muted-foreground">Staff Members</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-5 card-shadow flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <Building2 className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{0 /* Real patient count not explicitly linked yet */}</p>
            <p className="text-sm text-muted-foreground">Patients</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-5 card-shadow flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <StatusBadge status={org.status} />
          </div>
          ,</div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 card-shadow">
          <h3 className="font-medium text-foreground mb-4">Organization Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-foreground">{org.email || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="text-foreground">{org.phone || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="text-foreground">{org.address || "N/A"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="text-foreground">{org.city || ""}, {org.state || ""} {org.pincode || ""}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="text-foreground">{org.type}</span></div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 card-shadow">
          <h3 className="font-medium text-foreground mb-4">Certificate</h3>
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge status={org.certificate_status || 'pending'} />
            <span className="text-sm text-muted-foreground">
              {org.certificate_status === "verified" ? "Certificate has been verified" : "Awaiting verification"}
            </span>
          </div>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">Certificate preview</p>
            <p className="text-xs text-muted-foreground mt-1">{org.certificate_url ? "View Document" : "No document uploaded"}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrganizationDetail;

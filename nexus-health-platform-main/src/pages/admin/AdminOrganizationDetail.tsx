import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Users, FileText } from "lucide-react";

const orgData: Record<string, any> = {
  "1": { name: "City General Hospital", type: "Hospital", certificate: "verified" as const, status: "approved" as const, staffCount: 34, patientCount: 456, email: "admin@citygeneral.com", phone: "+1 555-1000", address: "123 Medical Ave, Metro City", registeredDate: "2025-06-15" },
  "2": { name: "Sunrise Clinic", type: "Clinic", certificate: "pending" as const, status: "pending" as const, staffCount: 8, patientCount: 120, email: "info@sunriseclinic.com", phone: "+1 555-2000", address: "456 Health Blvd, Sunrise", registeredDate: "2026-01-10" },
  "3": { name: "MedLab Diagnostics", type: "Laboratory", certificate: "verified" as const, status: "approved" as const, staffCount: 12, patientCount: 0, email: "contact@medlab.com", phone: "+1 555-3000", address: "789 Lab Lane, Techville", registeredDate: "2025-09-20" },
  "4": { name: "Greenfield Medical Center", type: "Hospital", certificate: "pending" as const, status: "pending" as const, staffCount: 22, patientCount: 310, email: "admin@greenfield.com", phone: "+1 555-4000", address: "321 Green St, Fieldtown", registeredDate: "2026-02-01" },
  "5": { name: "QuickCare Urgent Center", type: "Clinic", certificate: "verified" as const, status: "rejected" as const, staffCount: 5, patientCount: 89, email: "info@quickcare.com", phone: "+1 555-5000", address: "654 Quick Rd, Urgentville", registeredDate: "2025-12-05" },
};

const AdminOrganizationDetail = () => {
  const { id } = useParams();
  const org = orgData[id || "1"] || orgData["1"];

  return (
    <DashboardLayout role="admin">
      <div className="mb-4">
        <Link to="/admin/organizations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Organizations
        </Link>
      </div>
      <PageHeader
        title={org.name}
        description={`${org.type} • Registered ${org.registeredDate}`}
        action={
          org.status === "pending" ? (
            <div className="flex gap-2">
              <Button>Approve</Button>
              <Button variant="outline">Reject</Button>
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
            <p className="text-2xl font-semibold text-foreground">{org.staffCount}</p>
            <p className="text-sm text-muted-foreground">Staff Members</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-5 card-shadow flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <Building2 className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground">{org.patientCount}</p>
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
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 card-shadow">
          <h3 className="font-medium text-foreground mb-4">Organization Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-foreground">{org.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="text-foreground">{org.phone}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="text-foreground">{org.address}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="text-foreground">{org.type}</span></div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 card-shadow">
          <h3 className="font-medium text-foreground mb-4">Certificate</h3>
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge status={org.certificate} />
            <span className="text-sm text-muted-foreground">
              {org.certificate === "verified" ? "Certificate has been verified" : "Awaiting verification"}
            </span>
          </div>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">Certificate preview</p>
            <p className="text-xs text-muted-foreground mt-1">healthcare-license-2026.pdf</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrganizationDetail;

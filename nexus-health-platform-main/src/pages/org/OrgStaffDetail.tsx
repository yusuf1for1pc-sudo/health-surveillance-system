import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { ArrowLeft, FileText } from "lucide-react";

const staffData: Record<string, any> = {
  "1": { name: "Dr. Emily Watson", type: "Doctor", certificate: "verified" as const, email: "e.watson@hospital.com", phone: "+1 555-0201", specialization: "General Medicine", joinedDate: "2025-08-01", patientCount: 42, recordCount: 186 },
  "2": { name: "Dr. Michael Patel", type: "Doctor", certificate: "pending" as const, email: "m.patel@hospital.com", phone: "+1 555-0202", specialization: "Internal Medicine", joinedDate: "2025-11-15", patientCount: 28, recordCount: 95 },
  "3": { name: "Lisa Chen", type: "Lab Staff", certificate: "verified" as const, email: "l.chen@hospital.com", phone: "+1 555-0203", specialization: "Hematology", joinedDate: "2025-07-10", patientCount: 0, recordCount: 234 },
  "4": { name: "James Rodriguez", type: "Lab Staff", certificate: "pending" as const, email: "j.rodriguez@hospital.com", phone: "+1 555-0204", specialization: "Biochemistry", joinedDate: "2026-01-05", patientCount: 0, recordCount: 67 },
};

const OrgStaffDetail = () => {
  const { id } = useParams();
  const staff = staffData[id || "1"] || staffData["1"];

  return (
    <DashboardLayout role="org">
      <div className="mb-4">
        <Link to="/org/staff" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Staff
        </Link>
      </div>
      <PageHeader title={staff.name} description={`${staff.type} • ${staff.specialization}`} />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-5 card-shadow text-center">
          <p className="text-2xl font-semibold text-foreground">{staff.patientCount}</p>
          <p className="text-sm text-muted-foreground">Patients</p>
        </div>
        <div className="bg-card rounded-xl p-5 card-shadow text-center">
          <p className="text-2xl font-semibold text-foreground">{staff.recordCount}</p>
          <p className="text-sm text-muted-foreground">Records Created</p>
        </div>
        <div className="bg-card rounded-xl p-5 card-shadow text-center">
          <StatusBadge status={staff.certificate} />
          <p className="text-sm text-muted-foreground mt-1">Certificate</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 card-shadow">
          <h3 className="font-medium text-foreground mb-4">Contact Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-foreground">{staff.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="text-foreground">{staff.phone}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span className="text-foreground">{staff.joinedDate}</span></div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-6 card-shadow">
          <h3 className="font-medium text-foreground mb-4">Certificate</h3>
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge status={staff.certificate} />
            <span className="text-sm text-muted-foreground">
              {staff.certificate === "verified" ? "Verified" : "Pending verification"}
            </span>
          </div>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">Certificate preview</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrgStaffDetail;

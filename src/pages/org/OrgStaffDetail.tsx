import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface StaffDetail {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  certificate: "verified" | "pending";
  joinedDate: string;
  patientCount: number;
  recordCount: number;
}

const OrgStaffDetail = () => {
  const { id } = useParams();
  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchStaffData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Profile
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("id, full_name, role, email, phone, created_at")
          .eq("id", id)
          .single();

        if (profileErr) throw profileErr;

        // 2. Fetch Record Count Created by Staff
        const { count: recordCount, error: recordErr } = await supabase
          .from("medical_records")
          .select("*", { count: "exact", head: true })
          .eq("created_by", id);

        // 3. Fetch Patient Count (Unique patients this staff created records for)
        // Since we don't have a direct "staff created patient" link that's guaranteed,
        // we count unique patient_ids in the medical_records they created.
        const { data: uniquePatients, error: patientErr } = await supabase
          .from("medical_records")
          .select("patient_id")
          .eq("created_by", id);

        const uniquePatientCount = uniquePatients
          ? new Set(uniquePatients.map(r => r.patient_id)).size
          : 0;

        setStaff({
          id: profile.id,
          name: profile.full_name || "Unknown",
          type: profile.role === "doctor" ? "Doctor" : "Lab Staff",
          email: profile.email || "N/A",
          phone: profile.phone || "N/A",
          certificate: "verified", // Hardcoded to verified for demo, ideally add to profiles
          joinedDate: new Date(profile.created_at).toLocaleDateString(),
          patientCount: uniquePatientCount,
          recordCount: recordCount || 0,
        });

      } catch (err) {
        console.error("Error fetching staff details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout role="org">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!staff) {
    return (
      <DashboardLayout role="org">
        <div className="mb-4">
          <Link to="/org/staff" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Staff
          </Link>
        </div>
        <div className="bg-card rounded-xl p-12 text-center card-shadow">
          <p className="text-muted-foreground">Staff member not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="org">
      <div className="mb-4">
        <Link to="/org/staff" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Staff
        </Link>
      </div>
      <PageHeader title={staff.name} description={staff.type} />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-5 card-shadow text-center">
          <p className="text-2xl font-semibold text-foreground">{staff.patientCount}</p>
          <p className="text-sm text-muted-foreground">Patients Treated</p>
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

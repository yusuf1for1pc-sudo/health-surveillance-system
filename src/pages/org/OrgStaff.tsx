import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  email: string;
  phone?: string;
  created_at: string;
}

const OrgStaff = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = user?.organization_id;

  useEffect(() => {
    if (!isSupabaseConfigured() || !orgId) return;
    let cancelled = false;
    setLoading(true);

    supabase
      .from("profiles")
      .select("id, full_name, role, email, phone, created_at")
      .eq("organization_id", orgId)
      .in("role", ["doctor", "lab_staff"])
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Error fetching staff:", error);
        } else {
          setStaff(data || []);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [orgId]);

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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-card rounded-xl p-12 text-center card-shadow">
          <p className="text-muted-foreground">No staff members yet. Click "Add Staff" to create one.</p>
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "full_name", header: "Name" },
            { key: "role", header: "Type", render: (item: StaffMember) => item.role === "doctor" ? "Doctor" : "Lab Staff" },
            { key: "email", header: "Email" },
            { key: "created_at", header: "Added", render: (item: StaffMember) => new Date(item.created_at).toLocaleDateString() },
          ]}
          data={staff}
          onRowClick={(item) => navigate(`/org/staff/${item.id}`)}
        />
      )}
    </DashboardLayout>
  );
};

export default OrgStaff;

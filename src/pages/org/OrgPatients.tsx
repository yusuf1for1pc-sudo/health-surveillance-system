import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface PatientRaw {
  patient_id: string;
  full_name: string;
  phone: string;
  created_at: string;
}

interface PatientData {
  id: string;
  name: string;
  phone: string;
  lastVisit: string;
}

const OrgPatients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = user?.organization_id;

  useEffect(() => {
    if (!isSupabaseConfigured() || !orgId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchPatients = async () => {
      try {
        // Find all staff in this org
        const { data: staff } = await supabase
          .from("profiles")
          .select("id")
          .eq("organization_id", orgId);

        if (!staff || staff.length === 0) {
          if (!cancelled) {
            setPatients([]);
            setLoading(false);
          }
          return;
        }

        const staffIds = staff.map(s => s.id);

        // Find all records created by these staff to get patient IDs
        const { data: records } = await supabase
          .from("medical_records")
          .select("patient_id, created_at")
          .in("created_by", staffIds)
          .order("created_at", { ascending: false });

        if (!records || records.length === 0) {
          if (!cancelled) {
            setPatients([]);
            setLoading(false);
          }
          return;
        }

        // Get unique patient IDs and their latest visit date
        const patientLatestVisit = new Map<string, string>();
        records.forEach(r => {
          if (!patientLatestVisit.has(r.patient_id)) {
            patientLatestVisit.set(r.patient_id, r.created_at);
          }
        });

        const uniquePatientIds = Array.from(patientLatestVisit.keys());

        // Fetch patient details
        const { data: patientDetails } = await supabase
          .from("patients")
          .select("id, full_name, phone")
          .in("id", uniquePatientIds);

        if (!cancelled && patientDetails) {
          const formattedPatients: PatientData[] = patientDetails.map(p => ({
            id: p.id,
            name: p.full_name || "Unknown",
            phone: p.phone || "N/A",
            lastVisit: new Date(patientLatestVisit.get(p.id) || "").toLocaleDateString()
          }));

          setPatients(formattedPatients);
        }
      } catch (err) {
        console.error("Error fetching org patients:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPatients();

    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return (
    <DashboardLayout role="org">
      <PageHeader title="Patients" description="All patients registered under your organization" />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-card rounded-xl p-12 text-center card-shadow">
          <p className="text-muted-foreground">No patients found for your organization yet.</p>
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "phone", header: "Phone" },
            { key: "lastVisit", header: "Last Visit" },
          ]}
          data={patients}
        />
      )}
    </DashboardLayout>
  );
};

export default OrgPatients;

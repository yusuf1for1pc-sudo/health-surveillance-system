import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface Prescription {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: any; // jsonb
  duration: string;
  created_at: string;
  medical_records: {
    creator_name: string;
    created_at: string;
  };
}

const PatientPrescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('prescriptions')
          .select(`
            id,
            medicine_name,
            dosage,
            frequency,
            duration,
            created_at,
            medical_records!inner (
              creator_name,
              created_at,
              patient_id
            )
          `)
          .eq('medical_records.patient_id', user.id) // Filter by current patient
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPrescriptions(data || []);
      } catch (err) {
        console.error("Error fetching prescriptions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [user]);

  const formatFrequency = (freq: any) => {
    if (!freq) return "—";
    if (typeof freq === 'string') return freq;

    // Handle the JSON format { morning: true, ... }
    const parts = [];
    if (freq.morning) parts.push("Morning");
    if (freq.afternoon) parts.push("Afternoon");
    if (freq.evening) parts.push("Evening");
    if (freq.night) parts.push("Night");
    return parts.length > 0 ? parts.join(", ") : "—";
  };

  const tableData = prescriptions.map(p => ({
    id: p.id,
    medication: p.medicine_name,
    dosage: p.dosage || "—",
    frequency: formatFrequency(p.frequency),
    duration: p.duration || "—",
    doctor: p.medical_records?.creator_name || "Unknown",
    date: new Date(p.medical_records?.created_at || p.created_at).toLocaleDateString(),
    status: "Active" // You could calculate this based on date + duration if needed
  }));

  return (
    <DashboardLayout role="patient">
      <PageHeader title="Prescriptions" description="Your prescribed medications" />
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : tableData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
          No prescriptions found.
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "medication", header: "Medication" },
            { key: "dosage", header: "Dosage" },
            { key: "frequency", header: "Frequency" },
            { key: "duration", header: "Duration" },
            { key: "doctor", header: "Prescribed By" },
            { key: "date", header: "Date" },
          ]}
          data={tableData}
        />
      )}
    </DashboardLayout>
  );
};

export default PatientPrescriptions;

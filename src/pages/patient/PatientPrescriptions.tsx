import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Panel, PanelGrid, Field } from "@/components/layout/Modular";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2, Pill, ArrowUpRight, FlaskConical, History } from "lucide-react";
import { useTranslation } from "react-i18next";
import { recordPath } from "@/lib/patientNav";

interface Prescription {
  id: string;
  record_id: string;
  medicine_name: string;
  dosage: string;
  frequency: any; // jsonb
  duration: string;
  created_at: string;
  medical_records: {
    creator_name: string;
    created_at: string;
    created_by: string;
    profiles: any;
  }[];
}

const PatientPrescriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('prescriptions')
          .select(`
            id,
            record_id,
            medicine_name,
            dosage,
            frequency,
            duration,
            created_at,
            medical_records!inner (
              creator_name,
              created_at,
              created_by,
              patient_id,
              profiles:created_by ( full_name )
            )
          `)
          .eq('medical_records.patient_id', user.id)
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

  // One card per visit (record), listing its medicines, newest first
  const visits = (() => {
    const map = new Map<string, { record_id: string; date: string; doctor: string; items: Prescription[] }>();
    prescriptions.forEach((p) => {
      const rec = p.medical_records?.[0];
      const g = map.get(p.record_id) ?? {
        record_id: p.record_id,
        date: rec?.created_at || p.created_at,
        doctor: rec?.creator_name || rec?.profiles?.full_name || "Unknown",
        items: [],
      };
      g.items.push(p);
      map.set(p.record_id, g);
    });
    return [...map.values()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  })();

  return (
    <DashboardLayout role="patient" fit>
      <PageHeader compact title={t("prescriptions_title")} description={t("prescriptions_desc")} />
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : visits.length === 0 ? (
        <Panel><p className="text-sm text-muted-foreground">{t("no_prescriptions")}</p></Panel>
      ) : (
        <PanelGrid className="lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[minmax(0,1fr)]">
          <div className="grid content-start gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1 xl:grid-cols-2">
            {visits.map((v) => (
              <Panel
                key={v.record_id}
                title={new Date(v.date).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                description={`Prescribed by ${v.doctor}`}
                icon={<Pill className="h-5 w-5" />}
                action={
                  <Link
                    to={recordPath({ id: v.record_id, record_type: "Prescription" })}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Open prescription <ArrowUpRight className="h-4 w-4" />
                  </Link>
                }
                bodyClassName="p-0"
              >
                <button
                  onClick={() => navigate(recordPath({ id: v.record_id, record_type: "Prescription" }))}
                  className="block w-full text-left transition-colors hover:bg-muted/30"
                  aria-label="Open this prescription"
                >
                  <ul className="divide-y">
                    {v.items.map((p) => (
                      <li key={p.id} className="px-5 py-3.5">
                        <div>
                          <p className="font-medium">{p.medicine_name} <span className="font-normal text-muted-foreground">· {p.dosage || "—"}</span></p>
                          <p className="text-sm text-muted-foreground">{formatFrequency(p.frequency)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </button>
              </Panel>
            ))}
          </div>

          <aside className="space-y-5 lg:overflow-y-auto">
            <Panel title="Summary" bodyClassName="py-1">
              <Field inline icon={<Pill className="h-3.5 w-3.5" />} label="Medicines" value={prescriptions.length} />
              <Field inline label="Prescriptions" value={visits.length} />
              <Field inline label="Latest" value={new Date(visits[0].date).toLocaleDateString()} />
            </Panel>
            <Panel title="Go to" bodyClassName="space-y-2">
              <Link to="/patient/reports" className="flex items-center gap-3 rounded-sm border px-3 py-2 text-sm transition-colors hover:bg-muted/50">
                <FlaskConical className="h-4 w-4 text-muted-foreground" /> Lab reports <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
              <Link to="/patient/history" className="flex items-center gap-3 rounded-sm border px-3 py-2 text-sm transition-colors hover:bg-muted/50">
                <History className="h-4 w-4 text-muted-foreground" /> Full history <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            </Panel>
          </aside>
        </PanelGrid>
      )}
    </DashboardLayout>
  );
};

export default PatientPrescriptions;

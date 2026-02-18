import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Download, FileText, Pill, Loader2, ShieldCheck, User, Calendar, Stethoscope, FileOutput, Plus } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Prescription {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: any;
  duration: string;
}

const StaffRecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRecord, patients } = useData();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  // Add Medicine Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newMed, setNewMed] = useState({
    name: "",
    dosage: "",
    frequency: { morning: true, afternoon: false, evening: false, night: true },
    duration: "5 days"
  });

  const fetchPrescriptions = async () => {
    if (!id) return;
    setLoadingPrescriptions(true);
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('record_id', id);

      if (!error && data) {
        setPrescriptions(data);
      }
    } catch (err) {
      console.error("Failed to fetch prescriptions:", err);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [id]);

  const record = getRecord(id || "");

  if (!record) {
    return (
      <DashboardLayout role="staff">
        <PageHeader title="Record Not Found" />
        <p className="text-muted-foreground">No record found with this ID or you do not have permission to view it.</p>
        <Button className="mt-4" onClick={() => navigate("/staff/records")}>Back to Records</Button>
      </DashboardLayout>
    );
  }

  const patient = patients.find(p => p.id === record.patient_id);

  const formatFrequency = (freq: any) => {
    if (!freq) return "—";
    if (typeof freq === 'string') return freq;
    const parts = [];
    if (freq.morning) parts.push("Morning");
    if (freq.afternoon) parts.push("Afternoon");
    if (freq.evening) parts.push("Evening");
    if (freq.night) parts.push("Night");
    return parts.length > 0 ? parts.join(", ") : "—";
  };

  const toggleFrequency = (key: keyof typeof newMed.frequency) => {
    setNewMed({
      ...newMed,
      frequency: { ...newMed.frequency, [key]: !newMed.frequency[key] }
    });
  };

  const handleAddMedicine = async () => {
    if (!newMed.name || !id) return;
    setAdding(true);
    try {
      const { error } = await supabase.from('prescriptions').insert({
        record_id: id,
        medicine_name: newMed.name,
        dosage: newMed.dosage,
        frequency: newMed.frequency,
        duration: newMed.duration
      });

      if (error) throw error;

      toast.success("Medicine added successfully");
      setIsAddOpen(false);
      setNewMed({
        name: "",
        dosage: "",
        frequency: { morning: true, afternoon: false, evening: false, night: true },
        duration: "5 days"
      });
      fetchPrescriptions(); // Refresh list
    } catch (err: any) {
      toast.error("Failed to add medicine: " + err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <DashboardLayout role="staff">
      <div className="max-w-4xl mx-auto pb-10">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Medical Record Details</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              Confidential • Authorized Access Only
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/staff/records")}>Back to Records</Button>
        </div>

        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          {/* Header / Banner */}
          <div className="bg-primary/5 border-b px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{patient?.full_name || "Unknown Patient"}</h2>
                <span className="text-sm text-muted-foreground">ID: {patient?.patient_id || "—"}</span>
              </div>
            </div>
            <div className="text-right sm:text-left">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Date: {new Date(record.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Stethoscope className="w-4 h-4" />
                <span>Dr: {record.creator_name}</span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Clinical Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Record Type</span>
                  <div className="text-foreground font-medium mt-1">{record.record_type}</div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</span>
                  <div className="text-foreground font-medium mt-1">{record.title}</div>
                </div>
                {record.icd_code && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ICD Diagnosis</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded border border-blue-200">{record.icd_code}</span>
                      <span className="text-foreground">{record.icd_label}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {record.diagnosis && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clinical Description / Findings</span>
                    <p className="text-foreground mt-1 whitespace-pre-wrap bg-muted/20 p-3 rounded-lg text-sm border">{record.diagnosis}</p>
                  </div>
                )}
                {record.description && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Additional Notes</span>
                    <p className="text-foreground mt-1 whitespace-pre-wrap text-sm">{record.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Divider */}
            <div className="border-t"></div>

            {/* Prescriptions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 text-green-700 rounded-lg">
                  <Pill className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">Prescribed Medications</h3>
              </div>

              {loadingPrescriptions ? (
                <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : prescriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No medications prescribed in this record.</p>
              ) : (
                <div className="grid gap-3">
                  {prescriptions.map((med) => (
                    <div key={med.id} className="group relative border rounded-lg p-4 bg-card">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <div className="font-semibold text-base">{med.medicine_name} <span className="text-muted-foreground font-normal ml-1">({med.dosage})</span></div>
                          <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4">
                            <span><span className="font-medium text-foreground/80">Take:</span> {formatFrequency(med.frequency)}</span>
                            <span><span className="font-medium text-foreground/80">Duration:</span> {med.duration}</span>
                          </div>
                        </div>
                        <div className="text-xs font-medium px-2 py-1 bg-muted rounded self-start sm:self-center text-muted-foreground">Prescribed</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attachments */}
            {record.attachment_name && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                    <FileOutput className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">Attachments</h3>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <FileText className="w-8 h-8 text-primary/70" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground block truncate">{record.attachment_name}</span>
                    <span className="text-xs text-muted-foreground">Document</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => alert("Mock Download: " + record.attachment_name)}>
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-muted/20 border-t px-6 py-3 text-xs text-center text-muted-foreground">
            This record is a confidential medical document. Unauthorized access is prohibited.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffRecordDetail;

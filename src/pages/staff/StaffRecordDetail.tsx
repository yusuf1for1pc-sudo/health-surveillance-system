import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Panel, PanelGrid, Field } from "@/components/layout/Modular";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Download, FileText, Pill, Loader2, ShieldCheck, Calendar, Stethoscope, FileOutput, Plus, ChevronRight, ArrowLeft, ArrowUpRight, Hash, Printer } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import LabReportViewer from "@/components/lab/LabReportViewer";

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
  const [labReport, setLabReport] = useState<any>(null);
  const [loadingLabReport, setLoadingLabReport] = useState(false);

  // Direct-fetch state (bypasses slow DataContext bulk load)
  const [directRecord, setDirectRecord] = useState<any>(null);
  const [directPatient, setDirectPatient] = useState<any>(null);
  const [loadingRecord, setLoadingRecord] = useState(true);

  // Add Medicine Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newMed, setNewMed] = useState({
    name: "",
    dosage: "",
    frequency: { morning: true, afternoon: false, evening: false, night: true },
    duration: "5 days"
  });

  // Fetch record + patient + prescriptions + lab report all in parallel
  useEffect(() => {
    if (!id) return;
    setLoadingRecord(true);

    const fetchAll = async () => {
      // Fire all queries in parallel
      const [recRes, prescRes, labRes] = await Promise.all([
        supabase.from('medical_records').select('*').eq('id', id).maybeSingle(),
        supabase.from('prescriptions').select('*').eq('record_id', id),
        supabase.from('lab_reports').select('*').eq('record_id', id).maybeSingle(),
      ]);

      if (recRes.data) {
        setDirectRecord(recRes.data);
        // Fetch patient in a follow-up (needs patient_id from record)
        const { data: patData } = await supabase
          .from('patients')
          .select('id, patient_id, full_name, email, phone, gender, date_of_birth, blood_type')
          .eq('id', recRes.data.patient_id)
          .maybeSingle();
        if (patData) setDirectPatient(patData);
      }

      if (prescRes.data) setPrescriptions(prescRes.data);
      if (labRes.data) setLabReport(labRes.data);

      setLoadingRecord(false);
      setLoadingPrescriptions(false);
      setLoadingLabReport(false);
    };

    fetchAll().catch((err) => {
      console.error("Failed to fetch record details:", err);
      setLoadingRecord(false);
    });
  }, [id]);

  // Use cache first, fall back to direct fetch
  const cachedRecord = getRecord(id || "");
  const record = cachedRecord || directRecord;
  const patient = patients.find(p => p.id === record?.patient_id) || directPatient;

  if (loadingRecord && !record) {
    return (
      <DashboardLayout role="staff">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!record) {
    return (
      <DashboardLayout role="staff">
        <PageHeader title="Record Not Found" />
        <p className="text-muted-foreground">No record found with this ID or you do not have permission to view it.</p>
        <Button className="mt-4" onClick={() => navigate("/staff/records")}>Back to Records</Button>
      </DashboardLayout>
    );
  }

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
      // Refresh prescriptions list
      const { data: refreshed } = await supabase.from('prescriptions').select('*').eq('record_id', id);
      if (refreshed) setPrescriptions(refreshed);
    } catch (err: any) {
      toast.error("Failed to add medicine: " + err.message);
    } finally {
      setAdding(false);
    }
  };

  const isRx = record.record_type === "Prescription";
  const isLab = record.record_type === "Lab Report";

  return (
    <DashboardLayout role="staff" fit>
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Breadcrumb */}
        <nav className="mb-3 flex shrink-0 items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/staff/records" className="inline-flex items-center gap-1.5 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Records
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-foreground">{record.title}</span>
        </nav>

        <PanelGrid className="lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[minmax(0,1fr)]">
          {/* Main column scrolls on its own */}
          <div className="space-y-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1 print:!overflow-visible">
            <Panel bodyClassName="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span className="inline-block rounded-sm border border-foreground/30 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider">{record.record_type}</span>
                <h1 className="mt-2 font-serif text-2xl font-medium leading-tight">{record.title}</h1>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(record.created_at).toLocaleDateString()}</span>
                  <span className="inline-flex items-center gap-1.5"><Stethoscope className="h-4 w-4" />{record.creator_name}</span>
                  {record.icd_code && <span className="inline-flex items-center gap-1.5"><Hash className="h-4 w-4" />{record.icd_code} · {record.icd_label}</span>}
                </div>
              </div>
              {!isLab && (
                <Button variant="outline" size="sm" className="gap-2 print:hidden" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Print
                </Button>
              )}
            </Panel>

            {(record.diagnosis || record.description) && (
              <Panel title="Clinical summary" bodyClassName="grid gap-4 md:grid-cols-2">
                {record.diagnosis && (
                  <div>
                    <p className="eyebrow mb-1.5">Findings</p>
                    <p className="whitespace-pre-wrap text-sm">{record.diagnosis}</p>
                  </div>
                )}
                {record.description && (
                  <div>
                    <p className="eyebrow mb-1.5">Notes</p>
                    <p className="whitespace-pre-wrap text-sm">{record.description}</p>
                  </div>
                )}
              </Panel>
            )}

            {isLab && (
              <Panel title="Lab results">
                {loadingLabReport ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : labReport ? (
                  <LabReportViewer labReport={labReport} patientName={patient?.full_name} recordDate={record.created_at} />
                ) : (
                  <p className="text-sm italic text-muted-foreground">No lab report data found for this record.</p>
                )}
              </Panel>
            )}

            {(isRx || prescriptions.length > 0) && (
              <Panel
                title="Prescribed medications"
                icon={<Pill className="h-5 w-5" />}
                bodyClassName="p-0"
                action={
                  <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-1.5 print:hidden"><Plus className="h-4 w-4" />Add medicine</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add medicine</DialogTitle></DialogHeader>
                      <div className="grid gap-4 py-2">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label>Medicine name</Label>
                            <Input className="mt-1.5" value={newMed.name} onChange={(e) => setNewMed({ ...newMed, name: e.target.value })} placeholder="e.g. Paracetamol" />
                          </div>
                          <div>
                            <Label>Dosage</Label>
                            <Input className="mt-1.5" value={newMed.dosage} onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })} placeholder="e.g. 500mg" />
                          </div>
                        </div>
                        <div>
                          <Label>When to take</Label>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {(["morning", "afternoon", "evening", "night"] as const).map((k) => (
                              <button
                                key={k}
                                type="button"
                                onClick={() => toggleFrequency(k)}
                                className={`rounded-sm border px-3 py-1.5 text-sm capitalize transition-colors ${newMed.frequency[k] ? "border-foreground bg-foreground text-background" : "hover:bg-muted/60"}`}
                              >
                                {k}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddMedicine} disabled={adding || !newMed.name}>
                          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add medicine"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                }
              >
                {loadingPrescriptions ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : prescriptions.length === 0 ? (
                  <p className="p-4 text-sm italic text-muted-foreground">No medications prescribed in this record.</p>
                ) : (
                  <ul className="divide-y">
                    {prescriptions.map((med) => (
                      <li key={med.id} className="px-4 py-3">
                        <p className="font-medium">{med.medicine_name} <span className="font-normal text-muted-foreground">· {med.dosage}</span></p>
                        <p className="mt-0.5 text-sm text-muted-foreground">Take: {formatFrequency(med.frequency)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            )}

            {record.attachment_name && (
              <Panel title="Attachments" icon={<FileOutput className="h-5 w-5" />}>
                <div className="flex items-center gap-3 rounded-sm border bg-muted/30 p-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{record.attachment_name}</span>
                    <span className="text-xs text-muted-foreground">Document</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => alert("Mock Download: " + record.attachment_name)}>
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                </div>
              </Panel>
            )}
          </div>

          {/* Side column */}
          <aside className="space-y-4 lg:min-h-0 lg:overflow-y-auto print:hidden">
            <Panel
              title="Patient"
              bodyClassName="py-1"
              action={patient?.id ? (
                <Link to={`/staff/patients/${patient.id}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  Open <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              ) : undefined}
            >
              <Field inline label="Name" value={patient?.full_name || "Unknown"} />
              <Field inline label="ID" value={patient?.patient_id || "—"} />
              <Field inline label="Gender" value={patient?.gender || "—"} />
              <Field inline label="Blood" value={patient?.blood_type || "—"} />
            </Panel>

            <Panel title="Record" bodyClassName="py-1">
              <Field inline label="Type" value={record.record_type} />
              <Field inline label="Date" value={new Date(record.created_at).toLocaleDateString()} />
              <Field inline label="By" value={record.creator_name || "—"} />
            </Panel>

            <p className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              Confidential medical record. Authorized access only.
            </p>
          </aside>
        </PanelGrid>
      </div>
    </DashboardLayout>
  );
};

export default StaffRecordDetail;

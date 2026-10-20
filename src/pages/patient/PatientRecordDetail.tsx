import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Panel, PanelGrid, Field } from "@/components/layout/Modular";
import { Button } from "@/components/ui/button";
import {
  Download, FileText, Pill, Loader2, Calendar, Stethoscope, FileOutput, ChevronRight,
  ArrowLeft, ArrowRight, Printer, Hash,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabase";
import LabReportViewer from "@/components/lab/LabReportViewer";
import { SECTION_LABELS, TYPE_STYLES, recordPath, sectionFor, sectionFromPath } from "@/lib/patientNav";

interface Prescription {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: any;
  duration: string;
}

const formatFrequency = (freq: any) => {
  if (!freq) return "—";
  if (typeof freq === "string") return freq;
  const parts = [];
  if (freq.morning) parts.push("Morning");
  if (freq.afternoon) parts.push("Afternoon");
  if (freq.evening) parts.push("Evening");
  if (freq.night) parts.push("Night");
  return parts.length > 0 ? parts.join(", ") : "—";
};

const DAY = 24 * 60 * 60 * 1000;

const PatientRecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const section = sectionFromPath(location.pathname);
  const { getRecord, records } = useData();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labReport, setLabReport] = useState<any>(null);
  const [directRecord, setDirectRecord] = useState<any>(null);
  const [loadingRecord, setLoadingRecord] = useState(true);

  // Record, medications and lab data are fetched together (reads are cached, so revisits are instant)
  useEffect(() => {
    if (!id) return;
    setLoadingRecord(true);
    const fetchAll = async () => {
      const [recRes, prescRes, labRes] = await Promise.all([
        supabase.from("medical_records").select("*").eq("id", id).maybeSingle(),
        supabase.from("prescriptions").select("*").eq("record_id", id),
        supabase.from("lab_reports").select("*").eq("record_id", id).maybeSingle(),
      ]);
      setDirectRecord(recRes.data ?? null);
      setPrescriptions(prescRes.data ?? []);
      setLabReport(labRes.data ?? null);
      setLoadingRecord(false);
    };
    fetchAll().catch((err) => {
      console.error("Failed to fetch record details:", err);
      setLoadingRecord(false);
    });
  }, [id]);

  const record = getRecord(id || "") || directRecord;

  // Records of the same kind, newest first, for the Newer / Older links
  const sameKind = useMemo(
    () =>
      records
        .filter((r) => record && sectionFor(r.record_type) === sectionFor(record.record_type))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [records, record],
  );
  const index = sameKind.findIndex((r) => r.id === id);
  const newer = index > 0 ? sameKind[index - 1] : null;
  const older = index >= 0 && index < sameKind.length - 1 ? sameKind[index + 1] : null;

  // Other records from the same condition or the same fortnight
  const related = useMemo(() => {
    if (!record) return [];
    const t = new Date(record.created_at).getTime();
    return records
      .filter((r) => r.id !== record.id && ((record.icd_code && r.icd_code === record.icd_code) || Math.abs(new Date(r.created_at).getTime() - t) <= 14 * DAY))
      .slice(0, 4);
  }, [records, record]);

  if (loadingRecord && !record) {
    return (
      <DashboardLayout role="patient">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!record) {
    return (
      <DashboardLayout role="patient">
        <PageHeader title="Record not found" description="This record doesn't exist or you don't have access to it." />
        <Button onClick={() => navigate(`/patient/${section}`)}>Back to {SECTION_LABELS[section]}</Button>
      </DashboardLayout>
    );
  }

  // A prescription opened from History (or a report opened from Prescriptions...) moves to its own section
  if (sectionFor(record.record_type) !== section) {
    return <Navigate to={recordPath(record)} replace />;
  }

  const isLab = record.record_type === "Lab Report";
  const isRx = record.record_type === "Prescription";

  return (
    <DashboardLayout role="patient" fit>
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Breadcrumb: always shows where you are and how to get back */}
        <nav className="mb-3 flex shrink-0 items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link to={`/patient/${section}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {SECTION_LABELS[section]}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-foreground">{record.title}</span>
        </nav>

        <PanelGrid className="lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[minmax(0,1fr)]">
          <div className="space-y-5 lg:min-h-0 lg:overflow-y-auto lg:pr-1 print:!overflow-visible">
            {/* Header module */}
            <Panel bodyClassName="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span className={`inline-block rounded-sm border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${TYPE_STYLES[record.record_type] ?? ""}`}>
                  {record.record_type}
                </span>
                <h1 className="mt-3 font-serif text-3xl font-medium leading-tight">{record.title}</h1>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
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

            {/* Notes / findings */}
            {(record.diagnosis || record.description) && (
              <Panel title={isLab ? "Doctor's remarks" : "Clinical summary"} bodyClassName="grid gap-5 md:grid-cols-2">
                {record.diagnosis && (
                  <div>
                    <p className="eyebrow mb-2">Diagnosis</p>
                    <p className="whitespace-pre-wrap text-sm">{record.diagnosis}</p>
                  </div>
                )}
                {record.description && (
                  <div>
                    <p className="eyebrow mb-2">Notes</p>
                    <p className="whitespace-pre-wrap text-sm">{record.description}</p>
                  </div>
                )}
              </Panel>
            )}

            {/* Lab results */}
            {isLab && (
              <Panel title="Lab results">
                {labReport ? (
                  <LabReportViewer labReport={labReport} patientName={undefined} recordDate={record.created_at} />
                ) : (
                  <p className="text-sm italic text-muted-foreground">No result values were recorded for this report.</p>
                )}
              </Panel>
            )}

            {/* Medications */}
            {(isRx || prescriptions.length > 0) && (
              <Panel title="Prescribed medications" icon={<Pill className="h-5 w-5" />} bodyClassName="p-0">
                {prescriptions.length === 0 ? (
                  <p className="p-5 text-sm italic text-muted-foreground">No medications were recorded for this prescription.</p>
                ) : (
                  <ul className="divide-y">
                    {prescriptions.map((med) => (
                      <li key={med.id} className="px-5 py-4">
                        <div>
                          <p className="font-medium">{med.medicine_name} <span className="font-normal text-muted-foreground">· {med.dosage}</span></p>
                          <p className="mt-0.5 text-sm text-muted-foreground">Take: {formatFrequency(med.frequency)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            )}

            {/* Attachments */}
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

          {/* Side column: where am I, where next */}
          <aside className="space-y-5 lg:min-h-0 lg:overflow-y-auto print:hidden">
            <Panel title="This record" bodyClassName="py-1">
              <Field inline label="Type" value={record.record_type} />
              <Field inline label="Date" value={new Date(record.created_at).toLocaleDateString()} />
              <Field inline label="Doctor" value={record.creator_name || "—"} />
            </Panel>

            <Panel title={`More ${SECTION_LABELS[section].toLowerCase()}`} bodyClassName="space-y-2">
              {newer ? (
                <Link to={recordPath(newer)} className="flex items-center gap-3 rounded-sm border px-3 py-2 text-sm transition-colors hover:bg-muted/50">
                  <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0"><span className="eyebrow block">Newer</span><span className="block truncate">{newer.title}</span></span>
                </Link>
              ) : null}
              {older ? (
                <Link to={recordPath(older)} className="flex items-center gap-3 rounded-sm border px-3 py-2 text-sm transition-colors hover:bg-muted/50">
                  <span className="min-w-0 flex-1"><span className="eyebrow block">Older</span><span className="block truncate">{older.title}</span></span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ) : null}
              {!newer && !older && <p className="text-sm text-muted-foreground">This is your only entry here.</p>}
              <Link to={`/patient/${section}`} className="block pt-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                All {SECTION_LABELS[section].toLowerCase()} →
              </Link>
            </Panel>

            {related.length > 0 && (
              <Panel title="Related" description="Same condition or the same fortnight" bodyClassName="space-y-2">
                {related.map((r) => (
                  <Link key={r.id} to={recordPath(r)} className="block rounded-sm border px-3 py-2 text-sm transition-colors hover:bg-muted/50">
                    <span className={`mb-1 inline-block rounded-sm border px-1.5 py-px text-[10px] uppercase tracking-wider ${TYPE_STYLES[r.record_type] ?? ""}`}>{r.record_type}</span>
                    <span className="block truncate">{r.title}</span>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </Link>
                ))}
              </Panel>
            )}
          </aside>
        </PanelGrid>
      </div>
    </DashboardLayout>
  );
};

export default PatientRecordDetail;

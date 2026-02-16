import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Search, Sparkles, Check, X, Loader2 } from "lucide-react";
import { searchIcdCodes } from "@/data/icdCodes";
import { suggestDiagnosis, isGeminiConfigured } from "@/lib/gemini";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import type { ICDCode, DiagnosisSuggestion } from "@/lib/types";

const recordTypes = ["Prescription", "Lab Report", "Clinical Note"];

const StaffRecordCreate = () => {
  const navigate = useNavigate();
  const { patients, addRecord } = useData();
  const { user } = useAuth();
  const [type, setType] = useState("Prescription");
  const [icdSearch, setIcdSearch] = useState("");
  const [selectedIcd, setSelectedIcd] = useState<ICDCode | null>(null);
  const [icdOpen, setIcdOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  // Patient search
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);

  // AI Diagnosis
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<DiagnosisSuggestion | null>(null);

  const filteredIcd = useMemo(() => searchIcdCodes(icdSearch), [icdSearch]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.patient_id.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }, [patientSearch, patients]);

  const handleAiAssist = async () => {
    if (!diagnosis.trim()) return;
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const suggestion = await suggestDiagnosis(diagnosis);
      setAiSuggestion(suggestion);
    } finally {
      setAiLoading(false);
    }
  };

  const acceptSuggestion = () => {
    if (!aiSuggestion) return;
    setDiagnosis(aiSuggestion.diagnosis);
    const icd = { code: aiSuggestion.icd_code, label: aiSuggestion.icd_label, category: "" };
    setSelectedIcd(icd);
    setAiSuggestion(null);
  };

  return (
    <DashboardLayout role="staff">
      <PageHeader title="Create Medical Record" description="Add a new record for a patient" />
      <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow max-w-2xl">
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!selectedPatient) return;
          setSubmitting(true);
          try {
            await addRecord({
              patient_id: selectedPatient.id,
              record_type: type as 'Prescription' | 'Lab Report' | 'Clinical Note',
              title,
              description: description || undefined,
              diagnosis: diagnosis || undefined,
              icd_code: selectedIcd?.code || undefined,
              icd_label: selectedIcd?.label || undefined,
              attachment_name: fileName || undefined,
              created_by: user?.id || 'staff-1',
              creator_name: user?.full_name || 'Dr. Demo',
              organization_id: user?.organization_id,
            });
            navigate("/staff/records");
          } finally {
            setSubmitting(false);
          }
        }} className="space-y-4">
          {/* Patient Search */}
          <div className="relative">
            <Label>Patient</Label>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search patient by name or ID..."
                className="pl-9 h-11 sm:h-10"
                value={selectedPatient ? `${selectedPatient.full_name} (${selectedPatient.patient_id})` : patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setSelectedPatient(null);
                  setPatientOpen(true);
                }}
                onFocus={() => setPatientOpen(true)}
                required
              />
            </div>
            {patientOpen && !selectedPatient && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">No matching patients</div>
                ) : (
                  filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-4 py-3 sm:py-2.5 hover:bg-muted/50 transition-colors border-b last:border-0"
                      onClick={() => { setSelectedPatient(p); setPatientSearch(""); setPatientOpen(false); }}
                    >
                      <span className="text-sm font-medium text-foreground">{p.full_name}</span>
                      <span className="text-sm text-muted-foreground ml-2">— {p.patient_id}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Record Type */}
          <div>
            <Label>Record Type</Label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1.5">
              {recordTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-3 sm:py-2 rounded-lg border text-sm font-medium transition-colors ${type === t ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground hover:bg-muted"
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnosis Text + AI Assist */}
          <div>
            <div className="flex items-center justify-between">
              <Label>Diagnosis / Clinical Notes</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!diagnosis.trim() || aiLoading}
                onClick={handleAiAssist}
                className="h-7 text-xs gap-1"
              >
                {aiLoading ? (
                  <><Loader2 className="w-3 h-3 animate-spin" />Analyzing...</>
                ) : (
                  <><Sparkles className="w-3 h-3" />AI Assist</>
                )}
              </Button>
            </div>
            <Textarea
              placeholder="Describe symptoms, diagnosis, or clinical findings..."
              className="mt-1.5"
              rows={3}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
            {!isGeminiConfigured() && (
              <p className="text-xs text-muted-foreground mt-1">
                Demo mode — AI will return simulated suggestions
              </p>
            )}
          </div>

          {/* AI Suggestion Panel */}
          {aiSuggestion && (
            <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">AI Suggestion</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {Math.round(aiSuggestion.confidence * 100)}% confidence
                  </span>
                </div>
                <button type="button" onClick={() => setAiSuggestion(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-muted-foreground">Diagnosis: </span>
                  <span className="text-foreground font-medium">{aiSuggestion.diagnosis}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">ICD Code: </span>
                  <span className="text-foreground font-medium">{aiSuggestion.icd_code} — {aiSuggestion.icd_label}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reasoning: </span>
                  <span className="text-foreground text-xs">{aiSuggestion.reasoning}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={acceptSuggestion} className="h-8 text-xs gap-1">
                  <Check className="w-3 h-3" />Accept
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setAiSuggestion(null)} className="h-8 text-xs">
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* ICD Code Selector */}
          <div className="relative">
            <Label>ICD Code</Label>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search ICD code or diagnosis..."
                className="pl-9 h-11 sm:h-10"
                value={selectedIcd ? `${selectedIcd.code} — ${selectedIcd.label}` : icdSearch}
                onChange={(e) => {
                  setIcdSearch(e.target.value);
                  setSelectedIcd(null);
                  setIcdOpen(true);
                }}
                onFocus={() => setIcdOpen(true)}
              />
            </div>
            {icdOpen && !selectedIcd && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                {filteredIcd.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">No matching codes</div>
                ) : (
                  filteredIcd.slice(0, 20).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      className="w-full text-left px-4 py-3 sm:py-2.5 hover:bg-muted/50 transition-colors border-b last:border-0"
                      onClick={() => { setSelectedIcd(c); setIcdSearch(""); setIcdOpen(false); }}
                    >
                      <span className="text-sm font-medium text-foreground">{c.code}</span>
                      <span className="text-sm text-muted-foreground ml-2">— {c.label}</span>
                      <span className="text-xs text-muted-foreground ml-2 opacity-60">({c.category})</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <Label>Title</Label>
            <Input placeholder="Record title" className="mt-1.5 h-11 sm:h-10" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea placeholder="Enter details..." className="mt-1.5" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Attachment */}
          <div>
            <Label>Attachment</Label>
            {fileName ? (
              <div className="mt-1.5 flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <Upload className="w-5 h-5 text-accent-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                  <p className="text-xs text-muted-foreground">Ready to upload</p>
                </div>
                <button type="button" onClick={() => setFileName(null)} className="text-xs text-muted-foreground hover:text-foreground">Remove</button>
              </div>
            ) : (
              <label className="block mt-1.5 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Upload file</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG (max 10MB)</p>
                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => { if (e.target.files?.[0]) setFileName(e.target.files[0].name); }} />
              </label>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button type="submit" className="h-11 sm:h-10" disabled={submitting}>{submitting ? "Saving..." : "Save Record"}</Button>
            <Button type="button" variant="outline" className="h-11 sm:h-10" onClick={() => navigate("/staff/records")}>Cancel</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default StaffRecordCreate;

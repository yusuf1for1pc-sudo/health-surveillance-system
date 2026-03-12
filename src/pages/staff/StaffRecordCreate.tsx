import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Search, Sparkles, Check, X, Loader2, Plus, Trash2, Pill, AlertTriangle, FileText, Beaker, User as UserIcon, Calendar as CalendarIcon, Edit3 } from "lucide-react";
import { searchIcdCodes } from "@/data/icdCodes";
import { suggestDiagnosis, isGeminiConfigured } from "@/lib/gemini";
import { extractLabDataFromImage, isGroqConfigured } from "@/lib/groq";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import type { ICDCode, DiagnosisSuggestion } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import LabReportBuilder from "@/components/lab/LabReportBuilder";
import { type LabTestPanelData, TEST_PANELS } from "@/data/labTestPanels";
import { extractMedicalData, type ExtractedMedicalData, type ExtractedTestResult } from "@/lib/mlApi";

const recordTypes = ["Prescription", "Lab Report", "Clinical Note"];

// ─── Allergy → Drug interaction map (prescription safety check) ───
const ALLERGY_DRUG_MAP: Record<string, { drugs: string[]; alternative: string }> = {
  penicillin: { drugs: ["penicillin", "amoxicillin", "ampicillin", "augmentin", "piperacillin"], alternative: "Azithromycin" },
  aspirin: { drugs: ["aspirin", "acetylsalicylic acid", "dispirin"], alternative: "Paracetamol" },
  sulfa: { drugs: ["sulfamethoxazole", "co-trimoxazole", "bactrim", "septran"], alternative: "Amoxicillin" },
  nsaid: { drugs: ["ibuprofen", "naproxen", "diclofenac", "piroxicam", "indomethacin"], alternative: "Paracetamol" },
  cephalosporin: { drugs: ["cephalexin", "cefixime", "ceftriaxone", "cefuroxime"], alternative: "Azithromycin" },
  metformin: { drugs: ["metformin", "glucophage"], alternative: "Glipizide" },
};

interface AllergyAlert {
  medicineName: string;
  allergen: string;
  alternative: string;
}

const checkAllergyConflict = (medicineName: string, patientAllergies: string | undefined): AllergyAlert | null => {
  if (!patientAllergies || !medicineName) return null;
  const allergies = patientAllergies.toLowerCase().split(/[,;]+/).map(a => a.trim());
  const medLower = medicineName.toLowerCase();

  for (const allergy of allergies) {
    if (!allergy) continue;
    // Check each allergen category
    for (const [allergen, { drugs, alternative }] of Object.entries(ALLERGY_DRUG_MAP)) {
      // Does the patient's allergy match this category?
      if (allergen.includes(allergy) || allergy.includes(allergen)) {
        // Does the prescribed drug belong to this category?
        if (drugs.some(d => medLower.includes(d) || d.includes(medLower))) {
          return { medicineName, allergen: allergy, alternative };
        }
      }
    }
    // Direct name match (e.g. patient allergic to "Paracetamol" and doctor prescribes "Paracetamol")
    if (medLower.includes(allergy) || allergy.includes(medLower)) {
      return { medicineName, allergen: allergy, alternative: "Consult pharmacist for safe alternative" };
    }
  }
  return null;
};

interface PrescriptionItem {
  id: string;
  name: string;
  dosage: string;
  frequency: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    night: boolean;
  };
  duration: string;
}

const StaffRecordCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { patients, addRecord, getPatient, organizations } = useData();
  const { user } = useAuth();
  const [type, setType] = useState("Prescription");
  const [icdSearch, setIcdSearch] = useState("");
  const [selectedIcd, setSelectedIcd] = useState<ICDCode | null>(null);
  const [icdOpen, setIcdOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [rawOcrText, setRawOcrText] = useState<string | null>(null);

  // Lab Report State
  const [labPanels, setLabPanels] = useState<LabTestPanelData[]>([]);
  const [labNotes, setLabNotes] = useState("");
  const [labEntryMode, setLabEntryMode] = useState<"ai" | "manual">("ai");

  // Prescription State
  const [medicines, setMedicines] = useState<PrescriptionItem[]>([]);
  const [newMed, setNewMed] = useState<PrescriptionItem>({
    id: "",
    name: "",
    dosage: "",
    frequency: { morning: true, afternoon: false, evening: false, night: true },
    duration: "5 days"
  });

  // Patient search
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null);
  const isPatientLocked = !!searchParams.get("patientId");
  const [submitting, setSubmitting] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);

  // Pre-select patient from URL param (e.g. navigated from patient detail page)
  useEffect(() => {
    const pid = searchParams.get("patientId");
    if (pid) {
      const p = getPatient(pid);
      if (p) {
        setSelectedPatient(p);
      }
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AI Diagnosis
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<DiagnosisSuggestion | null>(null);
  const [allergyAlerts, setAllergyAlerts] = useState<AllergyAlert[]>([]);

  // AI Extraction State
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedMedicalData | null>(null);
  const [showExtractionReview, setShowExtractionReview] = useState(false);
  const [editingExtracted, setEditingExtracted] = useState(false);

  // Determine if secondary fields (Title, Description, ICD, Save button) should be shown
  const showSecondaryFields = type !== "Lab Report" || labEntryMode === "manual";

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

    if (aiSuggestion.suggested_note && !description) {
      setDescription(aiSuggestion.suggested_note);
    }

    if (aiSuggestion.suggested_prescriptions && aiSuggestion.suggested_prescriptions.length > 0) {
      setType("Prescription");
      const newMeds = aiSuggestion.suggested_prescriptions.map(med => ({
        id: crypto.randomUUID(),
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration
      }));
      setMedicines([...medicines, ...newMeds]);
    }

    setAiSuggestion(null);
  };

  const addMedicine = () => {
    if (!newMed.name) return;

    // ── Allergy Safety Check ──
    const alert = checkAllergyConflict(newMed.name, selectedPatient?.allergies);
    if (alert) {
      setAllergyAlerts(prev => {
        // Avoid duplicate alerts for the same medicine
        if (prev.some(a => a.medicineName.toLowerCase() === alert.medicineName.toLowerCase())) return prev;
        return [...prev, alert];
      });
      toast.warning(`⚠️ Allergy Alert: Patient may be allergic to ${newMed.name}. Consider ${alert.alternative} instead.`, { duration: 6000 });
    }

    setMedicines([...medicines, { ...newMed, id: crypto.randomUUID() }]);
    setNewMed({
      id: "",
      name: "",
      dosage: "",
      frequency: { morning: true, afternoon: false, evening: false, night: true },
      duration: "5 days"
    });
  };

  const removeMedicine = (id: string) => {
    const med = medicines.find(m => m.id === id);
    setMedicines(medicines.filter(m => m.id !== id));
    // Clear any allergy alert for this medicine
    if (med) {
      setAllergyAlerts(prev => prev.filter(a => a.medicineName.toLowerCase() !== med.name.toLowerCase()));
    }
  };

  const toggleFrequency = (key: keyof typeof newMed.frequency) => {
    setNewMed({
      ...newMed,
      frequency: { ...newMed.frequency, [key]: !newMed.frequency[key] }
    });
  };

  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    setSelectedFile(file);
    
    // For Clinical Note, we keep the simulated extraction
    if (type === "Clinical Note") {
      setExtracting(true);
      setExtractedData(null);
      setShowExtractionReview(false);

      try {
        const data = await extractMedicalData(file);
        setExtractedData(data);
        setShowExtractionReview(true);
        toast.success("Medical data extracted successfully!");
        
        // Auto-update description if empty
        if (!description && data.diagnosis) {
          setDescription(`AI Extracted: ${data.diagnosis}`);
        }
      } catch (err) {
        console.error("Extraction failed:", err);
        toast.error("AI extraction failed, but file is attached.");
      } finally {
        setExtracting(false);
      }
      return;
    }
    
    // For Lab Report, we just store the file now and wait for the user to click "Extract"
  };

  const processLabExtraction = async () => {
    if (!selectedFile) return;

    if (!isGroqConfigured()) {
      toast.error("Groq API key is not configured.");
      return;
    }
    
    setExtracting(true);
    setExtractionProgress(0);
    setRawOcrText(null);

    // Simulated progress while Groq Vision processes the image
    const progressInterval = setInterval(() => {
      setExtractionProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90; }
        const inc = prev < 40 ? 6 : prev < 70 ? 3 : 1;
        return prev + inc;
      });
    }, 400);

    try {
      const schema = TEST_PANELS.map(p => ({
        panelId: p.id,
        name: p.name,
        tests: p.fields.map(f => ({ key: f.key, label: f.label, unit: f.unit }))
      }));

      // Send image directly to Groq Vision – no OCR library needed!
      const { panels: panelsFound, rawText } = await extractLabDataFromImage(selectedFile, schema);      clearInterval(progressInterval);
      setExtractionProgress(100);

      // Build a clean, human-readable description from the extracted panel values
      const buildDescription = (panels: typeof panelsFound): string => {
        if (panels.length === 0) return '';
        const lines: string[] = [];
        for (const panel of panels) {
          const panelDef = TEST_PANELS.find(p => p.id === panel.panelId);
          if (!panelDef) continue;
          // Section heading
          lines.push(`━━━ ${panelDef.name.toUpperCase()} ━━━`);
          for (const field of panelDef.fields) {
            const val = panel.values[field.key];
            if (!val || val.value === '') continue;
            const label = field.label.padEnd(22, ' ');
            const value = val.value.padEnd(10, ' ');
            const unit = field.unit || '';
            lines.push(`  ${label}${value} ${unit}`);
          }
          lines.push(''); // blank line between panels
        }
        return lines.join('\n').trim();
      };

      const formattedDescription = buildDescription(panelsFound);
      if (formattedDescription.length > 0) {
        setDescription(formattedDescription);
      }
      // Store the raw Groq text for the "Extracted Raw Text" box (used for debugging)
      setRawOcrText(rawText);

      if (panelsFound.length > 0) {
        setTimeout(() => {
          setLabPanels(panelsFound);
          toast.success(`Extracted ${panelsFound.length} panel(s) — values & description filled!`);
          setExtracting(false);
          setLabEntryMode("manual"); // Auto-switch to manual mode to review accepted panels
        }, 400);
      } else {
        toast.info("Raw extracted text has been placed in the description field below.");
        setExtracting(false);
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Vision extraction error:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Extraction Failed: ${errorMsg}`);
      setExtracting(false);
    }
  };

  const updateExtractedResult = (index: number, field: keyof ExtractedTestResult, value: string) => {
    if (!extractedData) return;
    const newResults = [...extractedData.test_results];
    newResults[index] = { ...newResults[index], [field]: value };
    setExtractedData({ ...extractedData, test_results: newResults });
  };

  const formatFrequency = (freq: typeof newMed.frequency) => {
    const parts = [];
    if (freq.morning) parts.push("Morning");
    if (freq.afternoon) parts.push("Afternoon");
    if (freq.evening) parts.push("Evening");
    if (freq.night) parts.push("Night");
    return parts.join(", ");
  };

  const generateTitle = () => {
    const parts = [type];
    if (selectedIcd) parts.push(selectedIcd.label);
    if (fileName) parts.push("with Attachment");
    return parts.join(", ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    if (!user) {
      toast.error("User session not ready. Please refresh or sign in again.");
      return;
    }

    // Validation: Ensure medicines are added if type is Prescription
    if (type === "Prescription" && medicines.length === 0) {
      if (newMed.name) {
        toast.warning("You typed a medicine but didn't click 'Add Medicine'. Please add it first.");
      } else {
        toast.error("Please add at least one medicine to create a prescription.");
      }
      return;
    }

    // Validation for Lab Report
    if (type === "Lab Report" && labPanels.length === 0) {
      toast.error("Please add at least one test panel to create a lab report.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the Medical Record
      const record = await addRecord({
        patient_id: selectedPatient.id,
        record_type: type as 'Prescription' | 'Lab Report' | 'Clinical Note',
        title: generateTitle(),
        description: description || undefined,
        diagnosis: diagnosis || undefined,
        icd_code: selectedIcd?.code || undefined,
        icd_label: selectedIcd?.label || undefined,
        attachment_name: fileName || undefined,
        created_by: user.id,
        creator_name: user.full_name || 'Staff',
        organization_id: user.organization_id!,
      });

      // 2. If it's a prescription and has medicines, save them
      if (type === "Prescription" && medicines.length > 0) {
        if (!record.id) throw new Error("Record created but ID is missing");

        const prescriptionsToInsert = medicines.map(med => ({
          record_id: record.id,
          medicine_name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration
        }));

        const { error: medError } = await supabase.from('prescriptions').insert(prescriptionsToInsert).select();
        if (medError) {
          toast.error("Record saved, but failed to save medicines: " + medError.message);
        }
      }

      // 3. If it's a lab report, save test panels
      if (type === "Lab Report" && labPanels.length > 0) {
        if (!record.id) throw new Error("Record created but ID is missing");

        // Auto-fill from selected patient and logged-in user
        const patientGender = (selectedPatient as any)?.gender || 'Male';
        const patientDob = (selectedPatient as any)?.date_of_birth;
        const patientAge = patientDob ? Math.floor((Date.now() - new Date(patientDob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

        const labName = user?.organization_id
          ? organizations?.find(o => o.id === user.organization_id)?.name || null
          : null;

        const { error: labError } = await supabase.from('lab_reports').insert({
          record_id: record.id,
          lab_name: labName,
          doctor_name: user?.full_name || 'Staff',
          patient_age: patientAge,
          patient_gender: patientGender,
          notes: labNotes || null,
          test_panels: labPanels,
        });

        if (labError) {
          console.error("Lab Insert Error:", labError);
          toast.error("Record saved, but failed to save lab data: " + labError.message);
        }
      }

      toast.success("Medical record created successfully");
      navigate("/staff/records");
    } catch (err: any) {
      console.error("Failed to create record:", err);
      toast.error("Failed to create record: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="staff">
      <PageHeader title="Create Medical Record" description="Add a new record for a patient" />
      <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Patient Search */}
          <div className="relative">
            <Label>Patient</Label>
            {isPatientLocked && selectedPatient ? (
              /* Read-only chip shown when patient was pre-selected from a scan or detail page */
              <div className="mt-1.5 flex items-center gap-3 h-11 sm:h-10 px-3 border rounded-md bg-muted/40">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {selectedPatient.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{selectedPatient.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedPatient.patient_id}</p>
                </div>
                <span className="text-xs text-muted-foreground">Pre-selected</span>
              </div>
            ) : (
              <>
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
                          onClick={() => { setSelectedPatient(p); setPatientSearch(""); setPatientOpen(false); setAllergyAlerts([]); }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{p.full_name}</span>
                            <span className="text-sm text-muted-foreground">— {p.patient_id}</span>
                            {p.allergies && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded font-medium">⚠ Allergies</span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Allergy info badge for selected patient */}
          {selectedPatient?.allergies && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs text-amber-700 dark:text-amber-400">
                <span className="font-semibold">Known Allergies:</span> {selectedPatient.allergies}
              </span>
            </div>
          )}

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

          {/* PRESCRIPTION BUILDER (Only for Prescriptions) */}
          {type === "Prescription" && (
            <div className="border rounded-xl p-4 bg-muted/30 space-y-4">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Medications</h3>
              </div>

              {/* ── Allergy Alert Banner ── */}
              {allergyAlerts.length > 0 && (
                <div className="space-y-2">
                  {allergyAlerts.map((alert, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">⚠ Allergy Alert</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                          Patient allergic to <span className="font-bold capitalize">{alert.allergen}</span> — <span className="font-medium">{alert.medicineName}</span> may cause a reaction.
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                          Recommended alternative: <span className="font-semibold">{alert.alternative}</span>
                        </p>
                      </div>
                      <button type="button" onClick={() => setAllergyAlerts(prev => prev.filter((_, idx) => idx !== i))} className="text-amber-500 hover:text-amber-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* List of Added Medicines */}
              {medicines.length > 0 && (
                <div className="space-y-2">
                  {medicines.map((med) => (
                    <div key={med.id} className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between p-3 bg-card border rounded-lg shadow-sm">
                      <div>
                        <div className="font-medium text-foreground">{med.name} <span className="text-muted-foreground font-normal">({med.dosage})</span></div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formatFrequency(med.frequency)} • {med.duration}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeMedicine(med.id)} className="self-end sm:self-center text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Medicine Form */}
              <div className="grid gap-4 p-4 bg-card border rounded-lg border-dashed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Medicine Name</Label>
                    <Input
                      placeholder="e.g. Paracetamol"
                      value={newMed.name}
                      onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMedicine(); } }}
                      className="h-9 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Dosage</Label>
                    <Input
                      placeholder="e.g. 500mg"
                      value={newMed.dosage}
                      onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); } }}
                      className="h-9 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-1.5 block">Frequency & Duration</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.keys(newMed.frequency).map((key) => {
                      const k = key as keyof typeof newMed.frequency;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => toggleFrequency(k)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${newMed.frequency[k]
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                            }`}
                        >
                          {k.charAt(0).toUpperCase() + k.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">For:</span>
                    <Input
                      placeholder="e.g. 5 days"
                      value={newMed.duration}
                      onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })}
                      className="h-8 w-32"
                    />
                  </div>
                </div>

                <Button type="button" onClick={addMedicine} disabled={!newMed.name} variant="secondary" className="w-full sm:w-auto self-start mt-2">
                  <Plus className="w-4 h-4 mr-2" /> Add Medicine
                </Button>
              </div>
            </div>
          )}

          {/* LAB REPORT BUILDER & AI UPLOAD (Only for Lab Reports) */}
          {type === "Lab Report" && (
            <div className="space-y-6">
              
              {/* Lab Entry Mode Toggle */}
              <div>
                <Label>Entry Mode</Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-1.5 p-1 bg-muted/40 rounded-xl border">
                  <button
                    type="button"
                    onClick={() => setLabEntryMode("ai")}
                    className={`flex-1 py-2.5 sm:py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      labEntryMode === "ai" 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" /> AI Auto-Extraction
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabEntryMode("manual")}
                    className={`flex-1 py-2.5 sm:py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      labEntryMode === "manual" 
                        ? "bg-slate-700 text-white shadow-sm" 
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    <Edit3 className="w-4 h-4" /> Manual Entry
                  </button>
                </div>
              </div>

              {/* Genuine ML File Upload - Placed at Top */}
              {labEntryMode === "ai" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <Label>Upload Report for ML Auto-Extraction</Label>
                {fileName ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3 p-4 border-2 border-primary/20 rounded-xl bg-primary/5 shadow-sm">
                    <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="w-5 h-5 text-primary shrink-0" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{fileName}</p>
                        <p className="text-xs text-primary/70 font-medium">Ready for ML extraction</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                      <Button 
                        type="button" 
                        onClick={processLabExtraction} 
                        disabled={extracting}
                        className="flex-1 sm:flex-none"
                      >
                        {extracting ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Extracting...</>
                        ) : (
                          <><Sparkles className="w-4 h-4 mr-2" /> Extract Data</>
                        )}
                      </Button>
                      <button type="button" onClick={() => { setFileName(null); setSelectedFile(null); setLabPanels([]); }} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="block border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                    </div>
                    <p className="text-sm font-bold text-slate-600 group-hover:text-primary">Click to upload lab report</p>
                    <p className="text-xs text-slate-400 mt-1">Gemini ML will automatically extract test results</p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                      }}
                    />
                  </label>
                )}

                {extracting && (
                  <div className="flex flex-col items-center justify-center p-8 space-y-5 bg-primary/5 border-2 border-primary/20 rounded-xl mt-4">
                    <div className="relative">
                      {extractionProgress === 100 ? (
                        <Check className="w-10 h-10 text-green-500 animate-in zoom-in" />
                      ) : (
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      )}
                      
                      {extractionProgress < 100 && (
                        <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-400 animate-bounce" />
                      )}
                    </div>
                    <div className="text-center w-full max-w-sm">
                      <p className="text-sm font-bold text-foreground mb-3">
                        {extractionProgress === 100 
                          ? "Extraction Complete!" 
                          : "Extracting real values with ML..."}
                      </p>
                      
                      {/* Progress Bar Container */}
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out" 
                          style={{ width: `${Math.round(extractionProgress)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between mt-2">
                        <p className="text-xs text-muted-foreground font-medium">
                          {extractionProgress === 100 ? "Success" : "Analyzing document..."}
                        </p>
                        <p className="text-xs font-bold text-primary">
                          {Math.round(extractionProgress)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw OCR text fallback — always visible once extracted */}
                {rawOcrText && !extracting && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Extracted Raw Text (from your report)
                      </p>
                      <button
                        type="button"
                        onClick={() => setRawOcrText(null)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Dismiss
                      </button>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-56 overflow-y-auto">
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">{rawOcrText}</pre>
                    </div>
                    <p className="text-xs text-muted-foreground italic">This is the raw text our scanner read from your image. If values are missing, try uploading a higher-resolution version of the report.</p>
                  </div>
                )}
              </div>
              )}

              {/* Lab Builder */}
              {labEntryMode === "manual" && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <LabReportBuilder
                  patientName={selectedPatient?.full_name}
                  patientAge={(() => { const dob = (selectedPatient as any)?.date_of_birth; return dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null; })()}
                  patientId={selectedPatient?.patient_id}
                  patientGender={((selectedPatient as any)?.gender as 'Male' | 'Female' | 'Other') || 'Male'}
                  labName={user?.organization_id ? organizations.find(o => o.id === user.organization_id)?.name : undefined}
                  doctorName={user?.full_name || 'Staff'}
                  panels={labPanels} setPanels={setLabPanels}
                  notes={labNotes} setNotes={setLabNotes}
                />
              </div>
              )}
            </div>
          )}

          {/* Diagnosis Text + AI Assist (Hidden for Lab Reports) */}
          {showSecondaryFields && type !== "Lab Report" && (
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
          )}

          {/* AI Suggestion Panel */}
          {showSecondaryFields && type !== "Lab Report" && aiSuggestion && (
            <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5 space-y-4">
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
              <div className="text-sm space-y-3">
                <div className="grid grid-cols-1 gap-2 border-b border-primary/10 pb-3">
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

                {aiSuggestion.suggested_note && (
                  <div>
                    <span className="text-muted-foreground block mb-1 font-medium">Suggested Clinical Note:</span>
                    <span className="text-foreground text-xs italic bg-background/50 p-2 rounded block">{aiSuggestion.suggested_note}</span>
                  </div>
                )}

                {aiSuggestion.suggested_prescriptions && aiSuggestion.suggested_prescriptions.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-2 font-medium">Suggested Prescriptions:</span>
                    <div className="space-y-2">
                      {aiSuggestion.suggested_prescriptions.map((px, i) => (
                        <div key={i} className="bg-background/80 p-2 rounded border text-xs">
                          <span className="font-semibold">{px.name}</span> ({px.dosage}) — {px.duration}
                          <div className="text-muted-foreground mt-0.5">Reason: {px.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
              <div className="flex gap-2 pt-1 border-t border-primary/10 mt-3 pt-3">
                <Button type="button" size="sm" onClick={acceptSuggestion} className="h-8 text-xs gap-1">
                  <Check className="w-3 h-3" />Accept All Suggestions
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setAiSuggestion(null)} className="h-8 text-xs">
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* ICD Code Selector */}
          {showSecondaryFields && type !== "Lab Report" && (
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
          )}

          {/* Title & Description */}
          {showSecondaryFields && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Title</Label>
                <Input placeholder="Record title" className="mt-1.5 h-11 sm:h-10" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea placeholder="Enter details..." className="mt-1.5" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
          )}

          {/* Attachment */}
          {type === "Clinical Note" && (
            <div className="space-y-4">
              <Label>Attachment & AI Analysis</Label>
            {fileName ? (
              <div className="flex items-center gap-3 p-4 border-2 border-primary/20 rounded-xl bg-primary/5 shadow-sm">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{fileName}</p>
                  <p className="text-xs text-primary/70 font-medium">Document attached for AI analysis</p>
                </div>
                <button type="button" onClick={() => { setFileName(null); setExtractedData(null); setShowExtractionReview(false); }} className="p-1.5 hover:bg-destructive/10 rounded-full text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                </div>
                <p className="text-sm font-bold text-slate-600 group-hover:text-primary">Click to upload medical document</p>
                <p className="text-xs text-slate-400 mt-1">AI will automatically analyze your PDF or Image</p>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                />
              </label>
            )}

            {extracting && (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 bg-muted/20 border-2 border-dashed rounded-xl animate-pulse">
                <div className="relative">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 animate-bounce" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">AI is reading medical report...</p>
                  <p className="text-xs text-muted-foreground mt-1">Extracting test names, results, and diagnosis</p>
                </div>
              </div>
            )}

            {showExtractionReview && extractedData && (
              <div className="bg-white border shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-primary/90 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-white" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Data Fetching</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEditingExtracted(!editingExtracted)}
                      className="h-8 text-xs font-bold text-white hover:bg-white/20 border border-white/30"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                      {editingExtracted ? "Done Editing" : "Edit Values"}
                    </Button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Basic Info Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Patient Identity</Label>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <UserIcon className="w-3.5 h-3.5 text-primary" />
                        <span className="bg-blue-50 px-1.5 py-0.5 rounded text-primary">{extractedData.patient_name}</span>
                        <span className="text-xs text-slate-400">{extractedData.age_gender}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Test Context</Label>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <Beaker className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate">{extractedData.test_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Test Results Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Extracted Test Parameters</Label>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{extractedData.test_results.length} Tests Found</span>
                    </div>
                    
                    <div className="border rounded-xl overflow-hidden">
                      <div className="grid grid-cols-12 bg-slate-50 border-b px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        <div className="col-span-5">Test Name</div>
                        <div className="col-span-3">Result</div>
                        <div className="col-span-4">Normal Range</div>
                      </div>
                      <div className="divide-y">
                        {extractedData.test_results.map((res, i) => (
                          <div key={i} className="grid grid-cols-12 px-4 py-3 items-center group hover:bg-slate-50/50 transition-colors">
                            <div className="col-span-5 font-bold text-sm text-slate-700 pr-2">
                              {editingExtracted ? (
                                <Input 
                                  value={res.test} 
                                  onChange={(e) => updateExtractedResult(i, 'test', e.target.value)}
                                  className="h-8 text-xs font-bold"
                                />
                              ) : res.test}
                            </div>
                            <div className="col-span-3">
                              {editingExtracted ? (
                                <Input 
                                  value={res.result} 
                                  onChange={(e) => updateExtractedResult(i, 'result', e.target.value)}
                                  className="h-8 text-xs font-bold text-primary"
                                />
                              ) : (
                                <span className="text-sm font-black text-primary bg-blue-50 px-2 py-1 rounded-md">{res.result}</span>
                              )}
                            </div>
                            <div className="col-span-4">
                              {editingExtracted ? (
                                <Input 
                                  value={res.range} 
                                  onChange={(e) => updateExtractedResult(i, 'range', e.target.value)}
                                  className="h-8 text-xs"
                                />
                              ) : (
                                <span className="text-xs font-medium text-slate-500 italic">{res.range}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Insights Section */}
                  <div className="grid grid-cols-1 gap-5 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400">AI Suggested Diagnosis</Label>
                      <div className="relative">
                        <Textarea 
                          value={extractedData.diagnosis} 
                          onChange={(e) => setExtractedData({...extractedData, diagnosis: e.target.value})}
                          className={`min-h-[60px] text-sm font-medium leading-relaxed ${editingExtracted ? "bg-white" : "bg-slate-50/50 border-slate-100"}`}
                          readOnly={!editingExtracted}
                        />
                        <Sparkles className="absolute right-3 top-3 w-3.5 h-3.5 text-primary/30" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Lab & Date</Label>
                        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-[11px] font-bold text-slate-500 border border-slate-100">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          <span>{extractedData.test_date}</span>
                          <span className="text-slate-200">|</span>
                          <span className="truncate">{extractedData.lab_name}</span>
                        </div>
                      </div>
                      <div className="flex items-end justify-end">
                        <Button 
                          type="button" 
                          onClick={() => {
                            setDiagnosis(extractedData.diagnosis || "");
                            setDescription((prev) => prev ? `${prev}\n\nNotes: ${extractedData.doctor_notes}` : extractedData.doctor_notes || "");
                            toast.success("Values synced to main form!");
                          }}
                          className="h-9 px-4 text-xs font-bold bg-slate-800 hover:bg-slate-900 shadow-lg active:scale-95 transition-all text-white"
                        >
                          Sync to Form
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 px-6 py-4 border-t flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 max-w-[200px] leading-tight italic">
                    Note: Please verify all AI-extracted values against the original document before saving.
                  </p>
                  <Button 
                    type="submit" 
                    className="h-10 px-8 rounded-xl font-bold bg-primary shadow-xl shadow-primary/25 hover:shadow-primary/40 active:scale-95 transition-all"
                  >
                    Confirm & Save Record
                  </Button>
                </div>
              </div>
          </div>

          {showSecondaryFields && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button type="submit" className="h-11 sm:h-10" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : "Save Record"}
              </Button>
              <Button type="button" variant="outline" className="h-11 sm:h-10" onClick={() => navigate("/staff/records")}>Cancel</Button>
            </div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
};

export default StaffRecordCreate;

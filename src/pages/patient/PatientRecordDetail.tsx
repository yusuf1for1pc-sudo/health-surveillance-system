import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Download, FileText, Pill, Loader2, Calendar, Stethoscope, FileOutput, ArrowLeft } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabase";

interface Prescription {
    id: string;
    medicine_name: string;
    dosage: string;
    frequency: any;
    duration: string;
}

const PatientRecordDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getRecord } = useData();
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

    useEffect(() => {
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

        fetchPrescriptions();
    }, [id]);

    const record = getRecord(id || "");

    if (!record) {
        return (
            <DashboardLayout role="patient">
                <PageHeader title="Record Not Found" />
                <p className="text-muted-foreground">No record found with this ID.</p>
                <Button className="mt-4" onClick={() => navigate("/patient/history")}>Back only to History</Button>
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

    return (
        <DashboardLayout role="patient">
            <div className="max-w-4xl mx-auto pb-10">
                <div className="mb-6 flex items-start justify-between">
                    <Button variant="ghost" className="gap-2 pl-0" onClick={() => navigate("/patient/history")}>
                        <ArrowLeft className="w-4 h-4" /> Back to History
                    </Button>
                </div>

                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                    {/* Header / Banner */}
                    <div className="bg-primary/5 border-b px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">{record.title}</h1>
                            <p className="text-muted-foreground text-sm mt-1">{record.record_type}</p>
                        </div>
                        <div className="text-right sm:text-left">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>Date: {new Date(record.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Stethoscope className="w-4 h-4" />
                                <span>Doctor: {record.creator_name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Clinical Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                {record.icd_code && (
                                    <div>
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diagnosis (ICD-10)</span>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded border border-blue-200">{record.icd_code}</span>
                                            <span className="text-foreground">{record.icd_label}</span>
                                        </div>
                                    </div>
                                )}
                                {record.diagnosis && (
                                    <div>
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clinical Findings</span>
                                        <p className="text-foreground mt-1 whitespace-pre-wrap bg-muted/20 p-3 rounded-lg text-sm border">{record.diagnosis}</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                {record.description && (
                                    <div>
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Doctor's Notes</span>
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
                                        <div key={med.id} className="group relative border rounded-lg p-4 bg-muted/10">
                                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                                <div>
                                                    <div className="font-semibold text-base">{med.medicine_name} <span className="text-muted-foreground font-normal ml-1">({med.dosage})</span></div>
                                                    <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4">
                                                        <span><span className="font-medium text-foreground/80">Take:</span> {formatFrequency(med.frequency)}</span>
                                                        <span><span className="font-medium text-foreground/80">Duration:</span> {med.duration}</span>
                                                    </div>
                                                </div>
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
                        Generated by Health Surveillance System.
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PatientRecordDetail;

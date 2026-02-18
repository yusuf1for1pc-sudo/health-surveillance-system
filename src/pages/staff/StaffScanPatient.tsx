import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { Camera, Search, User, FileText, Plus, Loader2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const StaffScanPatient = () => {
  const navigate = useNavigate();
  const { patients, getPatientByPatientId, refresh: refreshData } = useData();
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState("");
  const [processing, setProcessing] = useState(false);

  const processPatientId = async (idToProcess: string) => {
    setProcessing(true);
    try {
      // 1. Try local lookup first (if patient is already in our list/org)
      const existingPatient = getPatientByPatientId(idToProcess);

      if (existingPatient) {
        navigate(`/staff/patients/${existingPatient.id}`);
        return;
      }

      // 2. If not found locally, try to claim access via RPC
      // This handles cases where patient exists but we don't have access yet (e.g. from another org)
      const { data, error } = await supabase.rpc('claim_patient_access', { p_id_str: idToProcess });

      if (error) throw error;

      if (data && data.success) {
        toast.success(`Access granted to ${data.full_name}`);
        // Refresh context to pull in the new patient data
        await refreshData();
        navigate(`/staff/patients/${data.id}`);
      } else {
        toast.error(data?.message || "Patient not found");
      }

    } catch (err: any) {
      console.error("Error accessing patient:", err);
      toast.error(err.message || "Failed to access patient record");
    } finally {
      setProcessing(false);
      setScanning(false);
    }
  };

  const simulateScan = () => {
    setScanning(true);
    // Simulate finding a patient ID after a delay
    setTimeout(() => {
      // In a real app, this would come from the QR code scanner library
      // For demo, we'll try to find a patient ID
      // If we have patients, pick the first one's ID
      // If not, pick a demo ID that likely exists in DB (or fail gracefully)
      const demoId = patients.length > 0 ? patients[0].patient_id : "TMP-2026-0001";
      processPatientId(demoId);
    }, 1500);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    processPatientId(manualId.trim());
  };

  return (
    <DashboardLayout role="staff">
      <PageHeader title="Scan Patient" description="Scan a patient QR code or search by ID involved to view history" />
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex gap-2">
          <Button variant={mode === "scan" ? "default" : "outline"} className="flex-1 gap-2" onClick={() => setMode("scan")}>
            <Camera className="w-4 h-4" />Scan QR
          </Button>
          <Button variant={mode === "manual" ? "default" : "outline"} className="flex-1 gap-2" onClick={() => setMode("manual")}>
            <Search className="w-4 h-4" />Manual Search
          </Button>
        </div>

        {mode === "scan" ? (
          <div className="bg-card rounded-xl p-6 card-shadow text-center">
            <div className="w-full aspect-square bg-muted rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
              {scanning || processing ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary animate-pulse" />
                  <Camera className="w-12 h-12 text-muted-foreground animate-pulse" />
                </>
              ) : (
                <Camera className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <Button onClick={simulateScan} disabled={scanning || processing} className="w-full">
              {scanning || processing ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
              ) : "Start Camera Scan"}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Position the patient's QR code within the frame</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl p-6 card-shadow">
            <form onSubmit={handleManualSearch} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Patient ID</label>
                <Input
                  placeholder="e.g. TMP-2026-XXXX"
                  className="mt-1.5 h-11"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={processing}>
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search & Access"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffScanPatient;

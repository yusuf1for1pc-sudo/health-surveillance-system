import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Search, Loader2, XCircle } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

const QR_READER_ID = "qr-reader-viewport";

const StaffScanPatient = () => {
  const navigate = useNavigate();
  const { getPatientByPatientId, refresh: refreshData } = useData();
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState("");
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Clean up the scanner on unmount or mode change
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Stop scanner when switching to manual mode
  useEffect(() => {
    if (mode === "manual") {
      stopScanner();
    }
  }, [mode]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // State 2 = SCANNING
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        // Ignore errors during cleanup
      }
      scannerRef.current = null;
      setScanning(false);
    }
  };

  const processPatientId = async (idToProcess: string) => {
    // Stop the camera before processing to avoid double-scanning
    await stopScanner();
    setProcessing(true);
    try {
      // 1. Try local lookup first
      const existingPatient = getPatientByPatientId(idToProcess);

      if (existingPatient) {
        toast.success(`Patient found: ${existingPatient.full_name}`);
        navigate(`/staff/patients/${existingPatient.id}`);
        return;
      }

      // 2. Query Supabase directly for the patient (in case it exists but isn't in local context yet)
      const { data: dbPatient, error: dbError } = await supabase
        .from('patients')
        .select('*')
        .eq('patient_id', idToProcess)
        .maybeSingle();

      if (dbPatient && !dbError) {
        toast.success(`Patient found in database: ${dbPatient.full_name}`);
        // If we found them, refresh the context so we have their records locally, then navigate
        await refreshData();
        navigate(`/staff/patients/${dbPatient.id}`);
        return;
      }

      // 3. If not found locally or in direct DB query, try to claim access via RPC
      const { data, error } = await supabase.rpc("claim_patient_access", {
        p_id_str: idToProcess,
      });

      if (error) throw error;

      if (data && data.success) {
        toast.success(`Access granted to ${data.full_name}`);
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
    }
  };

  const startCameraScan = async () => {
    setScanning(true);
    try {
      // Ensure the div exists before initialising
      const el = document.getElementById(QR_READER_ID);
      if (!el) {
        toast.error("Camera viewport not ready. Please try again.");
        setScanning(false);
        return;
      }

      // Query available cameras to avoid OverconstrainedError on devices lacking a rear camera
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        toast.error("No cameras found on your device.");
        setScanning(false);
        return;
      }

      // Prefer back/environment camera, fallback to the first available camera
      const backCamera = cameras.find(c => 
        c.label.toLowerCase().includes('back') || 
        c.label.toLowerCase().includes('environment') ||
        c.label.toLowerCase().includes('rear')
      );
      const cameraId = backCamera ? backCamera.id : cameras[0].id;

      const scanner = new Html5Qrcode(QR_READER_ID);
      scannerRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Called on every successful QR decode
          processPatientId(decodedText.trim());
        },
        () => {
          // Called on each frame when no QR found — ignore
        }
      );
    } catch (err: any) {
      console.error("Failed to start camera:", err);
      toast.error(
        "Could not access camera. Please allow camera permission and try again."
      );
      scannerRef.current = null;
      setScanning(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    processPatientId(manualId.trim());
  };

  return (
    <DashboardLayout role="staff">
      <PageHeader
        title="Scan Patient"
        description="Scan a patient QR code or search by ID to view their record"
      />
      <div className="max-w-md mx-auto space-y-4">
        {/* Mode Tabs */}
        <div className="flex gap-2">
          <Button
            variant={mode === "scan" ? "default" : "outline"}
            className="flex-1 gap-2"
            onClick={() => setMode("scan")}
          >
            <Camera className="w-4 h-4" />
            Scan QR
          </Button>
          <Button
            variant={mode === "manual" ? "default" : "outline"}
            className="flex-1 gap-2"
            onClick={() => setMode("manual")}
          >
            <Search className="w-4 h-4" />
            Manual Search
          </Button>
        </div>

        {mode === "scan" ? (
          <div className="bg-card rounded-xl p-6 card-shadow text-center space-y-4">
            {/* Camera viewport — html5-qrcode renders the video feed here */}
            <div
              id={QR_READER_ID}
              className="w-full rounded-xl overflow-hidden bg-muted"
              style={{ minHeight: scanning ? 280 : 0 }}
            />

            {/* Placeholder shown before scanning starts */}
            {!scanning && !processing && (
              <div className="w-full aspect-square bg-muted rounded-xl flex flex-col items-center justify-center gap-3">
                <Camera className="w-14 h-14 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Camera will appear here
                </p>
              </div>
            )}

            {processing && (
              <div className="w-full aspect-square bg-muted rounded-xl flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Looking up patient…
                  </p>
                </div>
              </div>
            )}

            {scanning ? (
              <Button
                variant="destructive"
                onClick={stopScanner}
                className="w-full gap-2"
              >
                <XCircle className="w-4 h-4" />
                Stop Scanning
              </Button>
            ) : (
              <Button
                onClick={startCameraScan}
                disabled={processing}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing…
                  </>
                ) : (
                  "Start Camera Scan"
                )}
              </Button>
            )}

            <p className="text-xs text-muted-foreground">
              Position the patient's QR code within the frame
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-xl p-6 card-shadow">
            <form onSubmit={handleManualSearch} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Patient ID
                </label>
                <Input
                  placeholder="e.g. TMP-2026-XXXX"
                  className="mt-1.5 h-11"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11"
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Search & Access"
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffScanPatient;

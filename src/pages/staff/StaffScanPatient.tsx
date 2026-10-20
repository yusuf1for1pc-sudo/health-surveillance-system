import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Panel, PanelGrid } from "@/components/layout/Modular";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Search, Loader2, XCircle, ScanLine, QrCode, KeyRound } from "lucide-react";
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
          // Landscape camera frame; the scan box scales with the viewfinder
          qrbox: (w: number, h: number) => {
            const side = Math.floor(Math.min(w, h) * 0.7);
            return { width: side, height: side };
          },
          aspectRatio: 1.777,
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

  const Corner = ({ className }: { className: string }) => (
    <span className={`pointer-events-none absolute h-8 w-8 border-foreground ${className}`} aria-hidden />
  );

  return (
    <DashboardLayout role="staff" fit>
      <PageHeader compact title="Scan Patient" description="Scan a patient's QR code or enter their ID to open their record" />

      <PanelGrid className="lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[minmax(0,1fr)]">
        {/* Scanner module */}
        <Panel
          className="flex min-h-0 flex-col"
          bodyClassName="flex min-h-0 flex-1 flex-col gap-4"
          title={mode === "scan" ? "Scan QR code" : "Enter patient ID"}
          action={
            <div className="flex rounded-sm border p-0.5" role="tablist" aria-label="Lookup method">
              {([
                { key: "scan", label: "Scan", icon: <Camera className="h-3.5 w-3.5" /> },
                { key: "manual", label: "Enter ID", icon: <Search className="h-3.5 w-3.5" /> },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={mode === t.key}
                  onClick={() => setMode(t.key)}
                  className={`inline-flex items-center gap-1.5 rounded-[2px] px-3 py-1.5 text-xs font-medium transition-colors ${mode === t.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          }
        >
          {mode === "scan" ? (
            <>
              {/* Viewfinder: fills the space left on the screen instead of forcing a tall square */}
              <div className="relative min-h-[220px] flex-1 overflow-hidden rounded-sm border bg-muted">
                {/* html5-qrcode renders the live camera feed into this element */}
                <div id={QR_READER_ID} className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover [&>div]:h-full" />

                {!scanning && !processing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Camera className="h-10 w-10" />
                    <p className="text-sm">Camera preview appears here</p>
                  </div>
                )}
                {processing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/90">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm text-muted-foreground">Looking up patient…</p>
                  </div>
                )}

                <Corner className="left-3 top-3 border-l-2 border-t-2" />
                <Corner className="right-3 top-3 border-r-2 border-t-2" />
                <Corner className="bottom-3 left-3 border-b-2 border-l-2" />
                <Corner className="bottom-3 right-3 border-b-2 border-r-2" />
              </div>

              <div className="flex shrink-0 flex-col items-center gap-2">
                {scanning ? (
                  <Button variant="destructive" onClick={stopScanner} className="w-full gap-2 sm:w-auto sm:min-w-[220px]">
                    <XCircle className="h-4 w-4" /> Stop scanning
                  </Button>
                ) : (
                  <Button onClick={startCameraScan} disabled={processing} className="w-full gap-2 sm:w-auto sm:min-w-[220px]">
                    {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : <><ScanLine className="h-4 w-4" /> Start camera</>}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">Hold the patient's QR code inside the frame</p>
              </div>
            </>
          ) : (
            <form onSubmit={handleManualSearch} className="m-auto w-full max-w-md space-y-4 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm border text-muted-foreground"><KeyRound className="h-5 w-5" /></div>
              <div>
                <label className="text-sm font-medium" htmlFor="patient-id">Patient ID</label>
                <Input
                  id="patient-id"
                  placeholder="e.g. TMP-2026-XXXX"
                  className="mt-1.5 h-12 font-mono"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  required
                  autoFocus
                />
                <p className="mt-1.5 text-xs text-muted-foreground">The ID is printed on the patient's Health Card, under their name.</p>
              </div>
              <Button type="submit" className="h-11 w-full" disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search & open record"}
              </Button>
            </form>
          )}
        </Panel>

        {/* Guidance module */}
        <aside className="space-y-4 lg:min-h-0 lg:overflow-y-auto">
          <Panel title="How it works" icon={<QrCode className="h-5 w-5" />} bodyClassName="space-y-3 text-sm text-muted-foreground">
            {["Ask the patient to open their Health Card.", "Scan the QR code, or type the ID shown under their name.", "Their record opens once access is verified."].map((step, i) => (
              <p key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs text-foreground">{i + 1}</span>
                {step}
              </p>
            ))}
          </Panel>
          <Panel title="Camera not working?" bodyClassName="text-sm text-muted-foreground">
            Allow camera access in your browser, or switch to <button className="underline underline-offset-4 hover:text-foreground" onClick={() => setMode("manual")}>Enter ID</button> to look the patient up by their ID.
          </Panel>
        </aside>
      </PanelGrid>
    </DashboardLayout>
  );
};

export default StaffScanPatient;

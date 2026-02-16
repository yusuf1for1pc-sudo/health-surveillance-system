import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { Camera, Search, User, FileText, Plus } from "lucide-react";
import { useData } from "@/contexts/DataContext";

const StaffScanPatient = () => {
  const navigate = useNavigate();
  const { patients, getPatientByPatientId } = useData();
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState("");
  const [foundPatient, setFoundPatient] = useState<typeof patients[0] | null>(null);
  const [notFound, setNotFound] = useState(false);

  const simulateScan = () => {
    setScanning(true);
    setNotFound(false);
    setTimeout(() => {
      setScanning(false);
      // Simulate scanning the first real patient in the system
      if (patients.length > 0) {
        setFoundPatient(patients[0]);
      } else {
        setNotFound(true);
      }
    }, 2000);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setNotFound(false);
    const patient = getPatientByPatientId(manualId.trim());
    if (patient) {
      setFoundPatient(patient);
    } else {
      setNotFound(true);
    }
  };

  if (foundPatient) {
    return (
      <DashboardLayout role="staff">
        <PageHeader title="Patient Found" />
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-xl p-6 card-shadow text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <User className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{foundPatient.full_name}</h2>
            <p className="text-sm text-muted-foreground mt-1">ID: {foundPatient.patient_id}</p>

            <div className="mt-4 w-32 h-32 mx-auto bg-background rounded-xl p-2 border flex items-center justify-center">
              <QRCodeSVG value={foundPatient.patient_id} size={110} level="H" bgColor="transparent" fgColor="currentColor" className="text-foreground w-full h-full" />
            </div>

            <div className="mt-4 text-sm text-left space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span className="text-foreground">{foundPatient.gender}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">DOB</span><span className="text-foreground">{foundPatient.date_of_birth}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="text-foreground">{foundPatient.phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Blood Type</span><span className="text-foreground">{foundPatient.blood_type || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Allergies</span><span className="text-foreground">{foundPatient.allergies || "None"}</span></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button className="flex-1 gap-1" onClick={() => navigate(`/staff/patients/${foundPatient.id}`)}>
                <FileText className="w-4 h-4" />View Profile
              </Button>
              <Button variant="outline" className="flex-1 gap-1" onClick={() => navigate("/staff/records/create")}>
                <Plus className="w-4 h-4" />New Record
              </Button>
            </div>
            <Button variant="ghost" className="mt-3 w-full text-sm" onClick={() => { setFoundPatient(null); setManualId(""); }}>
              Scan Another
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="staff">
      <PageHeader title="Scan Patient" description="Scan a patient QR code or search by ID" />
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
              {scanning ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary animate-pulse" />
                  <Camera className="w-12 h-12 text-muted-foreground animate-pulse" />
                </>
              ) : (
                <Camera className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <Button onClick={simulateScan} disabled={scanning} className="w-full">
              {scanning ? "Scanning..." : "Start Camera Scan"}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Position the patient's QR code within the frame</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl p-6 card-shadow">
            <form onSubmit={handleManualSearch} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Patient ID</label>
                <Input
                  placeholder={patients.length > 0 ? patients[0].patient_id : "TMP-2026-0001"}
                  className="mt-1.5 h-11"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11">Search</Button>
            </form>
          </div>
        )}

        {notFound && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
            <p className="text-sm text-destructive font-medium">Patient not found</p>
            <p className="text-xs text-muted-foreground mt-1">Check the ID and try again, or create a new patient record.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate("/staff/patients/create")}>
              Create Patient
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffScanPatient;

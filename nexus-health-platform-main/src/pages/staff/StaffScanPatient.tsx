import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, Search, User } from "lucide-react";

const mockPatients: Record<string, any> = {
  "TMP-2026-0001": { id: "1", name: "Alice Johnson", phone: "+1 555-0101", gender: "Female", dob: "1985-03-12" },
  "TMP-2026-0002": { id: "2", name: "Bob Williams", phone: "+1 555-0102", gender: "Male", dob: "1990-07-24" },
  "TMP-2026-0003": { id: "3", name: "Carol Davis", phone: "+1 555-0103", gender: "Female", dob: "1978-11-05" },
  "TMP-2026-0042": { id: "4", name: "John Doe", phone: "+1 555-0142", gender: "Male", dob: "1988-06-15" },
};

const StaffScanPatient = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState("");
  const [foundPatient, setFoundPatient] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setNotFound(false);
    setFoundPatient(null);
    // Simulate scanning — in real app this would use camera API
    setTimeout(() => {
      setScanning(false);
      const patient = mockPatients["TMP-2026-0042"];
      setFoundPatient(patient);
    }, 2000);
  };

  const handleManualSearch = () => {
    setNotFound(false);
    const patient = mockPatients[manualId.trim().toUpperCase()];
    if (patient) {
      setFoundPatient(patient);
    } else {
      setFoundPatient(null);
      setNotFound(true);
    }
  };

  return (
    <DashboardLayout role="staff">
      <PageHeader title="Scan Patient" description="Scan a patient's QR code or search by ID" />

      <div className="max-w-md mx-auto space-y-6">
        {/* QR Scanner Area */}
        <div className="bg-card rounded-xl p-6 card-shadow text-center">
          <div
            className={`w-full aspect-square max-w-xs mx-auto rounded-xl border-2 border-dashed flex items-center justify-center mb-4 transition-colors ${
              scanning ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            {scanning ? (
              <div className="text-center">
                <ScanLine className="w-16 h-16 text-primary mx-auto mb-3 animate-pulse" />
                <p className="text-sm text-primary font-medium">Scanning...</p>
                <p className="text-xs text-muted-foreground mt-1">Point camera at patient QR code</p>
              </div>
            ) : (
              <div className="text-center">
                <ScanLine className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">Camera preview</p>
                <p className="text-xs text-muted-foreground mt-1">Tap scan to activate</p>
              </div>
            )}
          </div>
          <Button onClick={handleScan} disabled={scanning} className="w-full">
            <ScanLine className="w-4 h-4 mr-2" />
            {scanning ? "Scanning..." : "Scan QR Code"}
          </Button>
        </div>

        {/* Manual Search */}
        <div className="bg-card rounded-xl p-6 card-shadow">
          <h3 className="font-medium text-foreground mb-3">Or search by Patient ID</h3>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. TMP-2026-0042"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
            />
            <Button variant="outline" onClick={handleManualSearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Result */}
        {foundPatient && (
          <div className="bg-card rounded-xl p-6 card-shadow border-2 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <User className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{foundPatient.name}</h3>
                <p className="text-sm text-muted-foreground">{foundPatient.phone}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span className="text-foreground">{foundPatient.gender}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date of Birth</span><span className="text-foreground">{foundPatient.dob}</span></div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => navigate(`/staff/patients/${foundPatient.id}`)}>View Patient</Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate("/staff/records/create")}>New Record</Button>
            </div>
          </div>
        )}

        {notFound && (
          <div className="bg-card rounded-xl p-6 card-shadow text-center">
            <p className="text-sm text-destructive font-medium">Patient not found</p>
            <p className="text-xs text-muted-foreground mt-1">Check the ID and try again</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffScanPatient;

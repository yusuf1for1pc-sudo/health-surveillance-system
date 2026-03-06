import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { SmartphoneNfc } from "lucide-react";
import { toast } from "sonner";

const PatientHealthCard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <DashboardLayout role="patient">
        <PageHeader title="Health Card" description="Your digital patient identification" />
        <p className="text-sm text-muted-foreground text-center mt-8">Please sign in to view your health card.</p>
      </DashboardLayout>
    );
  }

  // Generate a deterministic patient ID from the user's id
  const patientId = user.id.startsWith("demo-")
    ? `TMP-2026-${user.id.slice(-4).replace(/\D/g, "0").padStart(4, "0")}`
    : `TMP-${user.id.slice(0, 8).toUpperCase()}`;

  return (
    <DashboardLayout role="patient">
      <PageHeader title="Health Card" description="Your digital patient identification" />

      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <div className="bg-card rounded-2xl p-6 sm:p-8 card-shadow border relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            {/* Logo & Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">T</span>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-foreground tracking-tight">HealthCard</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Universal ID</p>
              </div>
            </div>

            {/* Patient info from logged-in user */}
            <div className="text-left relative z-10 mb-8">
              <p className="text-sm text-muted-foreground mb-1">Patient Name</p>
              <h2 className="font-semibold text-foreground text-2xl">{user.full_name}</h2>
              <p className="text-sm text-muted-foreground mt-2 font-mono bg-muted/50 inline-block px-2 py-0.5 rounded">ID: {patientId}</p>
            </div>

            {/* Real QR Code */}
            <div className="mx-auto w-48 h-48 bg-white rounded-xl p-3 border flex items-center justify-center relative z-10 card-shadow-sm">
              <QRCodeSVG
                value={patientId}
                size={160}
                level="H"
                includeMargin={false}
                bgColor="transparent"
                fgColor="#000000"
                className="w-full h-full"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center mb-6">Scan QR to verify identity</p>

            {/* NFC Simulation */}
            <div className="relative z-10 border-t pt-6 text-center">
              <Button
                variant="outline"
                className="w-full gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                onClick={() => toast.success("NFC tapped! Patient record transmitted securely.")}
              >
                <SmartphoneNfc className="w-4 h-4" />
                Tap to Transmit via NFC
              </Button>
            </div>
            {/* Info from auth context */}
            <div className="mt-6 pt-4 border-t space-y-2 text-sm text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="text-foreground font-medium">{user.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="text-foreground font-medium capitalize">{user.role.replace("_", " ")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientHealthCard;

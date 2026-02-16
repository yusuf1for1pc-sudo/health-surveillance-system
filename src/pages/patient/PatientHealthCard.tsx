import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/contexts/AuthContext";

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
          <div className="bg-card rounded-2xl p-6 sm:p-8 card-shadow border text-center">
            {/* Logo */}
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-bold">T</span>
            </div>

            {/* Patient info from logged-in user */}
            <h2 className="font-semibold text-foreground text-xl">{user.full_name}</h2>
            <p className="text-sm text-muted-foreground mt-1">Patient ID: {patientId}</p>
            <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>{user.email}</span>
            </div>

            {/* Real QR Code */}
            <div className="mt-6 mx-auto w-52 h-52 sm:w-56 sm:h-56 bg-background rounded-xl p-3 border flex items-center justify-center">
              <QRCodeSVG
                value={patientId}
                size={180}
                level="H"
                includeMargin={false}
                bgColor="transparent"
                fgColor="currentColor"
                className="text-foreground w-full h-full"
              />
            </div>

            <p className="text-xs text-muted-foreground mt-4">Scan to verify patient identity</p>

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

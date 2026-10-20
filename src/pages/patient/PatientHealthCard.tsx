import { ReactNode } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { SmartphoneNfc, Droplets, ShieldAlert, Cake, PhoneCall, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

const ageFrom = (dob?: string) => {
  if (!dob) return null;
  const t = new Date(dob).getTime();
  return Number.isNaN(t) ? null : Math.floor((Date.now() - t) / (365.25 * 24 * 60 * 60 * 1000));
};

const Tile = ({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone?: "alert" }) => (
  <div className="relative rounded-sm border bg-card p-4 transition-colors hover:border-foreground/40">
    <span className={`absolute left-0 top-0 h-full w-0.5 ${tone === "alert" ? "bg-danger" : "bg-role-accent"}`} />
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="eyebrow">{label}</span>
    </div>
    <p className={`mt-2 font-serif text-2xl leading-tight ${tone === "alert" ? "text-danger" : "text-foreground"}`}>{value}</p>
  </div>
);

const PatientHealthCard = () => {
  const { user } = useAuth();
  const { patients } = useData();

  if (!user) {
    return (
      <DashboardLayout role="patient">
        <PageHeader title="Health Card" description="Your digital patient identification" />
        <p className="text-sm text-muted-foreground text-center mt-8">Please sign in to view your health card.</p>
      </DashboardLayout>
    );
  }

  // For the patient role, DataContext loads their own record into `patients`
  const record = patients.length > 0 ? patients[0] : null;

  // Prefer the real database patient_id, otherwise a deterministic fallback
  const patientId = record?.patient_id || (user.id.startsWith("demo-")
    ? `TMP-2026-${user.id.slice(-4).replace(/\D/g, "0").padStart(4, "0")}`
    : `TMP-${user.id.slice(0, 8).toUpperCase()}`);

  const age = ageFrom(record?.date_of_birth);
  const allergies = record?.allergies?.trim();

  return (
    <DashboardLayout role="patient" fit>
      <PageHeader compact title="Health Card" description="Your digital patient identification" />

      <div className="grid items-start lg:min-h-0 lg:overflow-y-auto gap-5 lg:grid-cols-[minmax(0,540px)_minmax(0,1fr)]">
        {/* ID card */}
        <div className="relative overflow-hidden rounded-sm border bg-card p-6 card-shadow">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-foreground/5 blur-3xl" />

          <div className="relative mb-5 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary">
              <span className="font-serif text-xl font-semibold text-primary-foreground">T</span>
            </div>
            <div className="text-right">
              <h3 className="font-serif text-lg font-semibold leading-none tracking-tight">HealthCard</h3>
              <p className="eyebrow mt-1">Universal ID</p>
            </div>
          </div>

          <div className="relative grid grid-cols-[1fr_auto] items-center gap-5">
            <div className="min-w-0">
              <p className="eyebrow">Patient</p>
              <h2 className="mt-1 break-words font-serif text-3xl font-medium leading-tight">{user.full_name}</h2>
              <p className="mt-3 inline-block rounded-sm bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">ID: {patientId}</p>
              <p className="mt-3 truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="text-center">
              <div className="rounded-sm border bg-background/60 p-2.5">
                <QRCodeSVG value={patientId} size={132} level="H" includeMargin={false} bgColor="transparent" fgColor="currentColor" className="block text-foreground" />
              </div>
              <p className="eyebrow mt-2">Scan to verify</p>
            </div>
          </div>

          <Button
            variant="outline"
            className="relative mt-6 w-full gap-2"
            onClick={() => toast.success("NFC tapped! Patient record transmitted securely.")}
          >
            <SmartphoneNfc className="h-4 w-4" />
            Tap to Transmit via NFC
          </Button>
        </div>

        {/* Health summary fills the rest of the screen */}
        <div>
          <p className="eyebrow mb-3">Health summary</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Tile icon={<Droplets className="h-4 w-4" />} label="Blood group" value={record?.blood_type || "—"} />
            <Tile icon={<Cake className="h-4 w-4" />} label="Age · Gender" value={age !== null ? `${age} · ${record?.gender ?? "—"}` : (record?.gender ?? "—")} />
            <Tile icon={<MapPin className="h-4 w-4" />} label="City" value={record?.city || "—"} />
            <div className="sm:col-span-2 xl:col-span-3">
              <Tile
                icon={<ShieldAlert className="h-4 w-4" />}
                label="Allergies"
                value={allergies || "None recorded"}
                tone={allergies ? "alert" : undefined}
              />
            </div>
            <Tile icon={<PhoneCall className="h-4 w-4" />} label="Emergency contact" value={record?.emergency_contact || "—"} />
            <Tile icon={<Phone className="h-4 w-4" />} label="Phone" value={record?.phone || user.phone || "—"} />
            <Tile icon={<MapPin className="h-4 w-4" />} label="Role" value={user.role.replace("_", " ")} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientHealthCard;

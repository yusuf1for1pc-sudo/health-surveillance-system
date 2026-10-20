import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Panel, PanelGrid, Field } from "@/components/layout/Modular";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabase";
import { Mail, Building2, Check, Phone, Droplet, HeartPulse, UserPlus, AlertCircle, MapPin, Cake, User } from "lucide-react";
import { format } from "date-fns";

const roleFromPath = (path: string): string => {
  const segment = path.split("/")[1];
  return segment || "patient";
};

const roleDisplayNames: Record<string, string> = {
  platform_admin: "Platform Admin",
  org_admin: "Organization Admin",
  doctor: "Doctor",
  lab_staff: "Lab Staff",
  patient: "Patient",
  government: "Government Officer",
};

const initials = (name?: string) =>
  (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

const Profile = () => {
  const location = useLocation();
  const role = roleFromPath(location.pathname);
  const { user } = useAuth();
  const { patients } = useData();
  const [saved, setSaved] = useState(false);
  const [fetchedPatient, setFetchedPatient] = useState<any>(null);
  const [orgName, setOrgName] = useState<string>("");

  // The patient's own record: fetched directly, or taken from the data context (covers the offline demo)
  const patientData = fetchedPatient ?? (user?.role === "patient" ? patients[0] : null);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (user?.role === "patient" && user.id) {
        const { data } = await supabase.from("patients").select("*").eq("id", user.id).maybeSingle();
        if (data) setFetchedPatient(data);
      }
    };
    fetchPatientData();

    if (user?.organization_id) {
      supabase
        .from("organizations")
        .select("name")
        .eq("id", user.organization_id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.name) setOrgName(data.name);
        });
    }
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const address = [patientData?.address, patientData?.city, patientData?.state, patientData?.pincode].filter(Boolean).join(", ");

  return (
    <DashboardLayout role={role} fit>
      <PageHeader compact title="Profile" description="Your account information" />

      <PanelGrid className="lg:min-h-0 lg:flex-1 lg:grid-cols-[340px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
        {/* Identity module */}
        <Panel className="lg:self-start" bodyClassName="space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm bg-primary font-serif text-2xl font-semibold text-primary-foreground">
              {initials(user?.full_name)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-serif text-2xl font-medium leading-tight">{user?.full_name || "Unknown User"}</h2>
              <span className="mt-1 inline-block rounded-sm border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {roleDisplayNames[user?.role || ""] || user?.role || "Unknown"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Field icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={user?.email || "—"} />
            {user?.role !== "platform_admin" && (
              <Field
                icon={<Phone className="h-3.5 w-3.5" />}
                label="Phone"
                value={patientData?.phone || user?.phone || <span className="font-normal italic text-muted-foreground">Not set</span>}
              />
            )}
            {user?.organization_id && (
              <Field icon={<Building2 className="h-3.5 w-3.5" />} label="Organization" value={orgName || user.organization_id} />
            )}
          </div>
        </Panel>

        <div className="space-y-5 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          {/* Health details module (patients only) */}
          {user?.role === "patient" && (
            <Panel title="Health details" icon={<HeartPulse className="h-5 w-5" />} description="From your medical record">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Field icon={<Droplet className="h-3.5 w-3.5" />} label="Blood type" value={patientData?.blood_type || "—"} />
                <Field icon={<User className="h-3.5 w-3.5" />} label="Gender" value={<span className="capitalize">{patientData?.gender || "—"}</span>} />
                <Field
                  icon={<Cake className="h-3.5 w-3.5" />}
                  label="Date of birth"
                  value={patientData?.date_of_birth ? format(new Date(patientData.date_of_birth), "PPP") : "—"}
                />
                <Field
                  className="sm:col-span-2 xl:col-span-3"
                  icon={<AlertCircle className="h-3.5 w-3.5" />}
                  label="Allergies"
                  value={patientData?.allergies || "None recorded"}
                  tone={patientData?.allergies ? "alert" : "default"}
                />
                <Field icon={<UserPlus className="h-3.5 w-3.5" />} label="Emergency contact" value={patientData?.emergency_contact || "—"} />
                <Field
                  className="sm:col-span-2"
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="Address"
                  value={address || "No address set"}
                />
              </div>
            </Panel>
          )}

          {/* Settings module */}
          <Panel title="Update settings" description="Change your name or password">
            <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Full Name</Label>
                <Input defaultValue={user?.full_name || ""} className="mt-1.5" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" defaultValue={user?.email || ""} className="mt-1.5" disabled />
                <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div>
                <Label>New Password</Label>
                <Input type="password" placeholder="Leave blank to keep current" className="mt-1.5" />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input type="password" placeholder="Confirm new password" className="mt-1.5" />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="gap-2">
                  {saved ? <><Check className="h-4 w-4" />Saved!</> : "Update Profile"}
                </Button>
              </div>
            </form>
          </Panel>
        </div>
      </PanelGrid>
    </DashboardLayout>
  );
};

export default Profile;

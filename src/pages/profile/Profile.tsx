import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { User, Mail, Shield, Building2, Check, Phone, Droplet, HeartPulse, UserPlus, AlertCircle, MapPin } from "lucide-react";
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

const Profile = () => {
  const location = useLocation();
  const role = roleFromPath(location.pathname);
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (user?.role === 'patient' && user.id) {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          console.log("Fetched Patient Data:", data);
          setPatientData(data);
        }
      }
    };
    fetchPatientData();
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardLayout role={role}>
      <PageHeader title="Profile" description="Your account information" />

      <div className="max-w-lg space-y-6">
        {/* User Info Card */}
        <div className="bg-card rounded-xl p-6 card-shadow">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{user?.full_name || "Unknown User"}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{roleDisplayNames[user?.role || ""] || user?.role || "Unknown"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Email</span>
                <p className="text-foreground font-medium">{user?.email || "—"}</p>
              </div>
            </div>
            {user?.role !== 'platform_admin' && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Phone</span>
                  <p className="text-foreground font-medium">{user?.phone || <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
                </div>
              </div>
            )}
            {user?.organization_id && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Organization</span>
                  <p className="text-foreground font-medium">{user.organization_id}</p>
                </div>
              </div>
            )}

            {/* Patient Specific Details */}
            {user?.role === 'patient' && (
              <>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Droplet className="w-4 h-4 text-red-500" />
                    <div>
                      <span className="text-muted-foreground text-xs block">Blood Type</span>
                      <p className="text-foreground font-medium">{patientData?.blood_type || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="w-4 h-4 text-blue-500" />
                    <div>
                      <span className="text-muted-foreground text-xs block">Gender</span>
                      <p className="text-foreground font-medium capitalize">{patientData?.gender || "—"}</p>
                    </div>
                  </div>
                </div>
                {patientData?.date_of_birth && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Check className="w-4 h-4 text-green-500" />
                    <div>
                      <span className="text-muted-foreground text-xs block">Date of Birth</span>
                      <p className="text-foreground font-medium">{format(new Date(patientData.date_of_birth), 'PPP')}</p>
                    </div>
                  </div>
                )}
                {patientData?.allergies && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <div>
                      <span className="text-red-500/70 text-xs block">Allergies</span>
                      <p className="text-red-700 dark:text-red-300 font-medium">{patientData.allergies}</p>
                    </div>
                  </div>
                )}
                {patientData?.emergency_contact && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <UserPlus className="w-4 h-4 text-orange-500" />
                    <div>
                      <span className="text-muted-foreground text-xs block">Emergency Contact</span>
                      <p className="text-foreground font-medium">{patientData.emergency_contact}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div className="w-full">
                    <span className="text-muted-foreground text-xs block">Address</span>
                    <p className="text-foreground font-medium truncate">
                      {[patientData?.address, patientData?.city, patientData?.state, patientData?.pincode].filter(Boolean).join(', ') || "No address set"}
                    </p>
                    {/* Lat/Lon intentionally hidden as requested */}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-card rounded-xl p-6 card-shadow">
          <h3 className="font-medium text-foreground mb-4">Update Settings</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input defaultValue={user?.full_name || ""} className="mt-1.5" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" defaultValue={user?.email || ""} className="mt-1.5" disabled />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" placeholder="Leave blank to keep current" className="mt-1.5" />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" placeholder="Confirm new password" className="mt-1.5" />
            </div>
            <Button type="submit" className="gap-2">
              {saved ? <><Check className="w-4 h-4" />Saved!</> : "Update Profile"}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;

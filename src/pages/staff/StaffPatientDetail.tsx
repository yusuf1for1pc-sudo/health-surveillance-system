import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { Plus, FileText, Activity } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import type { Patient } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const StaffPatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPatient, getRecordsForPatient } = useData();

  const [statusOpen, setStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("ACTIVE");
  const [referralOrg, setReferralOrg] = useState("");
  const [updating, setUpdating] = useState(false);

  const patient = getPatient(id || "");

  if (!patient) {
    return (
      <DashboardLayout role="staff">
        <PageHeader title="Patient Not Found" />
        <p className="text-muted-foreground">No patient found with this ID.</p>
        <Button className="mt-4" onClick={() => navigate("/staff/patients")}>Back to Patients</Button>
      </DashboardLayout>
    );
  }

  const patientRecords = getRecordsForPatient(patient.id);

  const colors: Record<string, string> = {
    'ACTIVE': 'bg-amber-100 text-amber-700 border-amber-200',
    'RECOVERED': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'CRITICAL': 'bg-rose-100 text-rose-700 border-rose-200',
    'REFERRED': 'bg-purple-100 text-purple-700 border-purple-200',
  };
  const statusStr = patient.status || 'ACTIVE';
  const colorClass = colors[statusStr] || 'bg-gray-100 text-gray-700 border-gray-200';

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      if (newStatus === "REFERRED" && !referralOrg) {
        toast.error("Please specify a referral organization");
        return;
      }

      const updates: Partial<Patient> = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === "REFERRED") {
        updates.organization_id = referralOrg; // Assuming it refers to org.id, not just name, but for UI sake it's text for now. (You can build a proper org picker later)
      }

      const { error } = await supabase
        .from("patients")
        .update(updates)
        .eq("id", patient.id);

      if (error) throw error;

      toast.success(`Patient status updated to ${newStatus}`);
      setStatusOpen(false);

      // Navigate to trigger data reload on mount for demo
      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DashboardLayout role="staff">
      <div className="flex items-start justify-between">
        <PageHeader
          title={patient.full_name}
          description={`Patient ID: ${patient.patient_id}`}
        />
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-[10px] font-medium border uppercase ${colorClass}`}>
            {statusStr}
          </span>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={() => setStatusOpen(true)}>
              <Activity className="w-4 h-4 mr-2" />
              Update Status
            </Button>
            <Link to="/staff/records/create">
              <Button size="sm"><Plus className="w-4 h-4 mr-2" />New Record</Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Patient Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-xl p-5 card-shadow">
            <h3 className="font-medium text-foreground mb-3">Patient Information</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground ml-2">{patient.phone}</span></div>
              <div><span className="text-muted-foreground">Gender:</span> <span className="text-foreground ml-2">{patient.gender}</span></div>
              <div><span className="text-muted-foreground">DOB:</span> <span className="text-foreground ml-2">{patient.date_of_birth}</span></div>
              <div><span className="text-muted-foreground">Blood Type:</span> <span className="text-foreground ml-2">{patient.blood_type || "—"}</span></div>
              <div><span className="text-muted-foreground">Allergies:</span> <span className="text-foreground ml-2">{patient.allergies || "None"}</span></div>
              <div><span className="text-muted-foreground">Emergency:</span> <span className="text-foreground ml-2">{patient.emergency_contact || "—"}</span></div>
              {patient.address && (
                <div className="sm:col-span-2"><span className="text-muted-foreground">Address:</span> <span className="text-foreground ml-2">{patient.address}</span></div>
              )}
            </div>
          </div>

          {/* Medical Records */}
          <div className="bg-card rounded-xl p-5 card-shadow">
            <h3 className="font-medium text-foreground mb-3">Medical Records ({patientRecords.length})</h3>
            {patientRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">No records yet.</p>
            ) : (
              <div className="space-y-3">
                {patientRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/staff/records/${record.id}`)}
                  >
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{record.title}</p>
                      <p className="text-xs text-muted-foreground">{record.record_type} • {record.created_at.split("T")[0]}</p>
                      {record.icd_code && (
                        <span className="text-xs text-primary">{record.icd_code}: {record.icd_label}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* QR Code Sidebar */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl p-5 card-shadow text-center">
            <h3 className="font-medium text-foreground mb-3">Health Card QR</h3>
            <div className="w-40 h-40 mx-auto bg-background rounded-xl p-2 border">
              <QRCodeSVG
                value={patient.patient_id}
                size={144}
                level="H"
                bgColor="transparent"
                fgColor="currentColor"
                className="text-foreground w-full h-full"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{patient.patient_id}</p>
          </div>
        </div>
      </div>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Patient Status</DialogTitle>
            <DialogDescription>
              Change the medical status for {patient.full_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="grid grid-cols-2 gap-2">
                {['ACTIVE', 'RECOVERED', 'CRITICAL', 'REFERRED'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setNewStatus(status);
                      if (status !== 'REFERRED') setReferralOrg('');
                    }}
                    className={`flex items-center justify-center py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${newStatus === status
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-border"
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {newStatus === 'REFERRED' && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="referral">Target Organization ID</Label>
                <Input
                  id="referral"
                  placeholder="e.g. org_abc123"
                  value={referralOrg}
                  onChange={(e) => setReferralOrg(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The patient will be transferred to this hospital/clinic.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)} disabled={updating}>Cancel</Button>
            <Button onClick={handleStatusUpdate} disabled={updating}>
              {updating ? "Updating..." : "Confirm Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StaffPatientDetail;

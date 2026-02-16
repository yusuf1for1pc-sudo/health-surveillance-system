import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Plus, FileText } from "lucide-react";
import { useData } from "@/contexts/DataContext";

const StaffPatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPatient, getRecordsForPatient, patients } = useData();

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

  return (
    <DashboardLayout role="staff">
      <PageHeader
        title={patient.full_name}
        description={`Patient ID: ${patient.patient_id}`}
        action={
          <Link to="/staff/records/create">
            <Button><Plus className="w-4 h-4 mr-2" />New Record</Button>
          </Link>
        }
      />
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
    </DashboardLayout>
  );
};

export default StaffPatientDetail;

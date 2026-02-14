import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

const patientData: Record<string, any> = {
  "1": { name: "Alice Johnson", phone: "+1 555-0101", gender: "Female", dob: "1985-03-12", patientId: "TMP-2026-0001" },
  "2": { name: "Bob Williams", phone: "+1 555-0102", gender: "Male", dob: "1990-07-24", patientId: "TMP-2026-0002" },
  "3": { name: "Carol Davis", phone: "+1 555-0103", gender: "Female", dob: "1978-11-05", patientId: "TMP-2026-0003" },
  "4": { name: "David Kim", phone: "+1 555-0104", gender: "Male", dob: "1995-01-18", patientId: "TMP-2026-0004" },
};

const records = [
  { type: "Prescription", title: "Amoxicillin 500mg", date: "2026-02-10", doctor: "Dr. Emily Watson" },
  { type: "Lab Report", title: "Complete Blood Count", date: "2026-02-08", doctor: "Lisa Chen" },
  { type: "Clinical Note", title: "Follow-up Visit", date: "2026-01-28", doctor: "Dr. Michael Patel" },
];

const StaffPatientDetail = () => {
  const { id } = useParams();
  const patient = patientData[id || "1"] || patientData["1"];

  return (
    <DashboardLayout role="staff">
      <div className="mb-4">
        <Link to="/staff/patients" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </Link>
      </div>
      <PageHeader
        title={patient.name}
        description={`ID: ${patient.patientId}`}
        action={<Link to="/staff/records/create"><Button size="sm"><Plus className="w-4 h-4 mr-1" />New Record</Button></Link>}
      />

      <div className="bg-card rounded-xl p-6 card-shadow mb-6">
        <h3 className="font-medium text-foreground mb-4">Patient Info</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="text-foreground">{patient.phone}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span className="text-foreground">{patient.gender}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Date of Birth</span><span className="text-foreground">{patient.dob}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Patient ID</span><span className="text-foreground">{patient.patientId}</span></div>
        </div>
      </div>

      <h3 className="font-medium text-foreground mb-4">Medical Records</h3>
      <div className="space-y-3">
        {records.map((record, i) => (
          <Link key={i} to={`/staff/records/${i + 1}`} className="block">
            <div className="bg-card rounded-xl p-4 card-shadow hover:card-shadow-hover transition-shadow">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-primary">{record.type}</span>
                <span className="text-xs text-muted-foreground">{record.date}</span>
              </div>
              <p className="text-sm font-medium text-foreground">{record.title}</p>
              <p className="text-xs text-muted-foreground mt-1">By {record.doctor}</p>
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default StaffPatientDetail;

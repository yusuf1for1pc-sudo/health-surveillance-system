import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { useData } from "@/contexts/DataContext";

const StaffRecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRecord, patients } = useData();

  const record = getRecord(id || "");

  if (!record) {
    return (
      <DashboardLayout role="staff">
        <PageHeader title="Record Not Found" />
        <p className="text-muted-foreground">No record found with this ID.</p>
        <Button className="mt-4" onClick={() => navigate("/staff/records")}>Back to Records</Button>
      </DashboardLayout>
    );
  }

  const patient = patients.find(p => p.id === record.patient_id);

  return (
    <DashboardLayout role="staff">
      <PageHeader
        title={record.title}
        description={`${record.record_type} • ${record.created_at.split("T")[0]}`}
      />
      <div className="max-w-2xl space-y-4">
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="font-medium text-foreground mb-3">Record Details</h3>
          <div className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Patient:</span> <span className="text-foreground ml-2">{patient?.full_name || "Unknown"}</span></div>
            <div><span className="text-muted-foreground">Type:</span> <span className="text-foreground ml-2">{record.record_type}</span></div>
            <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground ml-2">{record.created_at.split("T")[0]}</span></div>
            <div><span className="text-muted-foreground">Created By:</span> <span className="text-foreground ml-2">{record.creator_name}</span></div>
            {record.icd_code && (
              <div><span className="text-muted-foreground">ICD Code:</span> <span className="text-primary ml-2">{record.icd_code} — {record.icd_label}</span></div>
            )}
            {record.diagnosis && (
              <div>
                <span className="text-muted-foreground">Diagnosis:</span>
                <p className="text-foreground mt-1">{record.diagnosis}</p>
              </div>
            )}
            {record.description && (
              <div>
                <span className="text-muted-foreground">Notes:</span>
                <p className="text-foreground mt-1">{record.description}</p>
              </div>
            )}
          </div>
        </div>

        {record.attachment_name && (
          <div className="bg-card rounded-xl p-5 card-shadow">
            <h3 className="font-medium text-foreground mb-3">Attachments</h3>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-foreground flex-1">{record.attachment_name}</span>
              <Button size="sm" variant="outline" onClick={() => alert("Download: " + record.attachment_name)}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <Button variant="outline" onClick={() => navigate("/staff/records")}>Back to Records</Button>
      </div>
    </DashboardLayout>
  );
};

export default StaffRecordDetail;

import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const recordData: Record<string, any> = {
  "1": { patient: "Alice Johnson", type: "Prescription", title: "Amoxicillin 500mg", date: "2026-02-10", doctor: "Dr. Emily Watson", description: "Take 1 capsule (500mg) three times daily for 7 days. Complete the full course even if symptoms improve. Take with food to reduce stomach upset.", hasAttachment: false },
  "2": { patient: "Bob Williams", type: "Lab Report", title: "Complete Blood Count", date: "2026-02-08", doctor: "Lisa Chen", description: "WBC: 7.2 (Normal)\nRBC: 4.8 (Normal)\nHemoglobin: 14.2 g/dL (Normal)\nHematocrit: 42% (Normal)\nPlatelets: 250,000 (Normal)\n\nAll values within normal reference range.", hasAttachment: true },
  "3": { patient: "Carol Davis", type: "Clinical Note", title: "Follow-up Visit", date: "2026-01-28", doctor: "Dr. Michael Patel", description: "Patient presents for follow-up after respiratory infection. Symptoms have improved significantly. Mild residual cough noted. No fever. Lungs clear on auscultation. Recommend continued rest and hydration. Follow-up in 2 weeks if symptoms persist.", hasAttachment: false },
  "4": { patient: "Alice Johnson", type: "Lab Report", title: "Lipid Panel", date: "2026-01-20", doctor: "Lisa Chen", description: "Total Cholesterol: 215 mg/dL (Borderline High)\nLDL: 140 mg/dL (Borderline High)\nHDL: 52 mg/dL (Normal)\nTriglycerides: 115 mg/dL (Normal)\n\nRecommend dietary modifications and follow-up in 3 months.", hasAttachment: true },
};

const StaffRecordDetail = () => {
  const { id } = useParams();
  const record = recordData[id || "1"] || recordData["1"];

  return (
    <DashboardLayout role="staff">
      <div className="mb-4">
        <Link to="/staff/records" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Records
        </Link>
      </div>
      <PageHeader title={record.title} description={`${record.type} • ${record.date}`} />

      <div className="max-w-2xl space-y-6">
        <div className="bg-card rounded-xl p-6 card-shadow">
          <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
            <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span className="text-foreground font-medium">{record.patient}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created By</span><span className="text-foreground font-medium">{record.doctor}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="text-primary font-medium">{record.type}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-foreground">{record.date}</span></div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 card-shadow">
          <h3 className="font-medium text-foreground mb-3">Details</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{record.description}</p>
        </div>

        {record.hasAttachment && (
          <div className="bg-card rounded-xl p-6 card-shadow">
            <h3 className="font-medium text-foreground mb-3">Attachment</h3>
            <div className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">lab-report-{record.date}.pdf</p>
                  <p className="text-xs text-muted-foreground">PDF • 245 KB</p>
                </div>
              </div>
              <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Download</Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffRecordDetail;

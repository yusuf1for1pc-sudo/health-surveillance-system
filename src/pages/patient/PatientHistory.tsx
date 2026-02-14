import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";

const timelineItems = [
  { date: "2026-02-10", type: "Prescription", title: "Amoxicillin 500mg", doctor: "Dr. Emily Watson", description: "Take 1 capsule 3 times daily for 7 days." },
  { date: "2026-02-08", type: "Lab Report", title: "Complete Blood Count", doctor: "Lisa Chen", description: "All values within normal range." },
  { date: "2026-01-28", type: "Clinical Note", title: "Follow-up Visit", doctor: "Dr. Michael Patel", description: "Patient recovering well. Mild inflammation noted." },
  { date: "2026-01-15", type: "Prescription", title: "Ibuprofen 400mg", doctor: "Dr. Emily Watson", description: "Take as needed for pain." },
  { date: "2025-12-20", type: "Lab Report", title: "Lipid Panel", doctor: "Lisa Chen", description: "Cholesterol slightly elevated. Dietary changes recommended." },
];

const PatientHistory = () => (
  <DashboardLayout role="patient">
    <PageHeader title="Medical History" description="Your complete health timeline" />
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-6">
        {timelineItems.map((item, i) => (
          <div key={i} className="relative pl-10">
            <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-card" />
            <div className="bg-card rounded-xl p-4 card-shadow">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-primary">{item.type}</span>
                <span className="text-xs text-muted-foreground">{item.date}</span>
              </div>
              <h3 className="font-medium text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              <p className="text-xs text-muted-foreground mt-2">By {item.doctor}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </DashboardLayout>
);

export default PatientHistory;

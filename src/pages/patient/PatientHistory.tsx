import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { useData } from "@/contexts/DataContext";

const PatientHistory = () => {
  const { records } = useData();

  const timelineItems = records.map(r => ({
    date: r.created_at.split("T")[0],
    type: r.record_type,
    title: r.title,
    doctor: r.creator_name,
    description: r.description || r.diagnosis || "No details available.",
  }));

  return (
    <DashboardLayout role="patient">
      <PageHeader title="Medical History" description="Your complete health timeline" />
      {timelineItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">No medical history yet.</p>
      ) : (
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
      )}
    </DashboardLayout>
  );
};

export default PatientHistory;

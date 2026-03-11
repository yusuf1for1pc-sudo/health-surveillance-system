import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { useData } from "@/contexts/DataContext";

const PatientHistory = () => {
  const navigate = useNavigate();
  const { records } = useData();

  const timelineItems = records.map(r => ({
    id: r.id,
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
            {timelineItems.map((item) => (
              <div key={item.id} className="relative pl-10 group cursor-pointer" onClick={() => navigate(`/patient/history/${item.id}`)}>
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-card group-hover:scale-125 transition-transform" />
                <div className="bg-card rounded-xl p-4 card-shadow border border-transparent transition-all duration-300 group-hover:bg-green-50 group-hover:border-green-200 group-hover:shadow-xl group-hover:scale-[1.02] active:scale-[0.98]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">{item.type}</span>
                    <span className="text-xs text-muted-foreground font-medium">{item.date}</span>
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-green-900 transition-colors">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground/80 font-medium italic">By {item.doctor}</p>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1">View Details →</span>
                    </div>
                  </div>
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

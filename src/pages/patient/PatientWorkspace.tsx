import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { ClipboardList, FileText, Heart } from "lucide-react";
import { useData } from "@/contexts/DataContext";

const PatientWorkspace = () => {
  const { records } = useData();

  const prescriptions = records.filter(r => r.record_type === "Prescription");
  const labReports = records.filter(r => r.record_type === "Lab Report");
  const recentItems = records.slice(0, 5);

  return (
    <DashboardLayout role="patient">
      <PageHeader title="My Health Dashboard" description="Your recent medical activity" />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Prescriptions" value={prescriptions.length} icon={<ClipboardList className="w-5 h-5" />} />
        <StatCard title="Lab Reports" value={labReports.length} icon={<FileText className="w-5 h-5" />} />
        <StatCard title="Total Records" value={records.length} subtitle="All medical records" icon={<Heart className="w-5 h-5" />} />
      </div>
      <h2 className="text-lg font-medium text-foreground mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {recentItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No records yet.</p>
        ) : (
          recentItems.map((item) => (
            <div key={item.id} className="bg-card rounded-xl p-4 card-shadow flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.record_type} • {item.creator_name}</p>
              </div>
              <span className="text-xs text-muted-foreground">{item.created_at.split("T")[0]}</span>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientWorkspace;

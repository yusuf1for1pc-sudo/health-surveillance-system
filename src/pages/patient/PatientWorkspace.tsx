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
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-6">
          {recentItems.length === 0 ? (
            <p className="text-sm text-muted-foreground pl-10">No records yet.</p>
          ) : (
            recentItems.map((item) => (
              <div key={item.id} className="relative pl-10 group bg-transparent">
                <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-primary border-2 border-card" />
                <div className="bg-card rounded-xl p-4 card-shadow border border-transparent">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-primary">{item.record_type}</span>
                    <span className="text-xs text-muted-foreground">{item.created_at.split("T")[0]}</span>
                  </div>
                  <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">By {item.creator_name}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientWorkspace;

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { ClipboardList, FileText, Heart } from "lucide-react";

const recentItems = [
  { type: "Prescription", title: "Amoxicillin 500mg", doctor: "Dr. Emily Watson", date: "2026-02-10" },
  { type: "Lab Report", title: "Complete Blood Count", doctor: "Lisa Chen", date: "2026-02-08" },
  { type: "Clinical Note", title: "Follow-up Visit", doctor: "Dr. Michael Patel", date: "2026-01-28" },
];

const PatientWorkspace = () => (
  <DashboardLayout role="patient">
    <PageHeader title="My Health Dashboard" description="Your recent medical activity" />
    <div className="grid sm:grid-cols-3 gap-4 mb-8">
      <StatCard title="Prescriptions" value={8} icon={<ClipboardList className="w-5 h-5" />} />
      <StatCard title="Lab Reports" value={5} icon={<FileText className="w-5 h-5" />} />
      <StatCard title="Visits" value={12} subtitle="Total healthcare visits" icon={<Heart className="w-5 h-5" />} />
    </div>
    <h2 className="text-lg font-medium text-foreground mb-4">Recent Activity</h2>
    <div className="space-y-3">
      {recentItems.map((item, i) => (
        <div key={i} className="bg-card rounded-xl p-4 card-shadow flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.type} • {item.doctor}</p>
          </div>
          <span className="text-xs text-muted-foreground">{item.date}</span>
        </div>
      ))}
    </div>
  </DashboardLayout>
);

export default PatientWorkspace;

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { Users, Heart, FileText } from "lucide-react";

const OrgWorkspace = () => {
  return (
    <DashboardLayout role="org">
      <PageHeader title="Organization Dashboard" description="Overview of your healthcare organization" />
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard title="Staff Members" value={24} subtitle="3 pending verification" icon={<Users className="w-5 h-5" />} />
        <StatCard title="Patients" value={456} subtitle="12 new this week" icon={<Heart className="w-5 h-5" />} />
        <StatCard title="Records" value="1,230" subtitle="Total medical records" icon={<FileText className="w-5 h-5" />} />
      </div>
    </DashboardLayout>
  );
};

export default OrgWorkspace;

import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DataTable from "@/components/dashboard/DataTable";
import { Users, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const recentPatients = [
  { name: "Alice Johnson", phone: "+1 555-0101", lastVisit: "2026-02-10" },
  { name: "Bob Williams", phone: "+1 555-0102", lastVisit: "2026-02-08" },
  { name: "Carol Davis", phone: "+1 555-0103", lastVisit: "2026-01-28" },
];

const StaffWorkspace = () => {
  return (
    <DashboardLayout role="staff">
      <PageHeader title="Staff Dashboard" description="Your patient and record overview" />
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <StatCard title="Total Patients" value={64} subtitle="5 new this week" icon={<Users className="w-5 h-5" />} />
        <StatCard title="Medical Records" value={312} subtitle="Created by you" icon={<FileText className="w-5 h-5" />} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-foreground">Recent Patients</h2>
        <div className="flex gap-2">
          <Link to="/staff/patients/create"><Button size="sm"><Plus className="w-4 h-4 mr-1" />New Patient</Button></Link>
          <Link to="/staff/records/create"><Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" />New Record</Button></Link>
        </div>
      </div>
      <DataTable
        columns={[
          { key: "name", header: "Name" },
          { key: "phone", header: "Phone" },
          { key: "lastVisit", header: "Last Visit" },
        ]}
        data={recentPatients}
      />
    </DashboardLayout>
  );
};

export default StaffWorkspace;

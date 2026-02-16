import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { useData } from "@/contexts/DataContext";

const PatientReports = () => {
  const { records } = useData();

  const labReports = records
    .filter(r => r.record_type === "Lab Report")
    .map(r => ({
      title: r.title,
      lab: r.creator_name,
      date: r.created_at.split("T")[0],
      result: r.description || "Pending",
    }));

  return (
    <DashboardLayout role="patient">
      <PageHeader title="Lab Reports" description="Your laboratory test results" />
      {labReports.length === 0 ? (
        <p className="text-sm text-muted-foreground">No lab reports yet.</p>
      ) : (
        <DataTable
          columns={[
            { key: "title", header: "Test" },
            { key: "lab", header: "Lab Technician" },
            { key: "date", header: "Date" },
            { key: "result", header: "Result" },
          ]}
          data={labReports}
        />
      )}
    </DashboardLayout>
  );
};

export default PatientReports;

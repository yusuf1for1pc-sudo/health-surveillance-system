import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { useData } from "@/contexts/DataContext";

const PatientPrescriptions = () => {
  const { records } = useData();

  const prescriptions = records
    .filter(r => r.record_type === "Prescription")
    .map(r => ({
      medication: r.title,
      dosage: r.description || "—",
      doctor: r.creator_name,
      date: r.created_at.split("T")[0],
      status: new Date(r.created_at) > new Date(Date.now() - 30 * 86400000) ? "Active" : "Completed",
    }));

  return (
    <DashboardLayout role="patient">
      <PageHeader title="Prescriptions" description="Your prescribed medications" />
      {prescriptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No prescriptions yet.</p>
      ) : (
        <DataTable
          columns={[
            { key: "medication", header: "Medication" },
            { key: "dosage", header: "Dosage" },
            { key: "doctor", header: "Prescribed By" },
            { key: "date", header: "Date" },
            { key: "status", header: "Status" },
          ]}
          data={prescriptions}
        />
      )}
    </DashboardLayout>
  );
};

export default PatientPrescriptions;

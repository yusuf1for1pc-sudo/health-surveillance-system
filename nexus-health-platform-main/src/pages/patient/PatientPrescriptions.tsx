import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";

const prescriptions = [
  { medication: "Amoxicillin 500mg", dosage: "3x daily", doctor: "Dr. Emily Watson", date: "2026-02-10", status: "Active" },
  { medication: "Ibuprofen 400mg", dosage: "As needed", doctor: "Dr. Emily Watson", date: "2026-01-15", status: "Active" },
  { medication: "Metformin 500mg", dosage: "2x daily", doctor: "Dr. Michael Patel", date: "2025-11-20", status: "Completed" },
];

const PatientPrescriptions = () => (
  <DashboardLayout role="patient">
    <PageHeader title="Prescriptions" description="Your prescribed medications" />
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
  </DashboardLayout>
);

export default PatientPrescriptions;

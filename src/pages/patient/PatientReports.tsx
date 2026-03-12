import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { useData } from "@/contexts/DataContext";
import { useTranslation } from "react-i18next";

const PatientReports = () => {
  const navigate = useNavigate();
  const { records } = useData();
  const { t } = useTranslation();

  const labReports = records
    .filter(r => r.record_type === "Lab Report")
    .map(r => ({
      id: r.id,
      title: r.title,
      lab: r.creator_name,
      date: r.created_at.split("T")[0],
      result: r.description || "Pending",
    }));

  return (
    <DashboardLayout role="patient">
      <PageHeader title={t("reports_title")} description={t("reports_desc")} />
      {labReports.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("no_reports")}</p>
      ) : (
        <DataTable
          columns={[
            { key: "title", header: "Test" },
            { key: "lab", header: "Lab Technician" },
            { key: "date", header: "Date" },
            { key: "result", header: "Result" },
          ]}
          data={labReports}
          onRowClick={(item: any) => navigate(`/patient/history/${item.id}`)}
        />
      )}
    </DashboardLayout>
  );
};

export default PatientReports;

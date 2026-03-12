import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { ClipboardList, FileText, Heart } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useTranslation } from "react-i18next";

const PatientWorkspace = () => {
  const { records } = useData();
  const { t } = useTranslation();

  const prescriptions = records.filter(r => r.record_type === "Prescription");
  const labReports = records.filter(r => r.record_type === "Lab Report");
  const recentItems = records.slice(0, 5);

  return (
    <DashboardLayout role="patient">
      <PageHeader title={t("dashboard")} description={t("summary")} />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard title={t("prescriptions")} value={prescriptions.length} icon={<ClipboardList className="w-5 h-5" />} />
        <StatCard title={t("lab_reports")} value={labReports.length} icon={<FileText className="w-5 h-5" />} />
        <StatCard title={t("total_records")} value={records.length} subtitle={t("all_records")} icon={<Heart className="w-5 h-5" />} />
      </div>
      <h2 className="text-lg font-medium text-foreground mb-4">{t("recent_activity")}</h2>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-6">
          {recentItems.length === 0 ? (
            <p className="text-sm text-muted-foreground pl-10">{t("no_records")}</p>
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
                  <p className="text-xs text-muted-foreground mt-1">{t("by")} {item.creator_name}</p>
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

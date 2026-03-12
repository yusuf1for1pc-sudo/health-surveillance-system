import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { useData } from "@/contexts/DataContext";
import { useTranslation } from "react-i18next";

const PatientHistory = () => {
  const navigate = useNavigate();
  const { records } = useData();
  const { t } = useTranslation();

  const timelineItems = records.map(r => ({
    id: r.id,
    date: r.created_at.split("T")[0],
    type: r.record_type,
    title: r.title,
    doctor: r.creator_name,
    description: r.description || r.diagnosis || t("no_details"),
  }));

  return (
    <DashboardLayout role="patient">
      <PageHeader title={t("history_title")} description={t("history_desc")} />
      {timelineItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("no_history")}</p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-6">
            {timelineItems.map((item) => (
              <div key={item.id} className="relative pl-10 group cursor-pointer" onClick={() => navigate(`/patient/history/${item.id}`)}>
                <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-card group-hover:scale-125 transition-transform" />
                <div className="bg-card rounded-xl p-4 card-shadow group-hover:border-primary/50 transition-colors border border-transparent">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-primary">{item.type}</span>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  </div>
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{t("by")} {item.doctor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PatientHistory;

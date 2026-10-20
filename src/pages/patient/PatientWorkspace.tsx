import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { Panel, PanelGrid, Field } from "@/components/layout/Modular";
import { ClipboardList, FileText, Heart, Droplet, AlertCircle, CreditCard, ArrowUpRight } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { recordPath } from "@/lib/patientNav";
import { useTranslation } from "react-i18next";

const PatientWorkspace = () => {
  const { records, patients } = useData();
  const { t } = useTranslation();

  const me = patients[0];
  const prescriptions = records.filter(r => r.record_type === "Prescription");
  const labReports = records.filter(r => r.record_type === "Lab Report");
  const recentItems = records.slice(0, 6);

  return (
    <DashboardLayout role="patient" fit>
      <PageHeader compact title={t("dashboard")} description={t("summary")} />

      <div className="mb-4 grid shrink-0 gap-2 sm:grid-cols-3 sm:gap-4">
        <Link to="/patient/prescriptions" className="block"><StatCard title={t("prescriptions")} value={prescriptions.length} icon={<ClipboardList className="h-5 w-5" />} /></Link>
        <Link to="/patient/reports" className="block"><StatCard title={t("lab_reports")} value={labReports.length} icon={<FileText className="h-5 w-5" />} /></Link>
        <Link to="/patient/history" className="block"><StatCard title={t("total_records")} value={records.length} subtitle={t("all_records")} icon={<Heart className="h-5 w-5" />} /></Link>
      </div>

      <PanelGrid className="lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[minmax(0,1fr)]">
        {/* Main module: activity timeline */}
        <Panel title={t("recent_activity")} className="flex min-h-0 flex-col" bodyClassName="min-h-0 overflow-y-auto p-0">
          {recentItems.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">{t("no_records")}</p>
          ) : (
            <ul className="divide-y">
              {recentItems.map((item) => (
                <li key={item.id}>
                  <Link to={recordPath(item)} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40">
                    <span className="hidden w-24 shrink-0 text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:block">{item.record_type}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground"><span className="sm:hidden">{item.record_type} · </span>{t("by")} {item.creator_name}</p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Side module: quick facts */}
        <Panel
          className="lg:self-start"
          title="At a glance"
          action={
            <Link to="/patient/health-card" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <CreditCard className="h-3.5 w-3.5" /> Health card
            </Link>
          }
          bodyClassName="py-1"
        >
          <Field inline icon={<Droplet className="h-3.5 w-3.5" />} label="Blood group" value={me?.blood_type || "—"} />
          <Field
            icon={<AlertCircle className="h-3.5 w-3.5" />}
            label="Allergies"
            value={me?.allergies || "None recorded"}
            tone={me?.allergies ? "alert" : "default"}
          />
          <Field inline icon={<FileText className="h-3.5 w-3.5" />} label="Last visit" value={records[0] ? records[0].created_at.split("T")[0] : "—"} />
        </Panel>
      </PanelGrid>
    </DashboardLayout>
  );
};

export default PatientWorkspace;

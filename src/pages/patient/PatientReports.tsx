import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Panel, PanelGrid, Field } from "@/components/layout/Modular";
import { FlaskConical, ArrowUpRight, FileText, ClipboardList } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { recordPath } from "@/lib/patientNav";

interface Tally { normal: number; borderline: number; abnormal: number; tests: number }

const tally = (panels: any[] | undefined): Tally => {
  const t: Tally = { normal: 0, borderline: 0, abnormal: 0, tests: 0 };
  (panels ?? []).forEach((p) => {
    Object.values(p?.values ?? {}).forEach((v: any) => {
      t.tests += 1;
      if (v?.status === "abnormal") t.abnormal += 1;
      else if (v?.status === "borderline") t.borderline += 1;
      else t.normal += 1;
    });
  });
  return t;
};

const Chip = ({ n, label, cls }: { n: number; label: string; cls: string }) =>
  n > 0 ? <span className={`rounded-sm border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{n} {label}</span> : null;

const PatientReports = () => {
  const navigate = useNavigate();
  const { records } = useData();
  const { t } = useTranslation();
  const [tallies, setTallies] = useState<Record<string, Tally>>({});

  const reports = useMemo(
    () => records.filter((r) => r.record_type === "Lab Report").sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [records],
  );
  const idsKey = reports.map((r) => r.id).join(",");

  // Result values for every report in one request, to show an at-a-glance summary
  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    supabase
      .from("lab_reports")
      .select("record_id, test_panels")
      .in("record_id", idsKey.split(","))
      .then(({ data }) => {
        if (cancelled || !data) return;
        const next: Record<string, Tally> = {};
        data.forEach((row: any) => { next[row.record_id] = tally(row.test_panels); });
        setTallies(next);
      });
    return () => { cancelled = true; };
  }, [idsKey]);

  const needsAttention = reports.filter((r) => (tallies[r.id]?.abnormal ?? 0) > 0).length;

  return (
    <DashboardLayout role="patient" fit>
      <PageHeader compact title={t("reports_title")} description={t("reports_desc")} />

      <PanelGrid className="lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[minmax(0,1fr)]">
        <div className="grid content-start gap-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1 xl:grid-cols-2">
          {reports.length === 0 ? (
            <Panel><p className="text-sm text-muted-foreground">{t("no_reports")}</p></Panel>
          ) : (
            reports.map((r) => {
              const ty = tallies[r.id];
              return (
                <button
                  key={r.id}
                  onClick={() => navigate(recordPath(r))}
                  className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-sm border bg-card p-5 text-left transition-colors hover:border-foreground/40"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-sm border text-muted-foreground"><FlaskConical className="h-5 w-5" /></span>
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-xl font-medium leading-tight">{r.title}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{r.creator_name} · {new Date(r.created_at).toLocaleDateString()}</span>
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {ty ? (
                        <>
                          <Chip n={ty.abnormal} label="abnormal" cls="border-danger/30 bg-danger/15 text-danger" />
                          <Chip n={ty.borderline} label="borderline" cls="border-warning/30 bg-warning/15 text-warning" />
                          <Chip n={ty.normal} label="normal" cls="border-success/30 bg-success/15 text-success" />
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">{r.description || "Open to view results"}</span>
                      )}
                    </span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>
              );
            })
          )}
        </div>

        <aside className="space-y-5 lg:overflow-y-auto">
          <Panel title="Summary" bodyClassName="py-1">
            <Field inline icon={<FlaskConical className="h-3.5 w-3.5" />} label="Total reports" value={reports.length} />
            <Field
              label="Need attention"
              value={needsAttention > 0 ? `${needsAttention} with abnormal values` : "None"}
              tone={needsAttention > 0 ? "alert" : "default"}
            />
            <Field inline label="Latest" value={reports[0] ? new Date(reports[0].created_at).toLocaleDateString() : "—"} />
          </Panel>
          <Panel title="Go to" bodyClassName="space-y-2">
            <Link to="/patient/prescriptions" className="flex items-center gap-3 rounded-sm border px-3 py-2 text-sm transition-colors hover:bg-muted/50">
              <ClipboardList className="h-4 w-4 text-muted-foreground" /> Prescriptions <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
            <Link to="/patient/history" className="flex items-center gap-3 rounded-sm border px-3 py-2 text-sm transition-colors hover:bg-muted/50">
              <FileText className="h-4 w-4 text-muted-foreground" /> Full history <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          </Panel>
        </aside>
      </PanelGrid>
    </DashboardLayout>
  );
};

export default PatientReports;

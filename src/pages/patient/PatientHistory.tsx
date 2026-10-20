import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Panel, PanelGrid, Field } from "@/components/layout/Modular";
import { Input } from "@/components/ui/input";
import { Search, ClipboardList, FileText, StickyNote, ArrowUpRight, CreditCard, Pill, FlaskConical } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useTranslation } from "react-i18next";
import { TYPE_STYLES, recordPath } from "@/lib/patientNav";

type Filter = "all" | "Prescription" | "Lab Report" | "Clinical Note";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "Prescription", label: "Prescriptions" },
  { key: "Lab Report", label: "Lab reports" },
  { key: "Clinical Note", label: "Notes" },
];

const OPENS: Record<string, string> = {
  Prescription: "Open prescription",
  "Lab Report": "Open report",
  "Clinical Note": "Open note",
};

// Timeline marker per record type: a pill, a lab flask, a note
const MARKERS: Record<string, { icon: typeof Pill; color: string }> = {
  Prescription: { icon: Pill, color: "text-foreground border-foreground/40" },
  "Lab Report": { icon: FlaskConical, color: "text-foreground border-foreground/40" },
  "Clinical Note": { icon: StickyNote, color: "text-foreground border-foreground/40" },
};

const monthLabel = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });

const PatientHistory = () => {
  const navigate = useNavigate();
  const { records } = useData();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const sorted = useMemo(
    () => [...records].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [records],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: sorted.length };
    sorted.forEach((r) => { c[r.record_type] = (c[r.record_type] ?? 0) + 1; });
    return c;
  }, [sorted]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter(
      (r) =>
        (filter === "all" || r.record_type === filter) &&
        (!q || `${r.title} ${r.creator_name} ${r.diagnosis ?? ""} ${r.description ?? ""}`.toLowerCase().includes(q)),
    );
  }, [sorted, filter, query]);

  // Group by month so a long history is easy to scan
  const groups = useMemo(() => {
    const map = new Map<string, typeof visible>();
    visible.forEach((r) => {
      const k = monthLabel(r.created_at);
      map.set(k, [...(map.get(k) ?? []), r]);
    });
    return [...map.entries()];
  }, [visible]);

  const last = sorted[0];

  return (
    <DashboardLayout role="patient" fit>
      <PageHeader compact title={t("history_title")} description={t("history_desc")} />

      <PanelGrid className="lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[minmax(0,1fr)]">
        {/* Main: filters + grouped timeline */}
        <div className="flex min-h-0 flex-col gap-4">
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter records">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-sm border px-3 py-1.5 text-sm transition-colors ${filter === f.key ? "border-foreground bg-foreground text-background" : "hover:bg-muted/60"}`}
                >
                  {f.label} <span className="ml-1 opacity-60">{counts[f.key] ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your history" className="pl-9" />
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-4 lg:overflow-y-auto lg:pr-1">
          {groups.length === 0 ? (
            <Panel><p className="text-sm text-muted-foreground">{query || filter !== "all" ? "Nothing matches these filters." : t("no_history")}</p></Panel>
          ) : (
            /* Vertical timeline: a line down the left, a dot per entry, one card each */
            <div className="relative pb-2">
              <div className="absolute bottom-0 left-[15.5px] top-2 w-px bg-border" aria-hidden />
              {groups.map(([month, items]) => (
                <section key={month} className="mb-5 last:mb-0">
                  <h2 className="eyebrow relative mb-3 pl-10">{month}</h2>
                  <div className="space-y-3">
                    {items.map((r) => (
                      <div key={r.id} className="group relative pl-10">
                        {(() => {
                          const m = MARKERS[r.record_type] ?? MARKERS["Clinical Note"];
                          const Icon = m.icon;
                          return (
                            <span className={`absolute left-0 top-3 flex h-8 w-8 items-center justify-center rounded-full border bg-card transition-transform group-hover:scale-110 ${m.color}`} aria-hidden>
                              <Icon className="h-4 w-4" />
                            </span>
                          );
                        })()}
                        <button
                          onClick={() => navigate(recordPath(r))}
                          className="block w-full rounded-sm border bg-card px-4 py-3 text-left transition-colors hover:border-foreground/40"
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className={`rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${TYPE_STYLES[r.record_type] ?? ""}`}>{r.record_type}</span>
                            <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                          </span>
                          <span className="mt-2 block font-serif text-lg font-medium leading-snug">{r.title}</span>
                          <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{r.description || r.diagnosis || t("no_details")}</span>
                          <span className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{t("by")} {r.creator_name}</span>
                            <span className="inline-flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              {OPENS[r.record_type] ?? "Open"} <ArrowUpRight className="h-3.5 w-3.5" />
                            </span>
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
          </div>
        </div>

        {/* Side: summary and shortcuts */}
        <aside className="space-y-5 lg:overflow-y-auto">
          <Panel title="Summary" bodyClassName="py-1">
            <Field inline icon={<ClipboardList className="h-3.5 w-3.5" />} label="Prescriptions" value={counts["Prescription"] ?? 0} />
            <Field inline icon={<FileText className="h-3.5 w-3.5" />} label="Lab reports" value={counts["Lab Report"] ?? 0} />
            <Field inline icon={<StickyNote className="h-3.5 w-3.5" />} label="Clinical notes" value={counts["Clinical Note"] ?? 0} />
            <Field inline label="Last visit" value={last ? new Date(last.created_at).toLocaleDateString() : "—"} />
          </Panel>

          <Panel title="Go to" bodyClassName="space-y-2">
            {[
              { to: "/patient/prescriptions", label: "All prescriptions", icon: <ClipboardList className="h-4 w-4" /> },
              { to: "/patient/reports", label: "All lab reports", icon: <FileText className="h-4 w-4" /> },
              { to: "/patient/health-card", label: "My health card", icon: <CreditCard className="h-4 w-4" /> },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="flex items-center gap-3 rounded-sm border px-3 py-2 text-sm transition-colors hover:bg-muted/50">
                <span className="text-muted-foreground">{l.icon}</span>
                {l.label}
                <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </Panel>
        </aside>
      </PanelGrid>
    </DashboardLayout>
  );
};

export default PatientHistory;

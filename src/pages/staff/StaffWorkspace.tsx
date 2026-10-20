import { Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { Panel, PanelGrid } from "@/components/layout/Modular";
import { Users, FileText, Plus, ScanLine, ArrowUpRight, CalendarDays } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const StaffWorkspace = () => {
  const { patients, records } = useData();
  const { user } = useAuth();
  const [orgName, setOrgName] = useState<string>("");

  useEffect(() => {
    if (!user?.organization_id) return;
    supabase
      .from('organizations')
      .select('name')
      .eq('id', user.organization_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setOrgName(data.name);
      });
  }, [user?.organization_id]);

  // Only show patients this doctor has treated or registered
  const myPatients = useMemo(() => {
    if (!user) return [];

    const treatedPatientIds = new Set(
      records
        .filter(r => r.created_by === user.id)
        .map(r => r.patient_id)
    );

    return patients
      .filter(p => treatedPatientIds.has(p.id) || p.created_by === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [patients, records, user]);

  // Only records created by this doctor
  const myRecords = useMemo(() => {
    if (!user) return [];
    return records.filter(r => r.created_by === user.id);
  }, [records, user]);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const newPatientsThisWeek = myPatients.filter(p => new Date(p.created_at) >= weekAgo).length;
  const recordsThisWeek = myRecords.filter(r => new Date(r.created_at) >= weekAgo).length;

  const recentPatients = myPatients.slice(0, 8);
  const recentRecords = [...myRecords]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

  const actions = [
    { to: "/staff/patients/create", label: "New patient", icon: <Plus className="h-4 w-4" /> },
    { to: "/staff/records/create", label: "New record", icon: <FileText className="h-4 w-4" /> },
    { to: "/staff/scan", label: "Scan a patient", icon: <ScanLine className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout role="staff" fit>
      <PageHeader compact title="Staff Dashboard" description={orgName ? `${orgName} — Your patient and record overview` : "Your patient and record overview"} />

      <div className="mb-4 grid shrink-0 gap-2 sm:grid-cols-3 sm:gap-4">
        <StatCard title="My Patients" value={myPatients.length} subtitle={`${newPatientsThisWeek} new this week`} icon={<Users className="h-5 w-5" />} />
        <StatCard title="My Records" value={myRecords.length} subtitle="Created by you" icon={<FileText className="h-5 w-5" />} />
        <StatCard title="This week" value={recordsThisWeek} subtitle="Records written" icon={<CalendarDays className="h-5 w-5" />} />
      </div>

      <PanelGrid className="lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[minmax(0,1fr)]">
        {/* Main module: recent patients */}
        <Panel
          title="Recent patients"
          className="flex min-h-0 flex-col"
          bodyClassName="min-h-0 overflow-y-auto p-0"
          action={<Link to="/staff/patients" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">All patients</Link>}
        >
          {recentPatients.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No patients yet. Add your first patient to get started.</p>
          ) : (
            <ul className="divide-y">
              {recentPatients.map((p) => (
                <li key={p.id}>
                  <Link to={`/staff/patients/${p.id}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border font-serif text-sm">
                      {p.full_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.full_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{p.phone}</span>
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">{shortDate(p.created_at)}</span>
                    <ArrowUpRight className="hidden h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-60 sm:block" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Side modules: quick actions + latest records */}
        <div className="space-y-4 lg:min-h-0 lg:overflow-y-auto">
          <Panel title="Quick actions" bodyClassName="space-y-2">
            {actions.map((a) => (
              <Link key={a.to} to={a.to} className="flex items-center gap-3 rounded-sm border px-3 py-2 text-sm transition-colors hover:bg-muted/50">
                <span className="text-muted-foreground">{a.icon}</span>
                {a.label}
                <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </Panel>

          <Panel title="Latest records" bodyClassName="p-0">
            {recentRecords.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nothing written yet.</p>
            ) : (
              <ul className="divide-y">
                {recentRecords.map((r) => (
                  <li key={r.id}>
                    <Link to={`/staff/records/${r.id}`} className="block px-4 py-2.5 transition-colors hover:bg-muted/40">
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium">{r.title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{shortDate(r.created_at)}</span>
                      </span>
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{r.record_type}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </PanelGrid>
    </DashboardLayout>
  );
};

export default StaffWorkspace;

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { Users, Heart, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const OrgWorkspace = () => {
  const { user } = useAuth();
  const orgId = user?.organization_id;
  const [staffCount, setStaffCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgStats = async () => {
      if (!orgId) {
        setLoading(false);
        return;
      }

      try {
        // Count staff in this org
        const { count: staff } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .in('role', ['doctor', 'lab_staff']);

        // Count medical records from this org
        const { count: records } = await supabase
          .from('medical_records')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId);

        // Count unique patients treated by this org (patients with records from this org)
        const { data: patientIds } = await supabase
          .from('medical_records')
          .select('patient_id')
          .eq('organization_id', orgId);

        const uniquePatients = new Set(patientIds?.map(r => r.patient_id) || []);

        setStaffCount(staff || 0);
        setRecordCount(records || 0);
        setPatientCount(uniquePatients.size);
      } catch (err) {
        console.error('Error fetching org stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgStats();
  }, [orgId]);

  return (
    <DashboardLayout role="org">
      <PageHeader title="Organization Dashboard" description="Overview of your healthcare organization" />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard
            title="Staff Members"
            value={staffCount}
            subtitle="Doctors & lab staff"
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            title="Patients Treated"
            value={patientCount}
            subtitle="Unique patients with records"
            icon={<Heart className="w-5 h-5" />}
          />
          <StatCard
            title="Medical Records"
            value={recordCount.toLocaleString()}
            subtitle="Total records by your org"
            icon={<FileText className="w-5 h-5" />}
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default OrgWorkspace;

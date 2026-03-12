import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, UserPlus, CheckCircle, AlertCircle } from "lucide-react";

interface GovAccount {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  department?: string;
  created_at: string;
}

const AdminGovernment = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [govAccounts, setGovAccounts] = useState<GovAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Public Health");

  // Fetch government accounts from profiles table
  const fetchGovAccounts = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoadingAccounts(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at")
        .eq("role", "government")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching gov accounts:", error);
      } else {
        setGovAccounts(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch gov accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    fetchGovAccounts();
  }, [fetchGovAccounts]);

  // Create government account via edge function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        setFeedback({ type: "error", message: "Not authenticated. Please sign in again." });
        setSubmitting(false);
        return;
      }

      const response = await fetch(
        `https://jkhkgviyxkmuayenohhd.supabase.co/functions/v1/create-gov-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraGtndml5eGttdWF5ZW5vaGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNTY2OTQsImV4cCI6MjA4NjYzMjY5NH0.WDZ4eAyxloZqsrnN_8Bt1VF8EdOpxZoZFRZeKIJT4aI",
          },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            phone,
            department,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        setFeedback({ type: "error", message: result.error || "Failed to create account" });
      } else {
        setFeedback({ type: "success", message: `Government account created for ${fullName}` });
        // Reset form
        setFullName("");
        setEmail("");
        setPassword("");
        setPhone("");
        setDepartment("Public Health");
        setShowForm(false);
        // Refresh the list
        fetchGovAccounts();
      }
    } catch (err) {
      setFeedback({ type: "error", message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Government Accounts"
        description="Create and manage government official accounts for disease surveillance"
        action={
          <Button onClick={() => { setShowForm(!showForm); setFeedback(null); }}>
            {showForm ? "Cancel" : (
              <span className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Create Account
              </span>
            )}
          </Button>
        }
      />

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${feedback.type === "success"
          ? "bg-green-500/10 text-green-700 border border-green-200"
          : "bg-red-500/10 text-red-700 border border-red-200"
          }`}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-card rounded-xl p-6 card-shadow mb-6">
          <h3 className="font-medium mb-4">New Government Account</h3>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                placeholder="Dr. Jane Smith"
                className="mt-1.5"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="jane@health.gov.in"
                className="mt-1.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Password *</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="mt-1.5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                placeholder="+91 9876543210"
                className="mt-1.5"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <Label>Department</Label>
              <Input
                placeholder="Public Health"
                className="mt-1.5"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts Table */}
      {loadingAccounts ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : govAccounts.length === 0 ? (
        <div className="bg-card rounded-xl p-12 text-center card-shadow">
          <p className="text-muted-foreground">No government accounts yet. Click "Create Account" to add one.</p>
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "full_name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "phone", header: "Phone", render: (item: GovAccount) => item.phone || "—" },
            {
              key: "created_at",
              header: "Created",
              render: (item: GovAccount) => new Date(item.created_at).toLocaleDateString(),
            },
          ]}
          data={govAccounts}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminGovernment;

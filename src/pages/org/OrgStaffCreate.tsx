import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileCheck, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const OrgStaffCreate = () => {
  const navigate = useNavigate();
  const [staffType, setStaffType] = useState("doctor");
  const [fileName, setFileName] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        `https://jkhkgviyxkmuayenohhd.supabase.co/functions/v1/create-staff-user`,
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
            staff_type: staffType,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok || result.error) {
        setFeedback({ type: "error", message: result.error || "Failed to create staff account" });
      } else {
        setFeedback({ type: "success", message: `${staffType === "doctor" ? "Doctor" : "Lab Staff"} account created for ${fullName}` });
        // Wait briefly then navigate back
        setTimeout(() => navigate("/org/staff"), 1500);
      }
    } catch (err) {
      const msg = (err as Error).name === 'AbortError'
        ? 'Request timed out. The server may be warming up — please try again.'
        : (err as Error).message;
      setFeedback({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="org">
      <PageHeader title="Add Staff Member" description="Create a new medical staff account" />

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

      <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input
              placeholder="Dr. Jane Smith"
              className="mt-1.5 h-11 sm:h-10"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="jane.smith@hospital.com"
              className="mt-1.5 h-11 sm:h-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              className="mt-1.5 h-11 sm:h-10"
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
              className="mt-1.5 h-11 sm:h-10"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <Label>Staff Type</Label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-1.5">
              {["doctor", "lab"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setStaffType(type)}
                  className={`flex-1 py-3 sm:py-2.5 rounded-lg border text-sm font-medium transition-colors ${staffType === type ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
                    }`}
                >
                  {type === "doctor" ? "Doctor" : "Lab Staff"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Medical Certificate</Label>
            {fileName ? (
              <div className="mt-1.5 flex items-center gap-3 p-3 sm:p-4 border rounded-lg bg-muted/30">
                <FileCheck className="w-5 h-5 text-accent-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                  <p className="text-xs text-muted-foreground">Ready to upload</p>
                </div>
                <button type="button" onClick={() => setFileName(null)} className="text-xs text-muted-foreground hover:text-foreground">Remove</button>
              </div>
            ) : (
              <label className="block mt-1.5 border-2 border-dashed rounded-lg p-6 sm:p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Tap to upload certificate</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG (max 10MB)</p>
                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => { if (e.target.files?.[0]) setFileName(e.target.files[0].name); }} />
              </label>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button type="submit" className="h-11 sm:h-10" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Staff Account"
              )}
            </Button>
            <Button type="button" variant="outline" className="h-11 sm:h-10" onClick={() => navigate("/org/staff")}>Cancel</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default OrgStaffCreate;

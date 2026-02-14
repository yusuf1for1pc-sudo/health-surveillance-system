import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileCheck } from "lucide-react";

const OrgStaffCreate = () => {
  const navigate = useNavigate();
  const [staffType, setStaffType] = useState("doctor");
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <DashboardLayout role="org">
      <PageHeader title="Add Staff Member" description="Create a new medical staff account" />
      <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow max-w-lg">
        <form onSubmit={(e) => { e.preventDefault(); navigate("/org/staff"); }} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input placeholder="Dr. Jane Smith" className="mt-1.5 h-11 sm:h-10" required />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="jane.smith@hospital.com" className="mt-1.5 h-11 sm:h-10" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" className="mt-1.5 h-11 sm:h-10" required />
          </div>
          <div>
            <Label>Staff Type</Label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-1.5">
              {["doctor", "lab"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setStaffType(type)}
                  className={`flex-1 py-3 sm:py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    staffType === type ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
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
            <Button type="submit" className="h-11 sm:h-10">Create Staff Account</Button>
            <Button type="button" variant="outline" className="h-11 sm:h-10" onClick={() => navigate("/org/staff")}>Cancel</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default OrgStaffCreate;

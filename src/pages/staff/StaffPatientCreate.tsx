import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const StaffPatientCreate = () => {
  const navigate = useNavigate();
  return (
    <DashboardLayout role="staff">
      <PageHeader title="Add Patient" description="Register a new patient" />
      <div className="bg-card rounded-xl p-6 card-shadow max-w-lg">
        <form onSubmit={(e) => { e.preventDefault(); navigate("/staff/patients"); }} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input placeholder="John Doe" className="mt-1.5" required />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input type="tel" placeholder="+1 (555) 000-0000" className="mt-1.5" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Gender</Label>
              <div className="flex gap-2 mt-1.5">
                {["Male", "Female", "Other"].map((g) => (
                  <button key={g} type="button" className="flex-1 py-2 rounded-lg border text-sm hover:bg-muted transition-colors">{g}</button>
                ))}
              </div>
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" className="mt-1.5" required />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit">Create Patient</Button>
            <Button type="button" variant="outline" onClick={() => navigate("/staff/patients")}>Cancel</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default StaffPatientCreate;

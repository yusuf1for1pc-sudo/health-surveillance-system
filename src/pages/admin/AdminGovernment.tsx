import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const govAccounts = [
  { name: "Dr. Sarah Chen", email: "sarah.chen@gov.health", role: "Epidemiologist" },
  { name: "James Wright", email: "j.wright@gov.health", role: "Public Health Officer" },
];

const AdminGovernment = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Government Accounts"
        description="Create and manage government user accounts"
        action={<Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "Create Account"}</Button>}
      />

      {showForm && (
        <div className="bg-card rounded-xl p-6 card-shadow mb-6">
          <form onSubmit={(e) => { e.preventDefault(); setShowForm(false); }} className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input placeholder="Name" className="mt-1.5" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="name@gov.health" className="mt-1.5" required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" className="mt-1.5" required />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit">Create Account</Button>
            </div>
          </form>
        </div>
      )}

      <DataTable
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          { key: "role", header: "Role" },
        ]}
        data={govAccounts}
      />
    </DashboardLayout>
  );
};

export default AdminGovernment;

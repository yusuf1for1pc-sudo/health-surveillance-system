import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const roleFromPath = (path: string): string => {
  const segment = path.split("/")[1];
  return segment || "patient";
};

const Profile = () => {
  const location = useLocation();
  const role = roleFromPath(location.pathname);

  return (
    <DashboardLayout role={role}>
      <PageHeader title="Profile" description="Manage your account settings" />
      <div className="bg-card rounded-xl p-6 card-shadow max-w-lg">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input defaultValue="Demo User" className="mt-1.5" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" defaultValue="user@tempest.com" className="mt-1.5" disabled />
          </div>
          <div>
            <Label>New Password</Label>
            <Input type="password" placeholder="Leave blank to keep current" className="mt-1.5" />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input type="password" placeholder="Confirm new password" className="mt-1.5" />
          </div>
          <Button type="submit">Update Profile</Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Profile;

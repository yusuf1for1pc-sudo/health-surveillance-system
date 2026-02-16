import { Link, useLocation, useNavigate } from "react-router-dom";
import { ReactNode, useState } from "react";
import {
  LayoutDashboard, Users, Building2, Shield, User, FileText,
  ClipboardList, Activity, AlertTriangle, BarChart3, Heart,
  History, CreditCard, Menu, X, LogOut, ChevronLeft
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const roleNavItems: Record<string, NavItem[]> = {
  admin: [
    { label: "Workspace", path: "/admin/workspace", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Organizations", path: "/admin/organizations", icon: <Building2 className="w-5 h-5" /> },
    { label: "Government", path: "/admin/government", icon: <Shield className="w-5 h-5" /> },
    { label: "Profile", path: "/admin/profile", icon: <User className="w-5 h-5" /> },
  ],
  org: [
    { label: "Workspace", path: "/org/workspace", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Staff", path: "/org/staff", icon: <Users className="w-5 h-5" /> },
    { label: "Patients", path: "/org/patients", icon: <Heart className="w-5 h-5" /> },
    { label: "Profile", path: "/org/profile", icon: <User className="w-5 h-5" /> },
  ],
  staff: [
    { label: "Workspace", path: "/staff/workspace", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Scan Patient", path: "/staff/scan", icon: <Activity className="w-5 h-5" /> },
    { label: "Patients", path: "/staff/patients", icon: <Users className="w-5 h-5" /> },
    { label: "Records", path: "/staff/records", icon: <FileText className="w-5 h-5" /> },
    { label: "Profile", path: "/staff/profile", icon: <User className="w-5 h-5" /> },
  ],
  patient: [
    { label: "Workspace", path: "/patient/workspace", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "History", path: "/patient/history", icon: <History className="w-5 h-5" /> },
    { label: "Prescriptions", path: "/patient/prescriptions", icon: <ClipboardList className="w-5 h-5" /> },
    { label: "Reports", path: "/patient/reports", icon: <FileText className="w-5 h-5" /> },
    { label: "Health Card", path: "/patient/health-card", icon: <CreditCard className="w-5 h-5" /> },
    { label: "Profile", path: "/patient/profile", icon: <User className="w-5 h-5" /> },
  ],
  gov: [
    { label: "Workspace", path: "/gov/workspace", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Surveillance", path: "/gov/surveillance", icon: <Activity className="w-5 h-5" /> },
    { label: "Alerts", path: "/gov/alerts", icon: <AlertTriangle className="w-5 h-5" /> },
    { label: "Reports", path: "/gov/reports", icon: <BarChart3 className="w-5 h-5" /> },
    { label: "Profile", path: "/gov/profile", icon: <User className="w-5 h-5" /> },
  ],
};

const roleLabels: Record<string, string> = {
  admin: "Platform Admin",
  org: "Organization",
  staff: "Medical Staff",
  patient: "Patient",
  gov: "Government",
};

interface DashboardLayoutProps {
  children: ReactNode;
  role: string;
}

const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = roleNavItems[role] || [];
  const themeClass = `theme-${role}`;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className={`min-h-screen flex ${themeClass}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-card border-r z-50 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-6 border-b flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-foreground">Tempest</span>
          </Link>
          <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {roleLabels[role]}
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          {user && (
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b px-4 lg:px-8 h-14 flex items-center">
          <button className="lg:hidden mr-4 text-muted-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm text-muted-foreground">
            {roleLabels[role]} Portal
          </div>
        </header>

        <main className="p-4 lg:p-8 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

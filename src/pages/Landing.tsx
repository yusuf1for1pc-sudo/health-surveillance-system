import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Users, Building2, Activity, ArrowRight, Heart, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, getRoleRedirectPath } from "@/contexts/AuthContext";

const features = [
  {
    icon: <Building2 className="w-6 h-6" />,
    title: "Organization Management",
    description: "Register and manage healthcare organizations with certificate verification.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Staff Management",
    description: "Onboard doctors and lab staff with credential verification workflows.",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Medical Records",
    description: "Create, store, and share prescriptions, lab reports, and clinical notes.",
  },
  {
    icon: <Activity className="w-6 h-6" />,
    title: "Disease Surveillance",
    description: "Government-level analytics for monitoring public health trends.",
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (user) {
      navigate(getRoleRedirectPath(user.role), { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background theme-landing">
      {/* Nav */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-lg text-foreground">Tempest</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register/organization">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm mb-6">
              <Shield className="w-4 h-4" />
              Secure Healthcare Platform
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Your Trusted Partner for Better Healthcare
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg">
              A unified platform connecting organizations, medical staff, patients, and government agencies for seamless healthcare delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register/organization">
                <Button size="lg">
                  Register Organization
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/register/patient">
                <Button variant="outline" size="lg">Register as Patient</Button>
              </Link>
            </div>

            {/* Quick stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              {[
                { value: "Multi-Role", label: "Access Control" },
                { value: "Secure", label: "Data Storage" },
                { value: "Real-time", label: "Analytics" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-sm font-semibold text-primary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right side — feature grid */}
          <div className="grid grid-cols-2 gap-4" style={{ animationDelay: "0.1s" }}>
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-card rounded-xl p-5 card-shadow hover:card-shadow-hover transition-shadow animate-fade-in"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <div className="p-2 rounded-lg bg-accent text-accent-foreground w-fit mb-3">
                  {f.icon}
                </div>
                <h3 className="font-medium text-foreground text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role demo links */}
      <section className="bg-card border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-2">Explore by Role</h2>
          <p className="text-muted-foreground text-center mb-10">Click a role below to preview the dashboard experience.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Admin", path: "/admin/workspace", icon: <Shield className="w-5 h-5" />, desc: "Platform overview" },
              { label: "Organization", path: "/org/workspace", icon: <Building2 className="w-5 h-5" />, desc: "Manage staff & patients" },
              { label: "Medical Staff", path: "/staff/workspace", icon: <Heart className="w-5 h-5" />, desc: "Patient records" },
              { label: "Patient", path: "/patient/workspace", icon: <Users className="w-5 h-5" />, desc: "Health history" },
              { label: "Government", path: "/gov/workspace", icon: <BarChart3 className="w-5 h-5" />, desc: "Surveillance data" },
            ].map((role) => (
              <Link
                key={role.path}
                to={role.path}
                className="bg-background rounded-xl p-5 border hover:border-primary/30 hover:card-shadow-hover transition-all text-center group"
              >
                <div className="p-2.5 rounded-lg bg-accent text-accent-foreground w-fit mx-auto mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {role.icon}
                </div>
                <h3 className="font-medium text-foreground text-sm">{role.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{role.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 Tempest Healthcare Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;

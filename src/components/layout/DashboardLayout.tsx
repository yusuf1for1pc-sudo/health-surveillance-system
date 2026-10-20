import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { ReactNode, useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";

// The rail remounts on every page change; remember where it was scrolled so it stays put
let railScrollTop = 0;
import {
  LayoutDashboard, Users, Building2, Shield, User, FileText,
  ClipboardList, Activity, AlertTriangle, BarChart3, Heart,
  History, CreditCard, Menu, X, LogOut, ChevronLeft, ChevronRight, Loader2, FlaskConical
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { checkHealth } from "@/lib/mlApi";
import { isDemoSession } from "@/lib/demoAccounts";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const ic = "w-[18px] h-[18px]";

const roleNavItems: Record<string, NavItem[]> = {
  admin: [
    { label: "Workspace", path: "/admin/workspace", icon: <LayoutDashboard className={ic} /> },
    { label: "Organizations", path: "/admin/organizations", icon: <Building2 className={ic} /> },
    { label: "Government", path: "/admin/government", icon: <Shield className={ic} /> },
    { label: "Profile", path: "/admin/profile", icon: <User className={ic} /> },
  ],
  org: [
    { label: "Workspace", path: "/org/workspace", icon: <LayoutDashboard className={ic} /> },
    { label: "Staff", path: "/org/staff", icon: <Users className={ic} /> },
    { label: "Patients", path: "/org/patients", icon: <Heart className={ic} /> },
    { label: "Profile", path: "/org/profile", icon: <User className={ic} /> },
  ],
  staff: [
    { label: "Workspace", path: "/staff/workspace", icon: <LayoutDashboard className={ic} /> },
    { label: "Scan Patient", path: "/staff/scan", icon: <Activity className={ic} /> },
    { label: "Patients", path: "/staff/patients", icon: <Users className={ic} /> },
    { label: "Records", path: "/staff/records", icon: <FileText className={ic} /> },
    { label: "Profile", path: "/staff/profile", icon: <User className={ic} /> },
  ],
  patient: [
    { label: "Workspace", path: "/patient/workspace", icon: <LayoutDashboard className={ic} /> },
    { label: "History", path: "/patient/history", icon: <History className={ic} /> },
    { label: "Prescriptions", path: "/patient/prescriptions", icon: <ClipboardList className={ic} /> },
    { label: "Reports", path: "/patient/reports", icon: <FileText className={ic} /> },
    { label: "Health Card", path: "/patient/health-card", icon: <CreditCard className={ic} /> },
    { label: "Profile", path: "/patient/profile", icon: <User className={ic} /> },
  ],
  gov: [
    { label: "Workspace", path: "/gov/workspace", icon: <LayoutDashboard className={ic} /> },
    { label: "Surveillance", path: "/gov/surveillance", icon: <Activity className={ic} /> },
    { label: "Alerts", path: "/gov/alerts", icon: <AlertTriangle className={ic} /> },
    { label: "Reports", path: "/gov/reports", icon: <BarChart3 className={ic} /> },
    { label: "Simulator", path: "/gov/simulator", icon: <FlaskConical className={ic} /> },
    { label: "Profile", path: "/gov/profile", icon: <User className={ic} /> },
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
  /** Desktop: fit the page to the screen so only inner panels scroll, never the whole page. */
  fit?: boolean;
}

type MlState = "checking" | "online" | "offline" | "demo";

/** Polls the ML backend; demo accounts use the built-in offline engine instead. */
const useMlHealth = () => {
  const [state, setState] = useState<MlState>("checking");

  const check = useCallback(async () => {
    setState((s) => (s === "online" || s === "offline" || s === "demo" ? s : "checking"));
    const up = await checkHealth();
    // Demo accounts use the real server when it is up, otherwise the built-in engine
    setState(up ? "online" : isDemoSession() ? "demo" : "offline");
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [check]);

  return { state, recheck: check };
};

const mlLabels: Record<MlState, { text: string; dot: string; hint: string }> = {
  checking: { text: "Checking…", dot: "bg-muted-foreground", hint: "Checking the ML engine" },
  online: { text: "ML engine online", dot: "bg-success", hint: "The ML backend is reachable" },
  offline: { text: "ML engine offline", dot: "bg-danger", hint: "The ML backend can't be reached. Start it and click to re-check." },
  demo: { text: "Demo engine", dot: "bg-warning", hint: "ML server not reachable: this demo account is using the built-in offline engine" },
};

const MlStatusPill = ({ state, onClick }: { state: MlState; onClick: () => void }) => {
  const m = mlLabels[state];
  return (
    <button
      type="button"
      onClick={onClick}
      title={m.hint}
      aria-label={`${m.text}. ${m.hint}`}
      className="mr-4 inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className={`relative inline-block h-2 w-2 rounded-full ${m.dot} ${state === "online" ? "pulse-dot" : ""}`} />
      <span className="hidden sm:inline">{m.text}</span>
    </button>
  );
};

const ApiHealthBanner = ({ state }: { state: MlState }) => {
  if (state !== "offline") return null;

  return (
    <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center justify-center gap-2 text-xs font-medium text-destructive w-full sticky top-14 z-30 backdrop-blur-sm">
      <AlertTriangle className="h-4 w-4" />
      <span>ML Analytics Engine is currently offline. Simulator and Surveillance features may be unavailable.</span>
    </div>
  );
};

const RAIL_KEY = "tempest-rail-expanded";

const DashboardLayout = ({ children, role, fit = false }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, loading } = useAuth();
  const railNavRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (railNavRef.current) railNavRef.current.scrollTop = railScrollTop;
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem(RAIL_KEY) === "1"; } catch { return false; }
  });
  const navItems = roleNavItems[role] || [];
  const themeClass = `theme-${role}`;
  const demo = isDemoSession();
  const showMl = role === "gov" || role === "admin" || demo; // status pill: ML-heavy roles and every demo account
  const showBanner = role === "gov" || role === "admin"; // unchanged: the offline banner is only for these roles
  const ml = useMlHealth();

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    try { localStorage.setItem(RAIL_KEY, next ? "1" : "0"); } catch { /* storage unavailable */ }
  };

  // Protect the route
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleSignOut = async () => {
    // signOut clears local state synchronously; don't make the user wait on the network
    const pending = signOut();
    navigate("/login", { replace: true });
    await pending;
  };

  const iconBtn =
    "inline-flex h-9 w-9 items-center justify-center rounded-sm border border-sidebar-foreground/40 text-sidebar-foreground transition-colors hover:bg-rail-active hover:text-rail-active-foreground";
  const ghostBtn =
    "hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-sm text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground";

  // Vertical-tab rail (labels read top to bottom, like the reference) when `wide` is false,
  // horizontal labels when true.
  const renderRail = (wide: boolean) => (
    <>
      <Link
        to="/"
        className={`flex items-center border-b border-sidebar-border h-16 shrink-0 ${wide ? "px-5 gap-3" : "justify-center"}`}
        aria-label="Tempest home"
      >
        <span className="font-serif text-3xl font-semibold leading-none text-sidebar-foreground">T</span>
        {wide && <span className="font-serif text-xl font-semibold tracking-wide text-sidebar-foreground">Tempest</span>}
      </Link>

      {wide ? (
        <div className="px-5 py-3 border-b border-sidebar-border">
          <span className="eyebrow !text-sidebar-foreground/70">{roleLabels[role] || "User"}</span>
        </div>
      ) : (
        <div
          className="h-10 shrink-0 border-b border-sidebar-border flex items-center justify-center"
          title={roleLabels[role]}
        >
          <span className="block w-2 h-2 rounded-full bg-role-accent" />
        </div>
      )}

      <nav ref={railNavRef} onScroll={(e) => { railScrollTop = e.currentTarget.scrollTop; }} className="flex-1 overflow-y-auto flex flex-col" aria-label={`${roleLabels[role] || "User"} navigation`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          const base =
            "rail-tab relative flex items-center transition-colors border-b border-sidebar-border focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";
          const state = isActive
            ? "bg-rail-active text-rail-active-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
          return wide ? (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setDrawerOpen(false)}
              className={`${base} ${state} gap-3 px-5 py-4 font-serif text-lg`}
            >
              {item.icon}
              {item.label}
            </Link>
          ) : (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
              className={`${base} ${state} flex-col justify-start gap-3 py-6 [@media(max-height:820px)]:py-4 flex-auto shrink-0`}
            >
              <span className="rail-icon">{item.icon}</span>
              <span className="rail-label vertical-text font-serif text-[17px] [@media(max-height:820px)]:text-[15px] leading-none tracking-wide whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border">
        {wide && user && (
          <div className="px-5 py-3 border-b border-sidebar-border">
            <p className="text-sm font-medium truncate text-sidebar-foreground">{user.full_name}</p>
            <p className="text-xs truncate text-sidebar-foreground/70">{user.email}</p>
          </div>
        )}
        <div className={`flex ${wide ? "flex-row items-center justify-between px-3 py-3" : "flex-col items-center gap-2 py-3"}`}>
          <ThemeToggle onRail />
          <button onClick={() => setShowSignOutModal(true)} aria-label="Sign out" title="Sign out" className={iconBtn}>
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={toggleExpanded}
            aria-label={wide ? "Collapse sidebar" : "Expand sidebar"}
            title={wide ? "Collapse to vertical tabs" : "Expand sidebar (horizontal labels)"}
            className={ghostBtn}
          >
            {wide ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className={`min-h-screen flex ${themeClass}`}>
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Mobile drawer (horizontal labels) */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-screen w-64 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-transform ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button
          className="absolute top-5 right-3 text-sidebar-foreground/70"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        {renderRail(true)}
      </aside>

      {/* Desktop rail */}
      <aside
        className={`hidden lg:flex sticky top-0 h-screen shrink-0 flex-col bg-sidebar border-r border-sidebar-border transition-[width] duration-300 ${expanded ? "w-64" : "w-[84px]"}`}
      >
        {renderRail(expanded)}
      </aside>

      {showSignOutModal &&
        createPortal(
          <div className={themeClass}>
            <div className="fixed inset-0 bg-black/40 z-[100]" onClick={() => setShowSignOutModal(false)} />
            <div
              className="fixed bottom-4 left-4 lg:left-24 w-64 z-[101] bg-card text-card-foreground rounded-sm border border-foreground/30 shadow-xl p-4"
              role="dialog"
              aria-label="Confirm sign out"
            >
              <p className="font-serif text-xl">Sign out?</p>
              <p className="text-xs text-muted-foreground mb-4">You'll need to sign in again.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSignOutModal(false)}
                  className="flex-1 px-3 py-2 rounded-sm text-sm border border-foreground/30 hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowSignOutModal(false); handleSignOut(); }}
                  className="flex-1 px-3 py-2 rounded-sm text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-sm border-b px-4 lg:px-10 h-14 flex items-center">
          <button className="lg:hidden mr-4 text-foreground" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="eyebrow">{roleLabels[role]} Portal</div>
          <div className="flex-1" />
          {demo && (
            // Only visible on the offline demo session (real Supabase sign-ins never show it); deliberately unlabeled
            <span
              title="Offline demo data"
              className="mr-3 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500 dark:bg-violet-400"
            />
          )}
          {showMl && <MlStatusPill state={ml.state} onClick={ml.recheck} />}
          {role === "patient" && <LanguageSwitcher />}
        </header>

        {showBanner && <ApiHealthBanner state={ml.state} />}

        <main
          className={
            fit
              ? "page-stagger flex max-w-[1680px] flex-col p-4 lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden lg:px-10 lg:pb-6 lg:pt-6 print:!h-auto print:!overflow-visible"
              : "page-stagger p-4 lg:p-10 max-w-[1680px]"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

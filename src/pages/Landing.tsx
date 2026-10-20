import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from "framer-motion";
import {
  Shield, Users, Building2, ArrowRight, Heart, BarChart3, ArrowUpRight, Brain, Radar, LineChart,
  Home, Layers, UserCircle, Flag,
} from "lucide-react";
import { useAuth, getRoleRedirectPath } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

const sections = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "capabilities", label: "Capabilities", icon: Layers },
  { id: "roles", label: "Roles", icon: UserCircle },
  { id: "begin", label: "Begin", icon: Flag },
];

const features = [
  { icon: Building2, title: "Organization Management", text: "Register healthcare organizations with certificate verification and staff onboarding." },
  { icon: Brain, title: "AI Clinical Suggestions", text: "Gemini-powered prescription and clinical note generation for medical staff." },
  { icon: LineChart, title: "Prophet Forecasting", text: "Time-series disease forecasting with confidence intervals and outbreak simulation." },
  { icon: Radar, title: "ML Surveillance", text: "DBSCAN hotspot detection, Isolation Forest anomalies, and R-value monitoring." },
];

const roles = [
  { label: "Admin", path: "/admin/workspace", icon: Shield, desc: "Platform overview" },
  { label: "Organization", path: "/org/workspace", icon: Building2, desc: "Manage staff & patients" },
  { label: "Medical Staff", path: "/staff/workspace", icon: Heart, desc: "Patient records" },
  { label: "Patient", path: "/patient/workspace", icon: Users, desc: "Health history" },
  { label: "Government", path: "/gov/workspace", icon: BarChart3, desc: "Surveillance data" },
];

const stats = [
  { n: "5", l: "Roles, one platform" },
  { n: "4", l: "ML models watching" },
  { n: "24/7", l: "Secure record storage" },
];

const ticker = ["Prophet forecasting", "DBSCAN hotspots", "Isolation Forest", "R-value monitoring", "Gemini reports", "Clinical decision support", "Multilingual patient records"];

const ease = [0.2, 0.7, 0.2, 1] as const;

/** Headline that reveals word by word from behind a mask. */
const SplitHeadline = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => (
  <h1 className={className} aria-label={text}>
    {text.split(" ").map((w, i) => (
      <span key={i} className="mr-[0.25em] inline-block overflow-hidden pb-[0.12em] align-bottom" aria-hidden>
        <motion.span
          className="inline-block"
          initial={{ y: "110%", rotate: 4 }}
          animate={{ y: 0, rotate: 0 }}
          transition={{ duration: 0.9, ease, delay: delay + i * 0.09 }}
        >
          {w}
        </motion.span>
      </span>
    ))}
  </h1>
);

const Reveal = ({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.8, ease, delay }}
  >
    {children}
  </motion.div>
);

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [active, setActive] = useState("overview");
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -70]);
  const heroFade = useTransform(scrollYProgress, [0, 0.22], [1, 0.25]);

  useEffect(() => {
    if (user) navigate(getRoleRedirectPath(user.role), { replace: true });
  }, [user, navigate]);

  // Scroll-spy for the tab rail
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });

  return (
    <div className="theme-landing min-h-screen text-foreground">
      {/* scroll progress */}
      <motion.div className="fixed left-0 right-0 top-0 z-[60] h-[3px] origin-left bg-foreground" style={{ scaleX: progress }} />

      {/* Grey tab rail: vertical labels, divided by thin lines, active tab dark (as in the reference) */}
      <nav className="fixed bottom-0 left-0 top-0 z-50 hidden w-[84px] flex-col border-r border-sidebar-border bg-sidebar md:flex" aria-label="Sections">
        <button onClick={() => go("overview")} className="h-16 border-b border-sidebar-border font-serif text-3xl font-semibold text-sidebar-foreground" aria-label="Back to top">T</button>
        <div className="flex h-12 items-center justify-center border-b border-sidebar-border"><ThemeToggle onRail className="h-8 w-8 border-0" /></div>
        {sections.map((s) => {
          const on = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => go(s.id)}
              aria-current={on ? "true" : undefined}
              title={s.label}
              className={`rail-tab relative flex min-h-[120px] flex-1 items-center justify-center border-b border-sidebar-border transition-colors ${on ? "bg-rail-active text-rail-active-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}
            >
              <span className="rail-label vertical-text font-serif text-[18px] tracking-wide">{s.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Black edge tab */}
      <Link
        to="/login"
        className="fixed right-0 top-1/2 z-50 hidden -translate-y-1/2 items-center justify-center bg-foreground px-3 py-8 text-background transition-all hover:px-5 md:flex"
      >
        <span className="vertical-text rotate-180 font-sans text-xs font-bold uppercase tracking-[0.25em]">Sign in</span>
      </Link>

      {/* Mobile bar */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-sidebar px-4 md:hidden">
        <span className="font-serif text-2xl font-semibold text-sidebar-foreground">Tempest</span>
        <div className="flex items-center gap-2">
          <ThemeToggle onRail />
          <Link to="/login" className="inline-flex h-9 items-center bg-foreground px-4 text-sm text-background">Sign in</Link>
        </div>
      </header>

      <main className="md:pl-[84px]">
        {/* Overview */}
        <section id="overview" className="relative flex min-h-screen items-center overflow-hidden px-6 pb-24 pt-20 md:px-16 lg:px-24">
          <motion.div style={{ y: heroY, opacity: heroFade }} className="mx-auto w-full max-w-5xl">
            <motion.p className="eyebrow mb-6 flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <span className="block h-px w-10 bg-foreground/60" /> Tempest · Health surveillance
            </motion.p>
            <SplitHeadline
              text="Your trusted partner for better healthcare"
              className="font-serif text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl xl:text-8xl"
              delay={0.25}
            />
            <motion.p
              className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8, ease }}
            >
              AI-powered health surveillance connecting organizations, medical staff, patients, and government agencies with Prophet forecasting, anomaly detection, and Gemini AI reports.
            </motion.p>
            <motion.div className="mt-10 flex flex-wrap gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15, duration: 0.8, ease }}>
              <Link to="/register/organization" className="group inline-flex h-12 items-center gap-2 bg-foreground px-7 text-background transition-all hover:gap-4">
                Register Organization <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/register/patient" className="inline-flex h-12 items-center border border-foreground/50 px-7 transition-colors hover:bg-foreground hover:text-background">
                Register as Patient
              </Link>
            </motion.div>

            <motion.dl
              className="mt-16 grid max-w-3xl grid-cols-3 gap-6 border-t pt-8"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.35, duration: 0.8, ease }}
            >
              {stats.map((st) => (
                <div key={st.l}>
                  <dt className="font-serif text-4xl font-medium text-foreground sm:text-5xl">{st.n}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground sm:text-sm">{st.l}</dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>

        </section>

        {/* Marquee */}
        <div className="marquee overflow-hidden bg-foreground py-5 text-background">
          <div className="marquee-track flex w-max gap-12 font-serif text-2xl italic">
            {[...ticker, ...ticker].map((t, i) => (
              <span key={i} className="flex items-center gap-12 whitespace-nowrap">{t}<span className="not-italic text-background/60">✦</span></span>
            ))}
          </div>
        </div>

        {/* Capabilities: charcoal section */}
        <section id="capabilities" className="dark bg-background px-6 py-28 text-foreground md:px-16 lg:px-24">
          <div className="mx-auto max-w-7xl">
            <Reveal><p className="eyebrow mb-4 flex items-center gap-3"><span className="block h-px w-10 bg-foreground/60" /> Capabilities</p></Reveal>
            <Reveal delay={0.05}><h2 className="max-w-3xl font-serif text-4xl font-medium leading-tight sm:text-6xl">Intelligence at every layer of care.</h2></Reveal>
            <div className="mt-16 grid border-l border-t sm:grid-cols-2">
              {features.map((f, i) => (
                <Reveal key={f.title} delay={i * 0.08} className="border-b border-r">
                  <div className="group relative h-full overflow-hidden p-8 transition-colors duration-500 hover:bg-foreground hover:text-background sm:p-10">
                    <span className="absolute right-6 top-4 font-serif text-6xl text-foreground/10 transition-colors group-hover:text-background/20">0{i + 1}</span>
                    <f.icon className="mb-10 h-7 w-7 text-foreground/70 transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-6" />
                    <h3 className="font-serif text-3xl font-medium">{f.title}</h3>
                    <p className="mt-3 max-w-sm text-muted-foreground transition-colors group-hover:text-background/70">{f.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="px-6 py-28 md:px-16 lg:px-24">
          <div className="mx-auto max-w-7xl">
            <Reveal><p className="eyebrow mb-4 flex items-center gap-3"><span className="block h-px w-10 bg-foreground/60" /> Explore by role</p></Reveal>
            <Reveal delay={0.05}><h2 className="max-w-3xl font-serif text-4xl font-medium leading-tight sm:text-6xl">One platform. Five perspectives.</h2></Reveal>
            <div className="mt-14 border-t">
              {roles.map((r, i) => (
                <Reveal key={r.path} delay={i * 0.06}>
                  <Link to={r.path} className="group flex items-center gap-6 border-b py-7 transition-all duration-500 hover:bg-card hover:pl-6">
                    <span className="w-10 font-serif text-xl text-muted-foreground">0{i + 1}</span>
                    <r.icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-foreground" />
                    <span className="flex-1 font-serif text-3xl sm:text-5xl">{r.label}</span>
                    <span className="hidden text-muted-foreground sm:block">{r.desc}</span>
                    <ArrowUpRight className="h-6 w-6 opacity-30 transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-foreground group-hover:opacity-100" />
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Begin: handwritten close on paper */}
        <section id="begin" className="relative overflow-hidden border-t bg-card px-6 py-40 text-center md:px-16 lg:px-24">
          <Reveal><p className="eyebrow mb-8">Begin</p></Reveal>
          <motion.h2
            className="font-script text-6xl leading-tight sm:text-8xl"
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            whileInView={{ clipPath: "inset(0 0% 0 0)" }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 2.2, ease: "easeInOut" }}
          >
            The future of care<br />belongs to you.
          </motion.h2>
          <Reveal delay={0.4} className="mt-14 flex flex-wrap justify-center gap-3">
            <Link to="/login" className="inline-flex h-12 items-center gap-2 bg-foreground px-8 text-background transition-all hover:gap-4">Sign in <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/register/patient" className="inline-flex h-12 items-center border border-foreground/50 px-8 transition-colors hover:bg-foreground hover:text-background">Create account</Link>
          </Reveal>
        </section>

        <footer className="border-t py-8 text-center text-sm text-muted-foreground">
          <p>© 2026 Tempest Healthcare Platform. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export default Landing;

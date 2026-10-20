import { useBackToLanding } from "@/hooks/use-back-to-landing";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, getRoleRedirectPath } from "@/contexts/AuthContext";
import { DEMO_ACCOUNTS } from "@/lib/demoAccounts";
import { Stethoscope, User, Shield, Building2, Activity, ChevronLeft } from "lucide-react";

const demoIcons: Record<string, typeof User> = {
  Doctor: Stethoscope,
  Patient: User,
  "Org Admin": Building2,
  Admin: Shield,
  Government: Activity,
};
const demoAccounts = DEMO_ACCOUNTS.map((a) => ({ ...a, icon: demoIcons[a.label] ?? User }));




import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import ComicStory from "@/components/auth/ComicStory";

const Login = () => {
  useBackToLanding();
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If user is already authenticated, redirect to their dashboard
  // They can only see this page after signing out
  useEffect(() => {
    if (user) {
      navigate(getRoleRedirectPath(user.role), { replace: true });
    }
  }, [user, navigate]);

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setError("");
    setLoading(true);
    try {
      const result = await signIn(demoEmail, demoPassword);

      if (result.error) {
        setError("Demo login failed: " + result.error);
      } else if (result.role) {
        navigate(getRoleRedirectPath(result.role as any), { replace: true });
      }
    } catch {
      setError("Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
      } else if (result.role) {
        navigate(getRoleRedirectPath(result.role as any), { replace: true });
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Form side: full height, scrolls with the page instead of inside a box */}
      <div className="auth-enter flex min-h-screen flex-col px-6 py-6 sm:px-12 lg:px-16 xl:px-24">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back to Home
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto my-auto w-full max-w-md py-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-foreground">
              <span className="font-serif text-xl font-semibold text-background">T</span>
            </div>
            <span className="font-serif text-2xl font-semibold tracking-wide">Tempest</span>
          </div>

          <p className="eyebrow mb-3">Sign in</p>
          <h1 className="font-serif text-5xl font-medium leading-none">Welcome back</h1>
          <p className="mb-8 mt-3 text-muted-foreground">Sign in to your account to continue.</p>

          <Tabs defaultValue="email" className="w-full">

            <TabsContent value="email">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" required />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

                <Button type="submit" className="h-11 w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Demo access: one compact row */}
          <div className="mt-8">
            <div className="relative mb-4 flex items-center">
              <div className="flex-1 border-t" />
              <span className="eyebrow px-3">Quick demo access</span>
              <div className="flex-1 border-t" />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin(acc.email, acc.password)}
                  title={`Sign in as ${acc.label}`}
                  className="flex flex-col items-center gap-1.5 rounded-sm border border-foreground/25 px-1 py-3 text-[11px] font-medium transition-all hover:-translate-y-0.5 hover:bg-foreground hover:text-background disabled:opacity-50"
                >
                  <acc.icon className="h-[18px] w-[18px]" />
                  <span className="max-w-full truncate">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/register/patient" className="font-semibold text-foreground underline-offset-4 hover:underline">Create account</Link>
            {" · "}
            <Link to="/register/organization" className="font-semibold text-foreground underline-offset-4 hover:underline">Register organization</Link>
          </p>
        </div>

        <button
          type="button"
          onClick={() => { localStorage.clear(); window.location.reload(); }}
          className="mx-auto text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
        >
          Trouble logging in? Reset app
        </button>
      </div>

      {/* Comic side: a flip-through story about Tempest (fixed charcoal, so the page always reads as ink on paper) */}
      <aside className="auth-aside relative hidden flex-col justify-between overflow-hidden bg-[#1c1c1c] p-10 text-[#e8e2d8] lg:sticky lg:top-0 lg:flex lg:h-screen xl:p-14">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] opacity-60">Tempest · Health surveillance</p>
          <h2 className="mt-3 font-serif text-4xl font-medium leading-[1.05] xl:text-5xl">Welcome back.</h2>
        </div>

        <ComicStory />

        <p className="font-script text-2xl leading-snug opacity-90 xl:text-3xl [@media(max-height:760px)]:hidden">
          You're just one step away from a next-generation health surveillance experience.
        </p>
      </aside>
    </div>
  );
};

export default Login;

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, getRoleRedirectPath } from "@/contexts/AuthContext";
import { Stethoscope, User, Shield, Building2, Activity, ChevronLeft } from "lucide-react";

const demoAccounts = [
  { email: "Doom@doc.com", password: "123456", label: "Doctor", icon: Stethoscope, color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200" },
  { email: "Tony@patient.com", password: "123456", label: "Patient", icon: User, color: "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200" },
  { email: "admin@tempest.com", password: "admin123", label: "Admin", icon: Shield, color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-200" },
  { email: "sion@hospital.com", password: "123456", label: "Org Admin", icon: Building2, color: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200" },
  { email: "gov@gov.mail", password: "gov123", label: "Government", icon: Activity, color: "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200" },
];




import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, demoSignIn, user } = useAuth();
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-lg text-foreground">Tempest</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>




        {/* Demo Quick Login */}
        <div className="mt-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">Quick Demo Access</span></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin(acc.email, acc.password)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${acc.color}`}
              >
                <acc.icon className="w-5 h-5" />
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
        </div>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register/patient" className="text-primary hover:underline">Create Account</Link>
          {" · "}
          <Link to="/register/organization" className="text-primary hover:underline">Register Organization</Link>
        </div>

        <div className="mt-8 pt-4 border-t text-center">
          <button
            type="button"
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="text-xs text-red-500 hover:text-red-700 underline"
          >
            Trouble logging in? Click here to Reset App
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

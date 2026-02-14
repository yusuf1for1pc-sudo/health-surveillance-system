import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RegisterPatient = () => {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-4">✓</div>
          <h1 className="text-2xl font-semibold text-foreground">Account Created</h1>
          <p className="text-muted-foreground mt-2">Your patient account is ready. You can now sign in.</p>
          <Link to="/login"><Button className="mt-6">Go to Login</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-lg text-foreground">Tempest</span>
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Register as Patient</h1>
          <p className="text-muted-foreground mt-1">Create your personal health account</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input placeholder="John Doe" className="mt-1.5" required />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input type="tel" placeholder="+1 (555) 000-0000" className="mt-1.5" required />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="john@example.com" className="mt-1.5" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" className="mt-1.5" required />
          </div>
          <Button type="submit" className="w-full">Create Account</Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPatient;

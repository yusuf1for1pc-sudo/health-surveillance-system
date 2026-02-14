import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-4">✉</div>
          <h1 className="text-2xl font-semibold text-foreground">Check your email</h1>
          <p className="text-muted-foreground mt-2">We sent a password reset link to your email address.</p>
          <Link to="/login"><Button variant="outline" className="mt-6">Back to Login</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Forgot Password</h1>
          <p className="text-muted-foreground mt-1">Enter your email to receive a reset link</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="you@example.com" className="mt-1.5" required />
          </div>
          <Button type="submit" className="w-full">Send Reset Link</Button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-primary hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

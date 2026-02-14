import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileCheck } from "lucide-react";

const RegisterOrganization = () => {
  const [submitted, setSubmitted] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-4">✓</div>
          <h1 className="text-2xl font-semibold text-foreground">Registration Submitted</h1>
          <p className="text-muted-foreground mt-2">Your organization is pending admin approval. You'll receive an email once approved.</p>
          <Link to="/login"><Button className="mt-6">Go to Login</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-lg text-foreground">Tempest</span>
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Register Organization</h1>
          <p className="text-muted-foreground mt-1">Create your healthcare organization account</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
          <div>
            <Label>Organization Name</Label>
            <Input placeholder="City General Hospital" className="mt-1.5 h-11 sm:h-10" required />
          </div>
          <div>
            <Label>Admin Email</Label>
            <Input type="email" placeholder="admin@hospital.com" className="mt-1.5 h-11 sm:h-10" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" placeholder="••••••••" className="mt-1.5 h-11 sm:h-10" required />
          </div>
          <div>
            <Label>Organization Type</Label>
            <Input placeholder="Hospital, Clinic, Laboratory..." className="mt-1.5 h-11 sm:h-10" required />
          </div>
          <div>
            <Label>Certificate Upload</Label>
            {fileName ? (
              <div className="mt-1.5 flex items-center gap-3 p-3 sm:p-4 border rounded-lg bg-muted/30">
                <FileCheck className="w-5 h-5 text-accent-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                  <p className="text-xs text-muted-foreground">Ready to upload</p>
                </div>
                <button type="button" onClick={() => setFileName(null)} className="text-xs text-muted-foreground hover:text-foreground">Remove</button>
              </div>
            ) : (
              <label className="block mt-1.5 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Tap to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG (max 10MB)</p>
                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => { if (e.target.files?.[0]) setFileName(e.target.files[0].name); }} />
              </label>
            )}
          </div>
          <Button type="submit" className="w-full h-11 sm:h-10">Register Organization</Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already registered? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterOrganization;

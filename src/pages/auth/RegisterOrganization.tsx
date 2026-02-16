import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const RegisterOrganization = () => {
  const { signUp } = useAuth();
  const [orgName, setOrgName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgType, setOrgType] = useState("");
  const [phone, setPhone] = useState("");

  // Location
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [pincode, setPincode] = useState("");

  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create Auth User with Organization Metadata
      // The 'handle_new_user' trigger will automatically:
      // - Create the 'organizations' record
      // - Create the 'profiles' record linked to that organization
      const result = await signUp({
        email: adminEmail,
        password,
        full_name: `${orgName} Admin`,
        role: "org_admin",
        phone: phone, // Admin phone
        metadata: {
          // Organization Metadata for Trigger
          org_name: orgName,
          org_type: orgType,
          org_phone: phone,
          org_address: address,
          org_city: city,
          org_state: state,
          org_country: country,
          org_pincode: pincode,
        }
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Success! Trigger handles the rest.
      setSubmitted(true);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-4">✓</div>
          <h1 className="text-2xl font-semibold text-foreground">Registration Submitted</h1>
          <p className="text-muted-foreground mt-2">Your organization account has been created. You can now sign in with your credentials.</p>
          <Link to="/login"><Button className="mt-6">Go to Login</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl">
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

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 sm:p-8 rounded-xl border shadow-sm">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Organization Name</Label>
                <Input placeholder="City General Hospital" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
              </div>
              <div>
                <Label>Organization Type</Label>
                <Select value={orgType} onValueChange={setOrgType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hospital">Hospital</SelectItem>
                    <SelectItem value="Clinic">Clinic</SelectItem>
                    <SelectItem value="Laboratory">Laboratory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Admin Email</Label>
                <Input type="email" placeholder="admin@hospital.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
          </div>

          <div className="sapce-y-4 pt-2">
            <h3 className="font-medium text-sm text-foreground mb-3">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Input placeholder="123 Healthcare Blvd" value={address} onChange={(e) => setAddress(e.target.value)} required />
              </div>
              <div>
                <Label>City</Label>
                <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div>
                <Label>State</Label>
                <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} required />
              </div>
              <div>
                <Label>Country</Label>
                <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} required />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input placeholder="ZIP/Pin" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
              </div>
            </div>
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? "Registering..." : "Register Organization"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already registered? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterOrganization;

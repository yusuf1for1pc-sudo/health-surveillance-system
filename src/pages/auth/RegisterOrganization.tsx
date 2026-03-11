import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileCheck, HeartPulse } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import LocationSearch from "@/components/ui/LocationSearch";
import CitySearch from "@/components/ui/CitySearch";
import { StateSearch } from "@/components/ui/StateSearch";
import { Textarea } from "@/components/ui/textarea";

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
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleLocationSelect = (data: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
    country: string;
  }) => {
    setAddress(data.address);
    if (data.city) setCity(data.city);
    if (data.state) setState(data.state);
    setPincode(data.pincode);
    setLatitude(data.latitude);
    setLongitude(data.longitude);
  };

  const handleCitySelect = (data: { city: string; state?: string; pincode?: string }) => {
    setCity(data.city);
    if (data.state) setState(data.state);
    if (data.pincode) setPincode(data.pincode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload Certificate FIRST (before signUp, since signUp signs out immediately)
      let certificateUrl: string | undefined;
      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop() || 'pdf';
        const filePath = `org-certificates/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('certificates')
          .upload(filePath, selectedFile, { upsert: true });

        if (uploadError) {
          console.error('Certificate upload failed:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('certificates')
            .getPublicUrl(filePath);
          certificateUrl = urlData?.publicUrl;
        }
      }

      // 2. Create Auth User with Organization Metadata
      // The 'handle_new_user' trigger will automatically:
      // - Create the 'organizations' record (including certificate_url)
      // - Create the 'profiles' record linked to that organization
      const result = await signUp({
        email: adminEmail,
        password,
        full_name: `${orgName} Admin`,
        role: "org_admin",
        phone: phone,
        metadata: {
          org_name: orgName,
          org_type: orgType,
          org_phone: phone,
          org_address: address,
          org_city: city,
          org_state: state,
          org_country: country,
          org_pincode: pincode,
          org_latitude: latitude?.toString(),
          org_longitude: longitude?.toString(),
          org_certificate_url: certificateUrl || '',
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[url('/bg-abstract-top.png')] bg-cover bg-center bg-no-repeat bg-fixed p-4">
      {/* Main Glassmorphism Card (1100x650) */}
      <div className="w-full max-w-[1100px] h-full max-h-[750px] lg:h-[650px] bg-white/40 backdrop-blur-md rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-white/60 flex flex-col lg:flex-row overflow-hidden z-10 relative">
        
        {/* Left Pane: Registration Form (Scrollable) */}
        <div className="w-full lg:w-1/2 h-full overflow-y-auto p-6 sm:p-10 relative flex flex-col bg-white/60">
          <div className="text-center mb-8 shrink-0">
            <Link to="/" className="inline-flex items-center gap-2 mb-4 justify-center">
              <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-bold text-xl text-[#0f2a58] tracking-tight">Tempest</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Register Organization</h1>
            <p className="text-[#3b82f6] font-medium mt-1.5">Create your healthcare organization account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 flex-grow pb-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label className="text-slate-700 font-medium">Organization Name</Label>
                <Input placeholder="City General Hospital" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="mt-1.5 focus-visible:ring-blue-500 bg-white/80" required />
              </div>

              <div>
                <Label className="text-slate-700 font-medium">Organization Type</Label>
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
                <Label className="text-slate-700 font-medium">Phone Number <span className="text-slate-500 text-xs font-normal ml-1">(+91)</span></Label>
                <div className="relative mt-1.5 flex items-center">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 text-slate-500 border-r pr-2 border-slate-200 h-5">
                    <span className="text-sm font-medium">+91</span>
                  </div>
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(val);
                    }}
                    className="pl-14 focus-visible:ring-blue-500 bg-white/80"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-700 font-medium">Admin Email</Label>
                <Input type="email" placeholder="admin@hospital.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="mt-1.5 focus-visible:ring-blue-500 bg-white/80" required />
              </div>

              <div>
                <Label className="text-slate-700 font-medium">Password</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 focus-visible:ring-blue-500 bg-white/80" required />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 mt-6 shrink-0">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 tracking-tight">LOCATION & ADDRESS</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>State</Label>
                <StateSearch value={state} onSelect={setState} />
              </div>
              <div>
                <CitySearch
                  state={state}
                  initialValue={city}
                  onCitySelect={handleCitySelect}
                />
              </div>
            </div>

            <div className="mb-4">
              <LocationSearch
                city={city}
                state={state}
                onLocationSelect={handleLocationSelect}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Textarea placeholder="123 Healthcare Blvd" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1.5 focus-visible:ring-blue-500 bg-white/80" required />
              </div>

              <div>
                <Label>Pincode</Label>
                <Input placeholder="ZIP/Pin" value={pincode} onChange={(e) => setPincode(e.target.value)} className="mt-1.5 focus-visible:ring-blue-500 bg-white/80" required />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-slate-700 font-medium">Certificate Upload</Label>
            {fileName ? (
              <div className="mt-1.5 flex items-center gap-3 p-3 sm:p-4 border border-blue-200 rounded-lg bg-blue-50/50">
                <FileCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{fileName}</p>
                  <p className="text-xs text-slate-500">Ready to upload</p>
                </div>
                <button type="button" onClick={() => { setFileName(null); setSelectedFile(null); }} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
              </div>
            ) : (
              <label className="block mt-1.5 border-2 border-dashed border-blue-200 rounded-lg p-6 text-center cursor-pointer hover:bg-white/80 bg-white/50 transition-colors">
                <Upload className="w-6 h-6 mx-auto text-blue-400 mb-2" />
                <p className="text-sm text-slate-600 font-medium">Tap to upload or drag and drop</p>
                <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG (max 10MB)</p>
                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => { if (e.target.files?.[0]) { setFileName(e.target.files[0].name); setSelectedFile(e.target.files[0]); } }} />
              </label>
            )}
          </div>

          {error && (
            <div className={`shrink-0 text-sm p-3 rounded-md mt-4 ${error.includes("check your email") ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {error}
            </div>
          )}

          <div className="shrink-0 mt-6 pb-2">
            <Button type="submit" className="w-full bg-[#1e3a8a] hover:bg-[#0f2a58] text-white shadow-md shadow-blue-900/20 transition-all rounded-lg h-11 font-medium" disabled={loading}>
              {loading ? "Registering..." : "Register Organization"}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 font-medium shrink-0 pb-4">
          Already registered? <Link to="/login" className="text-[#1e3a8a] font-bold hover:underline">Sign in</Link>
        </div>
      </div>

      {/* Right Pane: Welcome Banner / Branding */}
      <div className="hidden lg:flex w-1/2 bg-white/10 flex-col items-center justify-center relative p-12 text-center overflow-hidden border-l border-white/20">
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-8 p-3 bg-white/10 backdrop-blur-md rounded-2xl shadow-sm border border-white/20">
            <HeartPulse className="w-12 h-12 text-[#1e3a8a] stroke-[1.5]" />
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f2a58] mb-4 tracking-tight drop-shadow-sm">Tempest Network</h2>
          <p className="text-xl text-[#1e3a8a] font-medium max-w-md leading-relaxed drop-shadow-sm opacity-90">
            Empower your organization with state-of-the-art health surveillance technology.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default RegisterOrganization;

import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LocationSearch from "@/components/ui/LocationSearch";
import CitySearch from "@/components/ui/CitySearch";
import { StateSearch } from "@/components/ui/StateSearch";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/types";
import { Eye, EyeOff, Calendar as CalendarIcon, Phone as PhoneIcon, User as UserIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RegisterPatient = () => {
  const { signUp, skipAuthRedirect } = useAuth();
  // Patient Identity
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Patient Medical/Personal Info
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState<Date>();
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Location fields
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [role] = useState<UserRole>("patient");
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

  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("Creating account...");
    setLoading(true);

    console.log("=== REGISTRATION START ===");

    try {
      // Prevent onAuthStateChange from navigating away during signup
      skipAuthRedirect.current = true;

      const result = await signUp({
        email,
        password,
        full_name: fullName,
        phone,
        role,
        metadata: {
          gender: gender || undefined,
          date_of_birth: dob ? format(dob, 'yyyy-MM-dd') : undefined,
          blood_type: bloodType || undefined,
          allergies: allergies || undefined,
          emergency_contact: emergencyContact || undefined,
          address: address || undefined,
          city,
          state,
          country,
          pincode,
          latitude: latitude?.toString(),
          longitude: longitude?.toString(),
        },
      });

      console.log("SignUp result:", JSON.stringify(result));

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data?.user?.id) {
        throw new Error("Account creation failed - no user ID returned.");
      }

      console.log("=== REGISTRATION COMPLETE === Patient created by trigger");
      setStatus("Done!");
      setSubmitted(true);
    } catch (err: any) {
      console.error("=== REGISTRATION ERROR ===", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      skipAuthRedirect.current = false;
      setLoading(false);
      setStatus("");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-4">✓</div>
          <h1 className="text-2xl font-semibold text-foreground">Account Created</h1>
          <p className="text-muted-foreground mt-2">Your account is ready. You can now sign in with your credentials.</p>
          <Link to="/login"><Button className="mt-6">Go to Login</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-lg text-foreground">Tempest</span>
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Patient Registration</h1>
          <p className="text-muted-foreground mt-1">Create your patient account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Full Name</Label>
              <Input placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" required />
            </div>

            <div>
              <Label>Phone Number <span className="text-muted-foreground text-xs font-normal ml-1">(+91)</span></Label>
              <div className="relative mt-1.5 flex items-center">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 text-muted-foreground border-r pr-2 border-border h-5">
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
                  className="pl-14"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Gender</Label>
                <Select value={gender} onValueChange={setGender} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col">
                <Label className="mb-1.5">Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !dob && "text-muted-foreground"
                      )}
                    >
                      {dob ? format(dob, "dd/MM/yyyy") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dob}
                      onSelect={setDob}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Blood Type <span className="text-muted-foreground font-normal text-xs">(Optional)</span></Label>
                <Select value={bloodType} onValueChange={setBloodType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Emergency Contact <span className="text-muted-foreground font-normal text-xs">(Optional)</span></Label>
                <div className="relative mt-1.5">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Name & Contact No."
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Allergies (Optional)</Label>
              <Input
                placeholder="Peanuts, Penicillin, etc."
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Password</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
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
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium mb-3">Location & Address</h3>

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
                <Label>Street Address / Flat No / Building</Label>
                <Textarea placeholder="Flat 4B, Sunshine Apts, MG Road" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1.5" />
              </div>

              <div>
                <Label>Pincode</Label>
                <Input placeholder="400001" value={pincode} onChange={(e) => setPincode(e.target.value)} className="mt-1.5" required />
              </div>
            </div>
          </div>

          {error && (
            <div className={`text-sm p-3 rounded-md ${error.includes("check your email") ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200" : "bg-destructive/10 text-destructive"}`}>
              {error}
            </div>
          )}

          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? (status || "Processing...") : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </div>
        <div className="mt-2 text-center text-sm text-muted-foreground">
          Registering an organization? <Link to="/register/organization" className="text-primary hover:underline">Register Organization</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPatient;

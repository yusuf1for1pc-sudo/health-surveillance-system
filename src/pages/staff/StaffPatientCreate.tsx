import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { StateSearch } from "@/components/ui/StateSearch";
import CitySearch from "@/components/ui/CitySearch";
import LocationSearch from "@/components/ui/LocationSearch";
import { Textarea } from "@/components/ui/textarea";

// ...

const StaffPatientCreate = () => {
  const navigate = useNavigate();
  const { addPatient } = useData();
  const { user } = useAuth();
  const [gender, setGender] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [createdPatient, setCreatedPatient] = useState<{ id: string; patientId: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const patient = await addPatient({
        patient_id: '',
        full_name: fullName,
        phone: phone ? `+91${phone}` : '',
        email: email || undefined,
        gender: gender as 'Male' | 'Female' | 'Other',
        date_of_birth: dob,
        blood_type: bloodType || undefined,
        allergies: allergies || undefined,
        emergency_contact: emergencyContact || undefined,
        address: address || undefined,
        city,
        state,
        country,
        pincode,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        organization_id: user?.organization_id || undefined, // undefined if null
        created_by: user?.id || '',
      });
      setCreatedPatient({ id: patient.id, patientId: patient.patient_id, name: patient.full_name });
    } catch (err: any) {
      console.error("Failed to create patient:", err);
      setError(err.message || "Failed to create patient.");
    } finally {
      setSubmitting(false);
    }
  };

  if (createdPatient) {
    return (
      <DashboardLayout role="staff">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-card rounded-xl p-8 card-shadow">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Patient Created</h2>
            <p className="text-sm text-muted-foreground mt-1">{createdPatient.name}</p>
            <p className="text-sm font-medium text-primary mt-2">ID: {createdPatient.patientId}</p>

            <div className="mt-6 w-44 h-44 mx-auto bg-background rounded-xl p-2 border flex items-center justify-center">
              <QRCodeSVG
                value={createdPatient.patientId}
                size={160}
                level="H"
                includeMargin={false}
                bgColor="transparent"
                fgColor="currentColor"
                className="text-foreground w-full h-full"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">Patient Smart Health Card</p>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button className="flex-1" onClick={() => navigate("/staff/patients")}>View Patients</Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate("/staff/records/create")}>Create Record</Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="staff">
      <PageHeader title="Add Patient" description="Register a new patient" />
      <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input placeholder="John Doe" className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <Label>Phone Number <span className="text-red-500">*</span></Label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-2.5 text-sm font-medium text-muted-foreground">
                    +91
                  </div>
                  <Input
                    type="tel"
                    placeholder="98765 43210"
                    className="pl-11"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(val);
                    }}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Email (optional)</Label>
                <Input type="email" placeholder="patient@email.com" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Gender</Label>
                <div className="flex gap-2 mt-1">
                  {["Male", "Female", "Other"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${gender === g ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground hover:bg-muted"
                        }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Date of Birth <span className="text-red-500">*</span></Label>
                <Input type="date" className="mt-1" value={dob} onChange={(e) => setDob(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Blood Type</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <Label>Allergies</Label>
                  <Input placeholder="None" className="mt-1" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Emergency Contact</Label>
                <Input type="tel" placeholder="+1 (555) 000-0000" className="mt-1" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <h3 className="font-medium text-sm text-foreground mb-3 mt-2">Home Address (Required for Surveillance)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>State</Label>
                <StateSearch value={state} onSelect={setState} />
              </div>
              <div>
                <CitySearch
                  state={state}
                  initialValue={city}
                  onCitySelect={(data) => {
                    setCity(data.city);
                    if (data.state) setState(data.state);
                    if (data.pincode) setPincode(data.pincode);
                  }}
                />
              </div>
            </div>

            <div className="mb-4">
              <LocationSearch
                city={city}
                state={state}
                onLocationSelect={(data) => {
                  setAddress(data.address);
                  if (data.city) setCity(data.city);
                  if (data.state) setState(data.state);
                  setPincode(data.pincode);
                  setLatitude(data.latitude);
                  setLongitude(data.longitude);
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Street Address <span className="text-red-500">*</span></Label>
                <Textarea placeholder="123 Main St" value={address} onChange={(e) => setAddress(e.target.value)} required />
              </div>
              <div>
                <Label>Country <span className="text-red-500">*</span></Label>
                <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} required />
              </div>
              <div>
                <Label>Pincode <span className="text-red-500">*</span></Label>
                <Input placeholder="ZIP/Pin" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive font-medium px-1">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="submit" className="h-10" disabled={submitting}>
              {submitting ? "Creating..." : "Create Patient"}
            </Button>
            <Button type="button" variant="outline" className="h-10" onClick={() => navigate("/staff/patients")}>Cancel</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default StaffPatientCreate;

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Search } from "lucide-react";

const recordTypes = ["Prescription", "Lab Report", "Clinical Note"];

const icdCodes = [
  { code: "J09", label: "Influenza due to identified avian influenza virus" },
  { code: "J10", label: "Influenza due to other identified influenza virus" },
  { code: "J18", label: "Pneumonia, unspecified organism" },
  { code: "U07.1", label: "COVID-19, virus identified" },
  { code: "A90", label: "Dengue fever" },
  { code: "A15", label: "Respiratory tuberculosis" },
  { code: "A09", label: "Infectious gastroenteritis and colitis" },
  { code: "B34", label: "Viral infection of unspecified site" },
  { code: "I10", label: "Essential (primary) hypertension" },
  { code: "E11", label: "Type 2 diabetes mellitus" },
  { code: "J45", label: "Asthma" },
  { code: "M54", label: "Dorsalgia (back pain)" },
  { code: "K21", label: "Gastro-esophageal reflux disease" },
  { code: "N39", label: "Urinary tract infection" },
  { code: "R50", label: "Fever of other and unknown origin" },
];

const StaffRecordCreate = () => {
  const navigate = useNavigate();
  const [type, setType] = useState("Prescription");
  const [icdSearch, setIcdSearch] = useState("");
  const [selectedIcd, setSelectedIcd] = useState<typeof icdCodes[0] | null>(null);
  const [icdOpen, setIcdOpen] = useState(false);

  const filteredIcd = useMemo(() => {
    if (!icdSearch) return icdCodes;
    const q = icdSearch.toLowerCase();
    return icdCodes.filter(c => c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q));
  }, [icdSearch]);

  return (
    <DashboardLayout role="staff">
      <PageHeader title="Create Medical Record" description="Add a new record for a patient" />
      <div className="bg-card rounded-xl p-4 sm:p-6 card-shadow max-w-lg">
        <form onSubmit={(e) => { e.preventDefault(); navigate("/staff/records"); }} className="space-y-4">
          <div>
            <Label>Patient</Label>
            <Input placeholder="Search patient..." className="mt-1.5 h-11 sm:h-10" required />
          </div>
          <div>
            <Label>Record Type</Label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1.5">
              {recordTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-3 sm:py-2 rounded-lg border text-sm font-medium transition-colors ${
                    type === t ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ICD Code Selector */}
          <div className="relative">
            <Label>ICD Code</Label>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search ICD code or diagnosis..."
                className="pl-9 h-11 sm:h-10"
                value={selectedIcd ? `${selectedIcd.code} — ${selectedIcd.label}` : icdSearch}
                onChange={(e) => {
                  setIcdSearch(e.target.value);
                  setSelectedIcd(null);
                  setIcdOpen(true);
                }}
                onFocus={() => setIcdOpen(true)}
              />
            </div>
            {icdOpen && !selectedIcd && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                {filteredIcd.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">No matching codes</div>
                ) : (
                  filteredIcd.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      className="w-full text-left px-4 py-3 sm:py-2.5 hover:bg-muted/50 transition-colors border-b last:border-0"
                      onClick={() => { setSelectedIcd(c); setIcdSearch(""); setIcdOpen(false); }}
                    >
                      <span className="text-sm font-medium text-foreground">{c.code}</span>
                      <span className="text-sm text-muted-foreground ml-2">— {c.label}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <Label>Title</Label>
            <Input placeholder="Record title" className="mt-1.5 h-11 sm:h-10" required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea placeholder="Enter details..." className="mt-1.5" rows={4} />
          </div>
          <div>
            <Label>Attachment</Label>
            <div className="mt-1.5 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Upload file</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG (max 10MB)</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button type="submit" className="h-11 sm:h-10">Save Record</Button>
            <Button type="button" variant="outline" className="h-11 sm:h-10" onClick={() => navigate("/staff/records")}>Cancel</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default StaffRecordCreate;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import RegisterOrganization from "./pages/auth/RegisterOrganization";
import RegisterPatient from "./pages/auth/RegisterPatient";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AdminWorkspace from "./pages/admin/AdminWorkspace";
import AdminOrganizations from "./pages/admin/AdminOrganizations";
import AdminOrganizationDetail from "./pages/admin/AdminOrganizationDetail";
import AdminGovernment from "./pages/admin/AdminGovernment";
import OrgWorkspace from "./pages/org/OrgWorkspace";
import OrgStaff from "./pages/org/OrgStaff";
import OrgStaffCreate from "./pages/org/OrgStaffCreate";
import OrgStaffDetail from "./pages/org/OrgStaffDetail";
import OrgPatients from "./pages/org/OrgPatients";
import StaffWorkspace from "./pages/staff/StaffWorkspace";
import StaffPatients from "./pages/staff/StaffPatients";
import StaffPatientCreate from "./pages/staff/StaffPatientCreate";
import StaffPatientDetail from "./pages/staff/StaffPatientDetail";
import StaffRecords from "./pages/staff/StaffRecords";
import StaffRecordCreate from "./pages/staff/StaffRecordCreate";
import StaffRecordDetail from "./pages/staff/StaffRecordDetail";
import StaffScanPatient from "./pages/staff/StaffScanPatient";
import PatientWorkspace from "./pages/patient/PatientWorkspace";
import PatientHistory from "./pages/patient/PatientHistory";
import PatientPrescriptions from "./pages/patient/PatientPrescriptions";
import PatientReports from "./pages/patient/PatientReports";
import PatientHealthCard from "./pages/patient/PatientHealthCard";
import GovWorkspace from "./pages/gov/GovWorkspace";
import GovSurveillance from "./pages/gov/GovSurveillance";
import GovAlerts from "./pages/gov/GovAlerts";
import GovReports from "./pages/gov/GovReports";
import Profile from "./pages/profile/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register/organization" element={<RegisterOrganization />} />
          <Route path="/register/patient" element={<RegisterPatient />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin */}
          <Route path="/admin/workspace" element={<AdminWorkspace />} />
          <Route path="/admin/organizations" element={<AdminOrganizations />} />
          <Route path="/admin/organizations/:id" element={<AdminOrganizationDetail />} />
          <Route path="/admin/government" element={<AdminGovernment />} />
          <Route path="/admin/profile" element={<Profile />} />

          {/* Organization */}
          <Route path="/org/workspace" element={<OrgWorkspace />} />
          <Route path="/org/staff" element={<OrgStaff />} />
          <Route path="/org/staff/create" element={<OrgStaffCreate />} />
          <Route path="/org/staff/:id" element={<OrgStaffDetail />} />
          <Route path="/org/patients" element={<OrgPatients />} />
          <Route path="/org/profile" element={<Profile />} />

          {/* Staff */}
          <Route path="/staff/workspace" element={<StaffWorkspace />} />
          <Route path="/staff/patients" element={<StaffPatients />} />
          <Route path="/staff/patients/create" element={<StaffPatientCreate />} />
          <Route path="/staff/patients/:id" element={<StaffPatientDetail />} />
          <Route path="/staff/records" element={<StaffRecords />} />
          <Route path="/staff/records/create" element={<StaffRecordCreate />} />
          <Route path="/staff/records/:id" element={<StaffRecordDetail />} />
          <Route path="/staff/scan" element={<StaffScanPatient />} />
          <Route path="/staff/profile" element={<Profile />} />

          {/* Patient */}
          <Route path="/patient/workspace" element={<PatientWorkspace />} />
          <Route path="/patient/history" element={<PatientHistory />} />
          <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />
          <Route path="/patient/reports" element={<PatientReports />} />
          <Route path="/patient/health-card" element={<PatientHealthCard />} />
          <Route path="/patient/profile" element={<Profile />} />

          {/* Government */}
          <Route path="/gov/workspace" element={<GovWorkspace />} />
          <Route path="/gov/surveillance" element={<GovSurveillance />} />
          <Route path="/gov/alerts" element={<GovAlerts />} />
          <Route path="/gov/reports" element={<GovReports />} />
          <Route path="/gov/profile" element={<Profile />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

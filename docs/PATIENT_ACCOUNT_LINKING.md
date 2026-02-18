# Patient Account Linking & Family Profiles

> Future implementation plan for connecting doctor-created patient records to patient-owned accounts.

---

## Problem Statement

When a doctor creates a patient record, it exists only in the `patients` table with no linked auth account. If that patient later registers themselves, their `auth.uid()` is a **different UUID** from `patients.id`, so RLS policies block them from viewing their own records.

Additionally, in India, multiple family members (parent + children) often share a single phone number. The system must handle **one phone → multiple patient records**.

---

## Phase 1: Phone-Based Account Linking (Hackathon-Ready)

### How It Works

1. **Doctor creates patient** → `patients` table gets `full_name`, `phone` (required), `email` (optional)
2. **Patient registers** at `/register` with **phone number + password**
3. On registration, system queries:
   ```sql
   SELECT * FROM patients WHERE phone = '<registered_phone>';
   ```
4. **Single match** → auto-link by updating `patients.id` to `auth.uid()`
5. **Multiple matches** → show a profile picker (see Phase 2)
6. **No match** → create a fresh patient record (self-registered, no prior history)

### Database Changes

```sql
-- Add a column to link patients to auth users (nullable, set on registration)
ALTER TABLE patients ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

-- Index for fast phone lookups
CREATE INDEX idx_patients_phone ON patients(phone);
```

### Registration Flow (Code Changes)

In `RegisterPatient.tsx`, after Supabase auth signup:

```typescript
// After successful auth signup
const { data: matchingPatients } = await supabase
  .from('patients')
  .select('*')
  .eq('phone', phoneNumber);

if (matchingPatients?.length === 1) {
  // Auto-link single match
  await supabase
    .from('patients')
    .update({ auth_user_id: authUser.id })
    .eq('id', matchingPatients[0].id);
} else if (matchingPatients?.length > 1) {
  // Store matches, redirect to profile picker
  navigate('/select-profile', { state: { patients: matchingPatients } });
}
```

### RLS Policy Update

```sql
-- Patients can view records linked to their auth account
CREATE POLICY "Patients view own records" ON medical_records
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM patients WHERE auth_user_id = auth.uid()
    )
  );
```

---

## Phase 2: Family Profile Switcher

### The Scenario

```
Phone: 9876543210
├── Priya Sharma  (Mother, age 32)
├── Arjun Sharma  (Son, age 8)
└── Meera Sharma  (Daughter, age 3)
```

One phone → one auth account → three patient profiles.

### Data Model

```sql
-- Junction table: one auth user can manage multiple patient profiles
CREATE TABLE linked_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) NOT NULL,
  patient_id UUID REFERENCES patients(id) NOT NULL,
  relationship TEXT DEFAULT 'self', -- 'self', 'child', 'spouse', 'parent'
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(auth_user_id, patient_id)
);

-- RLS: users can only see their own linked patients
ALTER TABLE linked_patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own links" ON linked_patients
  FOR SELECT USING (auth_user_id = auth.uid());
```

### UI: Profile Picker Screen

Shown on first login when multiple patients share the phone number:

```
┌─────────────────────────────┐
│  Who are you viewing for?   │
│                             │
│  👩 Priya Sharma (Self)     │
│     DOB: 1994-03-15         │
│                             │
│  👦 Arjun Sharma            │
│     DOB: 2018-07-22         │
│                             │
│  👧 Meera Sharma            │
│     DOB: 2023-01-10         │
│                             │
│  [Can switch anytime]       │
└─────────────────────────────┘
```

### State Management

```typescript
// In AuthContext or a dedicated ProfileContext
const [activePatientId, setActivePatientId] = useState<string | null>(null);
const [linkedPatients, setLinkedPatients] = useState<Patient[]>([]);

// All record views use activePatientId instead of auth.uid()
const { data: records } = await supabase
  .from('medical_records')
  .select('*')
  .eq('patient_id', activePatientId);
```

### Profile Switcher Component (in sidebar/header)

```typescript
// Dropdown in the dashboard header
<ProfileSwitcher
  patients={linkedPatients}
  activeId={activePatientId}
  onSwitch={(id) => setActivePatientId(id)}
/>
```

---

## Phase 3: OTP-Based Authentication (Production)

### Why OTP?

- Phone number IS the identity, OTP IS the verification
- No password to forget
- Rural patients are more comfortable with OTP than email+password
- Phone numbers are Aadhaar-linked in India — reliable identifiers

### Supabase Phone Auth Setup

1. Enable Phone provider in Supabase Dashboard → Authentication → Providers
2. Configure Twilio (or other SMS provider) credentials
3. Set OTP expiry and rate limits

### Login Flow

```typescript
// Step 1: Send OTP
const { error } = await supabase.auth.signInWithOtp({
  phone: '+919876543210'
});

// Step 2: Verify OTP
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+919876543210',
  token: '123456',
  type: 'sms'
});

// Step 3: Link to patient records (same as Phase 1)
```

### Cost Considerations

| Provider | Cost per SMS |
|----------|-------------|
| Twilio   | ~₹0.15/SMS  |
| MSG91    | ~₹0.10/SMS  |
| Gupshup  | ~₹0.08/SMS  |

For hackathon demo: use Supabase's built-in test phone numbers to avoid SMS costs.

---

## Implementation Priority

| Phase | Effort | Impact | When |
|-------|--------|--------|------|
| Phase 1: Phone linking | ~2 hours | Patients can see doctor-created records | Hackathon |
| Phase 2: Family profiles | ~4 hours | Multi-patient per phone support | Post-hackathon |
| Phase 3: OTP auth | ~2 hours | Foolproof authentication | Production |

---

## Key Files to Modify

- `src/pages/auth/RegisterPatient.tsx` — Add phone-based patient lookup on register
- `src/contexts/AuthContext.tsx` — Add active patient profile state
- `src/lib/types.ts` — Add `LinkedPatient` type
- `supabase/migrations/` — New migration for `linked_patients` table
- `src/components/ProfileSwitcher.tsx` — New component for switching profiles
- RLS policies on `medical_records`, `prescriptions` — Update to use `linked_patients`

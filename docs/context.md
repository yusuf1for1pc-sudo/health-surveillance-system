Below is a **clean, practical Antigravity prompt** that gives full context and requirements without over-specifying UI details. It focuses on **what must exist, how systems connect, and what to complete**, while letting Antigravity handle implementation details.

You can paste this directly into Antigravity.

---

# ANTIGRAVITY MASTER PROMPT — TEMPEST HEALTHCARE PLATFORM CONTINUATION

You are continuing development of an existing healthcare SaaS web application called Tempest. The frontend structure, role-based layouts, and most pages already exist. Your job is to complete remaining critical features and connect the system so it fully satisfies the Smart Healthcare History & Disease Surveillance System problem statement.

You cannot see the exact UI implementation, so do not redesign anything. Assume a modern responsive SaaS dashboard with role-based workspaces already exists. Focus on ensuring required components, data flow, and integrations are present.

---

# CORE PURPOSE OF TEMPEST

Tempest is designed to:

Centralize patient medical records
Provide QR-based smart health cards
Allow doctors and labs to create prescriptions and reports
Enable government authorities to view anonymized disease trends
Use ICD codes for standardized diagnosis
Ensure secure, role-based access
Work well on both mobile and desktop

Mobile usability is especially important because real-world medical staff will use phones.

---

# SYSTEM ROLES THAT ALREADY EXIST

Platform Admin
Organization Admin
Medical Staff (Doctor and Lab Staff)
Patient
Government User

Each role has its own workspace and navigation.

Your job is to ensure each role can perform its required functions fully.

---

# BACKEND PLATFORM

Supabase will be used as the backend.

Supabase must handle:

Authentication
Database
File storage
Security and encryption

Ensure frontend is ready to connect to Supabase.

The core database entities must include:

Users
Organizations
Patients
Medical Records

These should support relationships between organizations, staff, patients, and records.

---

# REQUIRED FEATURES THAT MUST EXIST AND WORK

Ensure these features exist in the frontend and are structured for Supabase integration.

---

## Patient Management

Medical staff must be able to create patient profiles.

Each patient must have:

Unique patient ID
Basic info (name, phone, etc.)
QR code representing their patient ID

QR code will act as smart health card.

Patients do not need to sign up to exist in system.

---

## Medical Record Creation

Medical staff must be able to create medical records for patients.

Each record must support:

Diagnosis text
ICD code selection
Notes or prescription text
Optional file attachment

Records must link to patient and creator.

---

## ICD Code Support

Diagnosis should use ICD codes.

Provide ICD selection capability and structure record data to include ICD codes.

ICD codes will be used for surveillance analytics.

---

## Government Surveillance Dashboard

Government users must have a surveillance page that displays disease trends.

Use Recharts to display disease analytics.

Charts should show trends over time and distribution of diseases.

Charts should use aggregated medical record data structure.

Charts must work on both mobile and desktop.

---

## Certificate Upload Support

Organizations and medical staff must be able to upload verification certificates.

Certificates must have status such as pending, approved, or rejected.

This builds trust in the system.

---

## QR Smart Health Card

Each patient profile must display QR code.

QR code must represent patient ID and be usable for identification.

---

## Authentication and Role-Based Access

System must use Supabase authentication.

Users must access only their allowed workspace and data.

Government users must see only aggregated anonymized data.

Patient identity must not be exposed in surveillance analytics.

---

# GEMINI API INTEGRATION

Gemini API will be used to assist diagnosis structuring.

When diagnosis text is entered, Gemini should suggest structured diagnosis and ICD code.

Doctor must be able to accept or modify suggestion.

Gemini should assist but not replace human input.

---

# MOBILE REQUIREMENTS

System must work smoothly on mobile devices.

Ensure all core workflows are usable on mobile:

Patient creation
Record creation
Viewing charts
Viewing QR code

Do not redesign desktop layout. Improve responsiveness without breaking desktop experience.

---

# SECURITY AND ENCRYPTION

Supabase will handle encryption automatically.

Ensure all data is transmitted securely using Supabase best practices.

Ensure role-based access logic is respected.

---

# WHAT YOU SHOULD DO NEXT

Focus on ensuring frontend supports these functional capabilities and is structured to connect with Supabase and Gemini.

Do not rebuild existing layout.

Do not over-design UI.

Ensure required components, data structures, and flows exist.

Use mock data where necessary, but structure it to match Supabase tables.

Ensure Recharts surveillance dashboard works using structured data.

Ensure QR code generation exists.

Ensure ICD-based diagnosis workflow exists.

Ensure system is ready for backend integration.

---

# FINAL GOAL

Tempest should function as a complete healthcare history and disease surveillance platform with:

Patient smart health cards
Centralized medical records
ICD-based diagnosis tracking
Government disease surveillance dashboard
Secure role-based access
Mobile-friendly workflows
Supabase-ready backend integration
Gemini-powered diagnosis assistance

Continue development from current state and complete remaining required functionality.

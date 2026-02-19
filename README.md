# Tempest — Health Surveillance System

AI-powered real-time health surveillance and disease monitoring platform.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: Google Gemini (ICD-10 coding, prescriptions)
- **Maps**: Leaflet + leaflet.heat (disease heatmaps)

## Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd health-surveillance-system

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Features

- 🩺 **Doctor Dashboard** — Register patients, create medical records with AI-assisted ICD-10 coding
- 👤 **Patient Portal** — View medical records, prescriptions, and reports
- 🏥 **Organization Management** — Register hospitals/labs, manage staff
- 🛡️ **Admin Panel** — Approve organizations, monitor platform activity
- 📊 **Government Surveillance** — Disease outbreak monitoring with gradient heatmaps
- 🤖 **AI Integration** — Smart diagnosis suggestions, prescription generation

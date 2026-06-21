# MediBook

**Doctor Appointment Booking SaaS Platform**

A full-featured, production-ready web app for booking doctor appointments. Patients can browse doctors, book appointments, and manage their history. Admins can manage doctors, availability slots, and all appointments with an analytics dashboard.

🌐 **Live Demo:** https://medibook-saas.vercel.app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4, shadcn/ui |
| Routing | Wouter |
| Forms | React Hook Form + Zod |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| Charts | Recharts |
| PDF Export | jsPDF + jspdf-autotable |
| Icons | Lucide React |
| Animations | Framer Motion |

---

## Features

**Public**
- Browse and search doctors by name and specialization
- View doctor profiles with available slots

**Patient**
- Register and sign in (Supabase Auth + email verification)
- Book appointments via 3-step wizard (slot → details → confirm)
- View upcoming, past, and cancelled appointments
- Cancel appointments
- Edit profile
- Export appointment history (CSV and PDF)
- Real-time appointment status updates

**Admin**
- Manage doctors (create, edit, delete)
- Generate availability slots (bulk, 7-day rolling)
- Manage all appointments (confirm / cancel / complete / reschedule)
- View patient list
- Analytics dashboard — appointment trends, status breakdown, revenue by doctor, peak booking hours

---

## Prerequisites

- **Node.js** 18+ (or 20+ recommended)
- **npm** 9+
- A **Supabase** project — free tier works fine: https://supabase.com

---

## Installation

```bash
# 1. Clone or unzip the project
cd medibook

# 2. Install dependencies
npm install

# 3. Copy the environment template
cp .env.example .env
```

---

## Environment Variables

Edit `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

Find these in: **Supabase Dashboard → your project → Settings → API**

---

## Database Setup

Run these two SQL files in your **Supabase SQL Editor** (in order):

1. `supabase/schema.sql` — creates all tables, RLS policies, and RPC functions
2. `supabase/seed.sql` — inserts 8 demo doctors with 7-day availability slots

> ⚠️ The app shows demo placeholder data until the schema is applied. Booking is disabled in demo mode.

**Make a user an admin:**
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

---

## Run Locally

```bash
npm run dev
```

Opens at **http://localhost:5173**

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/public/`. Serve it with:

```bash
npm start
```

(Uses `server.mjs` — an Express static server with SPA fallback and security headers.)

---

## Deployment — Vercel (Recommended)

### Option A: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option B: Vercel Dashboard

1. Push the project to GitHub
2. Go to https://vercel.com → **New Project** → import your repo
3. Framework: **Vite** (auto-detected)
4. Build command: `npm run build`
5. Output directory: `dist/public`
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Deploy

The `vercel.json` in the project root handles SPA routing rewrites automatically.

### After deploying — Supabase auth redirect URLs

In your Supabase project go to **Authentication → URL Configuration** and add:

```
https://your-app.vercel.app/**
```

---

## Folder Structure

```
medibook/
├── public/                  # Static assets (favicon, OG image)
├── src/
│   ├── components/
│   │   ├── appointment/     # AppointmentCard
│   │   ├── common/          # Navbar, Footer, ProtectedRoute, etc.
│   │   ├── doctor/          # DoctorCard
│   │   └── ui/              # shadcn/ui primitives
│   ├── config/              # App name, tagline
│   ├── contexts/            # AuthContext (auth + profile state)
│   ├── data/                # Demo doctors (shown before DB is set up)
│   ├── hooks/               # useToast, useMobile
│   ├── layouts/             # PublicLayout, DashboardLayout, AdminLayout
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   ├── exportAppointments.ts  # CSV + PDF export
│   │   └── utils.ts
│   ├── pages/
│   │   ├── admin/           # AdminOverview, AdminDoctors, AdminAnalytics, …
│   │   ├── auth/            # Login, Register, ForgotPassword, ResetPassword
│   │   └── patient/         # PatientDashboard, PatientProfilePage
│   ├── services/            # Supabase queries (doctors, slots, appointments)
│   ├── types/               # TypeScript types
│   ├── App.tsx              # Router + providers
│   ├── index.css            # Global styles + Tailwind
│   └── main.tsx             # Entry point
├── supabase/
│   ├── schema.sql           # Full DB schema, RLS, RPCs
│   └── seed.sql             # Demo data (8 doctors + 7-day slots)
├── .env.example             # Environment variable template
├── .gitignore
├── components.json          # shadcn/ui config
├── index.html
├── package.json
├── README.md
├── server.mjs               # Production Express server
├── tsconfig.json
├── vercel.json              # Vercel deployment config
└── vite.config.ts
```

---

## Architecture Notes

- **Frontend-only data access** — all DB queries go through the Supabase JS SDK directly; no custom backend
- **Atomic booking** — `book_appointment` is a PostgreSQL RPC with row-level locking to prevent double-booking
- **Role-based access** — `profiles.role` field (`patient` / `admin`); enforced by RLS and by `ProtectedRoute`
- **RLS on all tables** — patients see only their own data; admins see everything
- **Real-time updates** — patient dashboard subscribes to Supabase Realtime for live appointment status changes

---

## License

MIT

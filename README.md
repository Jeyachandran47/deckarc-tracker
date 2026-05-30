# DECKARC Project Tracker MVP

An internal admin portal for **DECKARC LLC** to track construction projects, daily tasks, milestones, delays, inspections, permits, and generate AI-powered updates.

Built by me as part of a **CONVAZANT INC** assignment.

---

## 🚀 Live Demo

> https://deckarc-tracker.vercel.app

---

## 🔐 Test Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@deckarc.test | Admin@1234 |
| General Contractor | gc@deckarc.test | Gc@12345 |
| Subcontractor | sub@deckarc.test | Sub@12345 |
| Client | client@deckarc.test | Client@123 |

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS |
| Database + Auth | Supabase |
| AI | Google Gemini 2.5 Flash |
| Deployment | Vercel |

---

## 👥 Role-Based Access

| Role | Access |
|---|---|
| **Admin** | Full access — projects, tasks, alerts, permits, inspections, AI reports, daily updates |
| **General Contractor** | Read-only — projects, tasks, permits, inspections, daily updates |
| **Subcontractor** | Read-only projects — assigned tasks only + submit daily updates |
| **Client** | Simplified view — progress, completed milestones, upcoming milestones, AI client updates |

---

## ✅ Features Built

- [x] Login page with role-based routing
- [x] Admin dashboard with live stats
  - Total projects, delayed projects, milestones due soon
  - Missed milestones, pending permits, pending inspections
  - Missing daily updates, red alert count
- [x] Project management — add, edit, view
- [x] Task and milestone tracker with status colors
- [x] Add/edit tasks (admin only)
- [x] Daily update form (subcontractor only)
- [x] Green / yellow / red alert system with auto-generation
- [x] Resolve alerts (admin only)
- [x] Delay logic — projected finish date auto-updates when task is delayed
- [x] Permit tracker — admin can update permit status
- [x] Inspection tracker — admin can update inspection result
- [x] AI Daily Summary (Gemini 2.5 Flash)
- [x] AI Risk Report
- [x] AI Internal Update
- [x] AI Client-Friendly Update
- [x] AI Missing Info Detector
- [x] All AI reports saved to database
- [x] Client simplified progress view

---

## 🗄️ Database Tables (Supabase)

| Table | Purpose |
|---|---|
| `profiles` | Extends Supabase auth users with role |
| `projects` | All DECKARC construction projects |
| `tasks` | Tasks and milestones per project |
| `daily_updates` | Daily progress submissions |
| `permits` | Permit tracking per project |
| `inspections` | Inspection scheduling and results |
| `alerts` | Green/yellow/red alerts auto-generated |
| `ai_reports` | All AI-generated reports saved |

---

## 🏗️ Sample Projects Loaded

1. **Vik Room Addition** — Single-story room addition, foundation in progress
2. **Ganesh Living Room Extension** — Two-story high ceiling extension, Charlotte NC
3. **Sample Bathroom Remodel** — Bathroom upgrade, material selection phase

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- Supabase account
- Google Gemini API key

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/deckarc-tracker.git
cd deckarc-tracker

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Fill in your values in .env.local

# 4. Run the development server
npm run dev

# 5. Open in browser
# http://localhost:3000
```

### Environment Variables

Create a `.env.local` file in the root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

---

## 📁 Project Structure

```
deckarc-tracker/
├── src/
│   ├── app/
│   │   ├── login/          → Login page
│   │   ├── dashboard/      → Role-based dashboard
│   │   ├── projects/       → Projects list + detail
│   │   │   └── [id]/       → Project detail with tabs
│   │   ├── alerts/         → Alert management (admin)
│   │   ├── reports/        → AI reports overview (admin)
│   │   ├── daily-update/   → Daily update form (subcontractor)
│   │   ├── client-view/    → Simplified client portal
│   │   └── api/
│   │       └── ai/         → Gemini AI API route
│   ├── components/
│   │   ├── Navbar.js       → Role-based navigation
│   │   └── AIPanel.js      → AI report generation panel
│   └── lib/
│       ├── supabase.js     → Supabase client
│       └── generateAlerts.js → Alert auto-generation logic
├── public/
├── .env.local              → Environment variables (not committed)
├── HANDOFF.md              → Project handoff document
└── README.md
```

---

## 🤖 AI Features (Gemini 2.5 Flash)

All AI reports are generated via `/api/ai` and saved to the `ai_reports` table.

| Report Type | Description |
|---|---|
| Daily Summary | Summarizes today's project progress |
| Risk Report | Identifies delayed/risky milestones with recommendations |
| Internal Update | Structured update for the DECKARC team |
| Client Update | Jargon-free friendly update for the client |
| Missing Info Check | Flags incomplete daily updates with follow-up questions |

---

## ⚠️ Known Limitations

1. No real email notifications — alerts are in-app only
2. Photo/file upload not yet implemented
3. No weather API integration
4. Client view shows all projects — future version should filter by assigned client
5. No pagination on large lists
6. No mobile responsive polish
7. User management UI not built — roles assigned via Supabase SQL
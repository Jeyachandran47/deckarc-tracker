This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


# DECKARC Project Tracker MVP — Handoff Document

**Assigned by:** CONVAZANT INC  
**Target client:** DECKARC LLC  
**Built by:** [Your Name]  
**Completion date:** [Today's Date]  
**MVP link:** [Your deployed URL or localhost:3000]

---

## Test Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@deckarc.test | Admin@1234 |
| General Contractor | gc@deckarc.test | Gc@12345 |
| Subcontractor | sub@deckarc.test | Sub@12345 |
| Client | client@deckarc.test | Client@123 |

**Test Gmail used:** deckarc.projecttracker.test@gmail.com  
**Test Gmail password:** [write here]

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS |
| Database + Auth | Supabase |
| AI | Google Gemini 2.5 Flash |
| Hosting | [Vercel / localhost] |

---

## Database Tables

| Table | Purpose |
|---|---|
| profiles | Extends Supabase auth users with role |
| projects | All DECKARC construction projects |
| tasks | Tasks and milestones per project |
| daily_updates | Daily progress submissions |
| permits | Permit tracking per project |
| inspections | Inspection scheduling and results |
| alerts | Green/yellow/red alerts auto-generated |
| ai_reports | All AI-generated reports saved |

---

## Sample Projects Loaded

1. **Vik Room Addition** — Single-story room addition, foundation in progress
2. **Ganesh Living Room Extension** — Two-story high ceiling extension, Charlotte NC
3. **Sample Bathroom Remodel** — Bathroom upgrade, material selection phase

---

## Features Completed

- [x] Login page with role-based routing
- [x] Admin dashboard with live stats
- [x] Project management — add, edit, view
- [x] Task and milestone tracker with status colors
- [x] Daily update form for subcontractors
- [x] Green/yellow/red alert system
- [x] Delay logic — projected finish date auto-updates
- [x] Permit and inspection tracker
- [x] AI daily summary (Gemini 2.5 Flash)
- [x] AI risk report
- [x] AI internal update
- [x] AI client-friendly update
- [x] AI missing info detector
- [x] Client simplified progress view
- [x] Role-based access — each role sees only what they should

---

## Known Limitations & Suggested Next Improvements

1. No real email notifications yet — alerts are in-app only
2. Photo/file upload placeholder only — not yet implemented
3. No weather API integration — placeholder exists
4. Client view shows all projects — future version should filter by assigned client
5. No mobile responsive polish — works on desktop, needs mobile CSS pass
6. No pagination on large project/task lists
7. Roles are assigned manually via SQL — admin UI for user management needed

---

## How to Run Locally

1. Clone the repo
2. Run `npm install`
3. Add `.env.local` with Supabase URL, anon key, and Gemini API key
4. Run `npm run dev`
5. Open `http://localhost:3000`
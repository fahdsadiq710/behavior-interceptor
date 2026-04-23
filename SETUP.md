# Behavior Interceptor — Setup

## Quick Start

```bash
cd behavior-interceptor
npm install
npm run dev
```

Open http://localhost:3000

## Demo Login

| Role  | Email                     | Password |
|-------|---------------------------|----------|
| Admin | admin@interceptor.ai      | admin123 |

New signups go to **pending** status — approve them from the admin panel.

## Project Structure

```
app/
  page.tsx          ← 3D cinematic landing page
  auth/page.tsx     ← Login / Signup / Pending
  dashboard/page.tsx ← Main SPA (single page)
  admin/page.tsx    ← Admin panel
  api/              ← Next.js API routes
components/
  landing/          ← 3D R3F components (orb, particles, glass panel)
  app/              ← App UI (orb, interventions, progress, rewards)
lib/
  db.ts             ← In-memory store (swap with Supabase)
  auth.ts           ← JWT helpers
  gemini.ts         ← Gemini AI integration
store/
  useAppStore.ts    ← Zustand global state
```

## Environment Variables (.env.local)

```
GEMINI_API_KEY=your_key_here
JWT_SECRET=your_secret
```

## Production Database

Replace `lib/db.ts` in-memory store with Supabase:
1. Create a Supabase project
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
3. Run the SQL schema (users, sessions, interventions, rewards tables)

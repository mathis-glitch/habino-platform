# Habino Platform — Setup Guide

> Phase 1: Get a working local dev environment + deployed app in under 1 hour.

---

## Step 1 — Prerequisites

Install these on your computer if you don't have them:

- **Node.js 20+**: https://nodejs.org
- **Git**: https://git-scm.com
- **VS Code** (recommended): https://code.visualstudio.com

---

## Step 2 — Create a Supabase project (free)

1. Go to **https://supabase.com** and sign up / log in
2. Click **New project**
3. Give it a name: `habino-platform`
4. Choose a strong database password (save it somewhere safe)
5. Pick a region close to your target market (e.g. Singapore for Africa)
6. Wait ~2 minutes for it to provision

Once ready:
- Go to **Settings → API**
- Copy the **Project URL** and the **anon public** key
- Also copy the **service_role** key (keep this secret — never put it in frontend code)

---

## Step 3 — Run the database schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **+ New query**
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Paste the entire contents into the SQL editor
5. Click **Run** (green button)

You should see: `Success. No rows returned.`

This creates all tables, indexes, Row Level Security policies, and a demo tenant.

---

## Step 4 — Create a Vercel account & connect repo (free)

1. Go to **https://vercel.com** and sign up with GitHub
2. You'll need to push this project to GitHub first:
   - Create a new **private** repo on https://github.com/new
   - Follow GitHub's instructions to push this folder

---

## Step 5 — Install dependencies & configure environment

Open a terminal in this project folder:

```bash
npm install
```

Then copy the example env file:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
NEXT_PUBLIC_ROOT_DOMAIN=habino.app
NEXT_PUBLIC_DEV_TENANT_SLUG=demo
```

To get your **OpenAI API key**:
- Go to https://platform.openai.com/api-keys
- Create a new key, copy it

---

## Step 6 — Run the app locally

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

You should see the Habino home page (empty listings, but fully working).

---

## Step 7 — Deploy to Vercel

1. In the Vercel dashboard, click **Add New → Project**
2. Import your GitHub repo
3. Under **Environment Variables**, add the same values from your `.env.local` file
4. Click **Deploy**

Vercel gives you a URL like `habino-platform.vercel.app`.

---

## Step 8 — Create your first operator account

1. Visit your app (locally or on Vercel)
2. Go to `/auth/register`
3. Register an account
4. In Supabase → Table Editor → users, find your new user row
5. Change the `role` column from `buyer` to `operator_admin`
6. Visit `/admin` — you now have the admin dashboard

---

## What's built so far (Phase 1)

| Feature | Status |
|---|---|
| Project structure (Next.js 14 App Router) | ✅ Done |
| Supabase database schema + RLS | ✅ Done |
| Multi-tenant middleware (subdomain resolution) | ✅ Done |
| Per-tenant CSS theming (colours, logo) | ✅ Done |
| Auth (login, register, password reset) | ✅ Done |
| Home page (listing feed) | ✅ Done |
| Admin dashboard (stats + listing table) | ✅ Done |
| API: GET/POST/PUT/DELETE properties | ✅ Done |
| API: POST market/insights (OpenAI + cache) | ✅ Done |
| Market Intelligence page | ✅ Done |

## Coming in Phase 2

- Property detail page (full spec + images + AVM widget)
- Admin listing form (add/edit with image upload)
- Search results page with filters
- Property image upload to Supabase Storage

---

## Need help?

Work through this with Claude — open a new session, share the project files,
and ask for help with any specific step.

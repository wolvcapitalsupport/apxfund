# APXFund Deployment Guide

Get your platform live in under 2 hours.

---

## Prerequisites

- Node.js 18+ installed
- Git installed
- Accounts needed (all free tier available):
  - [Vercel](https://vercel.com) — hosting
  - [Supabase](https://supabase.com) — database
  - [Resend](https://resend.com) — emails
  - A domain name (optional but recommended)

---

## Step 1 — Database Setup (Supabase)

1. Create a new project at supabase.com
2. Go to **SQL Editor** and run the migration files in order:
   ```
   prisma/migrations/init.sql
   prisma/migrations/add_apx_accounting_fields.sql
   prisma/migrations/add_airdrop_claims.sql
   ```
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

---

## Step 2 — Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in all values (see comments in the file)
3. Generate `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

---

## Step 3 — Install & Run Locally

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database (if not using migration SQL)
npx prisma db push

# Run development server
npm run dev
```

Visit `http://localhost:3000` to verify everything works.

---

## Step 4 — Deploy to Vercel

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/yourusername/apxfund.git
   git push -u origin main
   ```

2. Go to [vercel.com/new](https://vercel.com/new) and import the repo

3. Add all environment variables from `.env.local` in Vercel's dashboard
   - Settings → Environment Variables → add each one

4. Deploy — Vercel auto-builds on every push

---

## Step 5 — Email Setup (Resend)

1. Create account at resend.com
2. Add and verify your domain (or use their sandbox for testing)
3. Create an API key
4. Add to Vercel env vars:
   - `RESEND_API_KEY`
   - `EMAIL_FROM` (must match verified domain)

---

## Step 6 — Cron Jobs (Auto-configured on Vercel)

The `vercel.json` file already configures two cron jobs:
- **Daily ROI** — runs at 2:00 AM UTC
- **Drip emails** — runs at 9:00 AM UTC

They will activate automatically after deployment. Make sure `CRON_SECRET` is set in Vercel env vars.

---

## Step 7 — Create First Admin User

1. Register a normal account at your domain
2. Go to Supabase SQL Editor and run:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
   ```
3. Log out and log back in — you'll see the Admin panel

---

## Step 8 — APX Token (Optional)

If you want to use the existing APX token on BSC:
- Contract: `0x8d6032443cb7b23c134094c8921f1f37824ea3a2`
- Network: BNB Smart Chain (Mainnet)
- The token is already live — you just need a distribution wallet with APX balance

If you want to deploy your own token:
- Use [Remix IDE](https://remix.ethereum.org) with a standard ERC-20 contract
- Update `NEXT_PUBLIC_APX_CONTRACT_ADDRESS` with your new contract

---

## Common Issues

**Build fails with Prisma error:**
```bash
npx prisma generate
```
Run this before building.

**"Invalid API key" on emails:**
Make sure `EMAIL_FROM` domain matches your verified Resend domain.

**Cron jobs not running:**
Check that `CRON_SECRET` is set in Vercel and matches the value in your env.

**Database connection timeout:**
Use the pooler URL from Supabase (port 6543) for `DATABASE_URL`, and direct URL (port 5432) for `DIRECT_URL`.

---

## Support

For setup help, contact the seller via Gumroad messaging.

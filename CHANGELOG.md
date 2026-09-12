# APXFund Changelog

All notable features and updates to APXFund are documented here.

---

## [1.0.0] — September 2026 — Initial Release

### Core Platform
- Full investor registration and authentication (NextAuth + Supabase)
- Email verification flow on signup
- Secure session management with JWT
- Role-based access control (Investor / Admin)

### Investment System
- Multiple investment plan support (Starter, Growth, etc.)
- Configurable ROI rates and maturity periods
- Auto-reinvest toggle per investment
- Starter Portfolio two-cycle cap with `awaitingMigration` flag
- `MigrationBanner` component for smooth cycle transitions
- Force-complete investments from admin panel

### APX Token Economy
- All earnings (ROI, referral bonuses, maturity profit) paid in APX tokens
- Fixed buy rate: `$0.0008 USD per APX`
- Redemption rate: `$0.00072 USD per APX` (10% spread)
- USD equivalent and conversion rate stored on every APX transaction
- Historical allocations immutable even if rates change
- Capital/principal returns remain in USD — never converted to APX

### Daily ROI Cron System
- Vercel cron job runs at 2:00 AM UTC daily
- Processes active investments, credits APX to investor balance
- Handles investment maturity automatically
- Referral bonuses credited in APX on maturity
- Capital returned in USD on maturity (non-auto-reinvest)
- Secured via `CRON_SECRET` header validation

### APX Redemption System
- Investor submits redemption request (APX → USD)
- Minimum redemption enforced (configurable)
- Bidirectional input: type APX or USD, toggle with ⇄ button
- Live minimum redemption warning in UI
- Admin one-click approve + auto-credit USD to investor balance
- Manual APX debit feature for external payouts
- Full redemption queue with status filters (PENDING / SETTLED / REJECTED)

### Admin Panel
- Overview dashboard (total deposits, profit paid, user count)
- User management (view balances, edit, manual adjustments)
- Investment management (view all, force-complete)
- Withdrawal queue (approve / reject)
- KYC review tab
- APX Redemptions queue
- Profit migration tool (one-time USD → APX migration for existing investors)
- Campaign/email management

### Email System (Resend)
- 12 branded transactional email templates
- Welcome email on registration
- Investment confirmation email
- Withdrawal approved/rejected notifications
- APX redemption status emails
- Admin drip campaign system
- `wc_email_log` table for email audit trail
- Supabase auth webhook trigger for welcome emails
- Non-blocking email triggers (platform never crashes due to email failure)

### Airdrop System
- Public claim page at `/airdrop`
- BSC wallet address validation
- 100 wallet cap, 10,000 APX per wallet (configurable)
- Live stats: slots remaining, total claimed, progress bar
- AirdropClaim database table with status tracking (PENDING / DISTRIBUTED / FAILED)
- Admin panel to mark claims as distributed with tx hash
- ethers.js Node.js distribution script for Termux/server execution

### Referral System
- Unique referral link per investor
- Referral bonus credited in APX on referee's investment maturity
- Referral transaction history in dashboard

### Investor Dashboard
- Portfolio overview with active investments
- APX balance card with live USD equivalent
- Bidirectional APX/USD redemption interface
- Transaction history with type/currency labels
- Compounding projector tool
- Withdrawal request flow (USD balance)
- Manual APX wallet import guide (MetaMask / Trust Wallet)
- APX contract address with copy button

### Blockchain Integration
- BNB Smart Chain (BSC Mainnet)
- APX Token: `0x8d6032443cb7b23c134094c8921f1f37824ea3a2`
- ethers.js for on-chain interactions
- Token info display on Litepaper page with BscScan verification link

### Database
- PostgreSQL via Supabase
- Prisma ORM with full schema
- Double-entry ledger transaction system
- `usdEquivalent` and `conversionRate` fields on all APX transactions
- Connection pooling via Supabase pooler (port 6543)

### Tech Stack
- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (Supabase)
- **Auth:** NextAuth.js
- **Email:** Resend
- **Blockchain:** ethers.js, BNB Smart Chain
- **Deployment:** Vercel (with cron jobs)
- **Storage:** Supabase Storage

---

## Planned / Future Features

- CoinGecko / CoinMarketCap listing for APX token
- Trust Wallet assets repository submission
- Mobile app wrapper (Capacitor)
- Two-factor authentication (2FA)
- On-chain APX redemption (direct wallet transfer)
- Public investor leaderboard

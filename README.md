# 🏦 APXFund — Professional Investment Platform

> A production-ready, full-stack investment management system built with modern web technologies. Manage investment portfolios, process deposits/withdrawals, track returns, and scale to thousands of users.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=flat-square&logo=postgresql)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![APX Token](https://img.shields.io/badge/APX%20Token-BEP--20-F7931A?style=flat-square&logo=binance)](https://bscscan.com/token/0x8d6032443cb7b23c134094c8921f1f37824ea3a2)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](#license)

---

## ✨ Features

### Core Functionality
- ✅ **User Authentication** — Secure credential-based login with bcrypt password hashing
- ✅ **Email Verification** — OTP-based email verification on signup (Resend)
- ✅ **Investment Plans** — Create and manage flexible ROI-based investment plans (3.5% – 38% returns)
- ✅ **Portfolio Dashboard** — Real-time balance tracking, active investments, profit visualization
- ✅ **Deposit System** — Cryptocurrency deposit tracking with blockchain confirmation
- ✅ **Withdrawal Management** — Secure withdrawal requests with admin approval workflow
- ✅ **Transaction History** — Complete audit trail with filters and export capability
- ✅ **Referral System** — Referral code generation and bonus tracking
- ✅ **KYC Submissions** — Document upload and verification workflow
- ✅ **Admin Panel** — User management, balance adjustments, account suspension
- ✅ **Responsive UI** — Mobile-first design with Tailwind CSS
- ✅ **Real-time Charts** — Portfolio performance visualization (Recharts)
- ✅ **Notifications** — In-app notification system for deposits, withdrawals, and ROI payouts

### Advanced Features
- 🔐 **JWT Sessions** — 24-hour max session age with 1-hour refresh intervals
- 📊 **APX Rewards System** — Native reward token (BEP-20) with redemption workflow
- 💰 **Flexible Investment Options** — Multi-plan support with auto-reinvestment
- 🔄 **ROI Processing** — Automated profit calculation and crediting (cron-based)
- 🌐 **Multi-language Support** — i18n integration ready
- 📧 **Email Notifications** — Automated emails for critical events
- 🛡️ **Role-Based Access** — USER and ADMIN roles with protected routes

---

## 💎 APX Token (BEP-20)

**APXFund** features its own native reward token, **APX**, deployed on the Binance Smart Chain (BSC).

| Property | Details |
|----------|---------|
| **Token Name** | APX |
| **Standard** | BEP-20 (Binance Smart Chain) |
| **Contract Address** | [`0x8d6032443cb7b23c134094c8921f1f37824ea3a2`](https://bscscan.com/token/0x8d6032443cb7b23c134094c8921f1f37824ea3a2) |
| **Explorer Link** | [View on BSCScan](https://bscscan.com/token/0x8d6032443cb7b23c134094c8921f1f37824ea3a2) |
| **Decimals** | 18 |
| **Use Case** | User rewards, referral bonuses, platform incentives |

### APX Token Features
- **Rewards Distribution** — Earn APX tokens from referrals and platform activities
- **Redemption** — Convert APX to USD within the platform at current market rate
- **Live Tracking** — Real-time APX balance and USD equivalent in user dashboard
- **Transparent On-Chain** — All transactions verified on BSCScan
- **Withdrawal Ready** — Convert and withdraw APX to external wallets

### How to Add APX to Your Wallet
1. Open MetaMask or your BSC-compatible wallet
2. Go to **Import Token** (or **Add Token**)
3. Enter the contract address: `0x8d6032443cb7b23c134094c8921f1f37824ea3a2`
4. Token will auto-populate (Symbol: APX, Decimals: 18)
5. Click **Add** and start trading

---

## 🗂️ Project Structure

```
apxfund/
├── app/
│   ├── page.tsx                          # Landing page (public, SEO-optimized)
│   ├── layout.tsx                        # Root layout + providers
│   ├── middleware.ts                     # Auth route protection
│   ├── auth/
│   │   ├── login/page.tsx               # Login page
│   │   └── register/page.tsx            # Registration with OTP verification
│   ├── dashboard/
│   │   ├── layout.tsx                   # Sidebar + protected layout
│   │   ├── page.tsx                     # Portfolio overview
│   │   ├── deposit/page.tsx             # Deposit flow
│   │   ├── withdraw/page.tsx            # Withdrawal flow
│   │   ├── plans/page.tsx               # Investment plans selection
│   │   ├── transactions/page.tsx        # Transaction history
│   │   └── profile/page.tsx             # User profile management
│   ├── admin/
│   │   └── page.tsx                     # Admin dashboard (user mgmt)
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/route.ts   # NextAuth API endpoint
│       │   └── register/route.ts        # User registration endpoint
│       ├── user/me/route.ts             # Get current user data
│       ├── plans/route.ts               # Investment plans CRUD
│       ├── investments/route.ts         # Create/list investments
│       ├── transactions/route.ts        # Deposit/withdrawal requests
│       ├── cron/                        # Cron job endpoints
│       └── admin/users/route.ts         # Admin user management
├── components/
│   ├── layout/
│   │   ├── PublicHeader.tsx             # Landing page header
│   │   ├── PublicFooter.tsx             # Landing page footer
│   │   └── DashboardSidebar.tsx         # Dashboard navigation
│   ├── AnimatedNumber.tsx               # Number animation component
│   ├── TickingBalance.tsx               # Live balance ticker
│   ├── PortfolioAnalytics.tsx           # Portfolio charts
│   ├── CompoundingProjector.tsx         # Investment projection calculator
│   └── ...other components
├── lib/
│   ├── auth.ts                          # NextAuth configuration
│   ├── prisma.ts                        # Prisma client singleton
│   ├── mailer.ts                        # Email sending utilities
│   ├── utils.ts                         # Helper functions
│   ├── i18n.ts                          # Internationalization
│   └── useLang.ts                       # Language hook
├── prisma/
│   ├── schema.prisma                    # Database schema
│   └── seed.js                          # Database seeding
├── types/
│   └── next-auth.d.ts                   # NextAuth type extensions
├── public/
│   └── images/                          # Static assets
├── .env.example                         # Environment variable template
├── package.json
├── next.config.js                       # Next.js configuration
├── tailwind.config.js                   # Tailwind CSS config
├── tsconfig.json                        # TypeScript configuration
└── vercel.json                          # Vercel deployment config
```

---

## 🗄️ Database Schema

| Model | Purpose |
|-------|---------|
| **User** | Investor accounts, balances, KYC status, referral codes, APX balance & rewards |
| **Plan** | Investment plan definitions (Starter, Growth, Apex, Sovereign) |
| **Investment** | Active/completed user investments with ROI tracking |
| **Transaction** | All financial movements (deposits, withdrawals, profits, referral bonuses, APX operations) |
| **KycSubmission** | Document uploads and verification workflow |
| **Notification** | In-app notifications for user events |
| **ApxRedemption** | APX token redemption requests and status (pending, approved, settled) |
| **WalletAddress** | Cryptocurrency wallet addresses for deposits |
| **RoiProcessingLog** | Audit trail for automated ROI processing |
| **EmailLog** | Transactional email tracking and delivery logs |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ (18+ recommended)
- **npm** 7+ or **yarn** 1.22+
- **PostgreSQL** database (Supabase free tier recommended)

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/wolvcapitalsupport/apxfund.git
cd apxfund
npm install
```

**2. Set up Supabase (Free):**
- Go to [supabase.com](https://supabase.com)
- Click **"New Project"** → Enter project name & strong password
- Wait for provisioning (~2 minutes)
- Copy the PostgreSQL connection string from **Settings → Database → URI**

**3. Configure environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Database
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# Authentication
NEXTAUTH_SECRET="openssl rand -base64 32"  # Run: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_NAME="APXFund"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxx"

# APX Token & Blockchain
APX_TOKEN_ADDRESS="0x8d6032443cb7b23c134094c8921f1f37824ea3a2"
BSC_RPC_URL="https://bsc-dataseed1.binance.org"
APX_DECIMALS="18"

# Optional: AI Integration
XAI_API_KEY="xai_xxxxxxxxxxxxx"  # For Grok AI coaching (optional)
XAI_MODEL="grok-3-mini"

# Cron Jobs
CRON_SECRET="your-secret-key"
```

**4. Initialize the database:**
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with demo data
npm run db:seed
```

After seeding, you'll have:
- **Admin Account:** `admin@apxfund.xyz` / `Admin@123456`
- **Demo User:** `demo@apxfund.xyz` / `Demo@123456`
- **4 Investment Plans:** Starter Portfolio, Growth Fund, Apex Fund, Sovereign Tier
- **Crypto Wallet Addresses:** BTC, ETH, USDT (mainnet)

**5. Start development server:**
```bash
npm run dev
```

Visit **http://localhost:3000** and log in with the demo account.

---

## 📦 Deployment

### Deploy to Vercel (Recommended)

**Option A: Via GitHub**
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **"Add New..." → "Project"**
4. Select your repository
5. Add environment variables in **Settings → Environment Variables**
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your live domain)
   - `RESEND_API_KEY`
   - `APX_TOKEN_ADDRESS`
   - `BSC_RPC_URL`
   - `CRON_SECRET`
6. Deploy

**Option B: Via Vercel CLI**
```bash
npm i -g vercel
vercel
# Follow prompts, add environment variables in dashboard
```

**Enable Cron Jobs (Optional):**
Uncomment in `vercel.json` to auto-process investments:
```json
{
  "crons": [{
    "path": "/api/cron/process-investments",
    "schedule": "0 * * * *"  // Hourly
  }]
}
```

### Deploy to Other Platforms

**Docker:**
```bash
docker build -t apxfund .
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  -e APX_TOKEN_ADDRESS="..." \
  apxfund
```

**Traditional VPS:**
```bash
npm run build
npm run start
```

---

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma generate     # Regenerate Prisma client
npx prisma db push      # Apply schema changes
npx prisma studio      # Open visual database browser (http://localhost:5555)
npm run db:seed        # Re-seed database with demo data

# Linting & Quality
npm run lint            # Run ESLint
npm run format          # Format code with Prettier (if configured)
```

---

## 🔐 Authentication Flow

```
User Login
  ↓
Credentials sent to /api/auth/[...nextauth]
  ↓
Verify email & password with bcrypt
  ↓
Check if account is active & verified
  ↓
Issue JWT token (expires in 24 hours)
  ↓
Set HTTP-only cookie + session
  ↓
Redirect to /dashboard
```

**Session Details:**
- **Strategy:** JWT
- **Max Age:** 24 hours
- **Refresh Interval:** 1 hour (on activity)
- **Storage:** HTTP-only cookie (secure)

---

## 💰 Investment Flow

```
User selects Plan → Enters amount
  ↓
Backend validates:
  • User balance ≥ amount
  • minAmount ≤ amount ≤ maxAmount
  • User is active & verified
  ↓
Prisma Transaction:
  1. Create Investment record
  2. Deduct from user.balance
  3. Create Transaction record (type: INVESTMENT)
  ↓
Investment marked ACTIVE with endDate
  ↓
ROI Processing (automated):
  • At endDate: Mark as COMPLETED
  • Credit profit to user.balance
  • Create Transaction (type: PROFIT)
  ↓
User withdraws or reinvests
```

---

## 💎 APX Token Workflow

```
User Activity (Referral, Bonus)
  ↓
System generates APX reward
  ↓
APX credited to user.apxBalance
  ↓
User views APX balance in dashboard
  ↓
User initiates redemption request
  ↓
Admin approves redemption (optional)
  ↓
APX converted to USD at market rate
  ↓
Funds credited to user balance
  ↓
Can withdraw or reinvest
```

---

## 📋 API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth routes (signin, callback, session) |
| `/api/auth/register` | POST | Register new user with email OTP |

### User
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/me` | GET | Get current user profile, balance, APX balance & rewards |

### Investments
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/plans` | GET, POST | List/create investment plans |
| `/api/investments` | GET, POST | List/create user investments |

### Transactions
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transactions` | GET, POST | List/create transactions (deposit, withdrawal, APX operations) |

### Admin
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/users` | GET, PATCH | List users, adjust balance, suspend account |

### Cron Jobs
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cron/process-investments` | GET | Process due investments & credit profits |
| `/api/cron/process-apx-rewards` | GET | Distribute APX rewards & process redemptions |

---

## 🧩 Key Technologies

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React 18 + Next.js App Router | 18 + 14.2 |
| **Styling** | Tailwind CSS + Lucide Icons | 3.4 + 0.400 |
| **Charts** | Recharts | 2.15 |
| **Backend** | Node.js + Next.js API Routes | 18+ |
| **Database** | PostgreSQL (Supabase) | 15+ |
| **ORM** | Prisma | 5.22 |
| **Auth** | NextAuth.js | 4.24 |
| **Validation** | Zod | 3.23 |
| **Email** | Resend | 3.5 |
| **Notifications** | React Hot Toast | 2.4 |
| **Blockchain** | BSC (Binance Smart Chain) | — |
| **Token Standard** | BEP-20 (APX Token) | — |

---

## 🔄 Automated ROI Processing

The system includes a background job to automatically process investments and credit profits:

**Endpoint:** `/api/cron/process-investments`  
**Requires:** `Authorization: Bearer {CRON_SECRET}`

**Logic:**
1. Find all ACTIVE investments with `endDate ≤ now()`
2. For each investment:
   - Calculate expected profit
   - Update status to COMPLETED
   - Credit profit to user balance
   - Create PROFIT transaction
   - Optionally auto-reinvest if enabled
3. Log processing results

**Enable on Vercel:**
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/process-investments",
    "schedule": "0 * * * *"
  }]
}
```

---

## 🔍 Testing

Currently, testing is manual via:
1. **Development Server:** `npm run dev` + browser testing
2. **Prisma Studio:** `npm run db:studio` (visual DB browser)
3. **Demo Accounts:** Pre-seeded for testing workflows
4. **BSCScan:** View APX token contract and transactions on [BSCScan](https://bscscan.com/token/0x8d6032443cb7b23c134094c8921f1f37824ea3a2)

**Future Improvements:**
- [ ] Jest unit tests
- [ ] Cypress E2E tests
- [ ] API integration tests
- [ ] Smart contract unit tests (Hardhat)

---

## 📊 Performance Optimizations

- **Image Optimization:** Next.js Image component with lazy loading
- **Code Splitting:** Automatic route-based code splitting
- **Database Indexing:** Indexes on frequently queried fields
- **Caching:** HTTP caching for static assets (images, fonts)
- **API Route Compression:** Gzip compression via Vercel
- **Blockchain Caching:** RPCcall batching to minimize BSC RPC calls

---

## 🛡️ Security

- ✅ **Password Security** — bcrypt hashing (12 salt rounds)
- ✅ **Session Security** — JWT tokens, HTTP-only cookies
- ✅ **Input Validation** — Zod schema validation on all endpoints
- ✅ **CSRF Protection** — NextAuth built-in CSRF protection
- ✅ **SQL Injection** — Parameterized queries via Prisma
- ✅ **Rate Limiting** — Recommend implementing Vercel Rate Limiting
- ✅ **Environment Secrets** — All secrets in `.env.local` (never committed)
- ✅ **Smart Contract Security** — BEP-20 standard compliance
- ⚠️ **Production Checklist:**
  - [ ] Enable HTTPS (Vercel handles automatically)
  - [ ] Set strong `NEXTAUTH_SECRET`
  - [ ] Configure custom domain with HTTPS
  - [ ] Enable reCAPTCHA on login/register
  - [ ] Monitor authentication logs
  - [ ] Regular security audits
  - [ ] Smart contract audit (recommend Certik or Trail of Bits)

---

## 🚧 Roadmap & Future Features

### Planned Features
- [ ] **2FA (TOTP)** — Two-factor authentication
- [ ] **Live Chat** — Tawk.to / Crisp integration
- [ ] **Payment Gateway** — Stripe/Crypto payment processing
- [ ] **Advanced Analytics** — AI-powered insights & recommendations
- [ ] **Mobile App** — React Native companion app
- [ ] **API Documentation** — Swagger/OpenAPI spec
- [ ] **Automated Alerts** — SMS/push notifications
- [ ] **Compliance** — AML/KYC enhanced verification
- [ ] **APX Staking** — Stake APX for additional rewards
- [ ] **Governance** — APX token holder voting on platform changes
- [ ] **DEX Integration** — Direct APX trading on Pancakeswap

---

## 🤝 Contributing

This codebase is provided as a professional template. If you're deploying your own instance:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -m "Add new feature"`)
4. Push to branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

**Commercial Use:**
- ✅ Allowed with attribution
- ✅ Modify for your business
- ✅ Deploy to production
- ✅ Resell (ensure compliance with local laws)

---

## 📞 Support & Resources

- **Email:** support@apxfund.xyz
- **Documentation:** See `ARCHITECTURE.md` for detailed system design
- **Issues:** [GitHub Issues](https://github.com/wolvcapitalsupport/apxfund/issues)
- **APX Token:** [View on BSCScan](https://bscscan.com/token/0x8d6032443cb7b23c134094c8921f1f37824ea3a2)
- **Vercel Docs:** https://vercel.com/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **NextAuth Docs:** https://next-auth.js.org
- **BSC Docs:** https://docs.binance.org/smart-chain/

---

## 📈 Metrics & Monitoring

**Recommended Setup:**
- **Error Tracking:** Sentry, Rollbar
- **Analytics:** Google Analytics, Mixpanel
- **Performance Monitoring:** Vercel Analytics, New Relic
- **Database Monitoring:** Supabase dashboard
- **Uptime Monitoring:** Pingdom, UptimeRobot
- **Blockchain Monitoring:** BSCScan API, Alchemy Notify

---

## ⚖️ Legal Notice

**Disclaimer:** APXFund is a demo/template investment platform. Before deploying in production:

1. **Consult Legal Advisors** — Ensure compliance with financial regulations in your jurisdiction
2. **Register as Investment Firm** — Many jurisdictions require licensing
3. **Implement Fraud Prevention** — Advanced KYC, AML, and transaction monitoring
4. **Insurance** — Errors & Omissions insurance recommended
5. **Terms of Service** — Create comprehensive ToS & Privacy Policy
6. **Data Protection** — GDPR, CCPA compliance for user data
7. **Token Compliance** — Ensure APX token compliance with securities laws in your region

---

**Built with ❤️ for the modern fintech era.**

**Current Version:** 0.1.0  
**Last Updated:** 2026-09-12  
**Status:** Production-Ready Template  
**Blockchain:** Binance Smart Chain (BSC)  
**Token:** APX (BEP-20) — `0x8d6032443cb7b23c134094c8921f1f37824ea3a2`

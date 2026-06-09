const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const { addDays } = require('date-fns')

const prisma = new PrismaClient()

async function main() {
  console.log("🧹 Cleaning database before seeding...")
  await prisma.investment.deleteMany({})
  await prisma.transaction.deleteMany({})
  await prisma.notification.deleteMany({})
  await prisma.kycSubmission.deleteMany({})
  await prisma.plan.deleteMany({})
  await prisma.walletAddress.deleteMany({})
  await prisma.user.deleteMany({})
  console.log("✅ Database cleared.")
  console.log('🌱 Seeding APXFund database...\n')

  // ── Admin user ──────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123456', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@apxfund.xyz' },
    update: {},
    create: {
      email: 'admin@apxfund.xyz',
      password: adminPassword,
      fullName: 'APXFund Admin',
      role: 'ADMIN',
      kycStatus: 'APPROVED',
      isActive: true,
      referralCode: 'ADMIN001',
    },
  })
  console.log('✅ Admin user:', admin.email)

  // ── Demo investor ───────────────────────────────────────
  const userPassword = await bcrypt.hash('User@123456', 12)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@apxfund.xyz' },
    update: {},
    create: {
      email: 'demo@apxfund.xyz',
      password: userPassword,
      fullName: 'Demo Investor',
      role: 'USER',
      kycStatus: 'APPROVED',
      isActive: true,
      balance: 5000,
      totalDeposited: 5000,
      referralCode: 'DEMO001',
    },
  })
  console.log('✅ Demo user:', demoUser.email)

  // ── Investment plans ────────────────────────────────────
  // ROI is TOTAL return over duration (not daily), realistic for a fixed-term yield product
  const plansData = [
    {
      name: 'Starter Portfolio',
      roiPercent: 3.5,
      minAmount: 200,
      maxAmount: 1999,
      durationDays: 7,
      referralBonus: 5,
      description: 'A low-risk entry-level plan ideal for first-time investors. Fixed 3.5% return over 7 days.',
      features: [
        '3.5% Fixed Return',
        '$200 – $1,999 Investment',
        '7-Day Term',
        '5% Referral Bonus',
        '24/7 Support',
      ],
    },
    {
      name: 'Growth Fund',
      roiPercent: 12,
      minAmount: 2000,
      maxAmount: 29000,
      durationDays: 14,
      referralBonus: 7,
      description: 'Mid-tier managed fund with diversified exposure. 12% fixed return over a 14-day term.',
      features: [
        '12% Fixed Return',
        '$2,000 – $29,000 Investment',
        '14-Day Term',
        '7% Referral Bonus',
        'Priority Support',
      ],
    },
    {
      name: 'Apex Fund',
      roiPercent: 22,
      minAmount: 30000,
      maxAmount: 99000,
      durationDays: 30,
      referralBonus: 10,
      description: 'High-conviction strategy for institutional-grade clients. 22% fixed return over 30 days.',
      features: [
        '22% Fixed Return',
        '$30,000 – $99,000 Investment',
        '30-Day Term',
        '10% Referral Bonus',
        'Dedicated Account Manager',
      ],
    },
    {
      name: 'Sovereign Tier',
      roiPercent: 38,
      minAmount: 100000,
      maxAmount: 500000,
      durationDays: 30,
      referralBonus: 15,
      description: 'Exclusive VIP allocation for ultra-high-net-worth clients. 38% fixed return, full white-glove service.',
      features: [
        '38% Fixed Return',
        '$100,000+ Investment',
        '30-Day Term',
        '15% Referral Bonus',
        'VIP Private Manager',
      ],
    },
  ]

  for (const plan of plansData) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    })
  }
  console.log('✅ Investment plans seeded (4 plans)')

  // ── Wallet addresses ────────────────────────────────────
  const wallets = [
    { currency: 'BTC',  label: 'Bitcoin (BTC)',             address: 'Bc1qhgm7yze9p9hfr74q57kellpf35gz4y85tktdh4', network: 'Bitcoin Mainnet' },
    { currency: 'ETH',  label: 'Ethereum (ETH)',            address: '0x29D3554E0e83eCD7De7329763E750B0143635f93', network: 'ERC-20' },
    { currency: 'USDT', label: 'Tether USDT (TRC-20)',      address: 'TSC9hepwW7mZW1oBmgKJQT3itWuNyKEgmm',       network: 'TRC-20' },
    { currency: 'USDC', label: 'USD Coin (Arbitrum One)',   address: '0x29D3554E0e83eCD7De7329763E750B0143635f93', network: 'Arbitrum One' },
  ]

  for (const wallet of wallets) {
    await prisma.walletAddress.upsert({
      where: { currency: wallet.currency },
      update: {},
      create: wallet,
    })
  }
  console.log('✅ Wallet addresses seeded (BTC, ETH, USDT TRC20, USDC Arbitrum)')

  // ── Demo data ───────────────────────────────────────────
  const starterPlan = await prisma.plan.findUnique({ where: { name: 'Starter Portfolio' } })

  await prisma.transaction.create({
    data: {
      userId: demoUser.id,
      type: 'DEPOSIT',
      status: 'PENDING',
      amount: 500,
      currency: 'BTC',
      txHash: 'abc123demo456txhash789example',
      note: 'Demo pending deposit — review in admin panel',
    },
  })

  await prisma.kycSubmission.create({
    data: {
      userId: demoUser.id,
      documentType: 'passport',
      documentNumber: 'P12345678',
      frontImageUrl: 'https://via.placeholder.com/400x250/1a1a2e/c9a84c?text=Passport+Front',
      backImageUrl:  'https://via.placeholder.com/400x250/1a1a2e/c9a84c?text=Passport+Back',
      selfieUrl:     'https://via.placeholder.com/400x400/1a1a2e/c9a84c?text=Selfie+with+ID',
      status: 'PENDING',
    },
  })

  if (starterPlan) {
    await prisma.investment.create({
      data: {
        userId: demoUser.id,
        planId: starterPlan.id,
        amount: 500,
        expectedProfit: 500 * starterPlan.roiPercent / 100,
        status: 'ACTIVE',
        startDate: addDays(new Date(), -2),
        endDate: addDays(new Date(), 5),
      },
    })
  }

  await prisma.notification.create({
    data: {
      userId: demoUser.id,
      title: '👋 Welcome to APXFund',
      message: 'Your account is ready. Complete KYC verification to unlock full access.',
      type: 'info',
      link: '/dashboard/kyc',
    },
  })

  console.log('\n🎉 Seed complete!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Admin:  admin@apxfund.xyz  / Admin@123456')
  console.log('  Demo:   demo@apxfund.xyz   / User@123456')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

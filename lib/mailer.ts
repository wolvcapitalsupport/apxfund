import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM || 'APXFund <noreply@apxfund.xyz>'
const BASE = process.env.NEXTAUTH_URL || 'https://apxfund.xyz'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

// ── Branded email wrapper ─────────────────────────────────────────────
function wrap(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a14;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

  <!-- Header -->
  <tr><td style="background:#12121f;border:1px solid #1e1e35;border-radius:16px 16px 0 0;padding:28px 36px;text-align:center">
    <a href="${BASE}" style="text-decoration:none">
      <span style="font-size:26px;font-weight:900;letter-spacing:-0.5px">
        <span style="color:#c9a84c">APX</span><span style="color:#ffffff">Fund</span>
      </span>
    </a>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#12121f;border-left:1px solid #1e1e35;border-right:1px solid #1e1e35;padding:36px">
    ${content}
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#0d0d1a;border:1px solid #1e1e35;border-top:none;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center">
    <p style="margin:0 0 6px;font-size:12px;color:#444">© ${new Date().getFullYear()} APXFund. All rights reserved.</p>
    <p style="margin:0;font-size:11px;color:#333">3536 Badger Pond Lane, Pittsburgh, PA 15212, United States</p>
    <p style="margin:6px 0 0;font-size:11px;color:#333">
      <a href="mailto:support@apxfund.xyz" style="color:#c9a84c;text-decoration:none">support@apxfund.xyz</a>
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`
}

function heading(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#ffffff">${text}</h1>`
}

function para(text: string) {
  return `<p style="margin:12px 0;font-size:15px;color:#aaaaaa;line-height:1.6">${text}</p>`
}

function btn(text: string, href: string) {
  return `<div style="text-align:center;margin:28px 0">
    <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8cc7a);color:#0a0a14;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:900;font-size:14px">${text}</a>
  </div>`
}

function statusBox(label: string, value: string, color: string) {
  return `<div style="background:#0a0a14;border:1px solid #1e1e35;border-left:3px solid ${color};border-radius:8px;padding:14px 18px;margin:16px 0">
    <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${label}</div>
    <div style="font-size:18px;font-weight:900;color:${color}">${value}</div>
  </div>`
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #1e1e35;margin:24px 0">`
}

function note(text: string) {
  return `<p style="font-size:12px;color:#555;margin:16px 0 0">${text}</p>`
}

// ── Send helper ───────────────────────────────────────────────────────
async function send(to: string, subject: string, html: string) {
  try {
    const resend = getResend()
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error(`[mailer] Failed to send "${subject}" to ${to}:`, err)
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 1. EMAIL VERIFICATION OTP
// ═══════════════════════════════════════════════════════════════════════
export async function sendVerificationOtp(to: string, name: string, otp: string) {
  const html = wrap(`
    ${heading('Verify Your Email')}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, welcome to APXFund. Enter the code below to verify your email address and activate your account.`)}
    <div style="text-align:center;margin:32px 0">
      <div style="display:inline-block;background:#0a0a14;border:2px solid #c9a84c;border-radius:14px;padding:20px 40px">
        <div style="font-size:11px;color:#c9a84c;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px">Verification Code</div>
        <div style="font-size:42px;font-weight:900;letter-spacing:10px;color:#ffffff;font-family:monospace">${otp}</div>
        <div style="font-size:11px;color:#555;margin-top:10px">Expires in 15 minutes</div>
      </div>
    </div>
    ${para('If you did not create an APXFund account, you can safely ignore this email.')}
    ${note('Do not share this code with anyone. APXFund will never ask for your OTP.')}
  `)
  await send(to, 'Your APXFund Verification Code', html)
}

// ═══════════════════════════════════════════════════════════════════════
// 2. WELCOME (after verification)
// ═══════════════════════════════════════════════════════════════════════
export async function sendWelcome(to: string, name: string) {
  const html = wrap(`
    ${heading('Welcome to APXFund 🎉')}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, your account has been verified and is fully active. You can now make your first deposit and start investing.`)}
    <div style="background:#0a0a14;border:1px solid #1e1e35;border-radius:10px;padding:20px;margin:20px 0">
      <div style="font-size:13px;font-weight:700;color:#c9a84c;margin-bottom:12px">QUICK START</div>
      ${['Complete KYC verification to unlock higher limits', 'Deposit funds using BTC, ETH, USDT, or USDC', 'Choose an investment plan and start earning'].map((s, i) =>
        `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#e8cc7a);color:#0a0a14;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i + 1}</div>
          <span style="font-size:13px;color:#aaa">${s}</span>
        </div>`
      ).join('')}
    </div>
    ${btn('Go to Dashboard', `${BASE}/dashboard`)}
    ${note('Questions? Reply to this email or use live chat on our website.')}
  `)
  await send(to, 'Welcome to APXFund — Your Account is Ready', html)
}

// ═══════════════════════════════════════════════════════════════════════
// 3. DEPOSIT — PENDING
// ═══════════════════════════════════════════════════════════════════════
export async function sendDepositPending(to: string, name: string, amount: number, currency: string) {
  const html = wrap(`
    ${heading('Deposit Request Received')}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, we have received your deposit request and it is currently under review by our team.`)}
    ${statusBox('Amount', `$${amount.toFixed(2)}`, '#c9a84c')}
    ${statusBox('Currency', currency, '#60a5fa')}
    ${statusBox('Status', 'Pending Review', '#f59e0b')}
    ${divider()}
    ${para('Deposits are typically reviewed and credited within <strong style="color:#fff">30 minutes</strong>. You will receive another email once your deposit is confirmed.')}
    ${btn('View Transactions', `${BASE}/dashboard/transactions`)}
    ${note('If you did not make this request, contact support immediately.')}
  `)
  await send(to, 'Deposit Request Received — APXFund', html)
}

// ═══════════════════════════════════════════════════════════════════════
// 4. DEPOSIT — APPROVED
// ═══════════════════════════════════════════════════════════════════════
export async function sendDepositApproved(to: string, name: string, amount: number, currency: string) {
  const html = wrap(`
    ${heading('✅ Deposit Confirmed')}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, great news — your deposit has been verified and your balance has been credited.`)}
    ${statusBox('Amount Credited', `$${amount.toFixed(2)}`, '#34d399')}
    ${statusBox('Currency', currency, '#60a5fa')}
    ${statusBox('Status', 'Approved', '#34d399')}
    ${divider()}
    ${para('Your funds are now available in your account. You can start investing in any of our available plans.')}
    ${btn('Browse Investment Plans', `${BASE}/dashboard/plans`)}
  `)
  await send(to, '✅ Deposit Confirmed — Balance Credited', html)
}

// ═══════════════════════════════════════════════════════════════════════
// 5. DEPOSIT — REJECTED
// ═══════════════════════════════════════════════════════════════════════
export async function sendDepositRejected(to: string, name: string, amount: number, reason?: string) {
  const html = wrap(`
    ${heading('Deposit Could Not Be Processed')}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, unfortunately we were unable to verify your recent deposit request.`)}
    ${statusBox('Amount', `$${amount.toFixed(2)}`, '#f87171')}
    ${statusBox('Status', 'Rejected', '#f87171')}
    ${reason ? statusBox('Reason', reason, '#f59e0b') : ''}
    ${divider()}
    ${para('Please check the transaction hash you submitted and try again. If you believe this is an error, contact our support team with your proof of payment.')}
    ${btn('Contact Support', `mailto:support@apxfund.xyz`)}
    ${btn('Try Again', `${BASE}/dashboard/deposit`)}
  `)
  await send(to, 'Deposit Could Not Be Processed — APXFund', html)
}

// ═══════════════════════════════════════════════════════════════════════
// 6. WITHDRAWAL — PENDING
// ═══════════════════════════════════════════════════════════════════════
export async function sendWithdrawalPending(to: string, name: string, amount: number, currency: string) {
  const html = wrap(`
    ${heading('Withdrawal Request Received')}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, your withdrawal request has been submitted and is pending approval.`)}
    ${statusBox('Amount', `$${amount.toFixed(2)}`, '#c9a84c')}
    ${statusBox('Currency', currency, '#60a5fa')}
    ${statusBox('Status', 'Pending Approval', '#f59e0b')}
    ${divider()}
    ${para('Withdrawals are processed within <strong style="color:#fff">24 hours</strong>. The funds have been reserved from your balance pending review.')}
    ${btn('View Transactions', `${BASE}/dashboard/transactions`)}
    ${note('If you did not request this withdrawal, contact support immediately.')}
  `)
  await send(to, 'Withdrawal Request Received — APXFund', html)
}

// ═══════════════════════════════════════════════════════════════════════
// 7. WITHDRAWAL — APPROVED
// ═══════════════════════════════════════════════════════════════════════
export async function sendWithdrawalApproved(to: string, name: string, amount: number, currency: string) {
  const html = wrap(`
    ${heading('💸 Withdrawal Approved')}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, your withdrawal has been approved and the funds are on their way to your wallet.`)}
    ${statusBox('Amount Sent', `$${amount.toFixed(2)}`, '#34d399')}
    ${statusBox('Currency', currency, '#60a5fa')}
    ${statusBox('Status', 'Approved', '#34d399')}
    ${divider()}
    ${para('Please allow 1–3 network confirmations for the transfer to fully reflect in your wallet.')}
    ${btn('View Transactions', `${BASE}/dashboard/transactions`)}
  `)
  await send(to, '💸 Withdrawal Approved — Funds Sent', html)
}

// ═══════════════════════════════════════════════════════════════════════
// 8. WITHDRAWAL — REJECTED
// ═══════════════════════════════════════════════════════════════════════
export async function sendWithdrawalRejected(to: string, name: string, amount: number, reason?: string) {
  const html = wrap(`
    ${heading('Withdrawal Request Declined')}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, your recent withdrawal request has been declined and the amount has been refunded to your account balance.`)}
    ${statusBox('Amount Refunded', `$${amount.toFixed(2)}`, '#c9a84c')}
    ${statusBox('Status', 'Rejected', '#f87171')}
    ${reason ? statusBox('Reason', reason, '#f59e0b') : ''}
    ${divider()}
    ${para('Your balance has been fully restored. If you have any questions, please contact our support team.')}
    ${btn('Contact Support', `mailto:support@apxfund.xyz`)}
  `)
  await send(to, 'Withdrawal Request Declined — APXFund', html)
}

// ═══════════════════════════════════════════════════════════════════════
// 9. KYC — SUBMITTED
// ═══════════════════════════════════════════════════════════════════════
export async function sendKycSubmitted(to: string, name: string) {
  const html = wrap(`
    ${heading('KYC Documents Received')}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, we have received your identity verification documents and our compliance team is reviewing them.`)}
    ${statusBox('Status', 'Under Review', '#f59e0b')}
    ${divider()}
    ${para('KYC reviews are typically completed within <strong style="color:#fff">2–24 hours</strong>. You will receive an email as soon as your verification is complete.')}
    ${btn('Go to Dashboard', `${BASE}/dashboard`)}
  `)
  await send(to, 'KYC Documents Received — Under Review', html)
}

// ═══════════════════════════════════════════════════════════════════════
// 10. KYC — APPROVED
// ═══════════════════════════════════════════════════════════════════════
export async function sendKycApproved(to: string, name: string) {
  const html = wrap(`
    ${heading('✅ Identity Verified')}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, your identity has been successfully verified by our compliance team.`)}
    ${statusBox('KYC Status', 'Approved ✓', '#34d399')}
    ${divider()}
    ${para('You now have full access to all APXFund investment plans, higher deposit limits, and unrestricted withdrawals.')}
    ${btn('Start Investing', `${BASE}/dashboard/plans`)}
  `)
  await send(to, '✅ KYC Verified — Full Access Unlocked', html)
}

// ═══════════════════════════════════════════════════════════════════════
// 11. KYC — REJECTED
// ═══════════════════════════════════════════════════════════════════════
export async function sendKycRejected(to: string, name: string, reason?: string) {
  const html = wrap(`
    ${heading('KYC Verification — Action Required')}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, we were unable to verify your identity with the documents submitted.`)}
    ${statusBox('KYC Status', 'Rejected', '#f87171')}
    ${reason ? statusBox('Reason', reason, '#f59e0b') : statusBox('Reason', 'Documents unclear or invalid. Please resubmit with clearer images.', '#f59e0b')}
    ${divider()}
    ${para('Please resubmit your documents ensuring all details are clearly visible, not blurred, and match your legal name.')}
    ${btn('Resubmit Documents', `${BASE}/dashboard/kyc`)}
  `)
  await send(to, 'KYC Action Required — Please Resubmit', html)
}

// ═══════════════════════════════════════════════════════════════════════
// 12. INVESTMENT — ACTIVATED
// ═══════════════════════════════════════════════════════════════════════
export async function sendInvestmentActivated(to: string, name: string, planName: string, amount: number, profit: number, days: number, endDate: Date) {
  const html = wrap(`
    ${heading('🚀 Investment Activated')}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, your investment is now live and actively generating returns.`)}
    ${statusBox('Plan', planName, '#c9a84c')}
    ${statusBox('Principal', `$${amount.toFixed(2)}`, '#60a5fa')}
    ${statusBox('Expected Profit', `+$${profit.toFixed(2)}`, '#34d399')}
    ${statusBox('Matures On', endDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), '#a78bfa')}
    ${divider()}
    ${para(`Your investment runs for <strong style="color:#fff">${days} days</strong>. Principal and profit will be automatically credited to your balance at maturity.`)}
    ${btn('Track Investment', `${BASE}/dashboard`)}
  `)
  await send(to, `🚀 Investment Activated — ${planName}`, html)
}

// ═══════════════════════════════════════════════════════════════════════
// 13. INVESTMENT — MATURED (ROI credited)
// ═══════════════════════════════════════════════════════════════════════
export async function sendInvestmentMatured(to: string, name: string, planName: string, principal: number, profit: number) {
  const total = principal + profit
  const html = wrap(`
    ${heading('🎉 Investment Matured — Profit Credited')}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, your investment has reached maturity. Your principal and profit have been credited to your account balance.`)}
    ${statusBox('Plan', planName, '#c9a84c')}
    ${statusBox('Principal Returned', `$${principal.toFixed(2)}`, '#60a5fa')}
    ${statusBox('Profit Earned', `+$${profit.toFixed(2)}`, '#34d399')}
    ${statusBox('Total Credited', `$${total.toFixed(2)}`, '#c9a84c')}
    ${divider()}
    ${para('Congratulations on your return! Your funds are now available in your balance. You can reinvest or withdraw at any time.')}
    ${btn('Reinvest Now', `${BASE}/dashboard/plans`)}
    ${btn('Withdraw Funds', `${BASE}/dashboard/withdraw`)}
  `)
  await send(to, '🎉 Investment Matured — Profit Credited to Your Account', html)
}

// ═══════════════════════════════════════════════════════════════════════
// 14. ACCOUNT — SUSPENDED / REINSTATED
// ═══════════════════════════════════════════════════════════════════════
export async function sendAccountSuspended(to: string, name: string) {
  const html = wrap(`
    ${heading('Account Suspended')}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, your APXFund account has been temporarily suspended pending a review.`)}
    ${statusBox('Account Status', 'Suspended', '#f87171')}
    ${divider()}
    ${para('If you believe this is a mistake or would like to appeal, please contact our support team immediately.')}
    ${btn('Contact Support', `mailto:support@apxfund.xyz`)}
  `)
  await send(to, 'Your APXFund Account Has Been Suspended', html)
}

export async function sendAccountReinstated(to: string, name: string) {
  const html = wrap(`
    ${heading('Account Reinstated')}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, your APXFund account has been reinstated and you now have full access again.`)}
    ${statusBox('Account Status', 'Active ✓', '#34d399')}
    ${divider()}
    ${para('Welcome back. If you have any questions, our support team is available 24/7.')}
    ${btn('Go to Dashboard', `${BASE}/dashboard`)}
  `)
  await send(to, 'Your APXFund Account Has Been Reinstated', html)
}

// ═══════════════════════════════════════════════════════════════════════
// 15. PLAN UPGRADE NUDGE
// ═══════════════════════════════════════════════════════════════════════
export async function sendPlanUpgradeNudge(
  to: string,
  name: string,
  currentPlan: { name: string; roiPercent: number; durationDays: number },
  nextPlan: { name: string; roiPercent: number; durationDays: number; minAmount: number },
  userCapital: number,
  userBalance: number,
  qualifies: boolean
) {
  const totalHave = userCapital + userBalance
  const gap = nextPlan.minAmount - totalHave
  const currentPlanProfit = parseFloat(((userCapital * currentPlan.roiPercent) / 100).toFixed(2))
  const nextPlanProfit = parseFloat(((nextPlan.minAmount * nextPlan.roiPercent) / 100).toFixed(2))
  const uplift = parseFloat((nextPlanProfit - currentPlanProfit).toFixed(2))

  const html = wrap(`
    ${heading(qualifies
      ? `You Already Qualify for ${nextPlan.name} 🚀`
      : `You Need Just $${gap.toFixed(2)} More to Unlock ${nextPlan.name}`
    )}
    ${para(`Hi <strong style="color:#fff">${name}</strong>, your money is working — but it could be working <strong style="color:#34d399">significantly harder</strong>.`)}
    <div style="background:#0a0a14;border:1px solid #1e1e35;border-radius:14px;padding:20px;margin:20px 0">
      <div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:2px;text-align:center;margin-bottom:16px">Your Earning Comparison</div>
      <div style="display:flex;gap:12px;align-items:stretch">
        <div style="flex:1;background:#12121f;border:1px solid #2a2a45;border-radius:10px;padding:16px;text-align:center">
          <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">You Are Earning</div>
          <div style="font-size:14px;font-weight:700;color:#c9a84c;margin-bottom:6px">${currentPlan.name}</div>
          <div style="font-size:32px;font-weight:900;color:#ffffff;line-height:1">${currentPlan.roiPercent}%</div>
          <div style="font-size:11px;color:#555;margin-top:4px">over ${currentPlan.durationDays} days</div>
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid #1e1e35">
            <div style="font-size:10px;color:#555;margin-bottom:4px">Est. profit on $${userCapital.toFixed(0)}</div>
            <div style="font-size:18px;font-weight:900;color:#c9a84c">+$${currentPlanProfit.toFixed(2)}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;color:#34d399;font-size:20px;font-weight:900;flex-shrink:0">→</div>
        <div style="flex:1;background:#0d1f0d;border:2px solid #34d399;border-radius:10px;padding:16px;text-align:center">
          <div style="font-size:10px;color:#34d399;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">You Could Earn</div>
          <div style="font-size:14px;font-weight:700;color:#34d399;margin-bottom:6px">${nextPlan.name}</div>
          <div style="font-size:32px;font-weight:900;color:#ffffff;line-height:1">${nextPlan.roiPercent}%</div>
          <div style="font-size:11px;color:#34d399;margin-top:4px">over ${nextPlan.durationDays} days</div>
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid #1e1e35">
            <div style="font-size:10px;color:#555;margin-bottom:4px">Est. profit on $${nextPlan.minAmount.toFixed(0)}</div>
            <div style="font-size:18px;font-weight:900;color:#34d399">+$${nextPlanProfit.toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div style="margin-top:16px;background:#34d39918;border:1px solid #34d39940;border-radius:8px;padding:12px;text-align:center">
        <span style="font-size:13px;color:#aaa">By upgrading you could earn an extra </span>
        <span style="font-size:16px;font-weight:900;color:#34d399">+$${uplift.toFixed(2)}</span>
        <span style="font-size:13px;color:#aaa"> per cycle</span>
      </div>
    </div>
    <div style="background:#0a0a14;border:1px solid #1e1e35;border-radius:10px;padding:16px;margin:16px 0">
      <div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Your Current Position</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:13px;color:#aaa">Active Capital</span>
        <span style="font-size:13px;font-weight:700;color:#fff">$${userCapital.toLocaleString()}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:13px;color:#aaa">Available Balance</span>
        <span style="font-size:13px;font-weight:700;color:#fff">$${userBalance.toFixed(2)}</span>
      </div>
      <div style="height:1px;background:#1e1e35;margin:8px 0"></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:13px;color:#aaa">Total Available</span>
        <span style="font-size:14px;font-weight:900;color:#c9a84c">$${totalHave.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span style="font-size:13px;color:#aaa">${nextPlan.name} Minimum</span>
        <span style="font-size:14px;font-weight:900;color:#fff">$${nextPlan.minAmount.toLocaleString()}</span>
      </div>
      ${!qualifies ? `
      <div style="margin-top:12px;background:#c9a84c18;border:1px solid #c9a84c40;border-radius:8px;padding:10px;text-align:center">
        <span style="font-size:13px;color:#aaa">You need just </span>
        <span style="font-size:16px;font-weight:900;color:#c9a84c">$${gap.toFixed(2)} more</span>
        <span style="font-size:13px;color:#aaa"> to unlock ${nextPlan.name}</span>
      </div>` : `
      <div style="margin-top:12px;background:#34d39918;border:1px solid #34d39940;border-radius:8px;padding:10px;text-align:center">
        <span style="font-size:16px;font-weight:900;color:#34d399">✓ You already qualify — migrate now</span>
      </div>`}
    </div>
    ${divider()}
    ${qualifies
      ? para(`Your capital is ready. <strong style="color:#fff">Migrate to ${nextPlan.name} right now</strong> from your dashboard — it takes less than 30 seconds.`)
      : para(`Top up just <strong style="color:#c9a84c">$${gap.toFixed(2)}</strong> to your account and migrate your capital to <strong style="color:#fff">${nextPlan.name}</strong>. Your next cycle will earn at the higher rate.`)
    }
    ${btn(
      qualifies ? `Migrate to ${nextPlan.name} Now` : `Top Up $${gap.toFixed(2)} and Upgrade`,
      `${BASE}/dashboard/plans`
    )}
    ${note('You can migrate your active contract directly from the Investment Plans page — no need to wait for maturity.')}
  `)

  const subject = qualifies
    ? `You Already Qualify for ${nextPlan.name} — Migrate Now and Earn ${nextPlan.roiPercent}%`
    : `$${gap.toFixed(2)} Away from ${nextPlan.name} — Here is What You are Missing`

  await send(to, subject, html)
}

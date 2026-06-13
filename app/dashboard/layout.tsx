'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle,
  ListOrdered, Receipt, User, LogOut, TrendingUp,
  Menu, X, ChevronRight, Shield, Bell, FileCheck
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/deposit', label: 'Deposit', icon: ArrowDownCircle },
  { href: '/dashboard/withdraw', label: 'Withdraw', icon: ArrowUpCircle },
  { href: '/dashboard/plans', label: 'Invest', icon: ListOrdered },
  { href: '/dashboard/transactions', label: 'Transactions', icon: Receipt },
  { href: '/dashboard/kyc', label: 'KYC', icon: FileCheck },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
]

const IDLE_TIMEOUT = 10 * 60 * 1000
const WARN_BEFORE  = 60 * 1000

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(60)

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearAllTimers = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (warnTimer.current) clearTimeout(warnTimer.current)
    if (countdownInterval.current) clearInterval(countdownInterval.current)
  }

  const doLogout = useCallback(() => {
    clearAllTimers()
    signOut({ callbackUrl: '/auth/login?reason=idle' })
  }, [])

  const resetIdleTimer = useCallback(() => {
    if (status !== 'authenticated') return
    clearAllTimers()
    setShowWarning(false)
    setCountdown(60)
    warnTimer.current = setTimeout(() => {
      setShowWarning(true)
      setCountdown(60)
      countdownInterval.current = setInterval(() => {
        setCountdown(c => { if (c <= 1) { clearInterval(countdownInterval.current!); return 0 } return c - 1 })
      }, 1000)
    }, IDLE_TIMEOUT - WARN_BEFORE)
    idleTimer.current = setTimeout(doLogout, IDLE_TIMEOUT)
  }, [status, doLogout])

  useEffect(() => {
    if (status !== 'authenticated') return
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach(e => window.addEventListener(e, resetIdleTimer, { passive: true }))
    resetIdleTimer()
    return () => { events.forEach(e => window.removeEventListener(e, resetIdleTimer)); clearAllTimers() }
  }, [status, resetIdleTimer])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    const fetchUnread = async () => {
      try { const res = await fetch('/api/notifications'); const data = await res.json(); setUnreadCount(data.unreadCount || 0) } catch {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000)
    return () => clearInterval(interval)
  }, [status])

  if (status === 'loading') return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
    </div>
  )

  const isActive = (href: string) => href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-[#1e1e35]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <TrendingUp size={16} className="text-[#0a0a14]" />
          </div>
          <span className="text-base font-bold"><span className="gold-text">APX</span>Fund</span>
        </Link>
      </div>

      <div className="p-3 mx-3 mt-3 bg-[#0a0a14] rounded-xl border border-[#1e1e35]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-[#0a0a14] font-black text-sm flex-shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-semibold truncate">{session?.user?.name || 'Investor'}</div>
            <div className="text-xs text-gray-500 truncate">{session?.user?.email}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 mt-2 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isNotif = href === '/dashboard/notifications'
          const active = isActive(href)
          return (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative
                ${active ? 'bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Icon size={17} className="flex-shrink-0" />
              <span className="truncate">{label}</span>
              {isNotif && unreadCount > 0 && (
                <span className="ml-auto bg-[#c9a84c] text-[#0a0a14] text-xs font-black rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {!isNotif && active && <ChevronRight size={13} className="ml-auto flex-shrink-0" />}
            </Link>
          )
        })}
        {session?.user?.role === 'ADMIN' && (
          <Link href="/admin" onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-2
              ${pathname.startsWith('/admin') ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Shield size={17} className="flex-shrink-0" />
            Admin Panel
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-[#1e1e35]">
        <button onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-all w-full">
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a14] flex">
      {/* Idle warning */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12121f] border border-yellow-500/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <LogOut size={28} className="text-yellow-400" />
            </div>
            <h2 className="text-xl font-black mb-2">Still there?</h2>
            <p className="text-gray-400 text-sm mb-2">You have been inactive. You will be logged out in:</p>
            <div className="text-5xl font-black text-yellow-400 my-4">{countdown}s</div>
            <button onClick={resetIdleTimer} className="btn-gold w-full py-3 rounded-xl font-bold text-sm">Keep Me Logged In</button>
            <button onClick={doLogout} className="mt-3 w-full py-3 rounded-xl text-sm text-gray-500 hover:text-red-400 transition-colors">Log Out Now</button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-[#12121f] border-r border-[#1e1e35] flex-col fixed inset-y-0 left-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-[#12121f] border-r border-[#1e1e35] flex flex-col z-10">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-60 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-[#0a0a14]/95 backdrop-blur border-b border-[#1e1e35] px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white flex-shrink-0">
            <Menu size={22} />
          </button>
          {/* Page title on mobile */}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-500 hidden lg:block">
              Welcome back, <span className="text-white font-medium">{session?.user?.name?.split(' ')[0]}</span>
            </div>
            <div className="text-sm font-bold text-white lg:hidden truncate">
              {NAV.find(n => isActive(n.href))?.label || 'Dashboard'}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/dashboard/notifications" className="relative text-gray-400 hover:text-white p-1">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#c9a84c] text-[#0a0a14] text-xs font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#c9a84c] text-xs px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
              Live
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 sm:p-6">{children}</div>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#12121f]/95 backdrop-blur border-t border-[#1e1e35] z-30">
          <div className="grid grid-cols-5 gap-0">
            {NAV.slice(0, 5).map(({ href, icon: Icon, label }) => {
              const active = isActive(href)
              const isNotif = href === '/dashboard/notifications'
              return (
                <Link key={href} href={href}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 text-center transition-all relative ${active ? 'text-[#c9a84c]' : 'text-gray-500 hover:text-gray-300'}`}>
                  <div className="relative">
                    <Icon size={20} />
                    {isNotif && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#c9a84c] text-[#0a0a14] text-xs font-black rounded-full w-3.5 h-3.5 flex items-center justify-center" style={{fontSize:'8px'}}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium truncate w-full text-center">{label}</span>
                  {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#c9a84c] rounded-full" />}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom padding for mobile nav */}
        <div className="lg:hidden h-16" />
      </main>
    </div>
  )
}

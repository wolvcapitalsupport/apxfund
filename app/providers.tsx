'use client'
import { SessionProvider } from 'next-auth/react'
import { ReownProvider } from '@/components/ReownProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider><ReownProvider>{children}</ReownProvider></SessionProvider>
}

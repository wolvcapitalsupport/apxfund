'use client'

import { AppKitProvider } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { bsc } from '@reown/appkit/networks'

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID
const metadata = {
  name: 'APXFund',
  description: 'APXFund wallet and reward access',
  url: typeof window === 'undefined' ? 'https://apxfund.xyz' : window.location.origin,
  icons: ['/logo.png'],
}

export function ReownProvider({ children }: { children: React.ReactNode }) {
  if (!projectId) return <>{children}</>

  return (
    <AppKitProvider
      adapters={[new EthersAdapter()]}
      networks={[bsc]}
      defaultNetwork={bsc}
      projectId={projectId}
      metadata={metadata}
      features={{ analytics: true }}
    >
      {children}
    </AppKitProvider>
  )
}

export { projectId as REOWN_PROJECT_ID }

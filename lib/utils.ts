import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function calculateProfit(amount: number, roiPercent: number) {
  return (amount * roiPercent) / 100
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'text-yellow-400 bg-yellow-400/10',
    APPROVED: 'text-green-400 bg-green-400/10',
    COMPLETED: 'text-blue-400 bg-blue-400/10',
    REJECTED: 'text-red-400 bg-red-400/10',
    ACTIVE: 'text-emerald-400 bg-emerald-400/10',
    CANCELLED: 'text-gray-400 bg-gray-400/10',
  }
  return colors[status] || 'text-gray-400 bg-gray-400/10'
}

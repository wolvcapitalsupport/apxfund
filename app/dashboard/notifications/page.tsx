'use client'
import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

const TYPE_ICONS: any = {
  info: { icon: Info, color: 'text-blue-400 bg-blue-400/10' },
  success: { icon: CheckCircle, color: 'text-green-400 bg-green-400/10' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400 bg-yellow-400/10' },
  error: { icon: XCircle, color: 'text-red-400 bg-red-400/10' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications')
    const data = await res.json()
    setNotifications(data.notifications || [])
    setUnreadCount(data.unreadCount || 0)
    setLoading(false)
  }

  useEffect(() => { fetchNotifications() }, [])

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    setNotifications(n => n.map(x => ({ ...x, isRead: true })))
    setUnreadCount(0)
    toast.success('All notifications marked as read')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-[#c9a84c] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black mb-1">Notifications</h1>
          <p className="text-gray-500 text-sm">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-[#c9a84c] hover:underline">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="card-dark p-12 text-center text-gray-600">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif: any) => {
            const { icon: Icon, color } = TYPE_ICONS[notif.type] || TYPE_ICONS.info
            return (
              <div key={notif.id}
                className={`card-dark p-5 flex gap-4 transition-all ${!notif.isRead ? 'border-[#c9a84c]/20 bg-[#c9a84c]/3' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`font-semibold text-sm ${!notif.isRead ? 'text-white' : 'text-gray-300'}`}>
                      {notif.title}
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-[#c9a84c] flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-600 text-xs">{formatDate(notif.createdAt)}</span>
                    {notif.link && (
                      <Link href={notif.link} className="text-[#c9a84c] text-xs hover:underline">
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

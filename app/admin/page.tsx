'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'

interface User {
  id: string
  name: string
  email: string
  status: string
  isAdmin: boolean
  createdAt: string
  level?: number
  points?: number
}

export default function AdminPage() {
  const router = useRouter()
  const { user, logout } = useAppStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!user) { router.push('/auth'); return }
    if (!user.isAdmin) { router.push('/dashboard'); return }
    fetchUsers()
  }, [user, router])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      showToast('تعذّر تحميل المستخدمين')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (userId: string, status: 'approved' | 'rejected') => {
    setActionLoading(userId)
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
        credentials: 'include',
      })
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status } : u))
        showToast(status === 'approved' ? 'تمت الموافقة' : 'تم الرفض')
      }
    } catch {
      showToast('حدث خطأ')
    } finally {
      setActionLoading(null)
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const filtered = users.filter((u) => {
    if (filter === 'all') return !u.isAdmin
    return u.status === filter && !u.isAdmin
  })

  const stats = {
    total: users.filter(u => !u.isAdmin).length,
    pending: users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    rejected: users.filter(u => u.status === 'rejected').length,
  }

  return (
    <div className="min-h-screen bg-[#070711] relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-xl px-6 py-3 text-sm font-medium text-white border border-white/10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">لوحة الإدارة</h1>
            <p className="text-white/30 text-sm mt-1">إدارة طلبات المستخدمين</p>
          </div>
          <button
            onClick={() => { logout(); router.push('/') }}
            className="glass rounded-xl px-4 py-2 text-sm text-white/40 hover:text-white/70 cursor-pointer transition-all"
          >
            خروج
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'إجمالي', value: stats.total, color: 'text-white' },
            { label: 'انتظار', value: stats.pending, color: 'text-yellow-400' },
            { label: 'موافق', value: stats.approved, color: 'text-green-400' },
            { label: 'مرفوض', value: stats.rejected, color: 'text-red-400' },
          ].map((s) => (
            <motion.div
              key={s.label}
              className="glass rounded-2xl p-4 text-center"
              whileHover={{ scale: 1.02 }}
            >
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-white/30 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex bg-white/5 rounded-2xl p-1 mb-6 gap-1">
          {([
            { id: 'pending', label: 'انتظار' },
            { id: 'approved', label: 'موافق عليهم' },
            { id: 'rejected', label: 'مرفوضون' },
            { id: 'all', label: 'الكل' },
          ] as { id: typeof filter; label: string }[]).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === f.id ? 'bg-violet-600 text-white' : 'text-white/30 hover:text-white/60'
              }`}
            >
              {f.label}
              {f.id !== 'all' && (
                <span className={`mr-1 ${filter === f.id ? 'text-white/70' : 'text-white/20'}`}>
                  ({stats[f.id as keyof typeof stats]})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Users list */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-1/3 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <p className="text-white/20">لا يوجد مستخدمون في هذه الفئة</p>
            </div>
          ) : (
            filtered.map((u, i) => (
              <motion.div
                key={u.id}
                className="glass-strong rounded-2xl p-5 border border-white/5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{u.name}</p>
                      <p className="text-white/30 text-xs" dir="ltr">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status badge */}
                    <StatusBadge status={u.status} />

                    {/* Action buttons — only for pending */}
                    {u.status === 'pending' && (
                      <div className="flex gap-2 mr-2">
                        <button
                          onClick={() => updateStatus(u.id, 'approved')}
                          disabled={actionLoading === u.id}
                          className="bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 rounded-xl px-3 py-1.5 text-green-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === u.id ? '...' : 'موافقة'}
                        </button>
                        <button
                          onClick={() => updateStatus(u.id, 'rejected')}
                          disabled={actionLoading === u.id}
                          className="bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-xl px-3 py-1.5 text-red-400/70 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          رفض
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-[10px] text-white/20">
                  <span>انضم: {new Date(u.createdAt).toLocaleDateString('ar')}</span>
                  {u.points !== undefined && <span>النقاط: {u.points}</span>}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  const labels = { pending: 'انتظار', approved: 'موافق', rejected: 'مرفوض' }

  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${map[status as keyof typeof map] || ''}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  )
}

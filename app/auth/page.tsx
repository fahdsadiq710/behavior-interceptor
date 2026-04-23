'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'

type Tab = 'login' | 'signup'
type SignupStatus = 'idle' | 'pending' | 'success' | 'error'

function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, user } = useAppStore()

  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'signup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupStatus, setSignupStatus] = useState<SignupStatus>('idle')

  // Login form
  const [loginData, setLoginData] = useState({ email: '', password: '' })

  // Signup form
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' })

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(user.isAdmin ? '/admin' : '/dashboard')
    }
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'pending') setSignupStatus('pending')
        else setError(data.error || 'حدث خطأ')
        return
      }
      setUser(data.user, data.token)
      router.push(data.user.isAdmin ? '/admin' : '/dashboard')
    } catch {
      setError('تعذّر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'حدث خطأ')
        return
      }
      setSignupStatus('pending')
    } catch {
      setError('تعذّر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070711] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-breathe" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-breathe"
          style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 noise opacity-30" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-5"
        style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <button onClick={() => router.push('/')} className="cursor-pointer">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center glow-violet">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <span className="font-black text-lg gradient-text">BEHAVIOR INTERCEPTOR</span>
            </div>
          </button>
        </motion.div>

        {/* Pending state */}
        <AnimatePresence mode="wait">
          {signupStatus === 'pending' ? (
            <PendingCard key="pending" />
          ) : (
            <motion.div
              key="form"
              className="glass-strong rounded-3xl p-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              {/* Tabs */}
              <div className="flex bg-white/5 rounded-2xl p-1 mb-8">
                {(['signup', 'login'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError('') }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      tab === t
                        ? 'bg-violet-600 text-white shadow-lg'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {t === 'signup' ? 'إنشاء حساب' : 'تسجيل الدخول'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {tab === 'login' ? (
                  <motion.form
                    key="login"
                    onSubmit={handleLogin}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-sm text-white/50 block mb-2">البريد الإلكتروني</label>
                      <input
                        type="email"
                        className="input-glass"
                        placeholder="name@example.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                        dir="ltr"
                        style={{ textAlign: 'left' }}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/50 block mb-2">كلمة المرور</label>
                      <input
                        type="password"
                        className="input-glass"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        dir="ltr"
                        style={{ textAlign: 'left' }}
                      />
                    </div>
                    {error && <ErrorMessage message={error} />}
                    <SubmitButton loading={loading} label="دخول" />
                    <p className="text-center text-xs text-white/30 mt-2">
                      admin@interceptor.ai / admin123 للتجربة
                    </p>
                  </motion.form>
                ) : (
                  <motion.form
                    key="signup"
                    onSubmit={handleSignup}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-sm text-white/50 block mb-2">الاسم الكامل</label>
                      <input
                        type="text"
                        className="input-glass"
                        placeholder="أحمد محمد"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/50 block mb-2">البريد الإلكتروني</label>
                      <input
                        type="email"
                        className="input-glass"
                        placeholder="name@example.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                        dir="ltr"
                        style={{ textAlign: 'left' }}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/50 block mb-2">كلمة المرور</label>
                      <input
                        type="password"
                        className="input-glass"
                        placeholder="٨ أحرف على الأقل"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                        minLength={8}
                        dir="ltr"
                        style={{ textAlign: 'left' }}
                      />
                    </div>
                    {error && <ErrorMessage message={error} />}
                    <SubmitButton loading={loading} label="طلب الانضمام" />
                    <p className="text-center text-xs text-white/30">
                      سيتم مراجعة طلبك من قِبل الإدارة
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function PendingCard() {
  return (
    <motion.div
      className="glass-strong rounded-3xl p-10 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      {/* Animated clock icon */}
      <motion.div
        className="w-20 h-20 rounded-full glass-violet flex items-center justify-center mx-auto mb-6 glow-violet"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-violet-300" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </motion.div>

      <h2 className="text-2xl font-black text-white mb-3">بانتظار الموافقة</h2>
      <p className="text-white/50 mb-2">
        تم استلام طلبك بنجاح
      </p>
      <p className="text-white/30 text-sm mb-8">
        سيتم مراجعة حسابك من قِبل الإدارة قريباً. ستصلك إشعار عند الموافقة.
      </p>

      <div className="flex flex-col gap-3">
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-sm text-white/50">طلبك قيد المراجعة</span>
        </div>
      </div>
    </motion.div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <motion.div
      className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-300 text-sm text-center"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {message}
    </motion.div>
  )
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      className="relative w-full bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl py-4 text-white font-bold text-lg overflow-hidden cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>جارٍ التحميل...</span>
        </div>
      ) : (
        label
      )}
      <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
    </motion.button>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070711] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}

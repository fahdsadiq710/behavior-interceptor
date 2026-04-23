'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { UserProfile } from '@/lib/userProfile'

interface OnboardingProps {
  userName: string
  userId: string
  onComplete: (profile: Partial<UserProfile>, tone: 'Gentle' | 'Direct' | 'Strict') => void
}

type HabitKind = 'BUILD_DISCIPLINE' | 'ELIMINATE_DISTRACTION'
type Tone = 'Gentle' | 'Direct' | 'Strict'

const TRIGGERS = [
  { value: 'fatigue',         label: 'التعب',              icon: '😴' },
  { value: 'boredom',         label: 'الملل',              icon: '😑' },
  { value: 'stress',          label: 'الضغط والتوتر',      icon: '😤' },
  { value: 'time',            label: 'ضغط الوقت',          icon: '⏰' },
  { value: 'phone',           label: 'الجوال والسوشال',    icon: '📱' },
  { value: 'social',          label: 'الانشغال الاجتماعي', icon: '👥' },
  { value: 'procrastination', label: 'التسويف',            icon: '🔄' },
  { value: 'other',           label: 'أخرى',               icon: '❓' },
]


const TONES: { value: Tone; label: string; icon: string; example: string; desc: string }[] = [
  {
    value: 'Gentle',
    label: 'لطيف وهادئ',
    icon: '🌙',
    example: '"خلها خطوة بسيطة... روّق وابدأ"',
    desc: 'يناسب من يحتاج دعماً برفق',
  },
  {
    value: 'Direct',
    label: 'مباشر وصريح',
    icon: '⚡',
    example: '"لا تأجيل. ابدأ الآن بدون تفكير."',
    desc: 'يناسب من يحتاج وضوحاً بلا مجاملات',
  },
  {
    value: 'Strict',
    label: 'صارم ومحاسب',
    icon: '🔥',
    example: '"توقف عن الأعذار. الآن أو لا شيء."',
    desc: 'يناسب من يريد محاسبة حقيقية',
  },
]

export default function Onboarding({ userName, userId, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [telegramLink, setTelegramLink] = useState<string | null>(null)

  const [habitKind, setHabitKind] = useState<HabitKind>('BUILD_DISCIPLINE')
  const [goalText, setGoalText] = useState('')
  const [trigger, setTrigger] = useState('')
  const [failureReason, setFailureReason] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [alternativeAction, setAlternativeAction] = useState('')
  const [difficulty, setDifficulty] = useState(3)
  const [tone, setTone] = useState<Tone>('Gentle')

  const TOTAL_STEPS = 5
  const progress = Math.round((step / TOTAL_STEPS) * 100)

  const goNext = useCallback(() => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1)), [])
  const goPrev = useCallback(() => setStep(s => Math.max(s - 1, 0)), [])

  const buildProfile = useCallback((): Partial<UserProfile> => ({
    goalText,
    habitType: habitKind === 'BUILD_DISCIPLINE' ? 'build' : 'quit',
    mainTrigger: (trigger || 'procrastination') as UserProfile['mainTrigger'],
    preferredTime: null, // stored as exact HH:MM in DB; local profile uses null
    tone: tone === 'Gentle' ? 'gentle' : tone === 'Direct' ? 'direct' : 'motivational',
    onboardingComplete: true,
  }), [goalText, habitKind, trigger, preferredTime, tone])

  const handleSubmit = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: habitKind,
          goal_text: goalText,
          main_trigger: trigger,
          past_failure_reason: failureReason,
          preferred_time: preferredTime,
          alternative_action: alternativeAction,
          difficulty_level: difficulty,
          user_tone: tone,
        }),
      })

      if (res.ok) {
        const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'BehaviorInterceptorBot'
        setTelegramLink(`https://t.me/${botUsername}?start=${userId}`)
        setStep(4)
      }
    } catch (err) {
      console.error('Onboarding submit error:', err)
    } finally {
      setSaving(false)
    }
  }, [habitKind, goalText, trigger, failureReason, preferredTime, alternativeAction, difficulty, tone, userId])

  return (
    <div className="min-h-screen bg-[#070711] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <motion.div className="text-center mb-6" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          {step === 0 && (
            <>
              <p className="text-white/30 text-sm mb-1">مرحباً، {userName}</p>
              <h1 className="text-2xl font-black text-white leading-tight">
                لنبني خطة<br />
                <span className="gradient-text">مخصصة لك تماماً</span>
              </h1>
            </>
          )}
          {step > 0 && step < 4 && (
            <p className="text-white/30 text-sm">خطوة {step + 1} من {TOTAL_STEPS - 1}</p>
          )}
        </motion.div>

        {/* Progress bar */}
        {step < 4 && (
          <div className="mb-6">
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #7C3AED, #3B82F6)' }}
                animate={{ width: `${progress + 20}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Step content */}
        <AnimatePresence mode="wait">

          {/* ── STEP 0: Goal Definition ─────────────────────────────────── */}
          {step === 0 && (
            <StepWrapper key="s0">
              <h2 className="text-xl font-black text-white mb-1 text-center">ما الذي تريد تحقيقه؟</h2>
              <p className="text-white/25 text-sm text-center mb-5">حدد نوع هدفك أولاً</p>

              <div className="space-y-3 mb-5">
                {[
                  {
                    v: 'BUILD_DISCIPLINE' as HabitKind,
                    label: 'أبني انضباطاً جديداً',
                    icon: '↗',
                    desc: 'مثل: القراءة، الرياضة، التعلم، الإنتاجية',
                  },
                  {
                    v: 'ELIMINATE_DISTRACTION' as HabitKind,
                    label: 'أتخلص من عادة سيئة',
                    icon: '✕',
                    desc: 'مثل: التسويف، الجوال، السهر، الأكل العاطفي',
                  },
                ].map(opt => (
                  <motion.button
                    key={opt.v}
                    onClick={() => setHabitKind(opt.v)}
                    className={`w-full glass rounded-2xl p-4 text-right flex items-center gap-4 border cursor-pointer transition-all ${
                      habitKind === opt.v
                        ? 'border-violet-500/60 bg-violet-500/10'
                        : 'border-white/5 hover:border-violet-500/30'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-all ${
                      habitKind === opt.v ? 'bg-violet-500/20' : 'bg-white/5'
                    }`}>
                      {opt.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm">{opt.label}</p>
                      <p className="text-white/30 text-xs mt-0.5">{opt.desc}</p>
                    </div>
                    {habitKind === opt.v && (
                      <div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="mb-4">
                <label className="text-white/40 text-xs block mb-2">اكتب هدفك بوضوح</label>
                <textarea
                  value={goalText}
                  onChange={e => setGoalText(e.target.value)}
                  placeholder={habitKind === 'BUILD_DISCIPLINE'
                    ? 'مثال: أذاكر ٣٠ دقيقة يومياً...'
                    : 'مثال: أوقف التحقق من الجوال كل ٥ دقائق...'}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none placeholder:text-white/20 focus:border-violet-500/50 resize-none"
                  style={{ direction: 'rtl' }}
                  rows={3}
                  maxLength={200}
                />
              </div>

              <CtaButton onClick={goNext} disabled={!goalText.trim()}>التالي</CtaButton>
            </StepWrapper>
          )}

          {/* ── STEP 1: Psychological Mapping ───────────────────────────── */}
          {step === 1 && (
            <StepWrapper key="s1">
              <h2 className="text-xl font-black text-white mb-1 text-center">التحليل النفسي</h2>
              <p className="text-white/25 text-sm text-center mb-5">نفهم جذور سلوكك لنساعدك أفضل</p>

              <label className="text-white/40 text-xs block mb-2">ما الذي يُشعلك ويجعلك تتراجع؟</label>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {TRIGGERS.map((t, i) => (
                  <motion.button
                    key={t.value}
                    onClick={() => setTrigger(t.value)}
                    className={`glass rounded-xl py-3 px-3 text-right border cursor-pointer transition-all flex items-center gap-2 ${
                      trigger === t.value
                        ? 'border-violet-500/60 bg-violet-500/10'
                        : 'border-white/5 hover:border-violet-500/30'
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <span className="text-base">{t.icon}</span>
                    <span className="text-white/80 text-xs font-semibold">{t.label}</span>
                  </motion.button>
                ))}
              </div>

              <label className="text-white/40 text-xs block mb-2">لماذا فشلت في هذا الهدف من قبل؟</label>
              <textarea
                value={failureReason}
                onChange={e => setFailureReason(e.target.value)}
                placeholder="كن صريحاً مع نفسك. ما السبب الحقيقي؟"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none placeholder:text-white/20 focus:border-violet-500/50 resize-none mb-4"
                style={{ direction: 'rtl' }}
                rows={3}
                maxLength={300}
              />

              <div className="flex gap-2">
                <BackBtn onClick={goPrev} />
                <CtaButton onClick={goNext} disabled={!trigger} className="flex-1">التالي</CtaButton>
              </div>
            </StepWrapper>
          )}

          {/* ── STEP 2: Action Plan ──────────────────────────────────────── */}
          {step === 2 && (
            <StepWrapper key="s2">
              <h2 className="text-xl font-black text-white mb-1 text-center">خطة العمل</h2>
              <p className="text-white/25 text-sm text-center mb-5">متى وكيف ستبدأ؟</p>

              <label className="text-white/40 text-xs block mb-2">
                الوقت الدقيق للتدخل اليومي
              </label>
              <div className="relative mb-5">
                <input
                  type="time"
                  value={preferredTime}
                  onChange={e => setPreferredTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-bold outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all cursor-pointer"
                  style={{
                    colorScheme: 'dark',
                    direction: 'ltr',
                    textAlign: 'center',
                  }}
                />
                {preferredTime && (
                  <p className="text-white/25 text-xs text-center mt-2">
                    سيصلك تنبيه كل يوم في هذا الوقت بالضبط
                  </p>
                )}
              </div>

              <label className="text-white/40 text-xs block mb-2">
                صعوبة الهدف: <span className="text-violet-400 font-bold">{difficulty}/5</span>
              </label>
              <div className="flex gap-2 mb-5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setDifficulty(n)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-bold cursor-pointer transition-all ${
                      difficulty >= n
                        ? 'border-violet-500/60 bg-violet-500/20 text-violet-300'
                        : 'border-white/10 bg-white/5 text-white/30'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <label className="text-white/40 text-xs block mb-2">
                ماذا ستفعل بدلاً من العادة السيئة في لحظة الضعف؟
              </label>
              <input
                type="text"
                value={alternativeAction}
                onChange={e => setAlternativeAction(e.target.value)}
                placeholder="مثال: أمشي ٥ دقائق، أشرب ماء، أتنفس..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none placeholder:text-white/20 focus:border-violet-500/50 mb-4"
                style={{ direction: 'rtl' }}
                maxLength={150}
              />

              <div className="flex gap-2">
                <BackBtn onClick={goPrev} />
                <CtaButton onClick={goNext} disabled={!preferredTime} className="flex-1">التالي</CtaButton>
              </div>
            </StepWrapper>
          )}

          {/* ── STEP 3: AI Persona / Tone ────────────────────────────────── */}
          {step === 3 && (
            <StepWrapper key="s3">
              <h2 className="text-xl font-black text-white mb-1 text-center">شخصية المساعد الذكي</h2>
              <p className="text-white/25 text-sm text-center mb-5">كيف تريده يكلمك؟</p>

              <div className="space-y-3 mb-5">
                {TONES.map((t, i) => (
                  <motion.button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`w-full glass rounded-2xl p-4 text-right border cursor-pointer transition-all ${
                      tone === t.value
                        ? 'border-violet-500/60 bg-violet-500/10'
                        : 'border-white/5 hover:border-violet-500/30'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                        tone === t.value ? 'bg-violet-500/20' : 'bg-white/5'
                      }`}>
                        {t.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-sm mb-0.5">{t.label}</p>
                        <p className="text-white/30 text-xs mb-1">{t.desc}</p>
                        <p className="text-violet-300/60 text-[11px] italic">{t.example}</p>
                      </div>
                      {tone === t.value && (
                        <div className="w-2 h-2 rounded-full bg-violet-400 mt-1 flex-shrink-0" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-2">
                <BackBtn onClick={goPrev} />
                <CtaButton onClick={handleSubmit} loading={saving} className="flex-1">
                  {saving ? 'جاري الحفظ...' : 'ابدأ التجربة'}
                </CtaButton>
              </div>
            </StepWrapper>
          )}

          {/* ── STEP 4: Telegram Deep Link ───────────────────────────────── */}
          {step === 4 && (
            <StepWrapper key="s4">
              <div className="text-center">
                <motion.div
                  className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </motion.div>

                <h2 className="text-2xl font-black text-white mb-2">تم! ✨</h2>
                <p className="text-white/40 text-sm mb-6 leading-relaxed">
                  حُفظت خطتك بنجاح.<br />
                  الخطوة التالية: اربط حسابك بـ Telegram<br />
                  لتصل إليك التدخلات في الوقت المناسب
                </p>

                {telegramLink && (
                  <motion.a
                    href={telegramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full rounded-2xl py-4 font-bold text-white mb-4 no-underline"
                    style={{ background: 'linear-gradient(135deg, #2AABEE, #229ED9)' }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(42,171,238,0.5)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white flex-shrink-0">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    ربط حساب Telegram
                  </motion.a>
                )}

                <motion.button
                  onClick={() => { onComplete(buildProfile(), tone) }}
                  className="w-full glass rounded-2xl py-3 text-white/40 hover:text-white/70 text-sm cursor-pointer transition-all border border-white/5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  تخطي — سأربطه لاحقاً
                </motion.button>

                <p className="text-white/15 text-[10px] mt-4 break-all">
                  معرّفك: {userId}
                </p>
              </div>
            </StepWrapper>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Reusable sub-components ────────────────────────────────────────────────

function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 glass rounded-2xl text-white/30 hover:text-white/60 text-sm cursor-pointer transition-all border border-white/5"
    >
      رجوع
    </button>
  )
}

function CtaButton({
  children,
  onClick,
  disabled,
  loading,
  className = '',
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className={`rounded-2xl py-4 font-bold text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
      style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)' }}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  )
}

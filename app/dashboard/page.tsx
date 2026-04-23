'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import DynamicBackground from '@/components/app/DynamicBackground'
import RewardBadge, { RewardType } from '@/components/app/RewardBadge'
import LiquidProgress from '@/components/app/LiquidProgress'
import Onboarding from '@/components/app/Onboarding'
import DecisionButton from '@/components/app/DecisionButton'
import ChatIntervention from '@/components/app/ChatIntervention'
import SessionFlow from '@/components/app/SessionFlow'
import AnalyticsPanel from '@/components/app/AnalyticsPanel'
import FollowUpPrompt from '@/components/app/FollowUpPrompt'
import {
  buildPersonalizedMessage,
  buildRewardMessage,
  computeBehaviorSnapshot,
  FOLLOW_UP_QUESTIONS,
  FollowUpQuestion,
} from '@/lib/messageEngine'
import { evaluateIntervention } from '@/lib/interventionEngine'
import { requestPushPermission, sendPushNotification } from '@/lib/pushNotifications'
import { hourContextLabel } from '@/lib/userProfile'

type View = 'home' | 'insights'

const LEVEL_AR: Record<string, string> = {
  Starter: 'مبتدئ', Consistent: 'منتظم', Focused: 'مركّز', Disciplined: 'منضبط',
}
const LEVEL_THRESHOLDS: Record<string, [number, number]> = {
  Starter: [0, 80], Consistent: [80, 250], Focused: [250, 600], Disciplined: [600, 9999],
}

export default function DashboardPage() {
  const router = useRouter()
  const store = useAppStore()
  const [view, setView] = useState<View>('home')
  const [reward, setReward] = useState<RewardType>(null)
  const [rewardExtra, setRewardExtra] = useState('')
  const [pendingFollowUpObj, setPendingFollowUpObj] = useState<FollowUpQuestion | null>(null)
  const [interventionPayload, setInterventionPayload] = useState({ message: '', microAction: '' })
  const prevLevelRef = useRef(store.level)
  const engineRef = useRef<ReturnType<typeof setInterval>>()
  const retryRef = useRef<ReturnType<typeof setTimeout>>()

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!store.user) { router.push('/auth'); return }
    if (store.user.status !== 'approved' && !store.user.isAdmin) { router.push('/auth'); return }
    if (store.user.isAdmin) { router.push('/admin'); return }
  }, [store.user, router])

  // ── Level-up detector ─────────────────────────────────────────────────────
  useEffect(() => {
    if (prevLevelRef.current !== store.level) {
      fireReward('levelup', LEVEL_AR[store.level])
      prevLevelRef.current = store.level
    }
  }, [store.level])

  // ── Behavior snapshot (memoised per render) ───────────────────────────────
  const snap = computeBehaviorSnapshot(
    store.interventionHistory, store.sessionHistory,
    store.streak, store.sessionCount, store.lastSessionDate
  )

  // ── Core intervention engine ──────────────────────────────────────────────
  const runEngine = useCallback(() => {
    if (store.activeSession || store.showIntervention) return
    if (!store.profile.onboardingComplete) return

    const now = new Date()
    const decision = evaluateIntervention({
      goalText: store.profile.goalText,
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      sessionCount: store.sessionCount,
      totalMinutes: store.totalMinutes,
      lastSessionDate: store.lastSessionDate,
      interventionHistory: store.interventionHistory,
      sessionHistory: store.sessionHistory,
      lastDismissedAt: store.lastDismissedAt,
      retryCount: store.retryCount,
    })

    if (!decision.shouldIntervene) return

    const { message, microAction } = buildPersonalizedMessage({
      profile: store.profile,
      snap,
      hour: now.getHours(),
      reason: decision.reason,
      retried: decision.retried,
    })

    setInterventionPayload({ message, microAction })
    store.triggerIntervention(message, microAction, decision.retried)
    store.addChatMessage(message, 'ai')

    if (store.pushEnabled) {
      sendPushNotification('Behavior Interceptor', message, 'intervention')
    }
  }, [store, snap])

  // Engine runs every 2 min; first check after 25 sec (demo-friendly)
  useEffect(() => {
    if (!store.profile.onboardingComplete) return
    const first = setTimeout(runEngine, 25000)
    engineRef.current = setInterval(runEngine, 2 * 60 * 1000)
    return () => { clearTimeout(first); clearInterval(engineRef.current) }
  }, [store.profile.onboardingComplete, runEngine])

  // Retry after dismiss
  useEffect(() => {
    if (!store.lastDismissedAt) return
    clearTimeout(retryRef.current)
    const delay = store.profile.retryPreference === 'soon' ? 5 * 60 * 1000 : 10 * 60 * 1000
    retryRef.current = setTimeout(runEngine, delay)
    return () => clearTimeout(retryRef.current)
  }, [store.lastDismissedAt, runEngine, store.profile.retryPreference])

  // ── Follow-up question checker ────────────────────────────────────────────
  useEffect(() => {
    if (!store.profile.onboardingComplete) return
    if (pendingFollowUpObj || store.showIntervention) return

    const daysActive = store.sessionHistory.length > 0
      ? Math.ceil((Date.now() - store.sessionHistory[store.sessionHistory.length - 1].startedAt) / 86400000)
      : 0

    const next = FOLLOW_UP_QUESTIONS.find(q =>
      !store.profile.followUpsDone.includes(q.id) &&
      store.sessionCount >= q.triggeredAfterSessions &&
      daysActive >= q.triggeredAfterDays
    )

    if (next && store.pendingFollowUp !== next.id) {
      store.setPendingFollowUp(next.id)
      setPendingFollowUpObj(next)
      store.addChatMessage(next.question, 'followup', next.id)
    }
  }, [store.sessionCount, store.showIntervention])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const fireReward = useCallback((type: RewardType, extra = '') => {
    setReward(type)
    setRewardExtra(extra)
    setTimeout(() => setReward(null), 4000)
  }, [])

  const handleStart = useCallback((minutes?: number) => {
    const mins = minutes ?? store.profile.preferredDuration
    const isReturn = store.mindState === 'distracted' && store.sessionCount > 0
    store.startSession(mins)

    const msg = buildRewardMessage(isReturn ? 'return' : 'start', store.profile, snap)
    store.addChatMessage(msg, 'reward')
    fireReward(isReturn ? 'return' : 'start')
  }, [store, snap, fireReward])

  const handleAccept = useCallback(() => {
    store.acceptIntervention()
    const msg = buildRewardMessage('return', store.profile, snap)
    store.addChatMessage(msg, 'reward')
    fireReward('return')
  }, [store, snap, fireReward])

  const handleDismiss = useCallback(() => {
    store.dismissIntervention()
    const retryMin = store.profile.retryPreference === 'soon' ? '٥' : '١٠'
    store.addChatMessage(`حسناً. سنذكّرك بعد ${retryMin} دقائق.`, 'system')
  }, [store])

  const handleEndSession = useCallback((extended = false) => {
    const { activeSession } = store
    if (!activeSession) return
    const duration = (Date.now() - activeSession.startedAt) / 60000
    store.endSession(extended)

    const msg = extended
      ? buildRewardMessage('exceed', store.profile, snap)
      : `أحسنت! انهيت جلستك.`
    store.addChatMessage(msg, 'reward')

    if (extended) fireReward('exceed')
    if (store.streak > 1) setTimeout(() => fireReward('streak'), 1800)
  }, [store, snap, fireReward])

  const handleExtend = useCallback((extra: number) => {
    store.addChatMessage(`ممتاز! تمديد ${extra} دقيقة.`, 'ai')
  }, [store])

  const handleFollowUpAnswer = useCallback((
    qId: string,
    profileUpdate: Record<string, unknown>,
    label: string
  ) => {
    store.answerFollowUp(qId, profileUpdate)
    setPendingFollowUpObj(null)
    store.addChatMessage(`شكراً — "${label}". ضبطنا ملفك.`, 'system')
  }, [store])

  const handleEnablePush = useCallback(async () => {
    const ok = await requestPushPermission()
    store.setPushEnabled(ok)
    if (ok) store.addChatMessage('تم تفعيل الإشعارات. سنُذكّرك في اللحظة المناسبة.', 'system')
  }, [store])

  const levelProgress = () => {
    const th = LEVEL_THRESHOLDS[store.level] || [0, 100]
    return Math.min(100, Math.round(((store.points - th[0]) / (th[1] - th[0])) * 100))
  }

  // ── Onboarding gate ───────────────────────────────────────────────────────
  if (!store.user) return null

  if (!store.profile.onboardingComplete) {
    return (
      <>
        <DynamicBackground mindState="idle" />
        <div className="relative z-10">
          <Onboarding
            userName={store.user.name.split(' ')[0]}
            userId={store.user.id}
            onComplete={(partial, _tone) => {
              store.completeOnboarding(partial)
              const hour = new Date().getHours()
              store.addChatMessage(
                `مرحباً! هدفك "${partial.goalText?.slice(0, 25)}" محفوظ. جاهز لتبدأ في ${hourContextLabel(hour)}؟`,
                'system'
              )
            }}
          />
        </div>
      </>
    )
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070711] overflow-hidden">
      <DynamicBackground mindState={store.mindState} />
      <RewardBadge type={reward} extra={rewardExtra} onDismiss={() => setReward(null)} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* ── Header ── */}
        <header className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center"
              animate={store.activeSession ? {
                boxShadow: ['0 0 10px rgba(124,58,237,0.4)', '0 0 25px rgba(124,58,237,0.7)', '0 0 10px rgba(124,58,237,0.4)']
              } : { boxShadow: '0 0 0px rgba(0,0,0,0)' }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M8 5v14l11-7z"/></svg>
            </motion.div>
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-wider">مرحباً</p>
              <p className="text-sm font-bold text-white">{store.user.name.split(' ')[0]}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tone badge */}
            <div className="glass rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span className="text-[10px] text-teal-300">
                {{ gentle: 'لطيف', direct: 'مباشر', motivational: 'تحفيزي' }[store.profile.tone]}
              </span>
            </div>
            {/* Level */}
            <div className="glass rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span className="text-[11px] text-violet-300 font-bold">{LEVEL_AR[store.level]}</span>
              <span className="text-[10px] text-white/20">{store.points}</span>
            </div>
            {/* Logout */}
            <button
              onClick={() => { store.logout(); router.push('/') }}
              className="glass rounded-full p-2 cursor-pointer hover:bg-white/10 transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        </header>

        {/* ── Main ── */}
        <main className="flex-1 px-4 pb-24 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* HOME */}
            {view === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-lg mx-auto"
              >
                <div className="pt-3">
                  {/* Goal chip */}
                  <motion.div
                    className="flex items-center justify-between mb-4"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-2 glass rounded-full px-4 py-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                      <p className="text-sm text-white/70 truncate max-w-[200px]">
                        {store.profile.goalText}
                      </p>
                    </div>
                    <button
                      onClick={() => store.updateProfile({ onboardingComplete: false })}
                      className="text-white/15 hover:text-white/40 text-xs cursor-pointer transition-colors"
                    >
                      تعديل
                    </button>
                  </motion.div>

                  {/* State headline */}
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={store.mindState}
                      className="text-center text-white/25 text-sm mb-5"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {store.mindState === 'focused'    && `أنت مركّز — استمر`}
                      {store.mindState === 'starting'   && `بدأت! الجلسة نشطة...`}
                      {store.mindState === 'distracted' && `لاحظنا تشتتاً — هل نبدأ؟`}
                      {store.mindState === 'idle'       && `جاهز تبدأ؟`}
                    </motion.p>
                  </AnimatePresence>

                  {/* Follow-up prompt (above chat) */}
                  <FollowUpPrompt
                    question={pendingFollowUpObj}
                    onAnswer={handleFollowUpAnswer}
                    onDismiss={() => {
                      setPendingFollowUpObj(null)
                      store.setPendingFollowUp(null)
                    }}
                  />

                  {/* Chat + Intervention */}
                  <ChatIntervention
                    messages={store.chatMessages}
                    showIntervention={store.showIntervention}
                    interventionMessage={interventionPayload.message || store.currentIntervention?.message || ''}
                    microAction={interventionPayload.microAction || store.currentIntervention?.microAction || ''}
                    onAccept={handleAccept}
                    onDismiss={handleDismiss}
                  />

                  {/* Session or Start button */}
                  <AnimatePresence mode="wait">
                    {store.activeSession ? (
                      <motion.div
                        key="session"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <SessionFlow
                          startedAt={store.activeSession.startedAt}
                          targetMinutes={store.activeSession.targetMinutes}
                          onEnd={handleEndSession}
                          onExtend={handleExtend}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="start"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                      >
                        <DecisionButton
                          onStart={handleStart}
                          goalText={store.profile.goalText}
                          defaultMinutes={store.profile.preferredDuration}
                        />

                        {/* Demo trigger */}
                        <div className="flex justify-center mt-5">
                          <button
                            onClick={() => {
                              const { message, microAction } = buildPersonalizedMessage({
                                profile: store.profile,
                                snap,
                                hour: new Date().getHours(),
                                reason: 'high-risk-window',
                                retried: false,
                              })
                              setInterventionPayload({ message, microAction })
                              store.triggerIntervention(message, microAction)
                              store.addChatMessage(message, 'ai')
                            }}
                            className="text-white/12 text-xs hover:text-white/30 cursor-pointer transition-colors"
                          >
                            محاكاة تدخل ذكي
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Stats */}
                  <motion.div
                    className="grid grid-cols-3 gap-2.5 mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {[
                      { label: 'الجلسات', value: store.sessionCount },
                      { label: 'الدقائق', value: store.totalMinutes },
                      { label: 'سلسلة', value: `${store.streak}ي` },
                    ].map((s) => (
                      <motion.div
                        key={s.label}
                        className="glass rounded-2xl p-3.5 text-center"
                        whileHover={{ scale: 1.03 }}
                      >
                        <motion.p
                          className="text-xl font-black gradient-text"
                          key={String(s.value)}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400 }}
                        >
                          {s.value}
                        </motion.p>
                        <p className="text-[10px] text-white/25 mt-0.5">{s.label}</p>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Level progress */}
                  <div className="glass rounded-2xl p-4 mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] text-white/25">المستوى</span>
                      <span className="text-[11px] font-bold text-violet-300">{LEVEL_AR[store.level]}</span>
                    </div>
                    <LiquidProgress value={levelProgress()} showPercentage height={8} />
                  </div>

                  {/* Push opt-in */}
                  {!store.pushEnabled && (
                    <motion.button
                      onClick={handleEnablePush}
                      className="w-full mt-3 glass rounded-xl py-3 flex items-center justify-center gap-2 text-xs text-white/20 hover:text-white/45 cursor-pointer transition-all"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                      </svg>
                      تفعيل إشعارات ذكية
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {/* INSIGHTS */}
            {view === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AnalyticsPanel
                  interventionHistory={store.interventionHistory}
                  sessionHistory={store.sessionHistory}
                  totalMinutes={store.totalMinutes}
                  profile={store.profile}
                  streak={store.streak}
                  sessionCount={store.sessionCount}
                  lastSessionDate={store.lastSessionDate}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ── Bottom Nav ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-40">
          <div className="mx-4 mb-4">
            <div className="glass-strong rounded-2xl px-3 py-3 flex items-center justify-around border border-white/5">
              {([
                { id: 'home' as View,     label: 'الرئيسية',
                  icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg> },
                { id: 'insights' as View, label: 'تقارير',
                  icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M9 11H7v9h2v-9zm4-4h-2v13h2V7zm4-4h-2v17h2V3z"/></svg> },
              ]).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex flex-col items-center gap-1 px-8 py-1 rounded-xl transition-all cursor-pointer ${
                    view === item.id ? 'text-violet-400' : 'text-white/20 hover:text-white/50'
                  }`}
                >
                  {item.icon}
                  <span className="text-[10px]">{item.label}</span>
                  {view === item.id && (
                    <motion.div layoutId="navDot" className="w-1 h-1 rounded-full bg-violet-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}

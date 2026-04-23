'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { computeAnalytics } from '@/lib/interventionEngine'
import { UserProfile, InterventionRecord, SessionRecord } from '@/lib/userProfile'
import {
  buildInsightText, computeBehaviorSnapshot,
} from '@/lib/messageEngine'
import LiquidProgress from './LiquidProgress'

interface AnalyticsPanelProps {
  interventionHistory: InterventionRecord[]
  sessionHistory: SessionRecord[]
  totalMinutes: number
  profile: UserProfile
  streak: number
  sessionCount: number
  lastSessionDate: string | null
}

const COLOR_CLASSES = {
  violet: { text: 'text-violet-400', bg: 'bg-violet-500/8', border: 'border-violet-500/15' },
  blue:   { text: 'text-blue-400',   bg: 'bg-blue-500/8',   border: 'border-blue-500/15' },
  green:  { text: 'text-green-400',  bg: 'bg-green-500/8',  border: 'border-green-500/15' },
  yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/8', border: 'border-yellow-500/15' },
  red:    { text: 'text-red-400',    bg: 'bg-red-500/8',    border: 'border-red-500/15' },
  teal:   { text: 'text-teal-400',   bg: 'bg-teal-500/8',   border: 'border-teal-500/15' },
} as const

type ColorKey = keyof typeof COLOR_CLASSES

interface InsightCard {
  key: string
  rawValue: string | number
  displayText: string
  isPercent?: boolean
  color: ColorKey
  wide?: boolean
}

export default function AnalyticsPanel({
  interventionHistory, sessionHistory, totalMinutes, profile,
  streak, sessionCount, lastSessionDate,
}: AnalyticsPanelProps) {
  const stats = useMemo(
    () => computeAnalytics(interventionHistory, sessionHistory, totalMinutes),
    [interventionHistory, sessionHistory, totalMinutes]
  )

  const snap = useMemo(
    () => computeBehaviorSnapshot(interventionHistory, sessionHistory, streak, sessionCount, lastSessionDate),
    [interventionHistory, sessionHistory, streak, sessionCount, lastSessionDate]
  )

  const hasData = sessionHistory.length > 0 || interventionHistory.length > 0

  const cards: InsightCard[] = useMemo(() => [
    {
      key: 'bestHour',
      rawValue: stats.bestHour,
      displayText: buildInsightText('bestHour', stats.bestHour, profile, snap),
      color: 'violet',
    },
    {
      key: 'failHour',
      rawValue: stats.failHour,
      displayText: buildInsightText('failHour', stats.failHour, profile, snap),
      color: 'red',
    },
    {
      key: 'avgDelay',
      rawValue: stats.avgDelay,
      displayText: `متوسط تأخيرك: ${stats.avgDelay} دقيقة للبداية`,
      color: 'yellow',
    },
    {
      key: 'energyPattern',
      rawValue: stats.energyPattern,
      displayText: buildInsightText('energyPattern', stats.energyPattern, profile, snap),
      color: 'blue',
      wide: true,
    },
    {
      key: 'acceptRate',
      rawValue: stats.acceptRate,
      displayText: buildInsightText('acceptRate', stats.acceptRate, profile, snap),
      isPercent: true,
      color: 'green',
    },
    {
      key: 'ignoreRate',
      rawValue: stats.ignoreRate,
      displayText: `تجاهلت ${stats.ignoreRate}٪ من رسائلنا`,
      isPercent: true,
      color: 'red',
    },
    {
      key: 'recoveryRate',
      rawValue: stats.recoveryRate,
      displayText: buildInsightText('recoveryRate', stats.recoveryRate, profile, snap),
      isPercent: true,
      color: 'teal',
    },
    {
      key: 'consistencyRate',
      rawValue: stats.consistencyRate,
      displayText: buildInsightText('consistencyRate', stats.consistencyRate, profile, snap),
      isPercent: true,
      color: 'violet',
    },
    {
      key: 'overachievement',
      rawValue: stats.overachievementRate,
      displayText: `${stats.overachievementRate}٪ من جلساتك تجاوزت الهدف${stats.overachievementRate > 30 ? ' — قوي' : ''}`,
      isPercent: true,
      color: 'blue',
    },
    {
      key: 'riskPattern',
      rawValue: stats.riskPattern,
      displayText: buildInsightText('riskPattern', stats.riskPattern, profile, snap),
      color: stats.riskPattern === 'نمط صحي' ? 'green' : 'yellow',
      wide: true,
    },
  ], [stats, profile, snap])

  const LEVEL_AR: Record<string, string> = {
    Starter: 'مبتدئ', Consistent: 'منتظم', Focused: 'مركّز', Disciplined: 'منضبط',
  }

  return (
    <div className="max-w-lg mx-auto pt-4 pb-8">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-black text-white mb-1">تقرير سلوكك</h2>
        <div className="flex items-center gap-2 text-xs text-white/25">
          <span>{profile.goalText.slice(0, 30)}</span>
          <span>·</span>
          <span>ثقتنا بملفك: {profile.confidenceScore}٪</span>
        </div>
      </div>

      {!hasData ? (
        <motion.div
          className="glass rounded-3xl p-10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-full glass-violet flex items-center justify-center mx-auto mb-4 glow-violet">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-violet-400">
              <path d="M9 11H7v9h2v-9zm4-4h-2v13h2V7zm4-4h-2v17h2V3z"/>
            </svg>
          </div>
          <p className="text-white/40 text-sm">ابدأ جلساتك لتظهر رؤى شخصية هنا</p>
          <p className="text-white/20 text-xs mt-2">نحتاج ٣ جلسات على الأقل</p>
        </motion.div>
      ) : (
        <>
          {/* Profile summary */}
          <div className="glass rounded-2xl p-4 mb-4 border border-white/5">
            <p className="text-[10px] text-white/25 mb-3 uppercase tracking-wider">ملفك المتعلَّم</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'الأسلوب', value: { gentle: 'لطيف', direct: 'مباشر', motivational: 'تحفيزي' }[profile.tone] || profile.tone },
                { label: 'المحفّز', value: { phone: 'الجوال', fatigue: 'التعب', procrastination: 'التسويف', social: 'الانشغال', boredom: 'الملل', other: 'أخرى' }[profile.mainTrigger] || profile.mainTrigger },
                { label: 'المدة', value: `${profile.preferredDuration} دقائق` },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className="text-sm font-bold text-white">{item.value}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
            {/* Confidence */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-white/20">مدى معرفتنا بك</span>
                <span className="text-[10px] text-violet-300">{profile.confidenceScore}٪</span>
              </div>
              <LiquidProgress value={profile.confidenceScore} showPercentage={false} height={4} />
            </div>
          </div>

          {/* Quick stats */}
          <div className="glass rounded-2xl p-4 mb-4 flex items-center justify-between">
            {[
              { label: 'جلسة', value: stats.totalSessions },
              { label: 'دقيقة', value: totalMinutes },
              { label: 'سلسلة', value: `${streak}ي` },
              { label: 'قبول', value: `${stats.acceptRate}٪` },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-lg font-black gradient-text">{s.value}</p>
                <p className="text-[10px] text-white/25 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* 10 insight cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {cards.map((card, i) => {
              const cl = COLOR_CLASSES[card.color]
              return (
                <motion.div
                  key={card.key}
                  className={`rounded-2xl p-4 border ${cl.bg} ${cl.border} ${card.wide ? 'col-span-2' : ''}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <p className={`font-bold text-sm leading-snug ${cl.text}`}>
                    {card.displayText}
                  </p>

                  {card.isPercent && typeof card.rawValue === 'number' && (
                    <div className="mt-2.5">
                      <LiquidProgress value={card.rawValue} showPercentage={false} height={4} />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Recent interventions */}
          {interventionHistory.length > 0 && (
            <div className="mt-4 glass rounded-2xl p-4">
              <p className="text-xs text-white/25 mb-3 uppercase tracking-wider">آخر التدخلات</p>
              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {interventionHistory.slice(0, 8).map((iv) => (
                  <div key={iv.id} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      iv.accepted ? 'bg-green-400' : 'bg-red-400/40'
                    }`} />
                    <p className="text-xs text-white/40 flex-1 truncate">{iv.message}</p>
                    <p className="text-[10px] text-white/15 flex-shrink-0">
                      {iv.accepted ? 'بدأ' : iv.retried ? 'أعيد' : 'تجاهل'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

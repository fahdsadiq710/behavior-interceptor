'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type RewardType = 'start' | 'exceed' | 'return' | 'streak' | 'levelup' | null

interface RewardBadgeProps {
  type: RewardType
  extra?: string        // e.g. new level name
  onDismiss: () => void
}

const REWARD_DATA: Record<NonNullable<RewardType>, {
  headline: string
  sub: string
  icon: React.ReactNode
  gradient: string
  border: string
}> = {
  start: {
    headline: 'بدأت — وهذا أهم جزء',
    sub: '+١٠ نقطة',
    gradient: 'from-violet-600/20 to-blue-600/20',
    border: 'border-violet-500/30',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-violet-400">
        <path d="M8 5v14l11-7z"/>
      </svg>
    ),
  },
  exceed: {
    headline: 'أداء ممتاز اليوم',
    sub: 'تجاوزت الهدف — بوست مكثف ⚡',
    gradient: 'from-green-600/20 to-teal-600/20',
    border: 'border-green-500/30',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-green-400">
        <path d="M9 11H7v9h2v-9zm4-4h-2v13h2V7zm4-4h-2v17h2V3z"/>
      </svg>
    ),
  },
  return: {
    headline: 'رجعة قوية',
    sub: 'كنا ننتظرك — +١٥ نقطة',
    gradient: 'from-yellow-600/20 to-orange-600/20',
    border: 'border-yellow-500/30',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-yellow-400">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
      </svg>
    ),
  },
  streak: {
    headline: 'سلسلة متواصلة!',
    sub: 'يوم تلو الآخر. لا تكسر السلسلة.',
    gradient: 'from-orange-600/20 to-red-600/20',
    border: 'border-orange-500/30',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-orange-400">
        <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/>
      </svg>
    ),
  },
  levelup: {
    headline: 'ارتقيت مستوى!',
    sub: 'واصل — أنت تتحسن',
    gradient: 'from-violet-600/25 to-pink-600/20',
    border: 'border-violet-400/40',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-violet-300">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
  },
}

export default function RewardBadge({ type, extra, onDismiss }: RewardBadgeProps) {
  useEffect(() => {
    if (!type) return
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [type, onDismiss])

  const data = type ? REWARD_DATA[type] : null

  return (
    <AnimatePresence>
      {type && data && (
        <motion.div
          className="fixed top-20 inset-x-0 flex justify-center z-50 px-4 pointer-events-none"
          initial={{ opacity: 0, y: -50, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
        >
          <div
            className={`pointer-events-auto glass-strong rounded-2xl px-6 py-4 flex items-center gap-4 border ${data.border} bg-gradient-to-r ${data.gradient} max-w-sm w-full`}
          >
            {/* Icon with bounce */}
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex-shrink-0"
            >
              {data.icon}
            </motion.div>

            <div className="flex-1 text-right">
              <p className="font-black text-white text-sm leading-tight">{data.headline}</p>
              {extra && <p className="text-xs text-white/70 mt-0.5">{extra}</p>}
              <p className="text-xs text-white/40 mt-0.5">{data.sub}</p>
            </div>

            {/* Auto-dismiss progress */}
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 rounded-full bg-white/20"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3.5, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

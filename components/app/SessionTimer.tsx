'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface SessionTimerProps {
  startedAt: number
  onEnd: () => void
}

export default function SessionTimer({ startedAt, onEnd }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const fmt = (n: number) => String(n).padStart(2, '0')

  return (
    <motion.div
      className="glass-strong rounded-2xl p-6 text-center"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <p className="text-xs text-white/40 mb-3 uppercase tracking-wider">الجلسة النشطة</p>

      <motion.div
        className="text-5xl font-black gradient-text mb-1"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {fmt(minutes)}:{fmt(seconds)}
      </motion.div>

      <p className="text-xs text-white/30 mb-6">دقيقة : ثانية</p>

      {/* Progress arc */}
      <div className="flex justify-center mb-6">
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          <motion.circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="url(#timerGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(elapsed / 600, 1))}`}
            transform="rotate(-90 50 50)"
          />
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <motion.button
        onClick={onEnd}
        className="w-full glass rounded-xl py-3 text-white/50 hover:text-white text-sm font-medium transition-all cursor-pointer border border-white/5 hover:border-white/10"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        إنهاء الجلسة
      </motion.button>
    </motion.div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LiquidProgress from './LiquidProgress'

interface SessionFlowProps {
  startedAt: number
  targetMinutes: number
  onEnd: (extended?: boolean) => void
  onExtend: (extraMinutes: number) => void
}

export default function SessionFlow({ startedAt, targetMinutes, onEnd, onExtend }: SessionFlowProps) {
  const [elapsed, setElapsed] = useState(0)
  const [phase, setPhase] = useState<'running' | 'done' | 'extended'>('running')
  const [extendAsked, setExtendAsked] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - startedAt) / 1000)
      setElapsed(secs)

      // Trigger "continue?" prompt when target reached
      if (secs >= targetMinutes * 60 && !extendAsked) {
        setExtendAsked(true)
        setPhase('done')
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt, targetMinutes, extendAsked])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const progress = Math.min(100, Math.round((elapsed / (targetMinutes * 60)) * 100))

  const handleExtend = useCallback((extra: number) => {
    setPhase('extended')
    setExtendAsked(false)
    onExtend(extra)
  }, [onExtend])

  return (
    <motion.div
      className="glass-strong rounded-3xl p-6 w-full max-w-xs mx-auto border border-white/5"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Status indicator */}
      <div className="flex items-center gap-2 mb-5">
        <motion.div
          className="w-2 h-2 rounded-full bg-violet-400"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-xs text-white/40 uppercase tracking-wider">
          {phase === 'running' ? 'جلسة نشطة' : phase === 'done' ? 'انتهى الوقت!' : 'تمديد نشط'}
        </span>
      </div>

      {/* Time display */}
      <div className="text-center mb-5">
        <motion.p
          className="text-5xl font-black"
          animate={phase === 'done' ? { color: ['#A78BFA', '#60A5FA', '#A78BFA'] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="gradient-text">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </motion.p>
        <p className="text-white/25 text-xs mt-1">
          الهدف: {targetMinutes} دقيقة
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <LiquidProgress value={progress} showPercentage={false} height={8} />
      </div>

      {/* "Continue?" prompt */}
      <AnimatePresence>
        {phase === 'done' && (
          <motion.div
            className="mb-5 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p className="text-white font-bold mb-1">أتمّيت! تبغى تكمل؟</p>
            <p className="text-white/30 text-xs mb-4">أنت في حالة تركيز جيدة الآن</p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { extra: 5, label: '+٥ دقائق' },
                { extra: 10, label: '+١٠ دقائق' },
                { extra: 25, label: '+٢٥ دقيقة' },
              ].map((opt) => (
                <motion.button
                  key={opt.extra}
                  onClick={() => handleExtend(opt.extra)}
                  className="glass rounded-xl py-2 text-xs text-violet-300 font-bold cursor-pointer hover:bg-violet-500/10 border border-violet-500/20 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End button */}
      <motion.button
        onClick={() => onEnd(phase === 'extended')}
        className="w-full glass rounded-xl py-3 text-white/40 hover:text-white/70 text-sm font-medium transition-all cursor-pointer border border-white/5"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {phase === 'done' ? 'انهِ الجلسة' : 'إنهاء مبكر'}
      </motion.button>
    </motion.div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DecisionButtonProps {
  onStart: (minutes: number) => void
  disabled?: boolean
  goalText?: string
  defaultMinutes?: number
}

const DURATION_OPTIONS = [
  { minutes: 3, label: '٣ دقائق', desc: 'البداية' },
  { minutes: 10, label: '١٠ دقائق', desc: 'متوسط' },
  { minutes: 25, label: '٢٥ دقيقة', desc: 'مكثف' },
]

export default function DecisionButton({ onStart, disabled, goalText, defaultMinutes = 3 }: DecisionButtonProps) {
  const [showOptions, setShowOptions] = useState(false)
  const [burst, setBurst] = useState(false)

  const handleQuickStart = useCallback(() => {
    if (disabled) return
    setBurst(true)
    // Haptic feedback (mobile)
    if (navigator.vibrate) navigator.vibrate([15, 10, 15])
    setTimeout(() => {
      setBurst(false)
      onStart(defaultMinutes)
    }, 350)
  }, [disabled, onStart])

  const handleOptionStart = useCallback((minutes: number) => {
    setShowOptions(false)
    if (navigator.vibrate) navigator.vibrate([15, 10, 15])
    onStart(minutes)
  }, [onStart])

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xs mx-auto">
      {/* Main CTA — big glowing button */}
      <div className="relative w-full">
        {/* Outer pulse rings */}
        {!disabled && (
          <>
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)' }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)' }}
              animate={{ scale: [1, 1.14, 1], opacity: [0.15, 0, 0.15] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            />
          </>
        )}

        {/* Main button */}
        <motion.button
          onClick={handleQuickStart}
          disabled={disabled}
          className="relative w-full rounded-3xl py-6 overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #3B82F6 100%)' }}
          whileHover={!disabled ? {
            scale: 1.03,
            boxShadow: '0 0 60px rgba(124,58,237,0.7), 0 0 120px rgba(124,58,237,0.3)',
          } : {}}
          whileTap={!disabled ? { scale: 0.96 } : {}}
          animate={!disabled ? {
            boxShadow: [
              '0 0 20px rgba(124,58,237,0.4)',
              '0 0 50px rgba(124,58,237,0.7)',
              '0 0 20px rgba(124,58,237,0.4)',
            ],
          } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Inner shine */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent rounded-3xl" />

          {/* Burst flash */}
          <AnimatePresence>
            {burst && (
              <motion.div
                className="absolute inset-0 bg-white rounded-3xl"
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 0 }}
                exit={{}}
                transition={{ duration: 0.35 }}
              />
            )}
          </AnimatePresence>

          {/* Shimmer swipe on hover */}
          <motion.div
            className="absolute inset-0 rounded-3xl"
            style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)' }}
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />

          {/* Content */}
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </motion.div>
              <span className="text-2xl font-black text-white">ابدأ الآن</span>
            </div>
            <p className="text-white/60 text-sm">
              {goalText ? `${goalText.slice(0, 20)}${goalText.length > 20 ? '...' : ''}` : '٣ دقائق فقط'}
            </p>
          </div>
        </motion.button>
      </div>

      {/* Duration options toggle */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="text-white/25 text-xs hover:text-white/50 cursor-pointer transition-colors flex items-center gap-1"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
        تغيير المدة
      </button>

      {/* Duration selector */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            className="w-full grid grid-cols-3 gap-2"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            {DURATION_OPTIONS.map((opt, i) => (
              <motion.button
                key={opt.minutes}
                onClick={() => handleOptionStart(opt.minutes)}
                className="glass rounded-2xl py-3 text-center cursor-pointer hover:bg-white/10 transition-all border border-white/5 hover:border-violet-500/30"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <p className="text-sm font-black text-white">{opt.label}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{opt.desc}</p>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

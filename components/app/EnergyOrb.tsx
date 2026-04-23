'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface EnergyOrbProps {
  onStart: () => void
  active: boolean
  size?: number
}

export default function EnergyOrb({ onStart, active, size = 180 }: EnergyOrbProps) {
  const [burst, setBurst] = useState(false)
  const [ripples, setRipples] = useState<number[]>([])

  const handleClick = useCallback(() => {
    if (active) return
    setBurst(true)
    setRipples((r) => [...r, Date.now()])
    setTimeout(() => setBurst(false), 600)
    setTimeout(() => {
      onStart()
      setRipples([])
    }, 400)
  }, [active, onStart])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-violet-500/20"
          style={{ width: size + i * 30, height: size + i * 30 }}
          animate={{
            scale: active ? [1, 1.05, 1] : [1, 1.02, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Ripples on click */}
      <AnimatePresence>
        {ripples.map((id) => (
          <motion.div
            key={id}
            className="absolute rounded-full border-2 border-violet-400"
            style={{ width: size, height: size }}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Main orb */}
      <motion.button
        onClick={handleClick}
        className="relative rounded-full cursor-pointer outline-none select-none"
        style={{ width: size, height: size }}
        animate={active
          ? { scale: [1, 1.03, 1], boxShadow: ['0 0 40px rgba(124,58,237,0.5)', '0 0 80px rgba(124,58,237,0.8)', '0 0 40px rgba(124,58,237,0.5)'] }
          : { scale: [1, 1.02, 1], boxShadow: ['0 0 20px rgba(124,58,237,0.3)', '0 0 40px rgba(124,58,237,0.5)', '0 0 20px rgba(124,58,237,0.3)'] }
        }
        transition={{ duration: active ? 2 : 4, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Gradient background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-600 via-violet-700 to-blue-700" />

        {/* Rotating conic gradient */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-60"
          style={{ background: 'conic-gradient(from 0deg, transparent 0%, #A78BFA 30%, transparent 60%, #60A5FA 80%, transparent 100%)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        {/* Inner glass */}
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm" />

        {/* Burst animation */}
        <AnimatePresence>
          {burst && (
            <motion.div
              className="absolute inset-0 rounded-full bg-white"
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          {active ? (
            <>
              <motion.div
                className="w-8 h-8 mb-1"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <svg viewBox="0 0 24 24" className="w-full h-full fill-white">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              </motion.div>
              <span className="text-xs font-bold text-white/80">جارٍ</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white mb-1">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span className="text-xs font-bold text-white/80">ابدأ</span>
            </>
          )}
        </div>
      </motion.button>
    </div>
  )
}

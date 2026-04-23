'use client'

import { motion } from 'framer-motion'

interface LiquidProgressProps {
  value: number // 0-100
  label?: string
  showPercentage?: boolean
  height?: number
}

export default function LiquidProgress({
  value,
  label,
  showPercentage = true,
  height = 12,
}: LiquidProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-white/50">{label}</span>}
          {showPercentage && (
            <motion.span
              className="text-sm font-bold text-violet-300"
              key={clamped}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {clamped}٪
            </motion.span>
          )}
        </div>
      )}

      <div
        className="relative overflow-hidden rounded-full bg-white/5"
        style={{ height }}
      >
        {/* Track glow */}
        <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }} />

        {/* Liquid fill */}
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          style={{ background: 'linear-gradient(90deg, #7C3AED, #A78BFA, #3B82F6, #7C3AED)', backgroundSize: '300% 100%' }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Shine overlay */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)' }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
          />
        </motion.div>

        {/* Bubbles */}
        {clamped > 10 && (
          <>
            {[0.2, 0.5, 0.75].map((pos, i) => (
              <motion.div
                key={i}
                className="absolute top-1 rounded-full bg-white/20"
                style={{ width: height * 0.4, height: height * 0.4, left: `${clamped * pos}%` }}
                animate={{ y: [0, -2, 0], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 1.5 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

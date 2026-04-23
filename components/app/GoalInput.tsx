'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SUGGESTIONS = [
  'أبغى أوقف التسويف',
  'أبغى أذاكر يومياً',
  'أبغى أكون أكثر إنتاجية',
  'أبغى أقرأ كل يوم',
  'أبغى أوقف وقت الشاشة الزائد',
  'أبغى أتمرن بانتظام',
]

interface GoalInputProps {
  onConfirm: (goal: string) => void
}

export default function GoalInput({ onConfirm }: GoalInputProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400)
  }, [])

  const filtered = value.length > 0
    ? SUGGESTIONS.filter(s => s.includes(value))
    : SUGGESTIONS

  const confirm = (text = value) => {
    const trimmed = text.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
    >
      {/* Headline */}
      <div className="text-center mb-10">
        <motion.div
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs text-violet-300">أخبرنا بهدفك</span>
        </motion.div>

        <h1 className="text-3xl font-black text-white mb-3 leading-tight">
          وش الشيء اللي<br />
          <span className="gradient-text">تبغى تغيره؟</span>
        </h1>
        <p className="text-white/30 text-sm">
          النظام سيتكيّف معك بناءً على هدفك
        </p>
      </div>

      {/* Input field */}
      <div className="relative mb-4">
        <motion.div
          className={`relative rounded-2xl transition-all duration-300 ${
            focused
              ? 'shadow-[0_0_0_2px_rgba(124,58,237,0.5),0_0_30px_rgba(124,58,237,0.2)]'
              : 'shadow-none'
          }`}
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); setShowSuggestions(true) }}
            onFocus={() => { setFocused(true); setShowSuggestions(true) }}
            onBlur={() => { setFocused(false); setTimeout(() => setShowSuggestions(false), 200) }}
            onKeyDown={(e) => e.key === 'Enter' && confirm()}
            placeholder="اكتب هدفك بحرية..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-base outline-none transition-all placeholder:text-white/25 pr-5 pl-14"
            style={{ direction: 'rtl' }}
            maxLength={100}
          />

          {/* Mic icon / clear */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <AnimatePresence>
              {value && (
                <motion.button
                  onClick={() => setValue('')}
                  className="text-white/20 hover:text-white/60 cursor-pointer transition-colors"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && filtered.length > 0 && (
            <motion.div
              className="absolute top-full right-0 left-0 mt-2 glass-strong rounded-2xl overflow-hidden z-20 border border-white/5"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {filtered.slice(0, 5).map((s, i) => (
                <motion.button
                  key={s}
                  onClick={() => { setValue(s); confirm(s) }}
                  className="w-full text-right px-5 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all cursor-pointer border-b border-white/5 last:border-0 flex items-center gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-violet-400/50 flex-shrink-0">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  {s}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirm button */}
      <motion.button
        onClick={() => confirm()}
        disabled={!value.trim()}
        className="w-full relative overflow-hidden rounded-2xl py-4 font-bold text-lg text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)' }}
        whileHover={{ scale: value.trim() ? 1.02 : 1, boxShadow: value.trim() ? '0 0 40px rgba(124,58,237,0.5)' : 'none' }}
        whileTap={{ scale: value.trim() ? 0.98 : 1 }}
      >
        {/* Shimmer on hover */}
        <motion.div
          className="absolute inset-0 bg-white/10"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.5 }}
        />
        <span className="relative z-10">ابدأ رحلتك</span>
      </motion.button>

      <p className="text-center text-white/15 text-xs mt-4">
        يمكنك تغيير هدفك في أي وقت
      </p>
    </motion.div>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ChatMessage } from '@/store/useAppStore'

interface ChatInterventionProps {
  messages: ChatMessage[]
  showIntervention: boolean
  interventionMessage: string
  microAction: string
  onAccept: () => void
  onDismiss: () => void
}

export default function ChatIntervention({
  messages,
  showIntervention,
  interventionMessage,
  microAction,
  onAccept,
  onDismiss,
}: ChatInterventionProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showIntervention])

  if (messages.length === 0 && !showIntervention) return null

  return (
    <div className="w-full space-y-2 mb-6">
      {/* Chat history */}
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            className="flex items-start gap-2"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Avatar dot */}
            <div className={`w-6 h-6 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center ${
              msg.type === 'reward'
                ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                : 'bg-gradient-to-br from-violet-600 to-blue-600'
            }`}>
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                {msg.type === 'reward'
                  ? <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  : <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                }
              </svg>
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 ${
              msg.type === 'reward'
                ? 'bg-gradient-to-r from-yellow-600/15 to-orange-600/15 border border-yellow-500/20'
                : 'glass border border-white/5'
            }`}>
              <p className="text-sm text-white/80 leading-relaxed">{msg.text}</p>
              <p className="text-[10px] text-white/20 mt-1">
                {new Date(msg.ts).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Active intervention card */}
      <AnimatePresence>
        {showIntervention && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="flex items-start gap-2"
          >
            {/* Pulsing avatar */}
            <motion.div
              className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5 bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center"
              animate={{ scale: [1, 1.15, 1], boxShadow: ['0 0 0 0 rgba(124,58,237,0.4)', '0 0 0 6px rgba(124,58,237,0)', '0 0 0 0 rgba(124,58,237,0.4)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </motion.div>

            <div className="flex-1 max-w-[90%]">
              {/* Message bubble */}
              <div className="glass-strong rounded-2xl rounded-tr-sm px-4 py-3 mb-2 border border-violet-500/20 relative overflow-hidden">
                {/* Top border glow */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500/0 via-violet-500/60 to-violet-500/0" />

                <p className="text-sm text-white leading-relaxed mb-2">{interventionMessage}</p>

                {/* Micro action */}
                <div className="bg-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-violet-400 flex-shrink-0">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <p className="text-xs text-violet-300">{microAction}</p>
                </div>
              </div>

              {/* Action buttons as chat options */}
              <div className="flex gap-2">
                <motion.button
                  onClick={onAccept}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl py-2.5 text-white text-sm font-bold cursor-pointer relative overflow-hidden"
                  whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(124,58,237,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-white/10"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.4 }}
                  />
                  <span className="relative z-10">ابدأ الآن</span>
                </motion.button>

                <motion.button
                  onClick={onDismiss}
                  className="px-4 glass rounded-xl text-white/35 hover:text-white/60 text-sm transition-all cursor-pointer border border-white/5"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  لاحقاً
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  )
}

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FollowUpQuestion } from '@/lib/messageEngine'

interface FollowUpPromptProps {
  question: FollowUpQuestion | null
  onAnswer: (questionId: string, profileUpdate: Record<string, unknown>, label: string) => void
  onDismiss: () => void
}

export default function FollowUpPrompt({ question, onAnswer, onDismiss }: FollowUpPromptProps) {
  return (
    <AnimatePresence>
      {question && (
        <motion.div
          className="flex items-start gap-2 mb-4"
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          {/* System avatar */}
          <motion.div
            className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </motion.div>

          <div className="flex-1">
            {/* Bubble */}
            <div className="glass-strong rounded-2xl rounded-tr-sm px-4 py-3 mb-2 border border-teal-500/15 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500/0 via-teal-400/50 to-teal-500/0" />

              <p className="text-[10px] text-teal-400/70 mb-1.5 uppercase tracking-wider">
                سؤال تكيّف — {question.context}
              </p>
              <p className="text-sm text-white leading-relaxed">{question.question}</p>
            </div>

            {/* Answer options */}
            <div className="flex flex-wrap gap-2">
              {question.options.map((opt, i) => (
                <motion.button
                  key={opt.value}
                  onClick={() => onAnswer(question.id, opt.profileUpdate, opt.label)}
                  className="glass rounded-xl px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-teal-500/10 border border-white/5 hover:border-teal-500/30 cursor-pointer transition-all"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {opt.label}
                </motion.button>
              ))}
              <motion.button
                onClick={onDismiss}
                className="text-white/15 hover:text-white/35 text-xs cursor-pointer transition-colors px-2 py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                تخطّى
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

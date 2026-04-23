'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface InterventionCardProps {
  show: boolean
  message: string
  microAction: string
  onAccept: () => void
  onDismiss: () => void
}

export default function InterventionCard({
  show, message, microAction, onAccept, onDismiss,
}: InterventionCardProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-8 right-4 left-4 md:right-8 md:left-auto md:w-96 z-50"
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="glass-strong rounded-3xl p-6 border border-violet-500/20 shadow-[0_0_40px_rgba(124,58,237,0.2)] relative overflow-hidden">
            {/* Glow streak */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </motion.div>
              <div>
                <p className="text-xs text-violet-300 font-medium">تدخل ذكي</p>
                <p className="text-[10px] text-white/30">Behavior Interceptor AI</p>
              </div>
              <button
                onClick={onDismiss}
                className="mr-auto text-white/20 hover:text-white/50 transition-colors cursor-pointer p-1"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Message */}
            <p className="text-white text-base font-medium mb-2 leading-relaxed">{message}</p>

            {/* Micro action */}
            <div className="glass rounded-xl p-3 mb-5 border border-white/5">
              <p className="text-xs text-white/40 mb-1">المهمة الصغيرة</p>
              <p className="text-sm text-violet-300">{microAction}</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <motion.button
                onClick={onAccept}
                className="flex-1 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl py-3 text-white font-bold text-sm cursor-pointer relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="relative z-10">ابدأ الآن</span>
                <motion.div
                  className="absolute inset-0 bg-white/10"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.5 }}
                />
              </motion.button>
              <motion.button
                onClick={onDismiss}
                className="px-5 glass rounded-xl text-white/40 hover:text-white/70 text-sm font-medium transition-all cursor-pointer"
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
  )
}

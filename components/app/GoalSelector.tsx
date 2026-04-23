'use client'

import { motion } from 'framer-motion'

const GOALS = [
  {
    id: 'productivity',
    label: 'الإنتاجية',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M9 11H7v9h2v-9zm4-4h-2v13h2V7zm4-4h-2v17h2V3z"/>
      </svg>
    ),
    description: 'إنجاز المهام وتحسين التركيز',
    color: 'violet',
  },
  {
    id: 'learning',
    label: 'التعلم',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M12 3L1 9l4 2.18V15c0 1.97 3.19 4 7 4s7-2.03 7-4v-3.82L23 9l-11-6zm0 2.18L19.42 9 12 12.82 4.58 9 12 5.18zM17 14.31C17 15.31 14.76 17 12 17s-5-1.69-5-2.69V12.9l5 2.73 5-2.73v1.41z"/>
      </svg>
    ),
    description: 'اكتساب مهارات جديدة يومياً',
    color: 'blue',
  },
  {
    id: 'exercise',
    label: 'الرياضة',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
      </svg>
    ),
    description: 'تحسين اللياقة البدنية',
    color: 'green',
  },
  {
    id: 'mindfulness',
    label: 'الوعي الذاتي',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    description: 'التأمل وإدارة التوتر',
    color: 'teal',
  },
  {
    id: 'creativity',
    label: 'الإبداع',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a1 1 0 0 0-1.41 0L9 12.25 11.75 15l8.96-8.96a1 1 0 0 0 0-1.41z"/>
      </svg>
    ),
    description: 'تطوير الأفكار والمشاريع',
    color: 'orange',
  },
  {
    id: 'reading',
    label: 'القراءة',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M18 2h-3a5 5 0 0 0-5 5v6H4v11h20V13h-6V7a3 3 0 0 1 3-3h3V2z"/>
      </svg>
    ),
    description: 'القراءة اليومية وتوسيع المعرفة',
    color: 'pink',
  },
]

const COLOR_MAP: Record<string, string> = {
  violet: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  green: 'border-green-500/30 bg-green-500/10 text-green-300',
  teal: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
  orange: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  pink: 'border-pink-500/30 bg-pink-500/10 text-pink-300',
}

interface GoalSelectorProps {
  selected: string | null
  onSelect: (id: string) => void
}

export default function GoalSelector({ selected, onSelect }: GoalSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white mb-2">اختر هدفك الرئيسي</h2>
        <p className="text-white/40 text-sm">سيتكيّف النظام معك بناءً على هدفك</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {GOALS.map((goal, i) => (
          <motion.button
            key={goal.id}
            onClick={() => onSelect(goal.id)}
            className={`relative p-4 rounded-2xl border text-right transition-all cursor-pointer ${
              selected === goal.id
                ? `${COLOR_MAP[goal.color]} border-opacity-100 glow-violet`
                : 'border-white/5 bg-white/3 hover:bg-white/5 text-white/60'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {selected === goal.id && (
              <motion.div
                className="absolute inset-0 rounded-2xl"
                layoutId="goalSelected"
                style={{ boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}
              />
            )}
            <div className={`mb-3 ${selected === goal.id ? '' : 'opacity-50'}`}>
              {goal.icon}
            </div>
            <p className="font-bold text-sm mb-1">{goal.label}</p>
            <p className="text-[10px] opacity-60">{goal.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useRef, useState, useEffect } from 'react'
import { useScroll, useTransform, motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Lazy-load 3D scene to avoid SSR issues
const LandingScene = dynamic(() => import('@/components/landing/LandingScene'), { ssr: false })

const SECTIONS = [
  {
    id: 'hero',
    title: 'غيّر قرارك\nفي اللحظة الحاسمة',
    subtitle: 'نظام تدخل ذكي يعمل في الوقت الفعلي',
    scrollRange: [0, 0.2],
  },
  {
    id: 'section2',
    title: 'نحن لا نتابع عاداتك',
    subtitle: 'نحن نتدخل قبل أن تفشل',
    scrollRange: [0.15, 0.35],
  },
  {
    id: 'section3',
    title: 'التدخل الذكي',
    subtitle: 'في اللحظة الحاسمة، نسألك: هل أنت مستعد؟',
    scrollRange: [0.35, 0.55],
  },
  {
    id: 'section4',
    title: 'من الفوضى إلى النظام',
    subtitle: 'كل بداية صغيرة تبني عادة كبيرة',
    scrollRange: [0.55, 0.75],
  },
  {
    id: 'cta',
    title: 'ابدأ رحلتك',
    subtitle: 'انضم إلى القائمة. الوصول بالدعوة فقط.',
    scrollRange: [0.75, 1],
  },
]

export default function LandingPage() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ container: containerRef })
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeSection, setActiveSection] = useState(0)

  useEffect(() => {
    return scrollYProgress.onChange((v) => {
      setScrollProgress(v)
      const idx = SECTIONS.findIndex(
        (s) => v >= s.scrollRange[0] && v <= s.scrollRange[1]
      )
      if (idx !== -1) setActiveSection(idx)
    })
  }, [scrollYProgress])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#070711]">
      {/* 3D Canvas — fixed background */}
      <LandingScene scrollProgress={scrollProgress} />

      {/* Gradient overlays */}
      <div className="fixed inset-0 pointer-events-none z-10">
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-[#070711]/30 to-[#070711]/80" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#070711] to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#070711]/50 to-transparent" />
      </div>

      {/* Scrollable content container */}
      <div
        ref={containerRef}
        className="relative z-20 h-full overflow-y-scroll"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {/* Nav */}
        <nav className="fixed top-6 right-6 left-6 z-50 flex items-center justify-between">
          <div className="glass rounded-full px-5 py-2.5 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-bold text-white/80 tracking-wider">BEHAVIOR INTERCEPTOR</span>
          </div>
          <button
            onClick={() => router.push('/auth')}
            className="glass rounded-full px-5 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            دخول
          </button>
        </nav>

        {/* Section 1 — Hero */}
        <section
          className="h-screen flex items-center justify-center relative"
          style={{ scrollSnapAlign: 'start' }}
        >
          <motion.div
            className="text-center z-20 px-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <motion.div
              className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs text-violet-300 font-medium">نظام ذكاء اصطناعي متقدم</span>
            </motion.div>

            <h1 className="text-6xl md:text-8xl font-black leading-tight mb-6 whitespace-pre-line">
              <span className="gradient-text">غيّر قرارك</span>
              {'\n'}
              <span className="text-white">في اللحظة الحاسمة</span>
            </h1>

            <p className="text-xl text-white/50 mb-12 max-w-lg mx-auto">
              نظام تدخل سلوكي في الوقت الفعلي. نتدخل قبل أن تفشل.
            </p>

            <motion.div
              className="flex flex-col items-center gap-4"
              whileInView={{ opacity: 1 }}
            >
              <div className="text-white/30 text-sm animate-bounce">
                ↓ اسحب للأسفل
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Section 2 */}
        <section
          className="h-screen flex items-center justify-center relative"
          style={{ scrollSnapAlign: 'start' }}
        >
          <AnimatedSection visible={activeSection >= 1}>
            <div className="text-center px-6 max-w-2xl">
              <p className="text-lg text-violet-300/70 mb-4 font-medium">الفرق الوحيد</p>
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                نحن لا نتابع عاداتك
              </h2>
              <p className="text-2xl md:text-3xl font-bold gradient-text">
                نحن نتدخل قبل أن تفشل
              </p>
              <div className="mt-12 grid grid-cols-3 gap-6">
                {[
                  { n: '٩٢٪', label: 'معدل قبول التدخل' },
                  { n: '٣ دقائق', label: 'متوسط وقت البداية' },
                  { n: '١٠×', label: 'تحسن في الإنتاجية' },
                ].map((stat) => (
                  <div key={stat.label} className="glass rounded-2xl p-5">
                    <div className="text-3xl font-black gradient-text">{stat.n}</div>
                    <div className="text-xs text-white/40 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </section>

        {/* Section 3 — Intervention Demo */}
        <section
          className="h-screen flex items-center justify-center relative"
          style={{ scrollSnapAlign: 'start' }}
        >
          <AnimatedSection visible={activeSection >= 2}>
            <div className="text-center px-6 max-w-xl">
              <p className="text-violet-300/70 mb-6 font-medium">تجربة التدخل الذكي</p>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-12">
                في اللحظة المناسبة
              </h2>

              {/* Demo intervention card */}
              <motion.div
                className="glass-strong rounded-3xl p-8 text-right float-card"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                    </svg>
                  </div>
                  <span className="text-sm text-violet-300 font-medium">Behavior Interceptor</span>
                </div>
                <p className="text-white text-lg font-medium mb-2">
                  غالباً تضيع وقتك الآن...
                </p>
                <p className="text-white/60 text-sm mb-6">
                  نبدأ 3 دقائق فقط؟ افتح ملفك وانظر إليه فقط.
                </p>
                <div className="flex gap-3">
                  <button className="flex-1 bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 font-bold transition-all cursor-pointer">
                    ابدأ
                  </button>
                  <button className="px-6 glass rounded-xl text-white/50 hover:text-white/80 transition-all cursor-pointer">
                    لاحقاً
                  </button>
                </div>
              </motion.div>
            </div>
          </AnimatedSection>
        </section>

        {/* Section 4 — Transformation */}
        <section
          className="h-screen flex items-center justify-center relative"
          style={{ scrollSnapAlign: 'start' }}
        >
          <AnimatedSection visible={activeSection >= 3}>
            <div className="text-center px-6 max-w-2xl">
              <p className="text-violet-300/70 mb-6 font-medium">التحول</p>
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                من الفوضى إلى النظام
              </h2>
              <p className="text-white/50 text-xl max-w-lg mx-auto">
                كل قرار صغير يبني هيكلاً. نساعدك تبني عادات حقيقية خطوة بخطوة.
              </p>

              <div className="mt-12 flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-3 opacity-50">
                    <div className="grid grid-cols-3 gap-1">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-red-400 opacity-70"
                          style={{ transform: `rotate(${Math.random() * 360}deg) translate(${Math.random() * 4}px)` }} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-white/30">قبل</span>
                </div>

                <div className="text-violet-400 text-2xl">←</div>

                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl glass-violet flex items-center justify-center mx-auto mb-3 glow-violet">
                    <div className="grid grid-cols-3 gap-1">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-violet-400" />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-violet-300">بعد</span>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </section>

        {/* Section 5 — CTA */}
        <section
          className="h-screen flex items-center justify-center relative"
          style={{ scrollSnapAlign: 'start' }}
        >
          <AnimatedSection visible={activeSection >= 4}>
            <div className="text-center px-6 max-w-xl">
              <motion.div
                className="w-32 h-32 rounded-full mx-auto mb-8 relative"
                animate={{ scale: [1, 1.05, 1], boxShadow: ['0 0 30px rgba(124,58,237,0.4)', '0 0 80px rgba(124,58,237,0.8)', '0 0 30px rgba(124,58,237,0.4)'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-12 h-12 fill-white">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-violet-400/30 animate-ping" />
              </motion.div>

              <h2 className="text-5xl md:text-6xl font-black text-white mb-4">
                ابدأ رحلتك
              </h2>
              <p className="text-white/50 text-lg mb-10">
                الوصول بالدعوة فقط. انضم لقائمة الانتظار الآن.
              </p>

              <button
                onClick={() => router.push('/auth')}
                className="relative group overflow-hidden bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl px-10 py-5 text-white text-xl font-bold transition-all hover:shadow-[0_0_60px_rgba(124,58,237,0.6)] cursor-pointer"
              >
                <span className="relative z-10">طلب دعوة</span>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <p className="text-white/20 text-sm mt-6">
                بالفعل لديك حساب؟{' '}
                <button onClick={() => router.push('/auth?tab=login')} className="text-violet-400 hover:text-violet-300 cursor-pointer underline">
                  سجّل دخولك
                </button>
              </p>
            </div>
          </AnimatedSection>
        </section>
      </div>

      {/* Scroll indicator dots */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {SECTIONS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-500 cursor-pointer ${
              activeSection === i
                ? 'w-2 h-8 bg-violet-500 glow-violet'
                : 'w-2 h-2 bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function AnimatedSection({ children, visible }: { children: React.ReactNode; visible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: visible ? 1 : 0.1, y: visible ? 0 : 30 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

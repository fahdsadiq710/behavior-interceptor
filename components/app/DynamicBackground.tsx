'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MindState } from '@/store/useAppStore'

interface DynamicBackgroundProps {
  mindState: MindState
}

export default function DynamicBackground({ mindState }: DynamicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>()
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Init particles
    const count = mindState === 'distracted' ? 80 : 40
    particlesRef.current = Array.from({ length: count }, () => new Particle(canvas))

    let frame = 0
    const loop = () => {
      frame++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const isDistracted = mindState === 'distracted'
      const isFocused = mindState === 'focused'

      particlesRef.current.forEach((p) => {
        p.update(isDistracted, isFocused, frame)
        p.draw(ctx, mindState)
      })

      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [mindState])

  const bgGradient = {
    distracted: 'radial-gradient(ellipse at 30% 70%, rgba(220,38,38,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(124,58,237,0.06) 0%, transparent 60%)',
    focused: 'radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 70%)',
    starting: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%)',
    idle: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.04) 0%, transparent 70%)',
  }

  return (
    <>
      {/* Canvas particles */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: mindState === 'distracted' ? 0.8 : 0.4 }}
      />

      {/* Gradient overlay per state */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{ background: bgGradient[mindState] }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />

      {/* Focus glow */}
      <AnimatePresence>
        {mindState === 'focused' && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-3xl" />
          </motion.div>
        )}

        {mindState === 'starting' && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Distracted noise shake */}
      {mindState === 'distracted' && (
        <style>{`
          @keyframes distortedShake {
            0%, 100% { transform: translate(0, 0); }
            10% { transform: translate(-1px, 1px); }
            30% { transform: translate(1px, -1px); }
            50% { transform: translate(-1px, 0); }
            70% { transform: translate(1px, 1px); }
            90% { transform: translate(0, -1px); }
          }
          .distracted-shake { animation: distortedShake 0.5s ease infinite; }
        `}</style>
      )}
    </>
  )
}

class Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  baseX: number
  baseY: number

  constructor(canvas: HTMLCanvasElement) {
    this.x = Math.random() * canvas.width
    this.y = Math.random() * canvas.height
    this.baseX = this.x
    this.baseY = this.y
    this.vx = (Math.random() - 0.5) * 1.5
    this.vy = (Math.random() - 0.5) * 1.5
    this.size = Math.random() * 2 + 0.5
    this.alpha = Math.random() * 0.5 + 0.2
    const colors = ['#7C3AED', '#A78BFA', '#3B82F6', '#60A5FA']
    this.color = colors[Math.floor(Math.random() * colors.length)]
  }

  update(distracted: boolean, focused: boolean, frame: number) {
    if (distracted) {
      // Chaotic movement
      this.vx += (Math.random() - 0.5) * 0.3
      this.vy += (Math.random() - 0.5) * 0.3
      this.vx = Math.max(-4, Math.min(4, this.vx))
      this.vy = Math.max(-4, Math.min(4, this.vy))
    } else if (focused) {
      // Calm, slow drift
      this.vx *= 0.98
      this.vy *= 0.98
      this.vx += Math.sin(frame * 0.01 + this.baseX) * 0.02
      this.vy += Math.cos(frame * 0.01 + this.baseY) * 0.02
    } else {
      // Gentle drift
      this.vx *= 0.99
      this.vy *= 0.99
      this.vx += (Math.random() - 0.5) * 0.05
      this.vy += (Math.random() - 0.5) * 0.05
    }

    this.x += this.vx
    this.y += this.vy

    // Wrap around
    if (this.x < 0) this.x = window.innerWidth
    if (this.x > window.innerWidth) this.x = 0
    if (this.y < 0) this.y = window.innerHeight
    if (this.y > window.innerHeight) this.y = 0
  }

  draw(ctx: CanvasRenderingContext2D, state: MindState) {
    ctx.save()
    ctx.globalAlpha = this.alpha * (state === 'focused' ? 0.5 : 1)
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

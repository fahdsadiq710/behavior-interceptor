'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleFieldProps {
  count?: number
  chaos?: number // 0 = order, 1 = chaos
}

export default function ParticleField({ count = 300, chaos = 0 }: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)

  // Generate particle positions — both chaotic and structured
  const { positions, colors, structuredPositions } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const structured = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Chaotic positions: random spread
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10

      // Structured positions: sphere formation
      const phi = Math.acos(-1 + (2 * i) / count)
      const theta = Math.sqrt(count * Math.PI) * phi
      const r = 4
      structured[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      structured[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      structured[i * 3 + 2] = r * Math.cos(phi)

      // Colors: violet to blue gradient
      const t = i / count
      col[i * 3] = 0.48 + t * 0.24   // R
      col[i * 3 + 1] = 0.23 + t * 0.3 // G
      col[i * 3 + 2] = 0.93           // B
    }
    return { positions: pos, colors: col, structuredPositions: structured }
  }, [count])

  // Current positions (interpolated)
  const currentPositions = useMemo(() => new Float32Array(positions), [positions])

  useFrame((state) => {
    if (!pointsRef.current) return
    const t = state.clock.getElapsedTime()
    const geo = pointsRef.current.geometry

    const pos = geo.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      // Interpolate between chaos and order
      const chaotic = positions
      const ordered = structuredPositions
      const drift = Math.sin(t * 0.5 + i * 0.1) * 0.05

      pos[i * 3] = chaotic[i * 3] * chaos + ordered[i * 3] * (1 - chaos) + drift
      pos[i * 3 + 1] = chaotic[i * 3 + 1] * chaos + ordered[i * 3 + 1] * (1 - chaos) + drift
      pos[i * 3 + 2] = chaotic[i * 3 + 2] * chaos + ordered[i * 3 + 2] * (1 - chaos)
    }
    geo.attributes.position.needsUpdate = true
    pointsRef.current.rotation.y = t * 0.05
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={currentPositions}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

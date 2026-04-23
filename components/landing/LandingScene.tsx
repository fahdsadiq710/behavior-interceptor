'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, PerspectiveCamera } from '@react-three/drei'
import { useScroll, useTransform } from 'framer-motion'
import * as THREE from 'three'
import FloatingOrb from './FloatingOrb'
import ParticleField from './ParticleField'
import GlassPanel3D from './GlassPanel3D'

interface SceneProps {
  scrollProgress: number
}

function CinematicCamera({ scrollProgress }: SceneProps) {
  const { camera } = useThree()

  useFrame(() => {
    // Scroll 0-0.2: Hero — camera at z=8
    // Scroll 0.2-0.4: Section2 — camera moves forward z=5
    // Scroll 0.4-0.6: Section3 — camera tilts slightly
    // Scroll 0.6-0.8: Section4 — chaos to order
    // Scroll 0.8-1.0: Section5 — camera zooms out

    const s = scrollProgress

    if (s < 0.2) {
      const t = s / 0.2
      camera.position.z = THREE.MathUtils.lerp(8, 6, t)
      camera.position.y = THREE.MathUtils.lerp(0, 0, t)
    } else if (s < 0.4) {
      const t = (s - 0.2) / 0.2
      camera.position.z = THREE.MathUtils.lerp(6, 4, t)
      camera.position.y = THREE.MathUtils.lerp(0, -0.5, t)
    } else if (s < 0.6) {
      const t = (s - 0.4) / 0.2
      camera.position.z = THREE.MathUtils.lerp(4, 4.5, t)
      camera.rotation.y = THREE.MathUtils.lerp(0, 0.1, t)
    } else if (s < 0.8) {
      const t = (s - 0.6) / 0.2
      camera.position.z = THREE.MathUtils.lerp(4.5, 5, t)
      camera.position.y = THREE.MathUtils.lerp(-0.5, 0, t)
    } else {
      const t = (s - 0.8) / 0.2
      camera.position.z = THREE.MathUtils.lerp(5, 10, t)
      camera.position.y = THREE.MathUtils.lerp(0, 1, t)
    }
    camera.lookAt(0, 0, 0)
  })

  return null
}

function SceneContent({ scrollProgress }: SceneProps) {
  // Show different elements based on scroll
  const showOrb = scrollProgress < 0.55
  const showPanel = scrollProgress >= 0.3 && scrollProgress < 0.6
  const chaosLevel = scrollProgress >= 0.6
    ? Math.max(0, 1 - (scrollProgress - 0.6) / 0.2) // 1→0 between 0.6–0.8
    : 1

  return (
    <>
      <CinematicCamera scrollProgress={scrollProgress} />
      <ambientLight intensity={0.1} />
      <pointLight color="#3B82F6" intensity={0.5} position={[-5, 3, 3]} />

      <ParticleField count={300} chaos={chaosLevel} />

      {showOrb && <FloatingOrb scroll={scrollProgress} />}

      {showPanel && (
        <group position={[0, 0, 0]}>
          <GlassPanel3D />
        </group>
      )}

      <Environment preset="night" />
    </>
  )
}

interface LandingSceneProps {
  scrollProgress: number
}

export default function LandingScene({ scrollProgress }: LandingSceneProps) {
  return (
    <Canvas
      className="!fixed inset-0"
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={60} />
      <Suspense fallback={null}>
        <SceneContent scrollProgress={scrollProgress} />
      </Suspense>
    </Canvas>
  )
}

'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

interface FloatingOrbProps {
  scroll?: number // 0-1
}

export default function FloatingOrb({ scroll = 0 }: FloatingOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const innerRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()

    // Breathing + float animation
    meshRef.current.position.y = Math.sin(t * 0.5) * 0.3
    meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.1
    meshRef.current.rotation.z = Math.cos(t * 0.2) * 0.1

    // Scale based on scroll
    const scale = 1 + scroll * 0.5
    meshRef.current.scale.setScalar(scale)

    if (innerRef.current) {
      innerRef.current.rotation.y = t * 0.4
      innerRef.current.rotation.x = t * 0.2
    }
  })

  return (
    <group>
      {/* Outer glow sphere */}
      <Sphere ref={meshRef} args={[1.5, 64, 64]}>
        <MeshDistortMaterial
          color="#7C3AED"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0}
          metalness={0.1}
          transparent
          opacity={0.85}
          envMapIntensity={1}
        />
      </Sphere>

      {/* Inner core */}
      <Sphere ref={innerRef} args={[0.8, 32, 32]}>
        <meshStandardMaterial
          color="#A78BFA"
          transparent
          opacity={0.5}
          roughness={0}
          metalness={0.8}
        />
      </Sphere>

      {/* Ambient point lights */}
      <pointLight color="#7C3AED" intensity={2} distance={8} />
      <pointLight color="#3B82F6" intensity={1} distance={5} position={[2, 0, 0]} />
    </group>
  )
}

'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'

export default function GlassPanel3D() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.15
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.2
  })

  return (
    <group ref={groupRef}>
      {/* Glass panel */}
      <RoundedBox args={[4, 2.5, 0.1]} radius={0.1} smoothness={4}>
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.05}
          roughness={0}
          metalness={0.1}
          envMapIntensity={1}
        />
      </RoundedBox>

      {/* Border glow */}
      <RoundedBox args={[4.05, 2.55, 0.08]} radius={0.1} smoothness={4}>
        <meshStandardMaterial
          color="#7C3AED"
          transparent
          opacity={0.15}
          roughness={0}
          wireframe={false}
          emissive="#7C3AED"
          emissiveIntensity={0.3}
        />
      </RoundedBox>

      {/* Text content */}
      <Text
        position={[0, 0.5, 0.1]}
        fontSize={0.25}
        color="#A78BFA"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvalIhTp2m.woff2"
      >
        عادةً تضيع وقتك الآن...
      </Text>

      <Text
        position={[0, 0, 0.1]}
        fontSize={0.22}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvalIhTp2m.woff2"
      >
        نبدأ 3 دقائق؟
      </Text>

      {/* Buttons */}
      <group position={[0, -0.6, 0.1]}>
        {/* Start button */}
        <RoundedBox args={[1.2, 0.4, 0.05]} radius={0.08} position={[0.8, 0, 0]}>
          <meshStandardMaterial
            color="#7C3AED"
            emissive="#7C3AED"
            emissiveIntensity={0.5}
          />
        </RoundedBox>
        <Text position={[0.8, 0, 0.08]} fontSize={0.18} color="#ffffff" anchorX="center">
          ابدأ
        </Text>

        {/* Later button */}
        <RoundedBox args={[1.2, 0.4, 0.05]} radius={0.08} position={[-0.8, 0, 0]}>
          <meshStandardMaterial
            color="#1E1B4B"
            transparent
            opacity={0.8}
          />
        </RoundedBox>
        <Text position={[-0.8, 0, 0.08]} fontSize={0.18} color="#94A3B8" anchorX="center">
          لاحقاً
        </Text>
      </group>

      <pointLight color="#7C3AED" intensity={1} distance={5} position={[0, 0, 1]} />
    </group>
  )
}

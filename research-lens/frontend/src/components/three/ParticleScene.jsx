import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function ParticleCloud({ dense = true, subtle = false, velocityFactor = 0 }) {
  const ref = useRef()
  const groupRef = useRef()
  const count = dense ? 2400 : 900

  const positions = useMemo(() => {
    const p = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3
      p[i3] = (Math.random() - 0.5) * 18
      p[i3 + 1] = (Math.random() - 0.5) * 12
      p[i3 + 2] = (Math.random() - 0.5) * 12
    }
    return p
  }, [count])

  useFrame((state, delta) => {
    if (!groupRef.current || !ref.current) return
    const t = state.clock.elapsedTime
    const velocityBoost = 1 + Math.min(Math.abs(velocityFactor) / 2800, 0.85)
    groupRef.current.rotation.y += delta * (subtle ? 0.01 : 0.02) * velocityBoost
    groupRef.current.rotation.x = Math.sin(t * 0.15) * 0.08

    const mx = state.mouse.x * 0.6
    const my = state.mouse.y * 0.4
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, mx, 0.03)
    // Scroll velocity adds subtle upward/downward drift intensity.
    const velocityDrift = THREE.MathUtils.clamp(velocityFactor / 2600, -0.65, 0.65)
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, my - velocityDrift, 0.03)

    const a = ref.current.material
    a.opacity = subtle ? 0.2 : 0.45
  })

  return (
    <group ref={groupRef}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled>
        <PointMaterial
          transparent
          color={subtle ? '#8b5cf6' : '#ffffff'}
          size={subtle ? 0.02 : 0.028}
          sizeAttenuation
          depthWrite={false}
        />
      </Points>
    </group>
  )
}

function Orb({ color, position, subtle = false, velocityFactor = 0 }) {
  const ref = useRef()
  useFrame((state, delta) => {
    if (!ref.current) return
    const velocityBoost = 1 + Math.min(Math.abs(velocityFactor) / 3200, 0.6)
    ref.current.rotation.y += delta * 0.2 * velocityBoost
    ref.current.rotation.x += delta * 0.1 * velocityBoost
    const t = state.clock.elapsedTime
    const s = subtle ? 1 + Math.sin(t * 0.7) * 0.03 : 1 + Math.sin(t) * 0.06
    ref.current.scale.setScalar(s)
  })

  return (
    <mesh ref={ref} position={position}>
      <icosahedronGeometry args={[subtle ? 0.9 : 1.4, 1]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={subtle ? 0.2 : 0.5} roughness={0.25} metalness={0.15} transparent opacity={subtle ? 0.25 : 0.45} />
    </mesh>
  )
}

export default function ParticleScene({ subtle = false, scrollVelocity = 0 }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 58 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 2, 4]} intensity={0.5} />
      <ParticleCloud dense={!subtle} subtle={subtle} velocityFactor={scrollVelocity} />
      <Orb subtle={subtle} color="#7c3aed" position={[-2.4, 0.9, -1.5]} velocityFactor={scrollVelocity} />
      <Orb subtle={subtle} color="#10b981" position={[2.2, -0.8, -1.2]} velocityFactor={scrollVelocity} />
    </Canvas>
  )
}

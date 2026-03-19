import React, { useEffect, useState } from 'react'
import { motion, useSpring } from 'framer-motion'

export default function CustomCursor() {
  const [visible, setVisible] = useState(false)
  const [variant, setVariant] = useState('default')

  const x = useSpring(0, { stiffness: 450, damping: 40, mass: 0.4 })
  const y = useSpring(0, { stiffness: 450, damping: 40, mass: 0.4 })
  const ringX = useSpring(0, { stiffness: 220, damping: 30, mass: 0.8 })
  const ringY = useSpring(0, { stiffness: 220, damping: 30, mass: 0.8 })

  useEffect(() => {
    const onMove = (e) => {
      setVisible(true)
      x.set(e.clientX - 3)
      y.set(e.clientY - 3)
      ringX.set(e.clientX - 18)
      ringY.set(e.clientY - 18)
    }

    const onOver = (e) => {
      const el = e.target
      if (!el || !el.closest) return
      if (el.closest('button, a, [role="button"]')) {
        setVariant('button')
      } else if (el.closest('.tilt-card, .gap-card')) {
        setVariant('card')
      } else {
        setVariant('default')
      }
    }

    const onLeave = () => setVisible(false)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    window.addEventListener('mouseout', onOver)
    document.addEventListener('mouseleave', onLeave)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mouseout', onOver)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [ringX, ringY, x, y])

  return (
    <>
      <motion.div
        className="custom-cursor-dot"
        style={{ x, y, opacity: visible ? 1 : 0 }}
      />
      <motion.div
        className={`custom-cursor-ring ${variant}`}
        style={{ x: ringX, y: ringY, opacity: visible ? 1 : 0 }}
      />
    </>
  )
}

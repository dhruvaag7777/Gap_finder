import React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function ScrollNavbar({ show, onHistory, onNew }) {
  const { scrollYProgress } = useScroll()
  const width = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: show ? 0 : -40, opacity: show ? 1 : 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      aria-hidden={!show}
    >
      <div className="mx-4 mt-3 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="h-0.5 bg-white/5 overflow-hidden rounded-t-2xl">
          <motion.div className="h-full bg-primary" style={{ width }} />
        </div>
        <div className="px-5 py-3 flex items-center justify-between">
          <h1 className="text-white/90 font-bold tracking-tight">ResearchLens</h1>
          <div className="flex items-center gap-5 text-sm text-[#9ca3af]">
            {onHistory && (
              <button onClick={onHistory} className="hover:text-white transition-colors">History</button>
            )}
            {onNew && (
              <button onClick={onNew} className="hover:text-white transition-colors">New Analysis</button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}

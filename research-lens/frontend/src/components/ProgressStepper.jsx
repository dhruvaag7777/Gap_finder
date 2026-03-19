import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Typewriter from './Typewriter'

const STEPS = [
  { id: 1, label: 'Mapping research landscape', icon: 'MAP' },
  { id: 2, label: 'Detecting saturated areas', icon: 'SAT' },
  { id: 3, label: 'Identifying research gaps', icon: 'GAP' },
  { id: 4, label: 'Ranking gaps by impact', icon: 'RANK' },
  { id: 5, label: 'Generating research proposal', icon: 'DOC' },
]

function Indicator({ state, icon }) {
  if (state === 'complete') {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  if (state === 'active') {
    return (
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )
  }
  return <span className="text-[10px] tracking-wider font-semibold">{icon}</span>
}

export default function ProgressStepper({ currentStep, liveLabel }) {
  const reduceMotion = useReducedMotion()
  const isTerminal = currentStep === 'complete' || currentStep === 'error'
  const n = typeof currentStep === 'number' ? currentStep : 0

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="space-y-3">
        {STEPS.map((step, idx) => {
          const state = isTerminal || step.id < n ? 'complete' : step.id === n ? 'active' : 'waiting'

          return (
            <motion.div
              key={step.id}
              initial={reduceMotion ? false : { x: 80, opacity: 0 }}
              animate={reduceMotion ? {} : { x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.08, type: 'spring', stiffness: 140, damping: 16 }}
              className={`step-card relative rounded-2xl border p-4 md:p-5 flex items-center gap-4 overflow-hidden transition-all duration-300 ${
                state === 'active'
                  ? 'bg-[#121018] border-primary shadow-[0_14px_40px_rgba(124,58,237,0.35)]'
                  : state === 'complete'
                    ? 'bg-[#0f1613] border-emerald/40'
                    : 'bg-[#101010] border-[#2a2a2a]'
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="relative">
                {state === 'active' && (
                  <span className="absolute -inset-2 rounded-xl pulse-outline" />
                )}
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                  state === 'active' ? 'border-primary text-primary bg-primary/10' : state === 'complete' ? 'border-emerald text-emerald bg-emerald/15' : 'border-[#2a2a2a] text-[#6b7280] bg-[#151515]'
                }`}>
                  <Indicator state={state} icon={step.icon} />
                </div>
              </div>

              <div className="flex-1">
                <p className={`font-semibold ${state === 'active' ? 'text-white' : state === 'complete' ? 'text-[#b8d8ca]' : 'text-[#71717a]'}`}>
                  {step.label}
                </p>
                {state === 'active' && (
                  <p className="mt-1 text-sm text-[#bbb6d8]">
                    <Typewriter text={liveLabel || 'Executing autonomous sequence...'} />
                  </p>
                )}
              </div>

              <AnimatePresence>
                {state === 'complete' && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.2, rotateY: -120 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-emerald text-xs uppercase tracking-wider font-bold"
                  >
                    complete
                  </motion.span>
                )}
              </AnimatePresence>

              {idx < STEPS.length - 1 && (
                <div className="absolute left-10 -bottom-3 h-3 w-[2px] overflow-hidden">
                  <div className="absolute inset-0 bg-[#1f1f1f]" />
                  <motion.div
                    className="absolute left-0 top-0 w-full bg-gradient-to-b from-primary to-emerald"
                    initial={{ height: 0 }}
                    animate={{ height: state === 'complete' ? '100%' : 0 }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

import React from 'react'
import { motion } from 'framer-motion'
import { useCountUp } from '../hooks/useCountUp'

function ScoreBadge({ label, score, tooltip }) {
  const n = useCountUp(Number(score) || 0, 900)
  let color = 'bg-emerald/20 text-emerald border-emerald/40'
  if (n < 40) color = 'bg-danger/20 text-danger border-danger/40'
  else if (n < 70) color = 'bg-amber/20 text-amber border-amber/40'

  return (
    <span className={`relative px-3 py-1.5 rounded-lg text-xs font-medium border ${color} cursor-help`} title={tooltip}>
      {label}: {n}
    </span>
  )
}

function CircularScore({ score }) {
  const displayScore = useCountUp(Number(score) || 0, 900)
  const pct = Math.min(100, Math.max(0, displayScore))
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const strokeDash = (pct / 100) * circumference

  let strokeColor = '#10b981'
  if (pct < 40) strokeColor = '#ef4444'
  else if (pct < 70) strokeColor = '#f59e0b'

  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={radius} fill="none" stroke="#1a1a1a" strokeWidth="4" />
        <circle cx="26" cy="26" r={radius} fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - strokeDash} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{displayScore}</span>
    </div>
  )
}

export default function GapsPanel({ gaps, onGenerateProposal, generatingGapId }) {
  if (!gaps?.length) return null

  const tooltips = {
    Novelty: 'How unexplored this research area is (0-100)',
    Feasibility: 'How realistic it is to study this gap (0-100)',
    Impact: 'How important it would be if solved (0-100)',
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white tracking-tight">
        Research Gaps Discovered <span className="ml-2 text-[#6b7280] font-normal">({gaps.length})</span>
      </h2>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {gaps.map((gap, idx) => (
          <motion.div
            key={gap.id ?? idx}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -90 : 90 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className={`gap-card tilt-card bg-[#141414] border rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/40 ${idx === 0 ? 'border-primary shadow-glow-primary top-pick-shimmer' : 'border-[#2a2a2a] hover:border-[#3a3a3a]'}`}
          >
            {idx === 0 && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs font-semibold text-amber-400">Top Pick</span>
              </div>
            )}

            <div className="flex justify-between items-start gap-4 mb-4">
              <h3 className="text-lg font-bold text-white pr-20 leading-snug">{gap.title}</h3>
              <CircularScore score={gap.overall_score} />
            </div>

            <p className="text-[#9ca3af] text-sm leading-relaxed mb-4">{gap.description}</p>
            <div className="flex flex-wrap gap-2 mb-5">
              <ScoreBadge label="Novelty" score={gap.novelty_score} tooltip={tooltips.Novelty} />
              <ScoreBadge label="Feasibility" score={gap.feasibility_score} tooltip={tooltips.Feasibility} />
              <ScoreBadge label="Impact" score={gap.impact_score} tooltip={tooltips.Impact} />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onGenerateProposal(gap)}
              disabled={!gap.id || generatingGapId === gap.id}
              className="relative w-full py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shader-ripple"
            >
              <span className="relative z-10">
                {generatingGapId === gap.id ? 'Generating...' : 'Generate Proposal'}
              </span>
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

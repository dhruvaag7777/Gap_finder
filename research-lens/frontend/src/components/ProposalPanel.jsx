import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const SECTION_ACCENTS = {
  abstract: '#7c3aed',
  objectives: '#10b981',
  methodology: '#f59e0b',
  outcomes: '#7c3aed',
  limitations: '#6b7280',
}

export default function ProposalPanel({ proposal, gap, loading }) {
  const printRef = useRef(null)
  const [copied, setCopied] = React.useState(false)
  const accentRefs = useRef([])

  React.useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      accentRefs.current.forEach((bar) => {
        if (!bar) return
        gsap.fromTo(
          bar,
          { scaleY: 0, transformOrigin: 'top center' },
          {
            scaleY: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: bar.closest('section'),
              start: 'top 85%',
              once: true,
            },
          },
        )
      })
    }, printRef)
    return () => ctx.revert()
  }, [proposal])

  const handleExportPDF = () => {
    if (!printRef.current) return
    const content = printRef.current.querySelector('[data-print-content]')
    const html = content ? content.innerHTML : printRef.current.innerHTML
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Research Proposal</title></head><body>${html}</body></html>`)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 300)
  }

  const handleCopy = () => {
    if (!proposal) return
    const text = `${proposal.title || ''}\n\nABSTRACT\n${proposal.abstract || ''}\n\nRESEARCH OBJECTIVES\n${(proposal.objectives || []).map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nMETHODOLOGY\n${proposal.methodology || ''}\n\nEXPECTED OUTCOMES\n${proposal.expected_outcomes || ''}\n\nLIMITATIONS\n${proposal.limitations || ''}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8">
        <div className="space-y-6">
          <div className="h-8 w-3/4 rounded-lg shimmer" />
          <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-4 rounded shimmer" style={{ width: `${100 - i * 10}%` }} />)}</div>
          <div className="h-24 rounded-lg shimmer" />
        </div>
      </div>
    )
  }

  if (!proposal) return null
  const objectives = Array.isArray(proposal.objectives) ? proposal.objectives : []

  return (
    <motion.div ref={printRef} className="bg-[#151515]/95 border border-[#2a2a2a] rounded-2xl overflow-hidden" initial={{ opacity: 0, y: 70 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 90, damping: 15 }}>
      <div className="p-8">
        <div className="flex flex-wrap gap-3 mb-8 no-print">
          <motion.button whileHover={{ y: -2 }} whileTap={{ y: 2 }} onClick={handleExportPDF} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover hover:shadow-glow-primary transition-all duration-200 shader-ripple">
            Export as PDF
          </motion.button>
          <button onClick={handleCopy} className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#2a2a2a] font-semibold transition-all duration-200 shader-ripple ${copied ? 'border-emerald bg-emerald/10 text-emerald' : 'text-[#e5e7eb] hover:border-primary/50 hover:text-primary'}`}>
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>

        <div data-print-content>
          <h1 className="text-2xl font-extrabold text-white mb-4 tracking-tight">{proposal.title}</h1>
          {gap && <p className="text-sm text-[#6b7280] mb-6">Generated for gap: {gap.title}</p>}

          {[
            { key: 'abstract', title: 'Abstract', content: proposal.abstract, isPara: true },
            { key: 'objectives', title: 'Research Objectives', content: objectives, isPara: false },
            { key: 'methodology', title: 'Methodology', content: proposal.methodology, isPara: true },
            { key: 'outcomes', title: 'Expected Outcomes', content: proposal.expected_outcomes, isPara: true },
            { key: 'limitations', title: 'Limitations', content: proposal.limitations, isPara: true },
          ].map(({ key, title, content, isPara }, idx) => (
            <motion.section key={key} className="mb-8 relative pl-5" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.08 }}>
              <span
                ref={(el) => { accentRefs.current[idx] = el }}
                className="absolute left-0 top-0 h-full w-1 rounded-full"
                style={{ backgroundColor: SECTION_ACCENTS[key] || '#6b7280' }}
              />
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: SECTION_ACCENTS[key] || '#6b7280' }}>{title}</h2>
              {isPara ? (
                <p className="text-[#e5e7eb] leading-relaxed">{content}</p>
              ) : (
                <ol className="space-y-3">
                  {(content || []).map((obj, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: SECTION_ACCENTS[key] || '#6b7280' }}>{i + 1}</span>
                      <span className="text-[#e5e7eb] leading-relaxed pt-0.5">{obj}</span>
                    </li>
                  ))}
                </ol>
              )}
            </motion.section>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { startAnalysis, getAnalysis, generateProposal } from '../services/api'
import ProgressStepper from './ProgressStepper'
import Typewriter from './Typewriter'
import LandscapeCard from './LandscapeCard'
import GapsPanel from './GapsPanel'
import ProposalPanel from './ProposalPanel'
import ScrollNavbar from './ui/ScrollNavbar'
import ParticleScene from './three/ParticleScene'

gsap.registerPlugin(ScrollTrigger)

export default function AnalysisView({ userId, topic, analysisIdFromHistory, onBack, onOpenHistory }) {
  const [phase, setPhase] = useState(analysisIdFromHistory ? 'loading' : 'streaming')
  const [currentStep, setCurrentStep] = useState(0)
  const [liveLabel, setLiveLabel] = useState('')
  const [analysisId, setAnalysisId] = useState(null)
  const [landscape, setLandscape] = useState(null)
  const [sources, setSources] = useState([])
  const [gaps, setGaps] = useState([])
  const [proposal, setProposal] = useState(null)
  const [proposalGap, setProposalGap] = useState(null)
  const [generatingGapId, setGeneratingGapId] = useState(null)
  const [error, setError] = useState(null)
  const [showNavbar, setShowNavbar] = useState(false)
  const [scrollVelocity, setScrollVelocity] = useState(0)

  const reduceMotion = useReducedMotion()
  const sectionsRef = useRef([])

  const runPipeline = useCallback(async () => {
    setPhase('streaming')
    setCurrentStep(0)
    setLiveLabel('')
    setError(null)

    try {
      const response = await startAnalysis(userId, topic)
      if (!response.ok) throw new Error('Analysis failed to start')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          try {
            const raw = line.replace(/^data:\s*/, '').trim()
            if (!raw) continue
            const event = JSON.parse(raw)

            setCurrentStep(event.step)
            setLiveLabel(event.label || '')

            if (event.data) {
              if (event.data.landscape) setLandscape(event.data.landscape)
              if (event.data.sources) setSources(event.data.sources)
              if (event.data.gaps) setGaps(event.data.gaps)
              if (event.data.ranked_gaps) setGaps(event.data.ranked_gaps)
              if (event.data.proposal) {
                setProposal(event.data.proposal)
                const ranked = event.data.ranked_gaps || gaps
                if (ranked?.length) setProposalGap(ranked[0])
              }
              if (event.data.analysis_id) setAnalysisId(event.data.analysis_id)
              if (event.data.error) {
                setError(event.data.error)
                setPhase('error')
              }
            }

            if (event.step === 'complete' && event.data?.analysis_id) {
              setAnalysisId(event.data.analysis_id)
              getAnalysis(event.data.analysis_id)
                .then((data) => {
                  setGaps(data.gaps || [])
                  if (data.proposals?.[0]) {
                    setProposal(data.proposals[0])
                    setProposalGap(data.gaps?.[0] || null)
                  }
                  if (data.landscape) {
                    setLandscape(data.landscape)
                    setSources(data.landscape.sources || [])
                  }
                  setPhase('complete')
                })
                .catch(() => setPhase('complete'))
            }
            if (event.step === 'error') setPhase('error')
          } catch (_) {}
        }
      }
    } catch (err) {
      setError(err.message || 'Analysis failed')
      setPhase('error')
    }
  }, [userId, topic, gaps])

  useEffect(() => {
    if (analysisIdFromHistory) {
      getAnalysis(analysisIdFromHistory)
        .then((data) => {
          setAnalysisId(data.analysis_id)
          setLandscape(data.landscape)
          setSources(data.landscape?.sources || [])
          setGaps(data.gaps || [])
          setProposal(data.proposals?.[0] || null)
          setProposalGap(data.gaps?.[0] || null)
          setPhase('complete')
        })
        .catch((err) => {
          setError(err.message)
          setPhase('error')
        })
      return
    }
    runPipeline()
  }, [analysisIdFromHistory, runPipeline])

  useEffect(() => {
    let lastY = window.scrollY
    let lastT = performance.now()
    let rafId

    const onScroll = () => {
      setShowNavbar(window.scrollY > 100)
      const now = performance.now()
      const y = window.scrollY
      const dt = Math.max(now - lastT, 1)
      const velocity = ((y - lastY) / dt) * 1000
      setScrollVelocity(velocity)
      lastY = y
      lastT = now
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => setScrollVelocity(0))
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'complete' || reduceMotion) return undefined

    const ctx = gsap.context(() => {
      sectionsRef.current.forEach((el, idx) => {
        if (!el) return
        gsap.fromTo(
          el,
          { opacity: 0, y: 40, rotateX: -15, filter: 'blur(20px)' },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            filter: 'blur(0px)',
            duration: 0.9,
            ease: 'power3.out',
            delay: idx * 0.08,
            scrollTrigger: {
              trigger: el,
              start: 'top 82%',
              once: true,
            },
          },
        )
      })
    })

    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [phase, reduceMotion])

  const handleGenerateProposal = async (gap) => {
    if (!analysisId) return
    const gapId = gap.id
    if (!gapId) return
    setGeneratingGapId(gapId)
    try {
      const res = await generateProposal(analysisId, gapId)
      setProposal(res)
      setProposalGap(gap)
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingGapId(null)
    }
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-dvh min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 rounded-xl border-2 border-primary border-t-transparent animate-spin" />
        <div className="mt-6 h-4 w-48 rounded shimmer" />
        <p className="text-[#6b7280] mt-4 text-sm">Loading analysis...</p>
      </div>
    )
  }

  if (phase === 'streaming' || (phase === 'complete' && !landscape)) {
    return (
      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.82 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="min-h-dvh min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none opacity-40" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent 40%)' }} />
        <div className="absolute inset-0 mission-grid" aria-hidden="true" />

        <div className="w-full max-w-3xl relative z-10">
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight text-center">Mission Sequence Active</h2>
          <p className="text-[#9ca3af] mb-10 text-lg text-center">{topic}</p>

          <ProgressStepper currentStep={currentStep} liveLabel={liveLabel} />

          <div className="mt-10 p-6 bg-[#101010]/80 rounded-2xl border border-[#2a2a2a] backdrop-blur-sm">
            <p className="text-base text-[#c5c5d4] min-h-[2rem] text-center tracking-wide">
              {liveLabel ? <Typewriter text={liveLabel} /> : '\u00A0'}
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-dvh min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md p-8 rounded-2xl border-2 border-danger/50 bg-danger/5 animate-shake">
          <p className="text-danger mb-6 font-medium">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover hover:shadow-glow-primary transition-all duration-200 btn-press"
          >
            Back to Start
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh min-h-screen bg-[#080808] text-white relative overflow-hidden">
      <div className="absolute inset-0 -z-0 opacity-60 pointer-events-none">
        <ParticleScene subtle scrollVelocity={scrollVelocity} />
      </div>

      <ScrollNavbar show={showNavbar} onHistory={onOpenHistory} onNew={onBack} />

      <main className="relative z-10 max-w-[1400px] mx-auto px-6 py-14 space-y-14">
        <section ref={(el) => { sectionsRef.current[0] = el }} className="opacity-0 [transform-style:preserve-3d]">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">{topic}</h2>
          <p className="text-[#6b7280] text-sm font-medium uppercase tracking-wider">Analysis complete</p>
        </section>

        <section ref={(el) => { sectionsRef.current[1] = el }} className="opacity-0 [transform-style:preserve-3d]">
          <LandscapeCard landscape={landscape} sources={sources} />
        </section>

        <section ref={(el) => { sectionsRef.current[2] = el }} className="opacity-0 [transform-style:preserve-3d]">
          <GapsPanel
            gaps={gaps}
            onGenerateProposal={handleGenerateProposal}
            generatingGapId={generatingGapId}
          />
        </section>

        <section ref={(el) => { sectionsRef.current[3] = el }} className="opacity-0 [transform-style:preserve-3d]">
          <h2 className="text-xl font-bold text-white mb-4 tracking-tight">Research Proposal</h2>
          <ProposalPanel proposal={proposal} gap={proposalGap} loading={generatingGapId !== null} />
        </section>
      </main>
    </div>
  )
}

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { createUser, getHistory } from './services/api'
import AnalysisView from './components/AnalysisView'
import HistoryPanel from './components/HistoryPanel'
import ParticleScene from './components/three/ParticleScene'
import CustomCursor from './components/ui/CustomCursor'
import { useLenisScroll } from './hooks/useLenisScroll'

const USER_KEY = 'research_lens_user_id'

const title = 'ResearchLens'.split('')
const features = ['AI-Powered', 'Real-time Analysis', 'Research Proposals']

function wordChunks(text) {
  return text.split(' ').map((word, i) => (
    <motion.span
      key={`${word}-${i}`}
      className="inline-block mr-2"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 + i * 0.05, duration: 0.45, ease: 'easeOut' }}
    >
      {word}
    </motion.span>
  ))
}

export default function App() {
  const [view, setView] = useState('landing')
  const [userId, setUserId] = useState(() => localStorage.getItem(USER_KEY))
  const [userName, setUserName] = useState('')
  const [topic, setTopic] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [analysisIdFromHistory, setAnalysisIdFromHistory] = useState(null)
  const [launching, setLaunching] = useState(false)
  const [burstAt, setBurstAt] = useState(null)
  const [scrollVelocity, setScrollVelocity] = useState(0)

  const reduceMotion = useReducedMotion()
  useLenisScroll(!reduceMotion)

  React.useEffect(() => {
    let lastY = window.scrollY
    let lastT = performance.now()
    let rafId

    const onScroll = () => {
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

  const loadHistory = useCallback(async () => {
    if (!userId) return
    setHistoryLoading(true)
    try {
      const data = await getHistory(userId)
      setHistory(data)
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [userId])

  const openHistory = () => {
    setHistoryOpen(true)
    loadHistory()
  }

  const handleSelectAnalysis = async (analysisId) => {
    setHistoryOpen(false)
    setView('analysis')
    setTopic('')
    setAnalysisIdFromHistory(analysisId)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = userName.trim()
    const t = topic.trim()
    if (!t || launching) return

    try {
      setLaunching(true)
      setBurstAt(Date.now())
      await new Promise((r) => setTimeout(r, reduceMotion ? 50 : 420))

      let uid = userId
      if (!uid || !name) {
        const res = await createUser(name || 'Researcher')
        uid = res.user_id
        setUserId(uid)
        localStorage.setItem(USER_KEY, uid)
        setUserName(res.name)
      }
      setTopic(t)
      setAnalysisIdFromHistory(null)
      setView('analysis')
    } catch (err) {
      console.error(err)
      setLaunching(false)
    }
  }

  const burstParticles = useMemo(() => Array.from({ length: 14 }, (_, i) => i), [])

  return (
    <div className="min-h-screen bg-[#070707] text-white overflow-x-hidden">
      <CustomCursor />

      <HistoryPanel
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onSelectAnalysis={handleSelectAnalysis}
        loading={historyLoading}
      />

      <AnimatePresence mode="wait">
        {view === 'analysis' ? (
          <motion.div
            key="analysis"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: 'blur(12px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <AnalysisView
              userId={userId}
              topic={topic}
              analysisIdFromHistory={analysisIdFromHistory}
              onBack={() => {
                setLaunching(false)
                setView('landing')
              }}
              onOpenHistory={openHistory}
            />
          </motion.div>
        ) : (
          <motion.section
            key="landing"
            className="relative min-h-dvh min-h-screen flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={launching ? { opacity: 0, scale: 1.08, filter: 'blur(14px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <ParticleScene subtle={false} scrollVelocity={scrollVelocity} />
            </div>

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(124,58,237,0.16),transparent_44%),radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.12),transparent_42%)] pointer-events-none" />

            {userId && (
              <button
                onClick={openHistory}
                className="absolute top-6 left-6 z-20 text-sm text-[#9ca3af] hover:text-white transition-colors"
                aria-label="View analysis history"
              >
                View History
              </button>
            )}

            <div className="w-full max-w-3xl relative z-10 text-center perspective-1000">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-5 hero-title-gradient">
                {title.map((letter, i) => (
                  <motion.span
                    key={`${letter}-${i}`}
                    className="inline-block"
                    initial={{ y: -70, opacity: 0, rotateX: -70 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.04 * i }}
                  >
                    {letter === ' ' ? '\u00A0' : letter}
                  </motion.span>
                ))}
              </h1>

              <motion.p className="text-[#a3a3b0] text-lg md:text-xl leading-relaxed mb-12">
                {wordChunks('Discover unexplored research gaps with cinematic AI intelligence.')}
              </motion.p>

              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 30, rotateX: 10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.9, duration: 0.65, type: 'spring' }}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="holo-wrap">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="holo-input"
                      aria-label="Your name"
                    />
                  </div>
                  <div className="holo-wrap">
                    <input
                      type="text"
                      placeholder="Research Topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      required
                      className="holo-input"
                      aria-label="Research topic"
                    />
                  </div>
                </div>

                <div className="relative inline-block">
                  <motion.button
                    type="submit"
                    whileHover={reduceMotion ? {} : { y: -5, scale: 1.01 }}
                    whileTap={reduceMotion ? {} : { y: 2, scale: 0.99 }}
                    className="discover-btn btn-press shader-ripple"
                    disabled={launching}
                  >
                    {launching ? 'Launching?' : 'Discover Gaps'}
                  </motion.button>

                  {!!burstAt && !reduceMotion && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      {burstParticles.map((p) => (
                        <span key={p} className="burst-dot" style={{ '--i': p }} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.form>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.15, duration: 0.45 }}
                className="flex flex-wrap justify-center gap-2 mt-8"
              >
                {features.map((f) => (
                  <span key={f} className="feature-pill">{f}</span>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: launching ? 0 : 1 }}
                className="absolute -bottom-16 left-1/2 -translate-x-1/2"
              >
                <div className="scroll-indicator">
                  <span className="scroll-arrow" />
                </div>
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

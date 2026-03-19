import React, { useState, useEffect } from 'react'

export default function Typewriter({ text, className = '' }) {
  const [display, setDisplay] = useState('')
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    setDisplay('')
    setIdx(0)
  }, [text])

  useEffect(() => {
    if (!text || idx >= text.length) return
    const timer = setTimeout(() => {
      setDisplay(text.slice(0, idx + 1))
      setIdx(idx + 1)
    }, 30)
    return () => clearTimeout(timer)
  }, [text, idx])

  return <span className={className}>{display}{idx < text.length && <span className="animate-pulse">|</span>}</span>
}

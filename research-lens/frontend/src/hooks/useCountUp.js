import { useState, useEffect, useRef } from 'react'

export function useCountUp(end, duration = 800, startOnMount = true) {
  const [value, setValue] = useState(0)
  const mounted = useRef(false)

  useEffect(() => {
    if (!startOnMount || !mounted.current) {
      mounted.current = true
    }
    const start = 0
    const startTime = performance.now()

    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 2)
      setValue(Math.round(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [end, duration, startOnMount])

  return value
}

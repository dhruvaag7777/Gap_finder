import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'

export function useLenisScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined

    const lenis = new Lenis({
      smoothWheel: true,
      duration: 1.15,
      wheelMultiplier: 1,
      touchMultiplier: 1.25,
      infinite: false,
    })

    const raf = (time) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [enabled])
}

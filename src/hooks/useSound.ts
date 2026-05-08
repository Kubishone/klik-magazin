import { useState, useRef, useEffect } from 'react'

export function useSound() {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('klik-sound') !== 'off' } catch { return true }
  })

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio('/sounds/page-flip.mp3')
    audio.preload = 'auto'
    audioRef.current = audio
    return () => { audioRef.current = null }
  }, [])

  function toggle() {
    setEnabled((prev) => {
      const next = !prev
      try { localStorage.setItem('klik-sound', next ? 'on' : 'off') } catch {}
      return next
    })
  }

  function play() {
    if (!enabled || !audioRef.current) return
    try {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    } catch {}
  }

  return { enabled, toggle, play }
}

import { useState, useEffect } from 'react'
import '../styles/globals.css'
import SurahTracker from '../components/SurahTracker'

export default function App({ Component, pageProps }) {
  const [theme, setTheme] = useState('arabian')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('tarteel_theme') || 'arabian'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)

    // Daily streak
    try {
      const today = new Date().toISOString().slice(0, 10)
      const raw   = localStorage.getItem('tarteel_streak')
      const s     = raw ? JSON.parse(raw) : { count: 0, lastDate: null }
      if (s.lastDate === today) {
        // already recorded today — nothing to do
      } else {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        const count = s.lastDate === yesterday ? s.count + 1 : 1
        localStorage.setItem('tarteel_streak', JSON.stringify({ count, lastDate: today }))
      }
    } catch {}

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => console.log('SW registered', reg.scope))
        .catch(err => console.log('SW failed', err))
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'arabian' ? 'african' : 'arabian'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('tarteel_theme', next)
  }

  if (!mounted) return null

  return (
    <>
      <Component {...pageProps} theme={theme} toggleTheme={toggleTheme} />
      <SurahTracker />
    </>
  )
}
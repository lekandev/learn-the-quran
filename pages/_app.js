import { useState, useEffect } from 'react'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  const [theme, setTheme] = useState('arabian')

  useEffect(() => {
    const saved = localStorage.getItem('tarteel_theme') || 'arabian'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'arabian' ? 'african' : 'arabian'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('tarteel_theme', next)
  }

  return <Component {...pageProps} theme={theme} toggleTheme={toggleTheme} />
}
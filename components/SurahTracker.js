import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../styles/SurahTracker.module.css'

function timeAgo(ts) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Called from surah/[id].js — export so page can import it
export function recordSurahVisit(surah) {
  try {
    const raw  = localStorage.getItem('tarteel_recent')
    const list = raw ? JSON.parse(raw) : []
    // remove duplicate
    const next = [
      { ...surah, ts: Date.now() },
      ...list.filter(s => s.number !== surah.number),
    ].slice(0, 8)
    localStorage.setItem('tarteel_recent', JSON.stringify(next))
  } catch {}
}

export default function SurahTracker() {
  const router           = useRouter()
  const [open, setOpen]  = useState(false)
  const [shown, setShown] = useState(false)
  const [recent, setRecent] = useState([])
  const [streak, setStreak] = useState({ count: 0, active: false, dots: [] })

  // Load data
  const load = () => {
    try {
      const raw  = localStorage.getItem('tarteel_recent')
      setRecent(raw ? JSON.parse(raw) : [])

      const sRaw  = localStorage.getItem('tarteel_streak')
      const s     = sRaw ? JSON.parse(sRaw) : { count: 0, lastDate: null }
      const today = new Date().toISOString().slice(0, 10)
      const active = s.lastDate === today

      // Build 7-day dot history
      const dots = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10)
        // We only track lastDate so approximate: active days = streak count working backwards from today
        // For a proper dot history you'd store an array of dates — for now mark today + streak trail
        const daysAgo = 6 - i
        return daysAgo === 0 ? active : (daysAgo < s.count && s.lastDate === today)
      })

      setStreak({ count: s.count, active, dots })
    } catch {}
  }

  useEffect(() => {
    load()
    // Re-load when route changes (user visited a new surah)
    router.events?.on('routeChangeComplete', load)
    return () => router.events?.off('routeChangeComplete', load)
  }, [])

  // Animate in after mount
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 600)
    return () => clearTimeout(t)
  }, [])

  // Don't render if no history yet
  if (recent.length === 0) return null

  const latest = recent[0]
  const rest   = recent.slice(1, 4)

  return (
    <div className={`${styles.root} ${shown ? styles.rootIn : ''}`}>
      {open ? (
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.panelHead}>
            <span className={styles.panelHeadLabel}>Your progress</span>
            <button className={styles.panelClose} onClick={() => setOpen(false)}>
              <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1l12 12M13 1L1 13"/>
              </svg>
            </button>
          </div>

          {/* Streak row */}
          <div className={styles.streakRow}>
            <span className={`${styles.streakIcon} ${streak.active ? styles.streakIconActive : ''}`}>🔥</span>
            <div className={styles.streakInfo}>
              <div className={styles.streakValue}>
                <span className={styles.streakNum}>{streak.count}</span>
                <span className={styles.streakUnit}>{streak.count === 1 ? 'day' : 'days'}</span>
              </div>
              <div className={styles.streakSub}>
                {streak.active ? 'Active today · keep it up' : 'Open the app daily to build your streak'}
              </div>
            </div>
            <div className={styles.streakDots}>
              {streak.dots.map((on, i) => (
                <div key={i} className={`${styles.dot} ${on ? styles.dotOn : ''}`} />
              ))}
            </div>
          </div>

          {/* Latest surah card */}
          <Link href={`/surah/${latest.number}`} className={styles.featCard}>
            <div className={styles.featStrip} />
            <div className={styles.featBody}>
              <div className={styles.featMeta}>
                <span className={styles.featNum}>#{latest.number}</span>
                {latest.juz && <span className={styles.featJuz}>Juz {latest.juz}</span>}
                <span className={styles.featTime}>{timeAgo(latest.ts)}</span>
              </div>
              <div className={styles.featAr}>{latest.name}</div>
              <div className={styles.featEn}>{latest.englishName}</div>
              <div className={styles.featSub}>{latest.englishNameTranslation}</div>
            </div>
            <div className={styles.featResume}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Resume
            </div>
          </Link>

          {/* Recent list */}
          {rest.length > 0 && (
            <div className={styles.recentList}>
              <div className={styles.recentLabel}>Earlier</div>
              {rest.map(s => (
                <Link href={`/surah/${s.number}`} key={s.number} className={styles.recentRow}>
                  <span className={styles.recentNum}>{s.number}</span>
                  <div className={styles.recentNames}>
                    <span className={styles.recentAr}>{s.name}</span>
                    <span className={styles.recentEn}>{s.englishName}</span>
                  </div>
                  <span className={styles.recentTime}>{timeAgo(s.ts)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button className={styles.trigger} onClick={() => setOpen(true)}>
          <div className={styles.triggerStrip} />
          <div className={`${styles.triggerStreak} ${streak.active ? styles.triggerStreakActive : ''}`}>
            <span className={styles.streakFire}>🔥</span>
            <span className={styles.streakCount}>{streak.count}</span>
          </div>
          <div className={styles.triggerBody}>
            <span className={styles.triggerLabel}>Continue reading</span>
            <span className={styles.triggerName}>{latest.englishName}</span>
          </div>
          <span className={styles.triggerAr}>{latest.name}</span>
          <svg className={styles.triggerChev} viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 4l4 4-4 4"/>
          </svg>
        </button>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import styles from '../styles/RightSidebar.module.css'

export default function RightSidebar({ surahId, surahName, surahEn, isOpen, onClose }) {
  const [ayahs, setAyahs] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!surahId || !isOpen) return
    setLoading(true)
    setAyahs([])
    fetch(`https://api.alquran.cloud/v1/surah/${surahId}/en.transliteration`)
      .then(r => r.json())
      .then(d => { setAyahs(d.data?.ayahs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [surahId, isOpen])

  return (
    <>
      {isOpen && (
        <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} aria-label="Transliteration">
        <div className={styles.frame}>

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitles}>
              <span className={styles.headerMain}>Transliteration</span>
              {surahName && (
                <div className={styles.headerSurah}>
                  <span className={styles.headerAr}>{surahName}</span>
                  <span className={styles.headerEn}>{surahEn}</span>
                </div>
              )}
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className={styles.divider} />

          {/* Content */}
          <div className={styles.content}>
            {loading && (
              <div className={styles.loadWrap}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={styles.sk} style={{ animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
            )}
            {!loading && ayahs.map(ayah => (
              <div key={ayah.number} className={styles.verse}>
                <div className={styles.verseNum}>{ayah.numberInSurah}</div>
                <div className={styles.verseText}>{ayah.text}</div>
              </div>
            ))}
          </div>

          {!loading && ayahs.length > 0 && (
            <div className={styles.footer}>
              <span>Transliteration · alquran.cloud</span>
            </div>
          )}

        </div>
      </aside>
    </>
  )
}
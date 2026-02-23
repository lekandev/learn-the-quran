import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../styles/LeftSidebar.module.css'

export default function LeftSidebar({ isOpen, onClose }) {
  const router = useRouter()
  const [surahs, setSurahs] = useState([])
  const [search, setSearch] = useState('')
  const activeSurahId = router.query.id ? parseInt(router.query.id) : null

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(r => r.json())
      .then(d => setSurahs(d.data))
  }, [])

  const filtered = surahs.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.englishName.toLowerCase().includes(q) ||
      s.name.includes(search) ||
      String(s.number).includes(search)
    )
  })

  return (
    <>
      {isOpen && (
        <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} aria-label="Surah list">
        <div className={styles.frame}>

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <span className={styles.headerAr}>السور</span>
              <span className={styles.headerEn}>Surahs</span>
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className={styles.divider} />

          {/* Search */}
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className={styles.search}
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* List */}
          <div className={styles.list}>
            {filtered.map(s => {
              const isActive = activeSurahId === s.number
              return (
                <Link
                  href={`/surah/${s.number}`}
                  key={s.number}
                  className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                  onClick={() => { if (window.innerWidth < 900) onClose() }}
                >
                  <span className={styles.itemNum}>{s.number}</span>
                  <div className={styles.itemBody}>
                    <span className={styles.itemEn}>{s.englishName}</span>
                    <span className={styles.itemTrans}>{s.englishNameTranslation}</span>
                  </div>
                  <div className={styles.itemRight}>
                    <span className={styles.itemAr}>{s.name}</span>
                    <div className={styles.itemDot} style={{
                      background: s.revelationType === 'Meccan' ? 'var(--brand)' : '#4A7A9B'
                    }} />
                  </div>
                </Link>
              )
            })}
          </div>

        </div>
      </aside>
    </>
  )
}
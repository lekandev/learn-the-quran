import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'

// Octagon SVG badge
function OctBadge({ className }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.2">
      <polygon points="11,2 25,2 34,11 34,25 25,34 11,34 2,25 2,11"/>
    </svg>
  )
}

export default function Home() {
  const [surahs, setSurahs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(r => r.json())
      .then(d => { setSurahs(d.data); setLoading(false) })
  }, [])

  const filtered = surahs.filter(s => {
    const q = search.toLowerCase()
    const matchQ = !q ||
      s.englishName.toLowerCase().includes(q) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      s.name.includes(search) ||
      String(s.number).includes(search)
    const matchF = filter === 'all'
      || (filter === 'meccan' && s.revelationType === 'Meccan')
      || (filter === 'medinan' && s.revelationType === 'Medinan')
    return matchQ && matchF
  })

  return (
    <>
      <Head><title>Tarteel — Learn the Quran</title></Head>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>ت</div>
            <div>
              <div className={styles.brandName}>Tarteel</div>
              <div className={styles.brandSub}>Quran Self Teaching</div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.bismillahTop}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
            <Link href="/session" className={styles.sessionBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Daily Session
            </Link>
          </div>
        </header>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className={styles.search}
              placeholder="Search by name or number…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filters}>
            {[['all','All'],['meccan','Meccan'],['medinan','Medinan']].map(([v,l]) => (
              <button key={v}
                className={`${styles.filterBtn} ${filter===v ? styles.filterActive:''}`}
                onClick={() => setFilter(v)}
              >{l}</button>
            ))}
          </div>
        </div>

        {!loading && <div className={styles.meta}>{filtered.length} surahs</div>}

        {loading ? (
          <div className={styles.skGrid}>
            {Array.from({length:24}).map((_,i) => (
              <div key={i} className={styles.sk} style={{animationDelay:`${i*.03}s`}} />
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((s,i) => (
              <Link href={`/surah/${s.number}`} key={s.number} className={styles.card}
                style={{animationDelay:`${i*.02}s`}}>
                <div className={styles.cardTop}>
                  <div className={styles.numWrap}>
                    <OctBadge className={styles.numOct} />
                    <span className={styles.numText}>{s.number}</span>
                  </div>
                  <div className={styles.revDot} style={{
                    background: s.revelationType === 'Meccan' ? '#9E6B3F' : '#4A7A9B'
                  }} title={s.revelationType} />
                </div>
                <div className={styles.arabicName}>{s.name}</div>
                <div className={styles.cardBot}>
                  <div>
                    <div className={styles.ename}>{s.englishName}</div>
                    <div className={styles.etrans}>{s.englishNameTranslation}</div>
                  </div>
                  <div className={styles.vcount}>
                    <span>{s.numberOfAyahs}</span>
                    <span className={styles.vlabel}>verses</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <footer className={styles.footer}>
          <p>Text · alquran.cloud &nbsp;·&nbsp; Audio · Mishary Rashid Alafasy</p>
        </footer>
      </div>
    </>
  )
}
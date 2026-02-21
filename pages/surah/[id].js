import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../../styles/Surah.module.css'

// Global ayah number → audio URL (Mishary Alafasy 128kbps)
const audioUrl = n => `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${n}.mp3`

export default function SurahPage() {
  const { query } = useRouter()
  const { id } = query

  const [surahAr, setSurahAr]       = useState(null)
  const [surahEn, setSurahEn]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [playingAyah, setPlayingAyah] = useState(null)
  const [loadingAyah, setLoadingAyah] = useState(null)
  const [progress, setProgress]     = useState(0)
  const [showTrans, setShowTrans]   = useState(true)
  const [surahList, setSurahList]   = useState([])
  const audioRef = useRef(null)
  const progressTimer = useRef(null)

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(r => r.json())
      .then(d => setSurahList(d.data))
  }, [])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setSurahAr(null)
    setSurahEn(null)
    stopAudio()

    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`).then(r => r.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${id}/en.sahih`).then(r => r.json()),
    ]).then(([ar, en]) => {
      setSurahAr(ar.data)
      setSurahEn(en.data)
      setLoading(false)
    })
  }, [id])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.onended = null
      audioRef.current.ontimeupdate = null
      audioRef.current.onerror = null
      audioRef.current = null
    }
    clearInterval(progressTimer.current)
    setPlayingAyah(null)
    setLoadingAyah(null)
    setProgress(0)
  }, [])

  const playAyah = useCallback((ayahNumInSurah, globalNum) => {
    // Toggle off if same ayah
    if (playingAyah === ayahNumInSurah) { stopAudio(); return }

    stopAudio()
    setLoadingAyah(ayahNumInSurah)

    const audio = new Audio()
    audioRef.current = audio

    audio.ontimeupdate = () => {
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }

    audio.onended = () => {
      setPlayingAyah(null)
      setLoadingAyah(null)
      setProgress(0)
    }

    audio.onerror = () => {
      setLoadingAyah(null)
      setPlayingAyah(null)
    }

    audio.src = audioUrl(globalNum)

    audio.play()
      .then(() => {
        setLoadingAyah(null)
        setPlayingAyah(ayahNumInSurah)
      })
      .catch(() => {
        setLoadingAyah(null)
        setPlayingAyah(null)
      })
  }, [playingAyah, stopAudio])

  useEffect(() => () => stopAudio(), [stopAudio])

  const surahInfo = surahList.find(s => String(s.number) === String(id))
  const num = parseInt(id)

  return (
    <>
      <Head>
        <title>{surahAr ? `${surahAr.englishName} · Tarteel` : 'Tarteel'}</title>
      </Head>

      <div className={styles.page}>
        {/* ── Sticky nav ── */}
        <nav className={styles.nav}>
          <Link href="/" className={styles.back}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Surahs
          </Link>

          <div className={styles.navMid}>
            {surahAr && <>
              <span className={styles.navAr}>{surahAr.name}</span>
              <span className={styles.navDot}>·</span>
              <span className={styles.navEn}>{surahAr.englishName}</span>
            </>}
          </div>

          <div className={styles.navRight}>
            <button
              className={`${styles.transBtn} ${showTrans ? styles.transBtnOn : ''}`}
              onClick={() => setShowTrans(v => !v)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m5 8 6 6M4 14l6-6 2-2M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>
              </svg>
              Translation
            </button>
            <div className={styles.arrows}>
              {num > 1 && (
                <Link href={`/surah/${num-1}`} className={styles.arrow}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </Link>
              )}
              {num < 114 && (
                <Link href={`/surah/${num+1}`} className={styles.arrow}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* ── Surah header ── */}
        {!loading && surahAr && (
          <header className={styles.surahHead}>
            <div className={styles.headMeta}>
              <span className={styles.headNum}>{surahAr.number}</span>
              {surahInfo && (
                <span className={styles.revTag} data-type={surahInfo.revelationType.toLowerCase()}>
                  {surahInfo.revelationType}
                </span>
              )}
            </div>
            <h1 className={styles.headAr}>{surahAr.name}</h1>
            <div className={styles.headEn}>{surahAr.englishName}</div>
            <div className={styles.headTrans}>{surahAr.englishNameTranslation}</div>
            <div className={styles.headStats}>
              <span>{surahAr.numberOfAyahs} verses</span>
              <span className={styles.hdot}>·</span>
              <span>Juz {surahAr.juz?.[0]?.index ?? '—'}</span>
            </div>
            {surahAr.number !== 1 && surahAr.number !== 9 && (
              <div className={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
            )}
          </header>
        )}

        {/* ── Divider ── */}
        {!loading && (
          <div className={styles.divider}>
            <span>❧</span>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className={styles.skList}>
            {Array.from({length:8}).map((_,i) => (
              <div key={i} className={styles.sk} style={{animationDelay:`${i*0.05}s`}} />
            ))}
          </div>
        )}

        {/* ── Ayah list ── */}
        {!loading && surahAr && surahEn && (
          <div className={styles.list}>
            {surahAr.ayahs.map((ayah, i) => {
              const en = surahEn.ayahs[i]
              const playing = playingAyah === ayah.numberInSurah
              const loading_ = loadingAyah === ayah.numberInSurah

              return (
                <div
                  key={ayah.number}
                  className={`${styles.row} ${playing ? styles.rowPlaying : ''} ${loading_ ? styles.rowLoading : ''}`}
                  style={{animationDelay:`${i*0.018}s`}}
                >
                  {/* Number */}
                  <div className={styles.badge}>
                    <svg className={styles.badgeRing} viewBox="0 0 40 40">
                      <polygon points="20,2 37,11 37,29 20,38 3,29 3,11" fill="none" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                    <span className={styles.badgeN}>{ayah.numberInSurah}</span>
                  </div>

                  {/* Text */}
                  <div className={styles.textArea}>
                    <div
                      className={styles.arText}
                      onClick={() => playAyah(ayah.numberInSurah, ayah.number)}
                      title="Click to play"
                    >
                      {ayah.text}
                    </div>
                    {showTrans && en && (
                      <div className={styles.enText}>{en.text}</div>
                    )}
                  </div>

                  {/* Play button */}
                  <button
                    className={`${styles.playBtn} ${playing ? styles.playOn : ''}`}
                    onClick={() => playAyah(ayah.numberInSurah, ayah.number)}
                    aria-label={playing ? 'Pause' : `Play verse ${ayah.numberInSurah}`}
                  >
                    {loading_ ? (
                      <span className={styles.spin} />
                    ) : playing ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                        <rect x="6" y="4" width="4" height="16" rx="1.5"/>
                        <rect x="14" y="4" width="4" height="16" rx="1.5"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                    {playing && (
                      <svg className={styles.ring} viewBox="0 0 38 38">
                        <circle cx="19" cy="19" r="17" fill="none" stroke="var(--amber-soft)" strokeWidth="2.5"/>
                        <circle cx="19" cy="19" r="17" fill="none" stroke="var(--amber)" strokeWidth="2.5"
                          strokeDasharray={`${2*Math.PI*17}`}
                          strokeDashoffset={`${2*Math.PI*17*(1-progress/100)}`}
                          strokeLinecap="round"
                          transform="rotate(-90 19 19)"
                          style={{transition:'stroke-dashoffset 0.25s linear'}}
                        />
                      </svg>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Footer nav ── */}
        {!loading && (
          <div className={styles.footNav}>
            {num > 1
              ? <Link href={`/surah/${num-1}`} className={styles.footBtn}>← Previous</Link>
              : <span/>}
            <Link href="/" className={styles.footCenter}>All Surahs</Link>
            {num < 114
              ? <Link href={`/surah/${num+1}`} className={styles.footBtn}>Next →</Link>
              : <span/>}
          </div>
        )}
      </div>
    </>
  )
}
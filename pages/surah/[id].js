import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../../styles/Surah.module.css'

const audioUrl = n => `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${n}.mp3`

const BISMILLAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
// Check if an ayah text is essentially the bismillah
function isBismillahAyah(text) {
  return text.replace(/\s/g, '').startsWith('بِسْمِاللَّهِ')
}

// ── Canvas verse image download ──────────────────────────────
async function downloadVerseImage({ ayahText, enText, surahName, surahEn, verseNum, surahNum }) {
  await document.fonts.ready

  const W = 1080, H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#FAF5EE')
  bg.addColorStop(1, '#F0E8DA')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Geometric diamond tile pattern
  ctx.save()
  ctx.globalAlpha = 0.06
  ctx.strokeStyle = '#9E6B3F'
  ctx.lineWidth = 1
  const tile = 60
  for (let x = 0; x < W + tile; x += tile) {
    for (let y = 0; y < H + tile; y += tile) {
      ctx.beginPath()
      ctx.moveTo(x, y - tile/2)
      ctx.lineTo(x + tile/2, y)
      ctx.lineTo(x, y + tile/2)
      ctx.lineTo(x - tile/2, y)
      ctx.closePath()
      ctx.stroke()
    }
  }
  ctx.restore()

  // Outer border
  ctx.save()
  ctx.strokeStyle = '#C4A072'
  ctx.lineWidth = 2
  ctx.strokeRect(40, 40, W - 80, H - 80)

  // Inner border
  ctx.strokeStyle = 'rgba(196,160,114,0.4)'
  ctx.lineWidth = 1
  ctx.strokeRect(52, 52, W - 104, H - 104)
  ctx.restore()

  // Corner ornaments — small geometric cross
  const corners = [[40,40],[W-40,40],[40,H-40],[W-40,H-40]]
  const size = 18
  ctx.save()
  ctx.strokeStyle = '#9E6B3F'
  ctx.lineWidth = 1.5
  corners.forEach(([cx, cy]) => {
    ctx.beginPath()
    ctx.moveTo(cx - size, cy); ctx.lineTo(cx + size, cy)
    ctx.moveTo(cx, cy - size); ctx.lineTo(cx, cy + size)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx, cy, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#9E6B3F'
    ctx.fill()
  })
  ctx.restore()

  // Surah info — top
  ctx.save()
  ctx.font = '500 22px Libre Baskerville, Georgia, serif'
  ctx.fillStyle = '#9E6B3F'
  ctx.textAlign = 'center'
  ctx.fillText(`${surahEn.toUpperCase()}  ·  VERSE ${verseNum}`, W/2, 120)
  ctx.restore()

  // Arabic surah name
  ctx.save()
  ctx.direction = 'rtl'
  ctx.font = '400 36px Amiri, serif'
  ctx.fillStyle = '#5A432C'
  ctx.textAlign = 'center'
  ctx.fillText(surahName, W/2, 165)
  ctx.restore()

  // Separator line
  ctx.save()
  ctx.strokeStyle = 'rgba(196,160,114,0.5)'
  ctx.lineWidth = 1
  const sep = 195
  ctx.beginPath()
  ctx.moveTo(120, sep); ctx.lineTo(W - 120, sep)
  ctx.stroke()
  // small diamond centre
  ctx.fillStyle = '#C4A072'
  ctx.beginPath()
  ctx.moveTo(W/2, sep - 5)
  ctx.lineTo(W/2 + 5, sep)
  ctx.lineTo(W/2, sep + 5)
  ctx.lineTo(W/2 - 5, sep)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Arabic verse text — wrapped
  ctx.save()
  ctx.direction = 'rtl'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#1A0E05'

  function wrapArabic(text, maxW, startY, lineH) {
    // Split on spaces and build lines from right
    const words = text.split(' ')
    let line = ''
    let y = startY
    const lines = []
    for (let w of words) {
      const test = line ? w + ' ' + line : w
      ctx.font = '400 52px Amiri, serif'
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line)
        line = w
      } else { line = test }
    }
    if (line) lines.push(line)
    // Center all lines vertically around startY
    const totalH = lines.length * lineH
    let curY = startY - (totalH / 2) + lineH / 2
    for (let l of lines) {
      ctx.font = '400 52px Amiri, serif'
      ctx.fillText(l, W / 2, curY)
      curY += lineH
    }
    return curY
  }

  const afterArabic = wrapArabic(ayahText, W - 160, H / 2 - 20, 90)

  ctx.restore()

  // Separator
  ctx.save()
  ctx.strokeStyle = 'rgba(196,160,114,0.35)'
  ctx.lineWidth = 1
  const sep2 = afterArabic + 30
  ctx.beginPath()
  ctx.moveTo(160, sep2); ctx.lineTo(W - 160, sep2)
  ctx.stroke()
  ctx.restore()

  // English translation — wrapped
  if (enText) {
    ctx.save()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#7A5A3A'
    ctx.font = 'italic 400 26px Lora, Georgia, serif'
    const enWords = enText.split(' ')
    let line = '', y = sep2 + 50
    for (let w of enWords) {
      const test = line ? line + ' ' + w : w
      if (ctx.measureText(test).width > W - 200 && line) {
        ctx.fillText(line, W/2, y)
        line = w; y += 40
      } else { line = test }
      if (y > H - 140) { line += '…'; break }
    }
    if (line) ctx.fillText(line, W/2, y)
    ctx.restore()
  }

  // Branding bottom
  ctx.save()
  ctx.font = '400 18px Libre Baskerville, Georgia, serif'
  ctx.fillStyle = 'rgba(158,107,63,0.6)'
  ctx.textAlign = 'center'
  ctx.letterSpacing = '0.12em'
  ctx.fillText('TARTEEL', W/2, H - 60)
  ctx.restore()

  // Download
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tarteel-${surahEn.toLowerCase().replace(/\s+/g,'-')}-${verseNum}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }, 'image/png')
}

// ── Mushaf Bismillah frame ────────────────────────────────────
function BismillahFrame() {
  return (
    <div className={styles.bismillahFrame}>
      {/* Corner ornaments */}
      <svg className={`${styles.corner} ${styles.cornerTL}`} viewBox="0 0 40 40" fill="none">
        <path d="M2 20 L20 2 L38 20 L20 38 Z" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8 20 L20 8 L32 20 L20 32 Z" stroke="currentColor" strokeWidth="0.6"/>
        <circle cx="20" cy="20" r="3" fill="currentColor"/>
      </svg>
      <svg className={`${styles.corner} ${styles.cornerTR}`} viewBox="0 0 40 40" fill="none">
        <path d="M2 20 L20 2 L38 20 L20 38 Z" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8 20 L20 8 L32 20 L20 32 Z" stroke="currentColor" strokeWidth="0.6"/>
        <circle cx="20" cy="20" r="3" fill="currentColor"/>
      </svg>
      <svg className={`${styles.corner} ${styles.cornerBL}`} viewBox="0 0 40 40" fill="none">
        <path d="M2 20 L20 2 L38 20 L20 38 Z" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8 20 L20 8 L32 20 L20 32 Z" stroke="currentColor" strokeWidth="0.6"/>
        <circle cx="20" cy="20" r="3" fill="currentColor"/>
      </svg>
      <svg className={`${styles.corner} ${styles.cornerBR}`} viewBox="0 0 40 40" fill="none">
        <path d="M2 20 L20 2 L38 20 L20 38 Z" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8 20 L20 8 L32 20 L20 32 Z" stroke="currentColor" strokeWidth="0.6"/>
        <circle cx="20" cy="20" r="3" fill="currentColor"/>
      </svg>
      {/* Side ornaments */}
      <svg className={`${styles.sideOrn} ${styles.sideL}`} viewBox="0 0 12 60" fill="none">
        <circle cx="6" cy="6" r="2.5" fill="currentColor"/>
        <line x1="6" y1="10" x2="6" y2="50" stroke="currentColor" strokeWidth="0.8"/>
        <circle cx="6" cy="54" r="2.5" fill="currentColor"/>
      </svg>
      <svg className={`${styles.sideOrn} ${styles.sideR}`} viewBox="0 0 12 60" fill="none">
        <circle cx="6" cy="6" r="2.5" fill="currentColor"/>
        <line x1="6" y1="10" x2="6" y2="50" stroke="currentColor" strokeWidth="0.8"/>
        <circle cx="6" cy="54" r="2.5" fill="currentColor"/>
      </svg>

      <div className={styles.bismillahText}>{BISMILLAH}</div>
    </div>
  )
}

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
  const [hoveredAyah, setHoveredAyah] = useState(null)
  const audioRef = useRef(null)

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(r => r.json())
      .then(d => setSurahList(d.data))
  }, [])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setSurahAr(null); setSurahEn(null); stopAudio()

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
      audioRef.current.ontimeupdate = null
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current = null
    }
    setPlayingAyah(null)
    setLoadingAyah(null)
    setProgress(0)
  }, [])

  const playAyah = useCallback((numInSurah, globalNum) => {
    if (playingAyah === numInSurah) { stopAudio(); return }
    stopAudio()
    setLoadingAyah(numInSurah)
    const audio = new Audio()
    audioRef.current = audio
    audio.ontimeupdate = () => {
      if (audio.duration > 0) setProgress((audio.currentTime / audio.duration) * 100)
    }
    audio.onended = () => { setPlayingAyah(null); setLoadingAyah(null); setProgress(0) }
    audio.onerror = () => { setLoadingAyah(null); setPlayingAyah(null) }
    audio.src = audioUrl(globalNum)
    audio.play()
      .then(() => { setLoadingAyah(null); setPlayingAyah(numInSurah) })
      .catch(() => { setLoadingAyah(null); setPlayingAyah(null) })
  }, [playingAyah, stopAudio])

  useEffect(() => () => stopAudio(), [stopAudio])

  const surahInfo = surahList.find(s => String(s.number) === String(id))
  const num = parseInt(id)

  // Filter ayahs — remove bismillah as first ayah for non-Fatiha surahs
  const filteredAyahs = surahAr?.ayahs.filter((ayah, i) => {
    if (num === 1) return true // Al-Fatiha: show all including bismillah as verse 1
    if (i === 0 && isBismillahAyah(ayah.text)) return false // skip duplicate
    return true
  }) || []

  const filteredEnAyahs = surahEn?.ayahs.filter((_, i) => {
    if (num === 1) return true
    if (i === 0 && surahAr?.ayahs[0] && isBismillahAyah(surahAr.ayahs[0].text)) return false
    return true
  }) || []

  return (
    <>
      <Head>
        <title>{surahAr ? `${surahAr.englishName} · Tarteel` : 'Tarteel'}</title>
      </Head>

      <div className={styles.page}>
        {/* ── Sticky Nav ── */}
        <nav className={styles.nav}>
          <Link href="/" className={styles.back}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            All Surahs
          </Link>

          <div className={styles.navMid}>
            {surahAr && <>
              <span className={styles.navAr}>{surahAr.name}</span>
              <span className={styles.navSep}>·</span>
              <span className={styles.navEn}>{surahAr.englishName}</span>
            </>}
          </div>

          <div className={styles.navRight}>
            <button
              className={`${styles.transBtn} ${showTrans ? styles.transBtnOn:''}`}
              onClick={() => setShowTrans(v => !v)}
              title="Toggle translation"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m5 8 6 6M4 14l6-6 2-2M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>
              </svg>
              <span className={styles.transBtnLabel}>Translation</span>
            </button>
            <div className={styles.navArrows}>
              {num > 1 && (
                <Link href={`/surah/${num-1}`} className={styles.navArrow} title="Previous surah">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </Link>
              )}
              {num < 114 && (
                <Link href={`/surah/${num+1}`} className={styles.navArrow} title="Next surah">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* ── Surah Header ── */}
        {!loading && surahAr && (
          <header className={styles.surahHead}>
            <div className={styles.headTopRow}>
              <div className={styles.headNumBadge}>
                <svg viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="1">
                  <polygon points="15,3 35,3 47,15 47,35 35,47 15,47 3,35 3,15"/>
                </svg>
                <span>{surahAr.number}</span>
              </div>
              {surahInfo && (
                <span className={styles.revTag} data-type={surahInfo.revelationType.toLowerCase()}>
                  {surahInfo.revelationType}
                </span>
              )}
              <div className={styles.headStats}>
                <span>{surahAr.numberOfAyahs} verses</span>
                <span className={styles.statDot}>·</span>
                <span>Juz {surahAr.juz?.[0]?.index ?? '—'}</span>
              </div>
            </div>

            <h1 className={styles.headAr}>{surahAr.name}</h1>
            <div className={styles.headEn}>{surahAr.englishName}</div>
            <div className={styles.headTrans}>{surahAr.englishNameTranslation}</div>

            {/* Bismillah — fancy mushaf frame, not for Fatiha or Tawbah */}
            {num !== 1 && num !== 9 && <BismillahFrame />}
          </header>
        )}

        {/* ── Ornamental divider ── */}
        {!loading && (
          <div className={styles.orn}>
            <div className={styles.ornLine}/>
            <svg viewBox="0 0 40 20" width="40" height="20" fill="none">
              <path d="M20 2 L38 10 L20 18 L2 10 Z" stroke="var(--brand-glow)" strokeWidth="1.2"/>
              <circle cx="20" cy="10" r="3" fill="var(--brand-glow)"/>
            </svg>
            <div className={styles.ornLine}/>
          </div>
        )}

        {/* ── Skeleton ── */}
        {loading && (
          <div className={styles.skList}>
            {Array.from({length:8}).map((_,i) => (
              <div key={i} className={styles.sk} style={{animationDelay:`${i*.05}s`}} />
            ))}
          </div>
        )}

        {/* ── Ayah list ── */}
        {!loading && surahAr && surahEn && (
          <div className={styles.list}>
            {filteredAyahs.map((ayah, i) => {
              const en = filteredEnAyahs[i]
              const playing = playingAyah === ayah.numberInSurah
              const isLoading = loadingAyah === ayah.numberInSurah
              const hovered = hoveredAyah === ayah.numberInSurah
              const showDl = hovered || playing

              return (
                <div
                  key={ayah.number}
                  className={`${styles.row} ${playing ? styles.rowPlaying:''} ${isLoading ? styles.rowLoading:''}`}
                  style={{animationDelay:`${i*.015}s`}}
                  onMouseEnter={() => setHoveredAyah(ayah.numberInSurah)}
                  onMouseLeave={() => setHoveredAyah(null)}
                >
                  {/* Verse number badge */}
                  <div className={styles.verseNum}>
                    <svg className={styles.verseOct} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <polygon points="12,2 28,2 38,12 38,28 28,38 12,38 2,28 2,12"/>
                    </svg>
                    <span>{ayah.numberInSurah}</span>
                  </div>

                  {/* Text */}
                  <div className={styles.textArea}>
                    <div
                      className={styles.arText}
                      onClick={() => playAyah(ayah.numberInSurah, ayah.number)}
                    >
                      {ayah.text}
                    </div>
                    {showTrans && en && (
                      <div className={styles.enText}>{en.text}</div>
                    )}
                  </div>

                  {/* Right column: play + download */}
                  <div className={styles.rowActions}>
                    {/* Play button */}
                    <button
                      className={`${styles.playBtn} ${playing ? styles.playOn:''}`}
                      onClick={() => playAyah(ayah.numberInSurah, ayah.number)}
                      aria-label={playing ? 'Pause' : `Play verse ${ayah.numberInSurah}`}
                    >
                      {isLoading
                        ? <span className={styles.spin}/>
                        : playing
                          ? <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>
                          : <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><path d="M8 5v14l11-7z"/></svg>
                      }
                      {playing && (
                        <svg className={styles.ring} viewBox="0 0 38 38">
                          <circle cx="19" cy="19" r="16" fill="none" stroke="var(--brand-soft)" strokeWidth="2.5"/>
                          <circle cx="19" cy="19" r="16" fill="none" stroke="var(--brand)" strokeWidth="2.5"
                            strokeDasharray={`${2*Math.PI*16}`}
                            strokeDashoffset={`${2*Math.PI*16*(1-progress/100)}`}
                            strokeLinecap="round" transform="rotate(-90 19 19)"
                            style={{transition:'stroke-dashoffset .25s linear'}}
                          />
                        </svg>
                      )}
                    </button>

                    {/* Download button — hover or playing */}
                    <button
                      className={`${styles.dlBtn} ${showDl ? styles.dlBtnVisible:''}`}
                      onClick={() => downloadVerseImage({
                        ayahText: ayah.text,
                        enText: en?.text || '',
                        surahName: surahAr.name,
                        surahEn: surahAr.englishName,
                        verseNum: ayah.numberInSurah,
                        surahNum: num,
                      })}
                      aria-label="Download verse as image"
                      title="Save verse as image"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Footer nav ── */}
        {!loading && (
          <div className={styles.footNav}>
            {num > 1
              ? <Link href={`/surah/${num-1}`} className={styles.footBtn}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  Previous
                </Link>
              : <span/>}
            <Link href="/" className={styles.footCenter}>All Surahs</Link>
            {num < 114
              ? <Link href={`/surah/${num+1}`} className={styles.footBtn}>
                  Next
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              : <span/>}
          </div>
        )}
      </div>
    </>
  )
}
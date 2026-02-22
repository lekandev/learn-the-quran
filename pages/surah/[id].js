import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../../styles/Surah.module.css'

const audioUrl = n => `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${n}.mp3`

// Bismillah prefix — strip from verse display text for non-Fatiha surahs
const BSMLA = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
const BSMLA_COMPACT = 'بِسْمِاللَّهِالرَّحْمَٰنِالرَّحِيمِ'

function stripBismillah(text) {
  // Strip the bismillah prefix from the verse text (with/without spaces/diacritics variations)
  const stripped = text.trim()
  // Try exact match first
  if (stripped.startsWith(BSMLA)) return stripped.slice(BSMLA.length).trim()
  // Try stripping on normalized (no-space) comparison
  const norm = stripped.replace(/\s+/g, '')
  if (norm.startsWith(BSMLA_COMPACT.replace(/\s+/g, ''))) {
    // Find where bismillah ends by character count approximation
    let bLen = 0, tLen = 0
    for (let i = 0; i < stripped.length && bLen < BSMLA.replace(/\s+/g,'').length; i++) {
      if (stripped[i] !== ' ') bLen++
      tLen = i + 1
    }
    return stripped.slice(tLen).trim()
  }
  return text
}

// ── Canvas verse image — fixed RTL ──────────────────────────
async function downloadVerseImage({ ayahText, enText, surahName, surahEn, verseNum }) {
  await document.fonts.ready

  const W = 1080, H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // Detect theme from data-theme attribute
  const theme = document.documentElement.getAttribute('data-theme') || 'arabian'
  const isAfrican = theme === 'african'

  const colors = isAfrican ? {
    bgFrom: '#F4FAF2', bgTo: '#E8F3E5',
    pattern: 'rgba(99,155,85,0.08)',
    border: '#B5CCA9', borderInner: '#D2E0CB',
    orn: '#3D6B35', ornDim: 'rgba(61,107,53,0.4)',
    heading: '#3D6B35', surahAr: '#2C5025',
    text: '#0E1A09', translation: '#375230',
    brand: '#3D6B35',
  } : {
    bgFrom: '#FBF7F0', bgTo: '#F4ECE0',
    pattern: 'rgba(158,107,63,0.07)',
    border: '#CFC0A8', borderInner: '#E4D9C8',
    orn: '#9E6B3F', ornDim: 'rgba(158,107,63,0.4)',
    heading: '#9E6B3F', surahAr: '#7A5030',
    text: '#1A0E05', translation: '#5A432C',
    brand: '#9E6B3F',
  }

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, colors.bgFrom)
  bg.addColorStop(1, colors.bgTo)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Subtle pattern overlay
  ctx.save()
  ctx.globalAlpha = 1
  const tile = 60
  if (isAfrican) {
    // Concentric circle pattern
    for (let x = 0; x < W + tile; x += tile) {
      for (let y = 0; y < H + tile; y += tile) {
        ctx.beginPath()
        ctx.arc(x, y, 18, 0, Math.PI * 2)
        ctx.strokeStyle = colors.pattern
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
  } else {
    // Diamond pattern
    ctx.strokeStyle = colors.pattern
    ctx.lineWidth = 1
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
  }
  ctx.restore()

  // Outer border
  ctx.save()
  ctx.strokeStyle = colors.border
  ctx.lineWidth = 2
  ctx.strokeRect(36, 36, W - 72, H - 72)
  ctx.strokeStyle = colors.borderInner
  ctx.lineWidth = 1
  ctx.strokeRect(46, 46, W - 92, H - 92)
  ctx.restore()

  // Corner ornaments
  const corners = [[36,36,1,1],[W-36,36,-1,1],[36,H-36,1,-1],[W-36,H-36,-1,-1]]
  ctx.save()
  ctx.strokeStyle = colors.orn
  ctx.fillStyle = colors.orn
  ctx.lineWidth = 1.5
  corners.forEach(([cx,cy,sx,sy]) => {
    ctx.beginPath()
    ctx.moveTo(cx, cy); ctx.lineTo(cx + sx*20, cy)
    ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + sy*20)
    ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI*2); ctx.fill()
  })
  ctx.restore()

  // Surah English name
  ctx.save()
  ctx.font = '700 20px "Libre Baskerville", Georgia, serif'
  ctx.fillStyle = colors.heading
  ctx.textAlign = 'center'
  ctx.letterSpacing = '0.15em'
  const label = `${surahEn.toUpperCase()}  ·  VERSE ${verseNum}`
  ctx.fillText(label, W/2, 110)
  ctx.restore()

  // Arabic surah name — RTL
  ctx.save()
  ctx.direction = 'rtl'
  ctx.font = '400 32px "Amiri", serif'
  ctx.fillStyle = colors.surahAr
  ctx.textAlign = 'center'
  ctx.fillText(surahName, W/2, 155)
  ctx.restore()

  // Ornamental separator
  const drawSep = (y) => {
    ctx.save()
    ctx.strokeStyle = colors.ornDim
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(W-100, y); ctx.stroke()
    ctx.fillStyle = colors.orn
    ctx.beginPath()
    ctx.moveTo(W/2, y-5); ctx.lineTo(W/2+5, y); ctx.lineTo(W/2, y+5); ctx.lineTo(W/2-5, y); ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  drawSep(183)

  // ── Arabic verse text — proper RTL word wrap ──
  const drawArabicRTL = (text, centerY) => {
    ctx.save()
    ctx.direction = 'rtl'
    ctx.textAlign = 'center'
    ctx.fillStyle = colors.text
    ctx.font = '400 50px "Amiri", serif'

    const maxW = W - 140
    const lineH = 88
    const words = text.split(' ')

    // Build lines — since direction=rtl and textAlign=center,
    // we just need to measure width; canvas handles visual RTL order
    const lines = []
    let current = []
    for (const word of words) {
      const test = [...current, word].join(' ')
      if (ctx.measureText(test).width > maxW && current.length > 0) {
        lines.push(current.join(' '))
        current = [word]
      } else {
        current.push(word)
      }
    }
    if (current.length) lines.push(current.join(' '))

    const totalH = lines.length * lineH
    let y = centerY - totalH/2 + lineH/2

    for (const line of lines) {
      ctx.fillText(line, W/2, y)
      y += lineH
    }

    ctx.restore()
    return centerY + totalH/2 + 20
  }

  const afterArabic = drawArabicRTL(ayahText, H/2 - 30)
  drawSep(afterArabic + 20)

  // English translation
  if (enText) {
    ctx.save()
    ctx.direction = 'ltr'
    ctx.textAlign = 'center'
    ctx.fillStyle = colors.translation
    ctx.font = 'italic 400 24px "Lora", Georgia, serif'
    const maxW = W - 200
    const words = enText.split(' ')
    let line = '', y = afterArabic + 60
    for (const word of words) {
      const test = line ? line + ' ' + word : word
      if (ctx.measureText(test).width > maxW && line) {
        if (y > H - 120) { ctx.fillText(line + '…', W/2, y); break }
        ctx.fillText(line, W/2, y)
        line = word; y += 38
      } else { line = test }
    }
    if (line && y <= H - 120) ctx.fillText(line, W/2, y)
    ctx.restore()
  }

  // Branding
  ctx.save()
  ctx.font = '400 16px "Libre Baskerville", Georgia, serif'
  ctx.fillStyle = colors.ornDim
  ctx.textAlign = 'center'
  ctx.fillText('TARTEEL', W/2, H - 55)
  ctx.restore()

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tarteel-${surahEn.toLowerCase().replace(/\s+/g,'-')}-${verseNum}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }, 'image/png')
}

// ── Mushaf Bismillah Frame (compact) ─────────────────────────
function BismillahFrame() {
  return (
    <div className={styles.bismillahFrame}>
      <svg className={`${styles.corner} ${styles.cTL}`} viewBox="0 0 32 32" fill="none">
        <path d="M2 16 L16 2 L30 16 L16 30 Z" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
      </svg>
      <svg className={`${styles.corner} ${styles.cTR}`} viewBox="0 0 32 32" fill="none">
        <path d="M2 16 L16 2 L30 16 L16 30 Z" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
      </svg>
      <svg className={`${styles.corner} ${styles.cBL}`} viewBox="0 0 32 32" fill="none">
        <path d="M2 16 L16 2 L30 16 L16 30 Z" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
      </svg>
      <svg className={`${styles.corner} ${styles.cBR}`} viewBox="0 0 32 32" fill="none">
        <path d="M2 16 L16 2 L30 16 L16 30 Z" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
      </svg>
      <div className={styles.bismillahText}>{BSMLA}</div>
    </div>
  )
}

export default function SurahPage({ theme, toggleTheme }) {
  const { query } = useRouter()
  const { id } = query

  const [surahAr, setSurahAr]         = useState(null)
  const [surahEn, setSurahEn]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [playingAyah, setPlayingAyah] = useState(null)
  const [loadingAyah, setLoadingAyah] = useState(null)
  const [progress, setProgress]       = useState(0)
  const [showTrans, setShowTrans]     = useState(true)
  const [surahList, setSurahList]     = useState([])
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
      setSurahAr(ar.data); setSurahEn(en.data); setLoading(false)
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
    setPlayingAyah(null); setLoadingAyah(null); setProgress(0)
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
    audio.onended  = () => { setPlayingAyah(null); setLoadingAyah(null); setProgress(0) }
    audio.onerror  = () => { setLoadingAyah(null); setPlayingAyah(null) }
    audio.src = audioUrl(globalNum)
    audio.play()
      .then(() => { setLoadingAyah(null); setPlayingAyah(numInSurah) })
      .catch(() => { setLoadingAyah(null); setPlayingAyah(null) })
  }, [playingAyah, stopAudio])

  useEffect(() => () => stopAudio(), [stopAudio])

  const surahInfo = surahList.find(s => String(s.number) === String(id))
  const num = parseInt(id)
  const showBismillahFrame = num !== 1 && num !== 9

  return (
    <>
      <Head>
        <title>{surahAr ? `${surahAr.englishName} · Tarteel` : 'Tarteel'}</title>
      </Head>

      <div className={styles.page}>
        {/* ── Nav ── */}
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
            {/* Theme toggle in nav */}
            {toggleTheme && (
              <button
                className={styles.themeNavBtn}
                onClick={toggleTheme}
                title={`Switch to ${theme === 'african' ? 'Arabian' : 'East African'} theme`}
              >
                {theme === 'african' ? '🌙' : '🌿'}
              </button>
            )}
            <button
              className={`${styles.transBtn} ${showTrans ? styles.transBtnOn:''}`}
              onClick={() => setShowTrans(v => !v)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m5 8 6 6M4 14l6-6 2-2M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>
              </svg>
              <span className={styles.transLabel}>Translation</span>
            </button>
            <div className={styles.navArrows}>
              {num > 1 && (
                <Link href={`/surah/${num-1}`} className={styles.navArrow}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </Link>
              )}
              {num < 114 && (
                <Link href={`/surah/${num+1}`} className={styles.navArrow}>
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

            {showBismillahFrame && <BismillahFrame />}
          </header>
        )}

        {/* ── Ornamental divider ── */}
        {!loading && (
          <div className={styles.orn}>
            <div className={styles.ornLine}/>
            <svg viewBox="0 0 40 20" width="36" height="18" fill="none">
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
            {surahAr.ayahs.map((ayah, i) => {
              const en = surahEn.ayahs[i]
              const playing  = playingAyah === ayah.numberInSurah
              const isLoading = loadingAyah === ayah.numberInSurah
              const hovered  = hoveredAyah === ayah.numberInSurah
              const showDl   = hovered || playing

              // Strip bismillah from verse 1 for non-Fatiha surahs
              const displayText = (num !== 1 && ayah.numberInSurah === 1)
                ? stripBismillah(ayah.text)
                : ayah.text

              return (
                <div
                  key={ayah.number}
                  className={`${styles.row} ${playing?styles.rowPlaying:''} ${isLoading?styles.rowLoading:''}`}
                  style={{animationDelay:`${i*.015}s`}}
                  onMouseEnter={() => setHoveredAyah(ayah.numberInSurah)}
                  onMouseLeave={() => setHoveredAyah(null)}
                >
                  <div className={styles.verseNum}>
                    <svg className={styles.verseOct} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <polygon points="12,2 28,2 38,12 38,28 28,38 12,38 2,28 2,12"/>
                    </svg>
                    <span>{ayah.numberInSurah}</span>
                  </div>

                  <div className={styles.textArea}>
                    <div
                      className={styles.arText}
                      onClick={() => playAyah(ayah.numberInSurah, ayah.number)}
                    >
                      {displayText}
                    </div>
                    {showTrans && en && (
                      <div className={styles.enText}>{en.text}</div>
                    )}
                  </div>

                  <div className={styles.rowActions}>
                    <button
                      className={`${styles.playBtn} ${playing?styles.playOn:''}`}
                      onClick={() => playAyah(ayah.numberInSurah, ayah.number)}
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

                    <button
                      className={`${styles.dlBtn} ${showDl?styles.dlBtnVisible:''}`}
                      onClick={() => downloadVerseImage({
                        ayahText: displayText,
                        enText: en?.text || '',
                        surahName: surahAr.name,
                        surahEn: surahAr.englishName,
                        verseNum: ayah.numberInSurah,
                      })}
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
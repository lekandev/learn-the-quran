import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import RightSidebar from '../../components/RightSidebar'
import styles from '../../styles/Surah.module.css'

const audioUrl = n => `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${n}.mp3`
const BSMLA = '\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064e\u0647\u0650 \u0627\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650'

function stripBismillah(text) {
  const t = text.trim()
  if (t.startsWith(BSMLA)) return t.slice(BSMLA.length).trim()
  // Normalised comparison (strip diacritics+spaces)
  const norm = s => s.replace(/[\u064B-\u065F\u0670\s]/g, '')
  const normBs = norm('\u0628\u0633\u0645\u0627\u0644\u0644\u0647\u0627\u0644\u0631\u062d\u0645\u0646\u0627\u0644\u0631\u062d\u064a\u0645')
  if (norm(t).startsWith(normBs)) {
    // find where bismillah ends character-by-character
    let matched = 0
    let i = 0
    while (i < t.length && matched < normBs.length) {
      const ch = t[i]
      if (!/[\u064B-\u065F\u0670\s]/.test(ch)) matched++
      i++
    }
    return t.slice(i).trim()
  }
  return text
}

// Canvas verse image download - no ctx.direction to avoid browser bugs
async function downloadVerseImage({ ayahText, enText, surahName, surahEn, verseNum }) {
  try {
    const W = 1080
    const H = 1080
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const theme = document.documentElement.getAttribute('data-theme') || 'arabian'
    const isAfrican = theme === 'african'
    const pal = isAfrican ? {
      bgFrom: '#F4FAF2', bgTo: '#E8F3E5',
      bdr: '#B5CCA9', bdr2: '#D2E0CB',
      orn: '#3D6B35', ornDim: 'rgba(61,107,53,0.35)',
      head: '#3D6B35', arSurah: '#2C5025',
      verse: '#0E1A09', trans: '#375230',
    } : {
      bgFrom: '#FBF7F0', bgTo: '#F4ECE0',
      bdr: '#CFC0A8', bdr2: '#E4D9C8',
      orn: '#9E6B3F', ornDim: 'rgba(158,107,63,0.35)',
      head: '#9E6B3F', arSurah: '#7A5030',
      verse: '#1A0E05', trans: '#5A432C',
    }

    // Background
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, pal.bgFrom)
    grad.addColorStop(1, pal.bgTo)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Double border
    ctx.strokeStyle = pal.bdr
    ctx.lineWidth = 2
    ctx.strokeRect(32, 32, W - 64, H - 64)
    ctx.strokeStyle = pal.bdr2
    ctx.lineWidth = 1
    ctx.strokeRect(44, 44, W - 88, H - 88)

    // Corner L-marks using regular function (no arrow + forEach to avoid scope issues)
    var corners = [[32,32,1,1],[W-32,32,-1,1],[32,H-32,1,-1],[W-32,H-32,-1,-1]]
    for (var ci = 0; ci < corners.length; ci++) {
      var cx = corners[ci][0], cy = corners[ci][1], sx = corners[ci][2], sy = corners[ci][3]
      ctx.strokeStyle = pal.orn
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + sx * 22, cy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + sy * 22); ctx.stroke()
      ctx.fillStyle = pal.orn
      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill()
    }

    // Separator line with diamond
    function sep(y) {
      ctx.strokeStyle = pal.ornDim; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(90, y); ctx.lineTo(W - 90, y); ctx.stroke()
      ctx.fillStyle = pal.orn
      ctx.beginPath()
      ctx.moveTo(W/2, y-5); ctx.lineTo(W/2+5, y); ctx.lineTo(W/2, y+5); ctx.lineTo(W/2-5, y)
      ctx.closePath(); ctx.fill()
    }

    // Surah label
    ctx.fillStyle = pal.head
    ctx.textAlign = 'center'
    ctx.font = '700 19px Georgia, serif'
    ctx.fillText((surahEn + '  \u00B7  VERSE ' + verseNum).toUpperCase(), W / 2, 106)

    // Arabic surah name (centered, single token — no direction needed)
    ctx.fillStyle = pal.arSurah
    ctx.textAlign = 'center'
    ctx.font = '400 30px Georgia, serif'
    ctx.fillText(surahName, W / 2, 150)

    sep(176)

    // Arabic verse — centered (canvas centers RTL text fine without ctx.direction)
    ctx.fillStyle = pal.verse
    ctx.textAlign = 'center'
    ctx.font = '400 46px Georgia, serif'
    var maxAW = W - 160
    var lineH = 80
    var arWords = ayahText.split(' ')
    var arLines = []
    var arCur = []
    for (var wi = 0; wi < arWords.length; wi++) {
      var arTest = arCur.concat([arWords[wi]]).join(' ')
      if (ctx.measureText(arTest).width > maxAW && arCur.length > 0) {
        arLines.push(arCur.join(' ')); arCur = [arWords[wi]]
      } else { arCur.push(arWords[wi]) }
    }
    if (arCur.length > 0) arLines.push(arCur.join(' '))

    var arTotalH = arLines.length * lineH
    var arStartY = (H / 2 - 20) - arTotalH / 2 + lineH / 2
    for (var li = 0; li < arLines.length; li++) {
      ctx.fillText(arLines[li], W / 2, arStartY + li * lineH)
    }
    var afterAr = (H / 2 - 20) + arTotalH / 2 + 24

    sep(afterAr + 18)

    // English translation
    if (enText) {
      ctx.fillStyle = pal.trans
      ctx.textAlign = 'center'
      ctx.font = 'italic 400 22px Georgia, serif'
      var enWords = enText.split(' ')
      var enLine = ''
      var enY = afterAr + 54
      for (var ei = 0; ei < enWords.length; ei++) {
        var enTest = enLine ? enLine + ' ' + enWords[ei] : enWords[ei]
        if (ctx.measureText(enTest).width > W - 200 && enLine) {
          if (enY > H - 120) { ctx.fillText(enLine + '\u2026', W/2, enY); enLine = ''; break }
          ctx.fillText(enLine, W/2, enY); enLine = enWords[ei]; enY += 36
        } else { enLine = enTest }
      }
      if (enLine && enY <= H - 120) ctx.fillText(enLine, W/2, enY)
    }

    // Brand
    ctx.fillStyle = pal.ornDim
    ctx.textAlign = 'center'
    ctx.font = '400 14px Georgia, serif'
    ctx.fillText('TARTEEL', W / 2, H - 52)

    // Download
    canvas.toBlob(function(blob) {
      if (!blob) return
      var url = URL.createObjectURL(blob)
      var a = document.createElement('a')
      a.href = url
      a.download = 'tarteel-' + surahEn.toLowerCase().replace(/\s+/g, '-') + '-' + verseNum + '.png'
      a.click()
      setTimeout(function() { URL.revokeObjectURL(url) }, 2000)
    }, 'image/png')

  } catch (err) {
    console.error('Download failed:', err)
  }
}

// Bismillah - pure CSS double border, no SVG
function BismillahFrame() {
  return (
    <div className={styles.bismillahFrame}>
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
  const [transOpen, setTransOpen]     = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(r => r.json())
      .then(d => setSurahList(d.data))
  }, [])

  useEffect(() => {
    if (!id) return
    setLoading(true); setSurahAr(null); setSurahEn(null); stopAudio(); setTransOpen(false)
    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`).then(r => r.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${id}/en.sahih`).then(r => r.json()),
    ]).then(([ar, en]) => { setSurahAr(ar.data); setSurahEn(en.data); setLoading(false) })
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
    stopAudio(); setLoadingAyah(numInSurah)
    const audio = new Audio(); audioRef.current = audio
    audio.ontimeupdate = () => { if (audio.duration > 0) setProgress((audio.currentTime / audio.duration) * 100) }
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

  const rightSidebar = id ? (
    <RightSidebar
      surahId={id}
      surahName={surahAr?.name}
      surahEn={surahAr?.englishName}
      isOpen={transOpen}
      onClose={() => setTransOpen(false)}
    />
  ) : null

  return (
    <Layout
      theme={theme}
      toggleTheme={toggleTheme}
      rightSidebarContent={rightSidebar}
      rightSidebarOpen={transOpen}
      onRightSidebarClose={() => setTransOpen(false)}
    >
      <Head>
        <title>{surahAr ? `${surahAr.englishName} - Tarteel` : 'Tarteel'}</title>
      </Head>

      <div className={styles.page}>
        {/* Nav */}
        <nav className={styles.nav}>
          <Link href="/read" className={styles.back}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <button className={styles.themeNavBtn} onClick={toggleTheme} title="Switch theme">
              {theme === 'african' ? '🌙' : '🌿'}
            </button>
            <button
              className={`${styles.transBtn} ${showTrans ? styles.transBtnOn : ''}`}
              onClick={() => setShowTrans(v => !v)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m5 8 6 6M4 14l6-6 2-2M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>
              </svg>
              <span className={styles.btnLabel}>Translation</span>
            </button>
            <button
              className={`${styles.transBtn} ${transOpen ? styles.transBtnOn : ''}`}
              onClick={() => setTransOpen(v => !v)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7h16M4 12h10M4 17h7"/>
              </svg>
              <span className={styles.btnLabel}>Translit.</span>
            </button>
            <div className={styles.navArrows}>
              {num > 1 && (
                <Link href={`/surah/${num - 1}`} className={styles.navArrow}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </Link>
              )}
              {num < 114 && (
                <Link href={`/surah/${num + 1}`} className={styles.navArrow}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Surah Header */}
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
                <span>Juz {surahAr.juz?.[0]?.index ?? '-'}</span>
              </div>
            </div>
            <h1 className={styles.headAr}>{surahAr.name}</h1>
            <div className={styles.headEn}>{surahAr.englishName}</div>
            <div className={styles.headTrans}>{surahAr.englishNameTranslation}</div>
            {showBismillahFrame && <BismillahFrame />}
          </header>
        )}

        {/* Divider */}
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

        {/* Skeleton */}
        {loading && (
          <div className={styles.skList}>
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} className={styles.sk} style={{animationDelay: `${i * .05}s`}} />
            ))}
          </div>
        )}

        {/* Ayah list */}
        {!loading && surahAr && surahEn && (
          <div className={styles.list}>
            {surahAr.ayahs.map((ayah, i) => {
              const en = surahEn.ayahs[i]
              const playing   = playingAyah === ayah.numberInSurah
              const isLoading = loadingAyah === ayah.numberInSurah
              const hovered   = hoveredAyah === ayah.numberInSurah
              const showDl    = hovered || playing
              const displayText = (num !== 1 && ayah.numberInSurah === 1)
                ? stripBismillah(ayah.text)
                : ayah.text

              return (
                <div
                  key={ayah.number}
                  className={`${styles.row} ${playing ? styles.rowPlaying : ''} ${isLoading ? styles.rowLoading : ''}`}
                  style={{animationDelay: `${i * .015}s`}}
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
                    <div className={styles.arText} onClick={() => playAyah(ayah.numberInSurah, ayah.number)}>
                      {displayText}
                    </div>
                    {showTrans && en && <div className={styles.enText}>{en.text}</div>}
                  </div>

                  <div className={styles.rowActions}>
                    <button
                      className={`${styles.playBtn} ${playing ? styles.playOn : ''}`}
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
                            strokeDasharray={`${2 * Math.PI * 16}`}
                            strokeDashoffset={`${2 * Math.PI * 16 * (1 - progress / 100)}`}
                            strokeLinecap="round" transform="rotate(-90 19 19)"
                            style={{transition: 'stroke-dashoffset .25s linear'}}
                          />
                        </svg>
                      )}
                    </button>

                    <button
                      className={`${styles.dlBtn} ${showDl ? styles.dlBtnVisible : ''}`}
                      onClick={() => downloadVerseImage({
                        ayahText: displayText,
                        enText: en?.text || '',
                        surahName: surahAr.name,
                        surahEn: surahAr.englishName,
                        verseNum: ayah.numberInSurah,
                      })}
                      title="Save as image"
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

        {/* Footer nav */}
        {!loading && (
          <div className={styles.footNav}>
            {num > 1 ? <Link href={`/surah/${num - 1}`} className={styles.footBtn}>← Previous</Link> : <span/>}
            <Link href="/read" className={styles.footCenter}>All Surahs</Link>
            {num < 114 ? <Link href={`/surah/${num + 1}`} className={styles.footBtn}>Next →</Link> : <span/>}
          </div>
        )}
      </div>
    </Layout>
  )
}
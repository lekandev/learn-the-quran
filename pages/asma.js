import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'
import styles from '../styles/Asma.module.css'

// ── Depth data — dua usage + meaning ─────────────────────────
const DEPTH = {
  1:  { dua: "يَا رَحْمَٰنُ ارْحَمْنِي", duaEn: "Ya Rahman, have mercy on me", benefit: "Call upon Al-Rahman when seeking general mercy in times of hardship, illness, or distress." },
  2:  { dua: "يَا رَحِيمُ ارْحَمْنِي", duaEn: "Ya Rahim, bestow Your mercy upon me", benefit: "Call upon Al-Rahim when seeking the special mercy reserved for believers — guidance, forgiveness, ease." },
  3:  { dua: "يَا مَلِكُ أَنْتَ الْمَلِكُ", duaEn: "Ya Malik, You are the Sovereign", benefit: "Recite when seeking awareness of divine authority, especially in legal, leadership or justice matters." },
  4:  { dua: "يَا قُدُّوسُ طَهِّرْ قَلْبِي", duaEn: "Ya Quddus, purify my heart", benefit: "Recite frequently to purify the heart from sin, arrogance, and spiritual illness." },
  5:  { dua: "يَا سَلَامُ سَلِّمْنِي", duaEn: "Ya Salam, grant me safety and peace", benefit: "Call upon As-Salam for safety from harm, for peace in the heart, and healing of disease." },
  6:  { dua: "يَا مُؤْمِنُ آمِنِّي", duaEn: "Ya Mu'min, grant me security", benefit: "Call upon Al-Mu'min to strengthen iman and remove fear." },
  7:  { dua: "يَا مُهَيْمِنُ احْفَظْنِي", duaEn: "Ya Muhaymin, protect and watch over me", benefit: "Call upon Al-Muhaymin for divine protection and to seek His watchfulness." },
  8:  { dua: "يَا عَزِيزُ أَعِزَّنِي", duaEn: "Ya Aziz, grant me honour", benefit: "Recite when feeling humiliated, powerless, or oppressed." },
  9:  { dua: "يَا جَبَّارُ اجْبُرْ كَسْرِي", duaEn: "Ya Jabbar, mend my brokenness", benefit: "Recite when your heart is broken — Al-Jabbar is the Mender of broken hearts." },
  10: { dua: "يَا مُتَكَبِّرُ أَنَانِيَّتِي لَكَ", duaEn: "Ya Mutakabbir, all greatness belongs to You", benefit: "Recite to humble yourself before Allah and reduce pride within yourself." },
  11: { dua: "يَا خَالِقُ اخْلُقْ لِي خَيْرًا", duaEn: "Ya Khaliq, create goodness for me", benefit: "Call upon Al-Khaliq when beginning a new project or seeking a fresh start." },
  12: { dua: "يَا بَارِئُ بَرِّئْنِي مِنَ الأَذَى", duaEn: "Ya Bari', free me from harm", benefit: "Recite for protection and when making du'a for children and descendants." },
  13: { dua: "يَا مُصَوِّرُ صَوِّرْنِي أَحْسَنَ صُورَةٍ", duaEn: "Ya Musawwir, shape me in the best form", benefit: "Pregnant women are encouraged to recite this name for the good formation of their child." },
  14: { dua: "يَا غَفَّارُ اغْفِرْ لِي", duaEn: "Ya Ghaffar, forgive me", benefit: "Recite abundantly when seeking forgiveness, especially after sin. He forgives again and again." },
  15: { dua: "يَا قَهَّارُ اقْهَرِ الشَّيْطَانَ", duaEn: "Ya Qahhar, subdue the shaytan for me", benefit: "Recite against whispers of shaytaan and against enemies seeking to overpower you." },
  16: { dua: "يَا وَهَّابُ هَبْ لِي", duaEn: "Ya Wahhab, grant me Your gifts", benefit: "Recite when making du'a for provision, for children, or for any gift freely given." },
  17: { dua: "يَا رَزَّاقُ ارْزُقْنِي", duaEn: "Ya Razzaq, provide for me", benefit: "Recite abundantly for sustenance, especially when facing financial difficulty." },
  18: { dua: "يَا فَتَّاحُ افْتَحْ لِي", duaEn: "Ya Fattah, open the doors for me", benefit: "Call upon Al-Fattah when doors seem closed — in rizq, knowledge, or any matter of life." },
  19: { dua: "يَا عَلِيمُ عَلِّمْنِي", duaEn: "Ya Alim, teach me", benefit: "Recite before studying, seeking knowledge, or when confused about a decision." },
  20: { dua: "يَا قَابِضُ اقْبِضِ الأَذَى عَنِّي", duaEn: "Ya Qabid, take harm away from me", benefit: "Recite in balance with Al-Basit — for protection from excess and grasping in worldly matters." },
}

// ── Canvas image download ──────────────────────────────────────
async function downloadNameCard(nameData, theme) {
  await document.fonts.ready
  const W = 1080, H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const isAfrican = (theme || 'arabian') === 'african'
  const pal = isAfrican ? {
    bgFrom:'#F4FAF2', bgTo:'#E8F3E5', bdr:'#B5CCA9', bdr2:'#D2E0CB',
    orn:'#3D6B35', ornDim:'rgba(61,107,53,0.3)', head:'#3D6B35',
    arabic:'#0E1A09', trans:'#375230', num:'rgba(61,107,53,0.25)',
  } : {
    bgFrom:'#FBF7F0', bgTo:'#F4ECE0', bdr:'#CFC0A8', bdr2:'#E4D9C8',
    orn:'#9E6B3F', ornDim:'rgba(158,107,63,0.3)', head:'#9E6B3F',
    arabic:'#1A0E05', trans:'#5A432C', num:'rgba(158,107,63,0.2)',
  }

  // Background
  var grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, pal.bgFrom); grad.addColorStop(1, pal.bgTo)
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H)

  // Double border
  ctx.strokeStyle = pal.bdr; ctx.lineWidth = 2; ctx.strokeRect(36, 36, W-72, H-72)
  ctx.strokeStyle = pal.bdr2; ctx.lineWidth = 1; ctx.strokeRect(48, 48, W-96, H-96)

  // Number badge (large background)
  ctx.fillStyle = pal.num
  ctx.font = 'bold 180px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText(String(nameData.number).padStart(2, '0'), W/2, 560)

  // Arabic name
  ctx.fillStyle = pal.arabic
  ctx.font = '400 96px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText(nameData.name, W/2, 420)

  // Transliteration
  ctx.fillStyle = pal.head
  ctx.font = '700 36px Georgia, serif'
  ctx.fillText(nameData.transliteration, W/2, 500)

  // Sep
  ctx.strokeStyle = pal.ornDim; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(160, 540); ctx.lineTo(W-160, 540); ctx.stroke()
  ctx.fillStyle = pal.orn
  ctx.beginPath(); ctx.moveTo(W/2, 533); ctx.lineTo(W/2+6, 540); ctx.lineTo(W/2, 547); ctx.lineTo(W/2-6, 540); ctx.closePath(); ctx.fill()

  // Translation
  ctx.fillStyle = pal.trans
  ctx.font = 'italic 400 30px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText(nameData.translation, W/2, 610)

  // Meaning (word-wrapped)
  if (nameData.meaning) {
    ctx.fillStyle = pal.trans; ctx.globalAlpha = 0.8
    ctx.font = '400 22px Georgia, serif'
    var words = nameData.meaning.split(' ')
    var line = '', y = 680
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i]
      if (ctx.measureText(test).width > W - 220 && line) {
        if (y > 820) break
        ctx.fillText(line, W/2, y); line = words[i]; y += 38
      } else line = test
    }
    if (line && y <= 820) ctx.fillText(line, W/2, y)
    ctx.globalAlpha = 1
  }

  // Brand
  ctx.fillStyle = pal.ornDim; ctx.font = '400 16px Georgia, serif'
  ctx.fillText('TARTEEL · Asma ul Husna', W/2, H - 56)

  canvas.toBlob(function(blob) {
    if (!blob) return
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'tarteel-' + (nameData.transliteration || nameData.number).toLowerCase().replace(/\s+/g, '-') + '.png'
    a.click()
    setTimeout(function() { URL.revokeObjectURL(url) }, 2000)
  }, 'image/png')
}

// ── Modal ──────────────────────────────────────────────────────
function NameModal({ names, index, onClose, onNext, onPrev, theme }) {
  const name = names[index]
  const depth = DEPTH[name?.number] || {}
  const [animDir, setAnimDir] = useState(null) // 'left' | 'right'

  const go = useCallback((dir) => {
    setAnimDir(dir)
    setTimeout(() => {
      if (dir === 'right') onNext()
      else onPrev()
      setAnimDir(null)
    }, 260)
  }, [onNext, onPrev])

  // Keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') go('right')
      if (e.key === 'ArrowLeft') go('left')
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [go, onClose])

  if (!name) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button className={styles.modalClose} onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Animated content */}
        <div className={`${styles.modalContent} ${animDir === 'right' ? styles.slideOutLeft : animDir === 'left' ? styles.slideOutRight : ''}`}>

          {/* Number */}
          <div className={styles.modalNum}>{String(name.number).padStart(2, '0')}</div>

          {/* Arabic */}
          <div className={styles.modalAr}>{name.name}</div>

          {/* Transliteration */}
          <div className={styles.modalTranslit}>{name.transliteration}</div>

          {/* Translation */}
          <div className={styles.modalTrans}>{name.translation}</div>

          <div className={styles.modalDivider}/>

          {/* Meaning */}
          {name.meaning && (
            <div className={styles.modalSection}>
              <div className={styles.modalSectionLabel}>Meaning</div>
              <p className={styles.modalMeaning}>{name.meaning}</p>
            </div>
          )}

          {/* Dua */}
          {depth.dua && (
            <div className={styles.modalSection}>
              <div className={styles.modalSectionLabel}>How to call upon Him</div>
              <div className={styles.modalDua}>{depth.dua}</div>
              <div className={styles.modalDuaEn}>"{depth.duaEn}"</div>
            </div>
          )}

          {/* Benefit */}
          {depth.benefit && (
            <div className={styles.modalSection}>
              <div className={styles.modalSectionLabel}>When to recite</div>
              <p className={styles.modalBenefit}>{depth.benefit}</p>
            </div>
          )}
        </div>

        {/* Nav + download */}
        <div className={styles.modalFooter}>
          <button className={styles.modalNav} onClick={() => go('left')} disabled={index === 0}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <span className={styles.modalCount}>{name.number} / 99</span>
          <button
            className={styles.modalDl}
            onClick={() => downloadNameCard(name, theme)}
            title="Save as image"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Save card
          </button>
          <button className={styles.modalNav} onClick={() => go('right')} disabled={index === names.length - 1}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────
export default function AsmaPage({ theme, toggleTheme }) {
  const [names, setNames]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [modalIdx, setModalIdx]   = useState(null)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    fetch('https://api.aladhan.com/v1/asmaAlHusna')
      .then(r => r.json())
      .then(d => {
        const normalized = (d.data || []).map(n => ({
          ...n,
          translation: n.translation || n.en?.meaning || n.en?.desc || '',
          meaning:     n.meaning     || n.en?.desc     || n.en?.meaning || '',
        }))
        setNames(normalized)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = names.filter(n => {
    if (!search) return true
    const q = search.toLowerCase()
    return n.transliteration?.toLowerCase().includes(q) ||
           n.translation?.toLowerCase().includes(q) ||
           n.name?.includes(search) ||
           String(n.number).includes(search)
  })

  const openModal = (globalIdx) => setModalIdx(globalIdx)
  const closeModal = () => setModalIdx(null)
  const nextName = () => setModalIdx(i => Math.min(i + 1, names.length - 1))
  const prevName = () => setModalIdx(i => Math.max(i - 1, 0))

  return (
    <Layout theme={theme} toggleTheme={toggleTheme}>
      <Head><title>Asma ul Husna · Tarteel</title></Head>

      <div className={styles.page}>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerNav}>
            <Link href="/" className={styles.back}>← Home</Link>
          </div>
          <div className={styles.headerContent}>
            <div className={styles.headerAr}>أَسْمَاءُ اللَّهِ الْحُسْنَى</div>
            <h1 className={styles.headerTitle}>Asma ul Husna</h1>
            <p className={styles.headerSub}>The 99 Most Beautiful Names of Allah</p>
          </div>
          <blockquote className={styles.headerVerse}>
            <p className={styles.headerVerseAr}>وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا ۖ وَذَرُوا الَّذِينَ يُلْحِدُونَ فِي أَسْمَائِهِ</p>
            <p className={styles.headerVerseEn}>"Allah has the Most Beautiful Names — so call upon Him by them, and leave those who deviate in His Names."</p>
            <cite className={styles.headerVerseSrc}>Al-A'raf 7:180</cite>
          </blockquote>
        </header>

        {/* Search */}
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className={styles.search}
            placeholder="Search by name or meaning…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className={styles.skGrid}>
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className={styles.sk} style={{ animationDelay: `${i * 0.03}s` }}/>
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((name, i) => (
              <button
                key={name.number}
                className={styles.nameCard}
                style={{ animationDelay: `${i * 0.012}s` }}
                onClick={() => openModal(names.findIndex(n => n.number === name.number))}
              >
                <div className={styles.nameNum}>{String(name.number).padStart(2, '0')}</div>
                <div className={styles.nameAr}>{name.name}</div>
                <div className={styles.nameTranslit}>{name.transliteration}</div>
                <div className={styles.nameTrans}>{name.translation}</div>
              </button>
            ))}
          </div>
        )}

        {/* Modal */}
        {modalIdx !== null && (
          <NameModal
            names={names}
            index={modalIdx}
            onClose={closeModal}
            onNext={nextName}
            onPrev={prevName}
            theme={theme}
          />
        )}
      </div>
    </Layout>
  )
}
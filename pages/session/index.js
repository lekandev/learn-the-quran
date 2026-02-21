import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import styles from '../../styles/Session.module.css'

const audioUrl = n => `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${n}.mp3`

// ── Storage helpers ──────────────────────────────────────────
const STORAGE_KEY = 'tarteel_progress_v1'

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveProgress(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

// SM-2 inspired next review interval (simplified for Quran portions)
function nextReview(reviewCount, score) {
  // score 0-2: missed, 1: shaky, 2: clean
  if (score < 1) return 1          // try again tomorrow
  const intervals = [1, 3, 7, 14, 30, 60]
  const idx = Math.min(reviewCount, intervals.length - 1)
  return intervals[idx]
}

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// ── Phases ───────────────────────────────────────────────────
const PHASE = { DHOR: 'dhor', SABAQI: 'sabaqi', SABAQ: 'sabaq', DONE: 'done' }

export default function SessionPage() {
  const [progress, setProgress]   = useState(null)   // full progress object
  const [surahList, setSurahList] = useState([])
  const [surahData, setSurahData] = useState({})       // cached surah data
  const [phase, setPhase]         = useState(null)     // current session phase
  const [sessionQueue, setSessionQueue] = useState([]) // dhor ayahs due today
  const [queueIdx, setQueueIdx]   = useState(0)
  const [currentAyah, setCurrentAyah] = useState(null)
  const [playingAyah, setPlayingAyah] = useState(null)
  const [loadingAyah, setLoadingAyah] = useState(null)
  const [audioProgress, setAudioProgress] = useState(0)
  const [mounted, setMounted]     = useState(false)
  const [sabaqSize, setSabaqSize] = useState(5)        // lines per new lesson
  const [showMemory, setShowMemory] = useState(false)  // Sabaqi: hide text
  const [setupMode, setSetupMode] = useState(false)    // first time setup
  const [setupSurah, setSetupSurah] = useState('1')
  const [setupAyah, setSetupAyah]  = useState('1')
  const audioRef = useRef(null)

  useEffect(() => { setMounted(true) }, [])

  // Load surah list
  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(r => r.json())
      .then(d => setSurahList(d.data))
  }, [])

  // Load progress from localStorage
  useEffect(() => {
    if (!mounted) return
    const p = loadProgress()
    if (!p) { setSetupMode(true); return }
    setProgress(p)
  }, [mounted])

  // When progress is set, build today's session
  useEffect(() => {
    if (!progress) return
    buildSession(progress)
  }, [progress])

  // Fetch surah data (Arabic + English)
  async function fetchSurah(surahNum) {
    if (surahData[surahNum]) return surahData[surahNum]
    const [ar, en] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/quran-uthmani`).then(r => r.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/en.sahih`).then(r => r.json()),
    ])
    const data = { ar: ar.data, en: en.data }
    setSurahData(prev => ({ ...prev, [surahNum]: data }))
    return data
  }

  function buildSession(p) {
    const due = (p.approvedPortions || []).filter(portion => {
      return portion.nextReview <= today()
    })
    setSessionQueue(due)

    if (due.length > 0) {
      setPhase(PHASE.DHOR)
      setQueueIdx(0)
      loadPortionData(due[0])
    } else if (p.pendingSabaqi) {
      setPhase(PHASE.SABAQI)
      loadPortionData(p.pendingSabaqi)
    } else {
      setPhase(PHASE.SABAQ)
      loadSabaqData(p)
    }
  }

  async function loadPortionData(portion) {
    const data = await fetchSurah(portion.surahNum)
    const ayahs = data.ar.ayahs.slice(portion.startIdx, portion.endIdx)
    const enAyahs = data.en.ayahs.slice(portion.startIdx, portion.endIdx)
    setCurrentAyah({ portion, ayahs, enAyahs, surahName: data.ar.name, surahEn: data.ar.englishName })
  }

  async function loadSabaqData(p) {
    const surahNum = p.currentSurah
    const startIdx = p.currentAyahIdx
    const data = await fetchSurah(surahNum)
    const total = data.ar.ayahs.length
    const endIdx = Math.min(startIdx + sabaqSize, total)
    const ayahs = data.ar.ayahs.slice(startIdx, endIdx)
    const enAyahs = data.en.ayahs.slice(startIdx, endIdx)
    const portion = { surahNum, startIdx, endIdx, id: `${surahNum}-${startIdx}` }
    setCurrentAyah({ portion, ayahs, enAyahs, surahName: data.ar.name, surahEn: data.ar.englishName, isSabaq: true })
  }

  // ── Audio ────────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.oncanplay = null
      audioRef.current.ontimeupdate = null
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current = null
    }
    setPlayingAyah(null)
    setLoadingAyah(null)
    setAudioProgress(0)
  }, [])

  const playAyah = useCallback((ayahNumInSurah, globalNum) => {
    if (playingAyah === ayahNumInSurah) { stopAudio(); return }
    stopAudio()
    setLoadingAyah(ayahNumInSurah)
    const audio = new Audio()
    audioRef.current = audio
    audio.ontimeupdate = () => {
      if (audio.duration > 0) setAudioProgress((audio.currentTime / audio.duration) * 100)
    }
    audio.onended = () => { setPlayingAyah(null); setLoadingAyah(null); setAudioProgress(0) }
    audio.onerror = () => { setLoadingAyah(null); setPlayingAyah(null) }

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

  // Play all ayahs in current portion sequentially
  function playAll() {
    if (!currentAyah) return
    const first = currentAyah.ayahs[0]
    playAyah(first.numberInSurah, first.number)
  }

  // ── Session actions ──────────────────────────────────────
  function markDhor(score) {
    const portion = sessionQueue[queueIdx]
    const newProgress = { ...progress }
    newProgress.approvedPortions = newProgress.approvedPortions.map(p => {
      if (p.id === portion.id) {
        const rc = (p.reviewCount || 0) + 1
        return { ...p, reviewCount: rc, nextReview: daysFromNow(nextReview(rc, score)), lastScore: score }
      }
      return p
    })

    const nextIdx = queueIdx + 1
    if (nextIdx < sessionQueue.length) {
      setQueueIdx(nextIdx)
      loadPortionData(sessionQueue[nextIdx])
      saveProgress(newProgress)
      setProgress(newProgress)
    } else {
      // Dhor done, move to sabaqi
      saveProgress(newProgress)
      setProgress(newProgress)
      if (newProgress.pendingSabaqi) {
        setPhase(PHASE.SABAQI)
        loadPortionData(newProgress.pendingSabaqi)
      } else {
        setPhase(PHASE.SABAQ)
        loadSabaqData(newProgress)
      }
    }
  }

  function markSabaqi(passed) {
    const newProgress = { ...progress }
    if (passed) {
      // Graduate the sabaqi to approved
      const portion = { ...newProgress.pendingSabaqi, reviewCount: 0, nextReview: daysFromNow(1), lastScore: 2 }
      newProgress.approvedPortions = [...(newProgress.approvedPortions || []), portion]
      newProgress.pendingSabaqi = null
    }
    saveProgress(newProgress)
    setProgress(newProgress)
    setPhase(PHASE.SABAQ)
    loadSabaqData(newProgress)
  }

  function approveSabaq() {
    if (!currentAyah) return
    const { portion } = currentAyah
    const newProgress = { ...progress }
    // Today's sabaq becomes tomorrow's sabaqi
    newProgress.pendingSabaqi = { ...portion, id: `${portion.surahNum}-${portion.startIdx}` }
    // Advance current position
    const data = surahData[portion.surahNum]
    if (data && portion.endIdx >= data.ar.ayahs.length) {
      // Move to next surah
      newProgress.currentSurah = portion.surahNum + 1
      newProgress.currentAyahIdx = 0
    } else {
      newProgress.currentAyahIdx = portion.endIdx
    }
    saveProgress(newProgress)
    setProgress(newProgress)
    setPhase(PHASE.DONE)
  }

  function initProgress() {
    const newP = {
      currentSurah: parseInt(setupSurah),
      currentAyahIdx: parseInt(setupAyah) - 1,
      approvedPortions: [],
      pendingSabaqi: null,
      startedAt: today(),
    }
    saveProgress(newP)
    setProgress(newP)
    setSetupMode(false)
  }

  // ── Render helpers ───────────────────────────────────────
  const surahInfo = surahList.find(s => s.number === progress?.currentSurah)
  const dhorRemaining = sessionQueue.length - queueIdx

  if (!mounted) return null

  // ── Setup screen ─────────────────────────────────────────
  if (setupMode) return (
    <div className={styles.page}>
      <Head><title>Start Learning · Tarteel</title></Head>
      <nav className={styles.nav}>
        <Link href="/" className={styles.back}>← Back</Link>
        <span className={styles.navTitle}>Begin your journey</span>
        <span/>
      </nav>
      <div className={styles.setupWrap}>
        <div className={styles.setupCard}>
          <div className={styles.setupIcon}>بد</div>
          <h2 className={styles.setupTitle}>Where shall we start?</h2>
          <p className={styles.setupSub}>
            Most beginners start with Surah Al-Fatiha (1) or Juz Amma — Surah An-Naba (78).
          </p>
          <div className={styles.setupFields}>
            <div className={styles.field}>
              <label className={styles.label}>Surah</label>
              <select
                className={styles.select}
                value={setupSurah}
                onChange={e => { setSetupSurah(e.target.value); setSetupAyah('1') }}
              >
                {surahList.map(s => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.englishName} ({s.name})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Starting from verse</label>
              <input
                className={styles.input}
                type="number"
                min="1"
                max={surahList.find(s=>String(s.number)===setupSurah)?.numberOfAyahs || 999}
                value={setupAyah}
                onChange={e => setSetupAyah(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Daily lesson size (verses)</label>
              <div className={styles.sizeButtons}>
                {[3,5,7,10].map(n => (
                  <button
                    key={n}
                    className={`${styles.sizeBtn} ${sabaqSize===n ? styles.sizeBtnOn:''}`}
                    onClick={() => setSabaqSize(n)}
                  >{n}</button>
                ))}
              </div>
            </div>
          </div>
          <button className={styles.startBtn} onClick={initProgress} disabled={surahList.length === 0}>
            Begin Session
          </button>
        </div>
      </div>
    </div>
  )

  // ── Done screen ──────────────────────────────────────────
  if (phase === PHASE.DONE) return (
    <div className={styles.page}>
      <Head><title>Session Complete · Tarteel</title></Head>
      <nav className={styles.nav}>
        <Link href="/" className={styles.back}>← Home</Link>
        <span className={styles.navTitle}>Session</span>
        <span/>
      </nav>
      <div className={styles.doneWrap}>
        <div className={styles.doneCard}>
          <div className={styles.doneIcon}>✦</div>
          <h2 className={styles.doneTitle}>Session complete</h2>
          <p className={styles.doneSub}>
            Your new lesson is set for review tomorrow.
            Come back then to begin the next cycle.
          </p>
          <div className={styles.doneStats}>
            <div className={styles.doneStat}>
              <span className={styles.doneStatN}>{sessionQueue.length || 0}</span>
              <span className={styles.doneStatL}>Reviewed</span>
            </div>
            <div className={styles.doneStatDiv}/>
            <div className={styles.doneStat}>
              <span className={styles.doneStatN}>1</span>
              <span className={styles.doneStatL}>New lesson</span>
            </div>
          </div>
          <div className={styles.doneActions}>
            <Link href="/" className={styles.doneBtn}>Back to Surahs</Link>
            <button className={styles.doneBtn} onClick={() => {
              const p = loadProgress()
              setProgress(p)
              buildSession(p)
            }}>
              New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── Loading state ────────────────────────────────────────
  if (!phase || !currentAyah) return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.back}>← Home</Link>
        <span className={styles.navTitle}>Loading session…</span>
        <span/>
      </nav>
      <div className={styles.loadingWrap}>
        {Array.from({length:4}).map((_,i) => (
          <div key={i} className={styles.sk} style={{animationDelay:`${i*0.1}s`}} />
        ))}
      </div>
    </div>
  )

  // ── Phase label ──────────────────────────────────────────
  const phaseLabel = {
    [PHASE.DHOR]:   { tag: 'Dhor', sub: `Review ${queueIdx+1} of ${sessionQueue.length}`, color: '#5a7fa8' },
    [PHASE.SABAQI]: { tag: 'Sabaqi', sub: 'Yesterday\'s lesson — from memory', color: '#8a6fa0' },
    [PHASE.SABAQ]:  { tag: 'Sabaq', sub: 'Today\'s new lesson', color: 'var(--amber)' },
  }[phase]

  const { ayahs, enAyahs, surahName, surahEn: surahEnName, isSabaq, portion } = currentAyah

  return (
    <div className={styles.page}>
      <Head><title>{phaseLabel.tag} · Tarteel</title></Head>

      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.back}>← Home</Link>
        <span className={styles.navTitle}>Daily Session</span>
        <span/>
      </nav>

      {/* ── Phase bar ── */}
      <div className={styles.phaseBar}>
        {[PHASE.DHOR, PHASE.SABAQI, PHASE.SABAQ].map(p => (
          <div key={p} className={`${styles.phaseStep} ${phase===p ? styles.phaseActive : ''} ${
            (p===PHASE.SABAQI && (phase===PHASE.SABAQ||phase===PHASE.DONE)) ||
            (p===PHASE.DHOR && phase!==PHASE.DHOR) ? styles.phaseDone : ''
          }`}>
            <div className={styles.phaseDot}/>
            <span>{p === PHASE.DHOR ? 'Review' : p === PHASE.SABAQI ? 'Sabaqi' : 'New Lesson'}</span>
          </div>
        ))}
      </div>

      {/* ── Phase card ── */}
      <div className={styles.phaseCard}>
        <div className={styles.phaseTop}>
          <span className={styles.phaseTag} style={{color: phaseLabel.color, borderColor: phaseLabel.color+'44', background: phaseLabel.color+'0f'}}>
            {phaseLabel.tag}
          </span>
          <span className={styles.phaseSub}>{phaseLabel.sub}</span>
        </div>

        {/* Surah name + position */}
        <div className={styles.portionInfo}>
          <span className={styles.portionAr}>{surahName}</span>
          <span className={styles.portionEn}>{surahEnName}</span>
          <span className={styles.portionRange}>
            Verse {ayahs[0]?.numberInSurah}
            {ayahs.length > 1 ? ` – ${ayahs[ayahs.length-1]?.numberInSurah}` : ''}
          </span>
        </div>

        {/* Memory toggle for Sabaqi */}
        {phase === PHASE.SABAQI && (
          <div className={styles.memoryRow}>
            <button
              className={`${styles.memBtn} ${showMemory ? styles.memBtnOn : ''}`}
              onClick={() => setShowMemory(v => !v)}
            >
              {showMemory ? 'Show text' : 'Hide text — recite from memory'}
            </button>
          </div>
        )}

        {/* Listen button */}
        <button className={styles.listenBtn} onClick={playAll}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Listen to this portion
        </button>
      </div>

      {/* ── Ayah list ── */}
      <div className={styles.ayahList}>
        {ayahs.map((ayah, i) => {
          const en = enAyahs[i]
          const playing = playingAyah === ayah.numberInSurah
          const isLoading = loadingAyah === ayah.numberInSurah
          const hidden = phase === PHASE.SABAQI && showMemory

          return (
            <div key={ayah.number}
              className={`${styles.ayahRow} ${playing ? styles.ayahPlaying : ''}`}
              style={{animationDelay:`${i*0.06}s`}}
            >
              <div className={styles.ayahNum}>{ayah.numberInSurah}</div>
              <div className={styles.ayahContent}>
                <div
                  className={`${styles.ayahAr} ${hidden ? styles.ayahHidden : ''}`}
                  onClick={() => !hidden && playAyah(ayah.numberInSurah, ayah.number)}
                >
                  {hidden ? '• • • • •' : ayah.text}
                </div>
                {!hidden && en && (
                  <div className={styles.ayahEn}>{en.text}</div>
                )}
              </div>
              <button
                className={`${styles.playBtn} ${playing ? styles.playOn : ''}`}
                onClick={() => playAyah(ayah.numberInSurah, ayah.number)}
                disabled={hidden}
              >
                {isLoading ? <span className={styles.spin}/> :
                 playing   ? <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg> :
                             <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><path d="M8 5v14l11-7z"/></svg>}
                {playing && (
                  <svg className={styles.ring} viewBox="0 0 38 38">
                    <circle cx="19" cy="19" r="17" fill="none" stroke="var(--amber-soft)" strokeWidth="2.5"/>
                    <circle cx="19" cy="19" r="17" fill="none" stroke="var(--amber)" strokeWidth="2.5"
                      strokeDasharray={`${2*Math.PI*17}`}
                      strokeDashoffset={`${2*Math.PI*17*(1-audioProgress/100)}`}
                      strokeLinecap="round" transform="rotate(-90 19 19)"
                      style={{transition:'stroke-dashoffset 0.25s linear'}}
                    />
                  </svg>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Action buttons ── */}
      <div className={styles.actions}>
        {phase === PHASE.DHOR && (
          <>
            <button className={`${styles.actionBtn} ${styles.actionWeak}`} onClick={() => markDhor(0)}>
              <span>Missed some</span>
              <span className={styles.actionHint}>Review again tomorrow</span>
            </button>
            <button className={`${styles.actionBtn} ${styles.actionShaky}`} onClick={() => markDhor(1)}>
              <span>Shaky</span>
              <span className={styles.actionHint}>Review in 3 days</span>
            </button>
            <button className={`${styles.actionBtn} ${styles.actionClean}`} onClick={() => markDhor(2)}>
              <span>Clean ✓</span>
              <span className={styles.actionHint}>Review in {nextReview(sessionQueue[queueIdx]?.reviewCount||0, 2)} days</span>
            </button>
          </>
        )}

        {phase === PHASE.SABAQI && (
          <>
            <button className={`${styles.actionBtn} ${styles.actionWeak}`} onClick={() => markSabaqi(false)}>
              <span>Couldn't recite</span>
              <span className={styles.actionHint}>Stay in sabaqi tomorrow</span>
            </button>
            <button className={`${styles.actionBtn} ${styles.actionClean}`} onClick={() => markSabaqi(true)}>
              <span>Recited well ✓</span>
              <span className={styles.actionHint}>Move to review queue</span>
            </button>
          </>
        )}

        {phase === PHASE.SABAQ && (
          <>
            <div className={styles.sabaqNote}>
              Listen until comfortable, then mark ready to memorize.
            </div>
            <button className={`${styles.actionBtn} ${styles.actionClean} ${styles.actionFull}`} onClick={approveSabaq}>
              <span>Ready — set as tomorrow's Sabaqi ✓</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
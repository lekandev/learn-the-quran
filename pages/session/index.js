import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../../components/Layout'
import styles from '../../styles/Session.module.css'

const audioUrl = n => `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${n}.mp3`
const STORAGE_KEY = 'tarteel_progress_v1'
const PHASE = { DHOR: 'dhor', SABAQI: 'sabaqi', SABAQ: 'sabaq', DONE: 'done' }

function loadProgress() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null } catch { return null }
}
function saveProgress(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}
function calcNextReview(reviewCount, score) {
  if (score < 1) return 1
  const intervals = [1, 3, 7, 14, 30, 60]
  return intervals[Math.min(reviewCount, intervals.length - 1)]
}
function daysFromNow(n) {
  const d = new Date(); d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}
function today() { return new Date().toISOString().split('T')[0] }

// ── Recorder hook ─────────────────────────────────────────────
function useRecorder() {
  const [recState, setRecState]   = useState('idle')  // idle | recording | recorded
  const [blobUrl, setBlobUrl]     = useState(null)
  const [duration, setDuration]   = useState(0)
  const mediaRef    = useRef(null)
  const chunksRef   = useRef([])
  const analyserRef = useRef(null)
  const sourceRef   = useRef(null)
  const streamRef   = useRef(null)
  const timerRef    = useRef(null)
  const durationRef = useRef(0)

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (mediaRef.current && mediaRef.current.state !== 'inactive') mediaRef.current.stop()
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (sourceRef.current) sourceRef.current.disconnect()
    streamRef.current = null; mediaRef.current = null
    analyserRef.current = null; sourceRef.current = null
    chunksRef.current = []
  }, [])

  const startRecording = useCallback(async (canvasEl) => {
    try {
      cleanup()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // AudioContext for waveform
      const actx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = actx.createAnalyser()
      analyser.fftSize = 128
      const source = actx.createMediaStreamSource(stream)
      source.connect(analyser)
      analyserRef.current = analyser
      sourceRef.current = source

      // Draw waveform
      if (canvasEl) {
        const ctx2d = canvasEl.getContext('2d')
        const draw = () => {
          if (!analyserRef.current) return
          requestAnimationFrame(draw)
          const buf = new Uint8Array(analyser.frequencyBinCount)
          analyser.getByteFrequencyData(buf)
          const W = canvasEl.width, H = canvasEl.height
          ctx2d.clearRect(0, 0, W, H)
          const barW = 3, gap = 2
          const total = Math.floor(W / (barW + gap))
          const step = Math.floor(buf.length / total)
          const brand = getComputedStyle(document.documentElement)
            .getPropertyValue('--brand').trim() || '#9E6B3F'
          for (let i = 0; i < total; i++) {
            const val = buf[i * step] / 255
            const barH = Math.max(3, val * H * 0.85)
            const x = i * (barW + gap)
            ctx2d.fillStyle = brand
            ctx2d.globalAlpha = 0.6 + val * 0.4
            ctx2d.beginPath()
            ctx2d.roundRect(x, (H - barH) / 2, barW, barH, 1.5)
            ctx2d.fill()
          }
          ctx2d.globalAlpha = 1
        }
        draw()
      }

      // MediaRecorder
      const mr = new MediaRecorder(stream)
      mediaRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url })
        setRecState('recorded')
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      }
      mr.start()

      durationRef.current = 0
      setDuration(0)
      timerRef.current = setInterval(() => {
        durationRef.current += 1; setDuration(durationRef.current)
      }, 1000)
      setRecState('recording')
    } catch (err) {
      console.error('Mic error:', err)
      setRecState('idle')
    }
  }, [cleanup])

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (mediaRef.current && mediaRef.current.state === 'recording') mediaRef.current.stop()
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
  }, [])

  const reset = useCallback(() => {
    cleanup()
    setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    setRecState('idle')
    setDuration(0)
    durationRef.current = 0
  }, [cleanup])

  useEffect(() => () => { cleanup(); if (blobUrl) URL.revokeObjectURL(blobUrl) }, [])

  return { recState, blobUrl, duration, analyserRef, startRecording, stopRecording, reset }
}

// ── Recorder panel component ──────────────────────────────────
function RecorderPanel({ onRated, phase }) {
  const canvasRef = useRef(null)
  const pbRef     = useRef(null)
  const [pbPlaying, setPbPlaying] = useState(false)
  const [pbProgress, setPbProgress] = useState(0)
  const [hasListened, setHasListened] = useState(false)
  const { recState, blobUrl, duration, startRecording, stopRecording, reset } = useRecorder()

  const fmtTime = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  const handleMic = () => {
    if (recState === 'idle') startRecording(canvasRef.current)
    else if (recState === 'recording') stopRecording()
  }

  const togglePlayback = () => {
    if (!pbRef.current) return
    if (pbPlaying) { pbRef.current.pause(); setPbPlaying(false) }
    else { pbRef.current.play(); setPbPlaying(true); setHasListened(true) }
  }

  const scoreLabels = phase === PHASE.DHOR
    ? [
        { score: 0, label: 'Missed some',  hint: 'Tomorrow',         cls: styles.rateWeak },
        { score: 1, label: 'Shaky',        hint: 'In 3 days',        cls: styles.rateShaky },
        { score: 2, label: 'Clean ✓',      hint: 'Spaced review',    cls: styles.rateClean },
      ]
    : [
        { score: 0, label: "Couldn't recite", hint: 'Repeat tomorrow', cls: styles.rateWeak },
        { score: 2, label: 'Recited well ✓',  hint: 'Move to review',  cls: styles.rateClean },
      ]

  return (
    <div className={styles.recPanel}>
      {/* Mic / waveform zone */}
      <div className={styles.recCenter}>
        {recState === 'idle' && (
          <button className={styles.micBtn} onClick={handleMic} aria-label="Start recording">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="26" height="26">
              <rect x="9" y="2" width="6" height="12" rx="3"/>
              <path d="M5 10a7 7 0 0 0 14 0"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="8" y1="22" x2="16" y2="22"/>
            </svg>
            <span className={styles.micLabel}>Record recitation</span>
          </button>
        )}

        {recState === 'recording' && (
          <div className={styles.recordingState}>
            <button className={styles.micBtnRec} onClick={handleMic} aria-label="Stop recording">
              <span className={styles.recPulse}/>
              <span className={styles.recDot}/>
            </button>
            <span className={styles.recTimer}>{fmtTime(duration)}</span>
            <canvas
              ref={canvasRef}
              className={styles.waveCanvas}
              width={280}
              height={48}
            />
            <span className={styles.recHint}>Tap to stop</span>
          </div>
        )}

        {recState === 'recorded' && (
          <div className={styles.recordedState}>
            <div className={styles.pbRow}>
              <button className={styles.pbBtn} onClick={togglePlayback}>
                {pbPlaying
                  ? <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>
                  : <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z"/></svg>
                }
              </button>
              <div className={styles.pbBar}>
                <div className={styles.pbFill} style={{ width: `${pbProgress}%` }}/>
              </div>
              <span className={styles.pbDur}>{fmtTime(duration)}</span>
              <button className={styles.rerecBtn} onClick={reset} title="Re-record">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
              </button>
            </div>
            <audio
              ref={pbRef}
              src={blobUrl}
              onTimeUpdate={() => {
                const a = pbRef.current
                if (a && a.duration > 0) setPbProgress((a.currentTime / a.duration) * 100)
              }}
              onEnded={() => { setPbPlaying(false); setPbProgress(0) }}
            />
            {!hasListened && (
              <p className={styles.listenPrompt}>Listen back first, then rate yourself</p>
            )}
          </div>
        )}
      </div>

      {/* Rating buttons — only show after recording */}
      {recState === 'recorded' && (
        <div className={`${styles.rateRow} ${scoreLabels.length === 2 ? styles.rateRow2 : ''}`}>
          {scoreLabels.map(({ score, label, hint, cls }) => (
            <button key={score} className={`${styles.rateBtn} ${cls}`} onClick={() => onRated(score)}>
              <span>{label}</span>
              <span className={styles.rateHint}>{hint}</span>
            </button>
          ))}
        </div>
      )}

      {/* Skip link */}
      {recState === 'idle' && (
        <button className={styles.skipRec} onClick={() => onRated(null)}>
          Skip recording — rate directly
        </button>
      )}
    </div>
  )
}

// ── Direct rating (fallback / skip) ──────────────────────────
function DirectRating({ phase, onRated, reviewCount }) {
  const btns = phase === PHASE.DHOR ? [
    { score: 0, label: 'Missed some',  hint: 'Tomorrow', cls: styles.actionWeak },
    { score: 1, label: 'Shaky',        hint: 'In 3 days', cls: styles.actionShaky },
    { score: 2, label: 'Clean ✓',      hint: `In ${calcNextReview(reviewCount||0, 2)} days`, cls: styles.actionClean },
  ] : [
    { score: 0, label: "Couldn't recite", hint: 'Repeat tomorrow', cls: styles.actionWeak },
    { score: 2, label: 'Recited well ✓',  hint: 'Move to review',  cls: styles.actionClean },
  ]
  return (
    <div className={styles.actions}>
      {btns.map(({ score, label, hint, cls }) => (
        <button key={score} className={`${styles.actionBtn} ${cls}`} onClick={() => onRated(score)}>
          <span>{label}</span>
          <span className={styles.actionHint}>{hint}</span>
        </button>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function SessionPage({ theme, toggleTheme }) {
  const [progress, setProgress]         = useState(null)
  const [surahList, setSurahList]       = useState([])
  const [surahData, setSurahData]       = useState({})
  const [phase, setPhase]               = useState(null)
  const [sessionQueue, setSessionQueue] = useState([])
  const [queueIdx, setQueueIdx]         = useState(0)
  const [currentAyah, setCurrentAyah]   = useState(null)
  const [playingAyah, setPlayingAyah]   = useState(null)
  const [loadingAyah, setLoadingAyah]   = useState(null)
  const [audioProgress, setAudioProgress] = useState(0)
  const [mounted, setMounted]           = useState(false)
  const [sabaqSize, setSabaqSize]       = useState(5)
  const [showMemory, setShowMemory]     = useState(false)
  const [setupMode, setSetupMode]       = useState(false)
  const [setupSurah, setSetupSurah]     = useState('1')
  const [setupAyah, setSetupAyah]       = useState('1')
  const [ratingMode, setRatingMode]     = useState('record') // 'record' | 'direct'
  const audioRef = useRef(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah').then(r => r.json()).then(d => setSurahList(d.data))
  }, [])

  useEffect(() => {
    if (!mounted) return
    const p = loadProgress()
    if (!p) { setSetupMode(true); return }
    setProgress(p)
  }, [mounted])

  useEffect(() => { if (progress) buildSession(progress) }, [progress])

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
    const due = (p.approvedPortions || []).filter(pt => pt.nextReview <= today())
    setSessionQueue(due)
    setRatingMode('record')
    if (due.length > 0) {
      setPhase(PHASE.DHOR); setQueueIdx(0); loadPortionData(due[0])
    } else if (p.pendingSabaqi) {
      setPhase(PHASE.SABAQI); loadPortionData(p.pendingSabaqi)
    } else {
      setPhase(PHASE.SABAQ); loadSabaqData(p)
    }
  }

  async function loadPortionData(portion) {
    const data = await fetchSurah(portion.surahNum)
    setCurrentAyah({
      portion,
      ayahs: data.ar.ayahs.slice(portion.startIdx, portion.endIdx),
      enAyahs: data.en.ayahs.slice(portion.startIdx, portion.endIdx),
      surahName: data.ar.name, surahEn: data.ar.englishName,
    })
  }

  async function loadSabaqData(p) {
    const surahNum = p.currentSurah
    const startIdx = p.currentAyahIdx
    const data = await fetchSurah(surahNum)
    const endIdx = Math.min(startIdx + sabaqSize, data.ar.ayahs.length)
    setCurrentAyah({
      portion: { surahNum, startIdx, endIdx, id: `${surahNum}-${startIdx}` },
      ayahs: data.ar.ayahs.slice(startIdx, endIdx),
      enAyahs: data.en.ayahs.slice(startIdx, endIdx),
      surahName: data.ar.name, surahEn: data.ar.englishName, isSabaq: true,
    })
  }

  // Audio
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.ontimeupdate = null; audioRef.current.onended = null
      audioRef.current.onerror = null; audioRef.current = null
    }
    setPlayingAyah(null); setLoadingAyah(null); setAudioProgress(0)
  }, [])

  const playAyah = useCallback((numInSurah, globalNum) => {
    if (playingAyah === numInSurah) { stopAudio(); return }
    stopAudio(); setLoadingAyah(numInSurah)
    const audio = new Audio(); audioRef.current = audio
    audio.ontimeupdate = () => { if (audio.duration > 0) setAudioProgress((audio.currentTime / audio.duration) * 100) }
    audio.onended = () => { setPlayingAyah(null); setLoadingAyah(null); setAudioProgress(0) }
    audio.onerror = () => { setLoadingAyah(null); setPlayingAyah(null) }
    audio.src = audioUrl(globalNum)
    audio.play()
      .then(() => { setLoadingAyah(null); setPlayingAyah(numInSurah) })
      .catch(() => { setLoadingAyah(null); setPlayingAyah(null) })
  }, [playingAyah, stopAudio])

  useEffect(() => () => stopAudio(), [stopAudio])

  function playAll() {
    if (!currentAyah) return
    const first = currentAyah.ayahs[0]
    playAyah(first.numberInSurah, first.number)
  }

  // Session actions
  function handleRating(score) {
    if (score === null) { setRatingMode('direct'); return }
    if (phase === PHASE.DHOR) markDhor(score)
    else if (phase === PHASE.SABAQI) markSabaqi(score >= 2)
    setRatingMode('record')
  }

  function markDhor(score) {
    const portion = sessionQueue[queueIdx]
    const newP = { ...progress }
    newP.approvedPortions = newP.approvedPortions.map(p => {
      if (p.id !== portion.id) return p
      const rc = (p.reviewCount || 0) + 1
      return { ...p, reviewCount: rc, nextReview: daysFromNow(calcNextReview(rc, score)), lastScore: score }
    })
    const nextIdx = queueIdx + 1
    saveProgress(newP); setProgress(newP)
    if (nextIdx < sessionQueue.length) {
      setQueueIdx(nextIdx); loadPortionData(sessionQueue[nextIdx])
    } else if (newP.pendingSabaqi) {
      setPhase(PHASE.SABAQI); loadPortionData(newP.pendingSabaqi)
    } else {
      setPhase(PHASE.SABAQ); loadSabaqData(newP)
    }
  }

  function markSabaqi(passed) {
    const newP = { ...progress }
    if (passed) {
      const pt = newP.pendingSabaqi
      if (pt) {
        newP.approvedPortions = [...(newP.approvedPortions || []), { ...pt, reviewCount: 0, nextReview: daysFromNow(3), lastScore: 2 }]
        newP.pendingSabaqi = null
      }
    }
    saveProgress(newP); setProgress(newP)
    setPhase(PHASE.SABAQ); loadSabaqData(newP)
  }

  function approveSabaq() {
    const newP = { ...progress }
    const { portion } = currentAyah
    newP.pendingSabaqi = { ...portion }
    newP.currentAyahIdx = (newP.currentAyahIdx || 0) + sabaqSize
    const surahInfo = surahList.find(s => s.number === portion.surahNum)
    if (surahInfo && newP.currentAyahIdx >= surahInfo.numberOfAyahs) {
      newP.currentSurah = Math.min((newP.currentSurah || 1) + 1, 114)
      newP.currentAyahIdx = 0
    }
    saveProgress(newP); setProgress(newP)
    setPhase(PHASE.DONE)
  }

  // ── Setup ─────────────────────────────────────────────────
  if (setupMode) return (
    <Layout theme={theme} toggleTheme={toggleTheme}>
      <div className={styles.page}>
        <Head><title>Setup · Tarteel</title></Head>
        <nav className={styles.nav}>
          <Link href="/" className={styles.back}>← Home</Link>
          <span className={styles.navTitle}>Set Up Your Journey</span>
          <span/>
        </nav>
        <div className={styles.setupWrap}>
          <div className={styles.setupCard}>
            <div className={styles.setupIcon}>ترتيل</div>
            <div className={styles.setupTitle}>Begin your memorisation</div>
            <div className={styles.setupSub}>
              The Islamiyyah method: daily new lesson (Sabaq), yesterday&apos;s review (Sabaqi), and spaced repetition of all previous work (Dhor).
            </div>
            <div className={styles.setupFields}>
              <div className={styles.field}>
                <label className={styles.label}>Start from Surah</label>
                <select className={styles.select} value={setupSurah} onChange={e => setSetupSurah(e.target.value)}>
                  {surahList.map(s => (
                    <option key={s.number} value={s.number}>{s.number}. {s.englishName} — {s.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Starting verse</label>
                <input className={styles.input} type="number" min="1" value={setupAyah} onChange={e => setSetupAyah(e.target.value)}/>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Daily lesson size (verses)</label>
                <div className={styles.sizeButtons}>
                  {[3,5,7,10].map(n => (
                    <button key={n} className={`${styles.sizeBtn} ${sabaqSize===n ? styles.sizeBtnOn:''}`}
                      onClick={() => setSabaqSize(n)}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
            <button className={styles.startBtn} disabled={!surahList.length} onClick={() => {
              const p = {
                currentSurah: parseInt(setupSurah),
                currentAyahIdx: parseInt(setupAyah) - 1,
                approvedPortions: [],
                pendingSabaqi: null,
                startedAt: today(),
              }
              saveProgress(p); setProgress(p); setSetupMode(false)
            }}>
              Begin — بسم الله
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )

  // ── Done ─────────────────────────────────────────────────
  if (phase === PHASE.DONE) return (
    <Layout theme={theme} toggleTheme={toggleTheme}>
      <div className={styles.page}>
        <Head><title>Done · Tarteel</title></Head>
        <nav className={styles.nav}>
          <Link href="/" className={styles.back}>← Home</Link>
          <span className={styles.navTitle}>Session Complete</span>
          <span/>
        </nav>
        <div className={styles.doneWrap}>
          <div className={styles.doneCard}>
            <div className={styles.doneIcon}>
              <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" width="40" height="40" style={{color:'var(--brand)'}}>
                <polygon points="15,3 25,3 37,15 37,25 25,37 15,37 3,25 3,15"/>
                <path d="M13 20l5 5 9-9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.doneTitle}>بارك الله فيك</div>
            <div className={styles.doneSub}>Session complete. Consistency is the key — return tomorrow for your Sabaqi.</div>
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
                const p = loadProgress(); setProgress(p); buildSession(p)
              }}>New Session</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )

  // ── Loading ───────────────────────────────────────────────
  if (!phase || !currentAyah) return (
    <Layout theme={theme} toggleTheme={toggleTheme}>
      <div className={styles.page}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.back}>← Home</Link>
          <span className={styles.navTitle}>Loading…</span>
          <span/>
        </nav>
        <div className={styles.loadingWrap}>
          {Array.from({length:4}).map((_,i) => (
            <div key={i} className={styles.sk} style={{animationDelay:`${i*0.1}s`}} />
          ))}
        </div>
      </div>
    </Layout>
  )

  const phaseLabel = {
    [PHASE.DHOR]:   { tag: 'Dhor',   sub: `Review ${queueIdx+1} of ${sessionQueue.length}`, color: '#5a7fa8' },
    [PHASE.SABAQI]: { tag: 'Sabaqi', sub: "Yesterday's lesson — recite from memory", color: '#8a6fa0' },
    [PHASE.SABAQ]:  { tag: 'Sabaq',  sub: "Today's new lesson", color: 'var(--brand)' },
  }[phase]

  const { ayahs, enAyahs, surahName, surahEn: surahEnName, isSabaq } = currentAyah
  const showRecorder = phase === PHASE.DHOR || phase === PHASE.SABAQI

  return (
    <Layout theme={theme} toggleTheme={toggleTheme}>
      <div className={styles.page}>
        <Head><title>{phaseLabel.tag} · Tarteel</title></Head>

        <nav className={styles.nav}>
          <Link href="/" className={styles.back}>← Home</Link>
          <span className={styles.navTitle}>Daily Session</span>
          <span/>
        </nav>

        {/* Phase bar */}
        <div className={styles.phaseBar}>
          {[PHASE.DHOR, PHASE.SABAQI, PHASE.SABAQ].map(p => (
            <div key={p} className={`${styles.phaseStep} ${phase===p ? styles.phaseActive : ''} ${
              (p===PHASE.DHOR && phase!==PHASE.DHOR) ||
              (p===PHASE.SABAQI && (phase===PHASE.SABAQ||phase===PHASE.DONE)) ? styles.phaseDone : ''
            }`}>
              <div className={styles.phaseDot}/>
              <span>{p === PHASE.DHOR ? 'Review' : p === PHASE.SABAQI ? 'Sabaqi' : 'New Lesson'}</span>
            </div>
          ))}
        </div>

        {/* Phase card */}
        <div className={styles.phaseCard}>
          <div className={styles.phaseTop}>
            <span className={styles.phaseTag} style={{color:phaseLabel.color, borderColor:phaseLabel.color+'44', background:phaseLabel.color+'0f'}}>
              {phaseLabel.tag}
            </span>
            <span className={styles.phaseSub}>{phaseLabel.sub}</span>
          </div>
          <div className={styles.portionInfo}>
            <span className={styles.portionAr}>{surahName}</span>
            <span className={styles.portionEn}>{surahEnName}</span>
            <span className={styles.portionRange}>
              Verse {ayahs[0]?.numberInSurah}{ayahs.length > 1 ? ` – ${ayahs[ayahs.length-1]?.numberInSurah}` : ''}
            </span>
          </div>
          {phase === PHASE.SABAQI && (
            <div className={styles.memoryRow}>
              <button className={`${styles.memBtn} ${showMemory ? styles.memBtnOn:''}`}
                onClick={() => setShowMemory(v => !v)}>
                {showMemory ? 'Show text' : 'Hide text — recite from memory'}
              </button>
            </div>
          )}
          <button className={styles.listenBtn} onClick={playAll}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M8 5v14l11-7z"/></svg>
            Listen to this portion
          </button>
        </div>

        {/* Ayah list */}
        <div className={styles.ayahList}>
          {ayahs.map((ayah, i) => {
            const en = enAyahs[i]
            const playing   = playingAyah === ayah.numberInSurah
            const isLoading = loadingAyah === ayah.numberInSurah
            const hidden    = phase === PHASE.SABAQI && showMemory
            return (
              <div key={ayah.number}
                className={`${styles.ayahRow} ${playing ? styles.ayahPlaying:''}`}
                style={{animationDelay:`${i*0.05}s`}}
              >
                <div className={styles.ayahNum}>{ayah.numberInSurah}</div>
                <div className={styles.ayahContent}>
                  <div className={`${styles.ayahAr} ${hidden ? styles.ayahHidden:''}`}
                    onClick={() => !hidden && playAyah(ayah.numberInSurah, ayah.number)}>
                    {hidden ? '• • • • •' : ayah.text}
                  </div>
                  {!hidden && en && <div className={styles.ayahEn}>{en.text}</div>}
                </div>
                <button
                  className={`${styles.playBtn} ${playing ? styles.playOn:''}`}
                  onClick={() => playAyah(ayah.numberInSurah, ayah.number)}
                  disabled={hidden}
                >
                  {isLoading ? <span className={styles.spin}/> :
                   playing   ? <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg> :
                               <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><path d="M8 5v14l11-7z"/></svg>}
                  {playing && (
                    <svg className={styles.ring} viewBox="0 0 38 38">
                      <circle cx="19" cy="19" r="17" fill="none" stroke="var(--brand-soft)" strokeWidth="2.5"/>
                      <circle cx="19" cy="19" r="17" fill="none" stroke="var(--brand)" strokeWidth="2.5"
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

        {/* Rating / recorder / sabaq actions */}
        {showRecorder && (
          ratingMode === 'record'
            ? <RecorderPanel key={`${phase}-${queueIdx}`} onRated={handleRating} phase={phase} />
            : <DirectRating phase={phase} onRated={handleRating} reviewCount={sessionQueue[queueIdx]?.reviewCount} />
        )}

        {phase === PHASE.SABAQ && (
          <div className={styles.actions}>
            <div className={styles.sabaqNote}>
              Listen until comfortable, then mark ready to memorise.
            </div>
            <button className={`${styles.actionBtn} ${styles.actionClean} ${styles.actionFull}`}
              onClick={approveSabaq}>
              <span>Ready — set as tomorrow's Sabaqi ✓</span>
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}

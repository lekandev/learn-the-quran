import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import Layout from '../components/Layout'
import styles from '../styles/Landing.module.css'

const FEATURES = [
  {
    id: 'read', href: '/read',
    arabicTitle: 'اقرأ',
    title: 'Read the Quran',
    subtitle: 'All 114 surahs · Alafasy audio · Sahih translation',
    desc: 'Browse every surah verse by verse. Listen to Mishary Alafasy, read the Arabic with full diacritics, and download any verse as a shareable image.',
    ref: { arabic: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', text: 'Read in the name of your Lord who created.', source: "Al-'Alaq 96:1", tag: 'Quran' },
    color: '#9E6B3F', soft: 'rgba(158,107,63,0.08)', border: 'rgba(158,107,63,0.22)',
  },
  {
    id: 'session', href: '/session',
    arabicTitle: 'رتّل',
    title: 'Practice & Memorise',
    subtitle: 'Sabaq · Sabaqi · Dhor — the Islamiyyah method',
    desc: 'The traditional three-phase system of the madrasah: new lesson daily, yesterday reviewed from memory, everything prior on spaced repetition. Record your recitation for AI pronunciation feedback.',
    ref: { arabic: 'وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا', text: 'Recite the Quran with measured recitation.', source: 'Al-Muzzammil 73:4', tag: 'Quran' },
    hadith: { text: '"The best of you are those who learn the Quran and teach it."', source: 'Bukhari 5027', tag: 'Hadith' },
    color: '#5a7fa8', soft: 'rgba(90,127,168,0.08)', border: 'rgba(90,127,168,0.22)',
  },
  {
    id: 'asma', href: '/asma',
    arabicTitle: 'الأسماء',
    title: 'Asma ul Husna',
    subtitle: 'The 99 Most Beautiful Names of Allah',
    desc: 'Reflect on each of the 99 Names — their Arabic, meaning, and how to call upon Allah through them in supplication. The foundation of true faith.',
    ref: { arabic: 'وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا', text: 'Allah has the Most Beautiful Names — call upon Him by them.', source: "Al-A'raf 7:180", tag: 'Quran' },
    hadith: { text: '"Allah has ninety-nine names. Whoever preserves them will enter Paradise."', source: 'Muslim 2677', tag: 'Hadith' },
    color: '#7a5a9e', soft: 'rgba(122,90,158,0.08)', border: 'rgba(122,90,158,0.22)',
  },
  {
    id: 'salat', href: '/salat',
    arabicTitle: 'الصَّلاة',
    title: 'Salat Guide',
    subtitle: 'Every step, posture, dua & dhikr',
    desc: 'A comprehensive, illustrated guide to Salat — Arabic text, transliteration, translation, and the ruling (fard, wajib, sunnah) for every step from Niyyah to post-prayer adhkar.',
    ref: { arabic: 'وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ', text: 'Establish prayer, give zakah, and bow with those who bow.', source: 'Al-Baqarah 2:43', tag: 'Quran' },
    hadith: { text: '"The first matter that the servant will be brought to account for on the Day of Judgement is the prayer."', source: 'Tirmidhi 413', tag: 'Hadith' },
    color: '#2e7d6b', soft: 'rgba(46,125,107,0.08)', border: 'rgba(46,125,107,0.22)',
  },
]

const ICONS = {
  read: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.3" width="32" height="32"><path d="M8 6h18l8 8v22H8V6z"/><path d="M26 6v8h8"/><line x1="13" y1="19" x2="27" y2="19"/><line x1="13" y1="24" x2="27" y2="24"/><line x1="13" y1="29" x2="21" y2="29"/></svg>,
  session: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.3" width="32" height="32"><rect x="9" y="5" width="8" height="17" rx="4"/><path d="M5 18a9 9 0 0 0 18 0"/><line x1="13" y1="27" x2="13" y2="34"/><line x1="8" y1="34" x2="18" y2="34"/><circle cx="29" cy="27" r="7"/><path d="M27 25l5 2-5 2v-4z" fill="currentColor" stroke="none"/></svg>,
  asma: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.3" width="32" height="32"><polygon points="20,3 23.5,13.5 34.5,13.5 26,20.5 29,31 20,25 11,31 14,20.5 5.5,13.5 16.5,13.5"/></svg>,
  salat: <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.3" width="32" height="32"><circle cx="20" cy="7" r="4"/><line x1="20" y1="11" x2="20" y2="26"/><path d="M20 17 Q13 21 10 20"/><path d="M20 17 Q27 21 30 20"/><line x1="20" y1="26" x2="15" y2="38"/><line x1="20" y1="26" x2="25" y2="38"/></svg>,
}

function OrnDivider() {
  return (
    <div className={styles.div}>
      <div className={styles.divLine}/>
      <svg viewBox="0 0 32 16" width="24" height="12" fill="none" stroke="currentColor"><path d="M16 2 L30 8 L16 14 L2 8 Z" strokeWidth="1"/><circle cx="16" cy="8" r="2" fill="currentColor" stroke="none"/></svg>
      <div className={styles.divLine}/>
    </div>
  )
}

export default function Landing({ theme, toggleTheme }) {
  return (
    <Layout theme={theme} toggleTheme={toggleTheme}>
      <Head><title>Tarteel — Learn & Memorise the Quran</title></Head>
      <div className={styles.page}>

        {/* ── Top nav row ── */}
        <nav className={styles.topNav}>
          <span className={styles.topNavBrand}>
            <span className={styles.topNavAr}>ت</span>Tarteel
          </span>
          <button className={styles.themeBtn} onClick={toggleTheme} title="Switch theme">
            {theme === 'african' ? '🌙' : '🌿'}
          </button>
        </nav>

        {/* ── Hero ── */}
        <header className={styles.hero}>
          <div className={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <h1 className={styles.heroAr}>ترتيل</h1>
          <p className={styles.heroSub}>A companion for reading, memorising,<br/>and knowing Allah through His Quran</p>
          <blockquote className={styles.heroVerse}>
            <p className={styles.heroVerseAr}>إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ</p>
            <p className={styles.heroVerseEn}>"Indeed, this Quran guides to that which is most suitable."</p>
            <cite className={styles.heroVerseSrc}>Al-Isra 17:9</cite>
          </blockquote>
        </header>

        <OrnDivider/>

        {/* ── Feature cards ── */}
        <section className={styles.cards}>
          {FEATURES.map((f, i) => (
            <Link key={f.id} href={f.href} className={styles.card}
              style={{ '--fc': f.color, '--fs': f.soft, '--fb': f.border, animationDelay: `${i * 0.07}s` }}>
              <div className={styles.cardAccent}/>
              <div className={styles.cardTop}>
                <div className={styles.cardNum}>{String(i+1).padStart(2,'0')}</div>
                <div className={styles.cardIcon} style={{color:f.color}}>{ICONS[f.id]}</div>
                <div className={styles.cardTitles}>
                  <span className={styles.cardAr}>{f.arabicTitle}</span>
                  <span className={styles.cardTitle}>{f.title}</span>
                  <span className={styles.cardSub}>{f.subtitle}</span>
                </div>
                <svg className={styles.cardArrow} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16" style={{color:f.color}}>
                  <path d="M4 10h12M12 5l5 5-5 5"/>
                </svg>
              </div>
              <p className={styles.cardDesc}>{f.desc}</p>
              <div className={styles.refs}>
                <div className={styles.ref}>
                  {f.ref.arabic && <div className={styles.refAr}>{f.ref.arabic}</div>}
                  <div className={styles.refText}>"{f.ref.text}"</div>
                  <div className={styles.refSrc}>
                    <span className={styles.refTag} style={{color:f.color,borderColor:f.border,background:f.soft}}>{f.ref.tag}</span>
                    {f.ref.source}
                  </div>
                </div>
                {f.hadith && (
                  <div className={styles.ref}>
                    <div className={styles.refText}>{f.hadith.text}</div>
                    <div className={styles.refSrc}>
                      <span className={styles.refTag} style={{color:f.color,borderColor:f.border,background:f.soft}}>{f.hadith.tag}</span>
                      {f.hadith.source}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </section>

        <footer className={styles.footer}>
          <p className={styles.footerCredit}>Text · alquran.cloud &nbsp;·&nbsp; Audio · Mishary Rashid Alafasy</p>
        </footer>
      </div>
    </Layout>
  )
}
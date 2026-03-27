import Head from 'next/head'
import { useState } from 'react'
import Layout from '../components/Layout'
import styles from '../styles/Salat.module.css'

/* ─────────────────────────────────────
   SVG ILLUSTRATIONS  (line-art person)
───────────────────────────────────────*/

const SVG = {
  qiyam: (
    <svg viewBox="0 0 80 160" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="16" r="10" />
      <line x1="40" y1="26" x2="40" y2="90" />
      <line x1="40" y1="45" x2="18" y2="72" />
      <line x1="40" y1="45" x2="62" y2="72" />
      <line x1="18" y1="72" x2="22" y2="80" />
      <line x1="62" y1="72" x2="58" y2="80" />
      <line x1="40" y1="90" x2="28" y2="140" />
      <line x1="40" y1="90" x2="52" y2="140" />
      <line x1="28" y1="140" x2="26" y2="155" />
      <line x1="52" y1="140" x2="54" y2="155" />
    </svg>
  ),
  qiyamHands: (
    <svg viewBox="0 0 80 160" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="16" r="10" />
      <line x1="40" y1="26" x2="40" y2="90" />
      {/* arms folded on chest */}
      <path d="M40 50 Q28 58 22 55" />
      <path d="M40 50 Q52 58 58 55" />
      <line x1="40" y1="90" x2="28" y2="140" />
      <line x1="40" y1="90" x2="52" y2="140" />
      <line x1="28" y1="140" x2="26" y2="155" />
      <line x1="52" y1="140" x2="54" y2="155" />
    </svg>
  ),
  ruku: (
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="30" cy="28" r="10" />
      <line x1="30" y1="38" x2="40" y2="60" />
      {/* torso horizontal */}
      <line x1="40" y1="60" x2="90" y2="60" />
      {/* arms down from torso mid */}
      <line x1="65" y1="60" x2="65" y2="78" />
      <line x1="75" y1="60" x2="75" y2="78" />
      {/* legs */}
      <line x1="40" y1="60" x2="38" y2="110" />
      <line x1="40" y1="60" x2="50" y2="110" />
      <line x1="38" y1="110" x2="36" y2="118" />
      <line x1="50" y1="110" x2="52" y2="118" />
    </svg>
  ),
  itidal: (
    <svg viewBox="0 0 80 160" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="16" r="10" />
      <line x1="40" y1="26" x2="40" y2="90" />
      {/* arms slightly raised */}
      <line x1="40" y1="50" x2="16" y2="65" />
      <line x1="40" y1="50" x2="64" y2="65" />
      <line x1="40" y1="90" x2="28" y2="140" />
      <line x1="40" y1="90" x2="52" y2="140" />
      <line x1="28" y1="140" x2="26" y2="155" />
      <line x1="52" y1="140" x2="54" y2="155" />
    </svg>
  ),
  sujud: (
    <svg viewBox="0 0 140 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* head on ground */}
      <circle cx="20" cy="75" r="10" />
      {/* back line */}
      <line x1="20" y1="65" x2="70" y2="50" />
      {/* hips up */}
      <line x1="70" y1="50" x2="80" y2="20" />
      {/* knees on ground */}
      <line x1="80" y1="20" x2="100" y2="75" />
      <line x1="100" y1="75" x2="110" y2="75" />
      {/* feet */}
      <line x1="110" y1="75" x2="120" y2="80" />
      {/* arms on ground */}
      <line x1="30" y1="80" x2="60" y2="80" />
      <line x1="30" y1="80" x2="20" y2="82" />
    </svg>
  ),
  jalsah: (
    <svg viewBox="0 0 120 130" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="20" r="10" />
      <line x1="40" y1="30" x2="40" y2="75" />
      {/* arms resting on thighs */}
      <line x1="40" y1="55" x2="22" y2="80" />
      <line x1="40" y1="55" x2="58" y2="80" />
      {/* legs bent */}
      <line x1="40" y1="75" x2="20" y2="115" />
      <line x1="40" y1="75" x2="70" y2="100" />
      <line x1="70" y1="100" x2="90" y2="120" />
      <line x1="20" y1="115" x2="15" y2="122" />
      <line x1="90" y1="120" x2="100" y2="122" />
    </svg>
  ),
  tashahhud: (
    <svg viewBox="0 0 120 130" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="20" r="10" />
      <line x1="40" y1="30" x2="40" y2="75" />
      {/* right arm raised with finger */}
      <line x1="40" y1="55" x2="65" y2="70" />
      <line x1="65" y1="70" x2="72" y2="58" />
      {/* left arm on thigh */}
      <line x1="40" y1="55" x2="22" y2="80" />
      {/* legs */}
      <line x1="40" y1="75" x2="20" y2="115" />
      <line x1="40" y1="75" x2="70" y2="100" />
      <line x1="70" y1="100" x2="90" y2="120" />
      <line x1="20" y1="115" x2="15" y2="122" />
      <line x1="90" y1="120" x2="100" y2="122" />
    </svg>
  ),
  tasleem: (
    <svg viewBox="0 0 120 130" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="20" r="10" />
      {/* head turning right */}
      <ellipse cx="48" cy="20" rx="10" ry="10" />
      <line x1="40" y1="30" x2="40" y2="75" />
      <line x1="40" y1="55" x2="22" y2="80" />
      <line x1="40" y1="55" x2="58" y2="80" />
      <line x1="40" y1="75" x2="20" y2="115" />
      <line x1="40" y1="75" x2="70" y2="100" />
      <line x1="70" y1="100" x2="90" y2="120" />
      <line x1="20" y1="115" x2="15" y2="122" />
      <line x1="90" y1="120" x2="100" y2="122" />
    </svg>
  ),
}

/* ─────────────────────────────────────
   SALAT STEPS DATA
───────────────────────────────────────*/

const STEPS = [
  {
    id: 'niyyah',
    num: 0,
    label: 'Niyyah',
    arabic: 'نِيَّة',
    subtitle: 'Intention',
    type: 'fard',
    illustration: SVG.qiyam,
    desc: 'The intention is made in the heart before the prayer begins. It is not required to be spoken aloud, though some scholars consider a whispered intention permissible.',
    items: [
      {
        title: 'Intention (Heart)',
        type: 'fard',
        note: 'Made silently in the heart before the opening Takbir.',
        arabic: '',
        transliteration: '',
        translation: 'I intend to pray [name of prayer], [number] rak\'ahs, for the sake of Allah.',
      },
    ],
  },
  {
    id: 'takbir',
    num: 1,
    label: 'Takbiratul Ihraam',
    arabic: 'تَكْبِيرَةُ الإِحْرَام',
    subtitle: 'Opening Takbir',
    type: 'fard',
    illustration: SVG.qiyamHands,
    desc: 'Raise both hands to the earlobes and say the opening Takbir. This marks the formal beginning of the prayer. All worldly matters become forbidden (haraam) from this point.',
    items: [
      {
        title: 'Takbir',
        type: 'fard',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: 'Allah is the Greatest',
      },
    ],
  },
  {
    id: 'thana',
    num: 2,
    label: 'Qiyaam — Thana & Fatiha',
    arabic: 'القِيَام',
    subtitle: 'Standing',
    type: 'fard',
    illustration: SVG.qiyamHands,
    desc: 'In Qiyaam (standing), the right hand is placed over the left hand on the chest. Begin with the opening supplication (Thana), seek refuge in Allah, then recite Surah al-Fatiha followed by any portion of the Quran.',
    items: [
      {
        title: 'Thana — Opening Supplication',
        type: 'sunnah',
        arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلاَ إِلَهَ غَيْرُكَ',
        transliteration: 'Subḥānaka Allāhumma wa bi-ḥamdika wa tabāraka ismuka wa ta\'ālā jadduka wa lā ilāha ghayruk',
        translation: 'Glory be to You, O Allah, and all praise. Blessed is Your Name and exalted is Your Majesty. There is no god but You.',
        source: 'Abu Dawud 775',
      },
      {
        title: 'Ta\'awwudh — Seeking Refuge',
        type: 'sunnah',
        arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
        transliteration: 'A\'ūdhu billāhi min ash-shayṭāni r-rajīm',
        translation: 'I seek refuge in Allah from the accursed devil.',
      },
      {
        title: 'Bismillah',
        type: 'sunnah',
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        transliteration: 'Bismillāhi r-raḥmāni r-raḥīm',
        translation: 'In the name of Allah, the Most Gracious, the Most Merciful.',
      },
      {
        title: 'Surah Al-Fatiha',
        type: 'fard',
        arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
        transliteration: 'Al-ḥamdu lillāhi rabbi l-\'ālamīn · ar-raḥmāni r-raḥīm · māliki yawmi d-dīn · iyyāka na\'budu wa iyyāka nasta\'īn · ihdinā ṣ-ṣirāṭa l-mustaqīm · ṣirāṭa lladhīna an\'amta \'alayhim ghayri l-maghḍūbi \'alayhim wa lā ḍ-ḍāllīn',
        translation: 'All praise is due to Allah, Lord of all the worlds. The Most Gracious, the Most Merciful. Master of the Day of Judgment. You alone we worship, and You alone we ask for help. Guide us to the straight path — the path of those whom You have blessed, not of those who have earned anger, nor of those who have gone astray.',
        source: 'Al-Fatiha 1:1–7',
      },
      {
        title: 'Ameen',
        type: 'sunnah',
        arabic: 'آمِين',
        transliteration: 'Āmīn',
        translation: 'O Allah, accept.',
        note: 'Said after Fatiha. Recited quietly in most prayers (aloud in Fajr, Maghrib, Isha according to some scholars).',
      },
      {
        title: 'Additional Surah or Verses',
        type: 'wajib',
        note: 'Recite any portion of the Quran after al-Fatiha in the first two rak\'ahs. Minimum: 3 short verses or 1 long verse.',
        arabic: '',
        transliteration: '',
        translation: '',
      },
    ],
  },
  {
    id: 'ruku',
    num: 3,
    label: "Ruku'",
    arabic: 'رُكُوع',
    subtitle: 'Bowing',
    type: 'fard',
    illustration: SVG.ruku,
    desc: 'Bow with the back straight and horizontal, hands gripping the knees. The back and neck should be level.',
    items: [
      {
        title: 'Takbir entering Ruku\'',
        type: 'sunnah',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: 'Allah is the Greatest',
        note: 'Hands are raised to earlobe level while transitioning.',
      },
      {
        title: 'Dhikr in Ruku\' (×3 minimum)',
        type: 'fard',
        arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
        transliteration: 'Subḥāna rabbiya l-\'aẓīm',
        translation: 'Glory be to my Lord, the Most Great.',
        source: 'Muslim 772',
      },
      {
        title: 'Sunnah addition in Ruku\'',
        type: 'sunnah',
        arabic: 'سُبْحَانَكَ اللَّهُمَّ رَبَّنَا وَبِحَمْدِكَ، اللَّهُمَّ اغْفِرْ لِي',
        transliteration: 'Subḥānaka Allāhumma rabbanā wa bi-ḥamdika, Allāhumma ghfir lī',
        translation: 'Glory be to You, O Allah our Lord, and all praise. O Allah, forgive me.',
        source: 'Bukhari 794',
      },
    ],
  },
  {
    id: 'itidal',
    num: 4,
    label: "I'tidal",
    arabic: 'اعْتِدَال',
    subtitle: 'Rising from Ruku\'',
    type: 'fard',
    illustration: SVG.itidal,
    desc: 'Rise from ruku\' back to a fully upright standing position. Hands may be dropped to the sides or placed on the chest (scholars differ).',
    items: [
      {
        title: 'Tasmee\' — rising',
        type: 'fard',
        arabic: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ',
        transliteration: 'Sami\'a llāhu li-man ḥamidah',
        translation: 'Allah hears those who praise Him.',
        note: 'Said while rising. The Imam says this aloud; the follower says it quietly.',
      },
      {
        title: 'Tahmid — upon standing upright',
        type: 'fard',
        arabic: 'رَبَّنَا وَلَكَ الْحَمْدُ، حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ',
        transliteration: 'Rabbanā wa laka l-ḥamd, ḥamdan kathīran ṭayyiban mubārakan fīh',
        translation: 'Our Lord, and to You is all praise — abundant, good, and blessed praise.',
        source: 'Bukhari 799',
      },
    ],
  },
  {
    id: 'sujud',
    num: 5,
    label: 'Sujud',
    arabic: 'سُجُود',
    subtitle: 'Prostration',
    type: 'fard',
    illustration: SVG.sujud,
    desc: 'Prostrate on seven limbs: forehead (with nose), both palms, both knees, and both feet. Elbows should be raised off the ground and away from the sides.',
    items: [
      {
        title: 'Takbir going down',
        type: 'sunnah',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: 'Allah is the Greatest',
      },
      {
        title: 'Dhikr in Sujud (×3 minimum)',
        type: 'fard',
        arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
        transliteration: 'Subḥāna rabbiya l-a\'lā',
        translation: 'Glory be to my Lord, the Most High.',
        source: 'Muslim 772',
      },
      {
        title: 'Sunnah dua in Sujud',
        type: 'sunnah',
        arabic: 'اللَّهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ دِقَّهُ وَجِلَّهُ وَأَوَّلَهُ وَآخِرَهُ وَعَلَانِيَتَهُ وَسِرَّهُ',
        transliteration: 'Allāhumma ghfir lī dhanbī kullahu diqqahu wa jillahu wa awwalahu wa ākhirahu wa \'alāniyatahu wa sirrahu',
        translation: 'O Allah, forgive me all my sins: the small and the great, the first and the last, the open and the secret.',
        source: 'Muslim 483',
      },
      {
        title: 'Additional sunnah dua',
        type: 'sunnah',
        arabic: 'سُبْحَانَكَ اللَّهُمَّ رَبَّنَا وَبِحَمْدِكَ، اللَّهُمَّ اغْفِرْ لِي',
        transliteration: 'Subḥānaka Allāhumma rabbanā wa bi-ḥamdika, Allāhumma ghfir lī',
        translation: 'Glory be to You, O Allah our Lord, and all praise. O Allah, forgive me.',
        source: 'Bukhari 817',
      },
    ],
  },
  {
    id: 'jalsah',
    num: 6,
    label: 'Jalsah',
    arabic: 'جَلْسَة',
    subtitle: 'Sitting between Prostrations',
    type: 'fard',
    illustration: SVG.jalsah,
    desc: 'Sit briefly between the two prostrations. The left foot is laid flat and sat upon; the right foot is upright with toes pointing toward the qibla. Hands rest on the thighs.',
    items: [
      {
        title: 'Takbir rising from first sujud',
        type: 'sunnah',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: 'Allah is the Greatest',
      },
      {
        title: 'Dua in Jalsah',
        type: 'sunnah',
        arabic: 'رَبِّ اغْفِرْ لِي، رَبِّ اغْفِرْ لِي',
        transliteration: 'Rabbi ghfir lī, rabbi ghfir lī',
        translation: 'My Lord, forgive me. My Lord, forgive me.',
        source: 'Ibn Majah 897',
      },
      {
        title: 'Expanded dua in Jalsah',
        type: 'sunnah',
        arabic: 'اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاهْدِنِي وَاجْبُرْنِي وَعَافِنِي وَارْزُقْنِي وَارْفَعْنِي',
        transliteration: 'Allāhumma ghfir lī warḥamnī wahdinī wajburnī wa\'āfinī warzuqnī warf\'anī',
        translation: 'O Allah, forgive me, have mercy on me, guide me, support me, grant me well-being, provide for me, and elevate me.',
        source: 'Abu Dawud 850',
      },
    ],
  },
  {
    id: 'qadah-ula',
    num: 7,
    label: "Qa'dah Ula",
    arabic: 'قَعْدَة أُولَى',
    subtitle: 'First Sitting (Tashahhud)',
    type: 'wajib',
    illustration: SVG.tashahhud,
    desc: 'In prayers of 3 or 4 rak\'ahs, after completing 2 rak\'ahs sit for the "first tashahhud." The right index finger is raised upon reaching the shahada portion.',
    items: [
      {
        title: 'At-Tashahhud',
        type: 'wajib',
        arabic: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
        transliteration: 'At-taḥiyyātu lillāhi wa ṣ-ṣalawātu wa ṭ-ṭayyibāt. As-salāmu \'alayka ayyuhan-nabiyyu wa raḥmatu llāhi wa barakātuh. As-salāmu \'alaynā wa \'alā \'ibādi llāhi ṣ-ṣāliḥīn. Ashhadu an lā ilāha illa llāh wa ashhadu anna Muḥammadan \'abduhu wa rasūluh.',
        translation: 'All greetings, prayers, and good things are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I testify that there is no god except Allah, and I testify that Muhammad is His servant and messenger.',
        source: 'Bukhari 831',
      },
    ],
  },
  {
    id: 'qadah-akhirah',
    num: 8,
    label: "Qa'dah Akhirah",
    arabic: 'قَعْدَة أَخِيرَة',
    subtitle: 'Final Sitting',
    type: 'fard',
    illustration: SVG.tashahhud,
    desc: 'The final sitting after the last rak\'ah. Recite at-Tashahhud in full, send Salawat upon the Prophet ﷺ, and make dua before the Tasleem.',
    items: [
      {
        title: 'At-Tashahhud (full)',
        type: 'fard',
        arabic: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
        transliteration: 'At-taḥiyyātu lillāhi wa ṣ-ṣalawātu wa ṭ-ṭayyibāt. As-salāmu \'alayka ayyuhan-nabiyyu wa raḥmatu llāhi wa barakātuh. As-salāmu \'alaynā wa \'alā \'ibādi llāhi ṣ-ṣāliḥīn. Ashhadu an lā ilāha illa llāh wa ashhadu anna Muḥammadan \'abduhu wa rasūluh.',
        translation: 'All greetings, prayers, and good things are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I testify that there is no god except Allah, and I testify that Muhammad is His servant and messenger.',
        source: 'Bukhari 831',
      },
      {
        title: 'As-Salawat Ibrahimiyyah (Durood)',
        type: 'wajib',
        arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ',
        transliteration: 'Allāhumma ṣalli \'alā Muḥammadin wa \'alā āli Muḥammadin kamā ṣallayta \'alā Ibrāhīma wa \'alā āli Ibrāhīm, innaka ḥamīdun majīd. Allāhumma bārik \'alā Muḥammadin wa \'alā āli Muḥammadin kamā bārakta \'alā Ibrāhīma wa \'alā āli Ibrāhīm, innaka ḥamīdun majīd.',
        translation: 'O Allah, send Your mercy upon Muhammad and the family of Muhammad, as You sent Your mercy upon Ibrahim and the family of Ibrahim. Truly You are praiseworthy and glorious. O Allah, bless Muhammad and the family of Muhammad, as You blessed Ibrahim and the family of Ibrahim. Truly You are praiseworthy and glorious.',
        source: 'Bukhari 3370',
      },
      {
        title: "Dua before Tasleem (Ma'thur)",
        type: 'sunnah',
        arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ جَهَنَّمَ، وَمِنْ عَذَابِ الْقَبْرِ، وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ، وَمِنْ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ',
        transliteration: 'Allāhumma innī a\'ūdhu bika min \'adhābi jahannam, wa min \'adhābi l-qabr, wa min fitnati l-maḥyā wa l-mamāt, wa min fitnati l-masīḥi d-dajjāl.',
        translation: 'O Allah, I seek refuge in You from the punishment of Hell, from the punishment of the grave, from the trials of life and death, and from the trial of the False Messiah.',
        source: 'Bukhari 832',
      },
      {
        title: "Dua Al-Qunoot (Fajr — Shafi'i)",
        type: 'sunnah',
        arabic: 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ، وَقِنِي شَرَّ مَا قَضَيْتَ، فَإِنَّكَ تَقْضِي وَلَا يُقْضَى عَلَيْكَ، وَإِنَّهُ لَا يَذِلُّ مَنْ وَالَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ',
        transliteration: 'Allāhumma hdinī fīman hadayt, wa \'āfinī fīman \'āfayt, wa tawallanī fīman tawallayt, wa bārik lī fīmā a\'ṭayt, wa qinī sharra mā qaḍayt, fa-innaka taqḍī wa lā yuqḍā \'alayk, wa innahu lā yadhillu man wālayt, tabārakta rabbanā wa ta\'ālayt.',
        translation: 'O Allah, guide me among those You have guided, grant me well-being among those You have granted well-being, befriend me among those You have befriended, bless me in what You have given me, protect me from the evil of what You have decreed. Truly You decree and none decrees over You. Whoever You befriend is never humbled. You are Blessed and Exalted, our Lord.',
        source: 'Abu Dawud 1425',
        note: 'Recited in the second rak\'ah of Fajr after rising from ruku\', before sujud. (Shafi\'i, Maliki position.)',
      },
    ],
  },
  {
    id: 'tasleem',
    num: 9,
    label: 'Tasleem',
    arabic: 'تَسْلِيم',
    subtitle: 'Closing Salaam',
    type: 'fard',
    illustration: SVG.tasleem,
    desc: 'Turn the head to the right and then to the left, saying the salaam each time. This concludes the prayer.',
    items: [
      {
        title: 'First Salaam (right)',
        type: 'fard',
        arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
        transliteration: 'As-salāmu \'alaykum wa raḥmatu llāh',
        translation: 'Peace be upon you and the mercy of Allah.',
      },
      {
        title: 'Second Salaam (left)',
        type: 'sunnah',
        arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
        transliteration: 'As-salāmu \'alaykum wa raḥmatu llāh',
        translation: 'Peace be upon you and the mercy of Allah.',
        note: 'The second salaam to the left is considered sunnah by most scholars.',
      },
    ],
  },
  {
    id: 'adkhaar',
    num: 10,
    label: 'After-Salat Adhkar',
    arabic: 'أَذْكَار بَعْدَ الصَّلَاة',
    subtitle: 'Post-Prayer Remembrance',
    type: 'sunnah',
    illustration: SVG.jalsah,
    desc: 'Remain seated briefly after completing the prayer and make the following remembrances and supplications.',
    items: [
      {
        title: 'Istighfar (×3)',
        type: 'sunnah',
        arabic: 'أَسْتَغْفِرُ اللَّهَ',
        transliteration: 'Astaghfiru llāh',
        translation: 'I seek forgiveness from Allah.',
        source: 'Muslim 591',
      },
      {
        title: 'Allahumma antas-salam',
        type: 'sunnah',
        arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
        transliteration: 'Allāhumma anta s-salāmu wa minka s-salāmu tabārakta yā dha l-jalāli wa l-ikrām',
        translation: 'O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of Majesty and Honour.',
        source: 'Muslim 591',
      },
      {
        title: 'Subhanallah (×33)',
        type: 'sunnah',
        arabic: 'سُبْحَانَ اللَّهِ',
        transliteration: 'Subḥāna llāh',
        translation: 'Glory be to Allah.',
        source: 'Muslim 595',
      },
      {
        title: 'Alhamdulillah (×33)',
        type: 'sunnah',
        arabic: 'الْحَمْدُ لِلَّهِ',
        transliteration: 'Al-ḥamdu lillāh',
        translation: 'All praise is due to Allah.',
        source: 'Muslim 595',
      },
      {
        title: 'Allahu Akbar (×33)',
        type: 'sunnah',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: 'Allah is the Greatest.',
        source: 'Muslim 595',
      },
      {
        title: "Completion of Tasbih (to 100)",
        type: 'sunnah',
        arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration: 'Lā ilāha illa llāhu waḥdahu lā sharīka lah, lahu l-mulku wa lahu l-ḥamd, wa huwa \'alā kulli shay\'in qadīr',
        translation: 'There is no god but Allah, alone, without partner. To Him belongs the dominion and all praise. And He is over all things powerful.',
        source: 'Muslim 597',
      },
      {
        title: 'Ayat al-Kursi',
        type: 'sunnah',
        arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
        transliteration: 'Allāhu lā ilāha illā huwa l-ḥayyu l-qayyūm...',
        translation: 'Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness nor sleep overtakes Him...',
        source: 'Al-Baqarah 2:255 — Nasai 9928',
        note: 'Whoever recites Ayat al-Kursi after every prayer, nothing will prevent them from entering Paradise except death. (Al-Nasai)',
      },
      {
        title: "Surat Al-Ikhlas, Al-Falaq, An-Nas (×1, or ×3 after Fajr & Maghrib)",
        type: 'sunnah',
        arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ...',
        transliteration: 'Qul huwa llāhu aḥad...',
        translation: 'Say: He is Allah, the One...',
        source: 'Abu Dawud 5082',
        note: 'Recite each surah once after every prayer, and three times after Fajr and Maghrib.',
      },
    ],
  },
]

/* ─────────────────────────────────────
   BADGE COMPONENT
───────────────────────────────────────*/

const TYPE_META = {
  fard:   { label: 'Fard',   en: 'Obligatory' },
  wajib:  { label: 'Wajib',  en: 'Necessary' },
  sunnah: { label: 'Sunnah', en: 'Recommended' },
}

function Badge({ type }) {
  const m = TYPE_META[type] || TYPE_META.sunnah
  return (
    <span className={`${styles.badge} ${styles['badge_' + type]}`} title={m.en}>
      {m.label}
    </span>
  )
}

/* ─────────────────────────────────────
   ITEM CARD
───────────────────────────────────────*/

function ItemCard({ item }) {
  const [showTrans, setShowTrans] = useState(false)
  return (
    <div className={`${styles.itemCard} ${styles['item_' + item.type]}`}>
      <div className={styles.itemHeader}>
        <span className={styles.itemTitle}>{item.title}</span>
        <Badge type={item.type} />
      </div>

      {item.arabic && (
        <p className={styles.itemArabic}>{item.arabic}</p>
      )}

      {item.transliteration && (
        <p className={styles.itemTranslit}>{item.transliteration}</p>
      )}

      {item.translation && (
        <p className={styles.itemTranslation}>
          <span className={styles.quoteOpen}>"</span>{item.translation}<span className={styles.quoteClose}>"</span>
        </p>
      )}

      {item.note && (
        <p className={styles.itemNote}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          {item.note}
        </p>
      )}

      {item.source && (
        <p className={styles.itemSource}>{item.source}</p>
      )}
    </div>
  )
}

/* ─────────────────────────────────────
   STEP CARD
───────────────────────────────────────*/

function StepCard({ step, isActive, onClick }) {
  return (
    <div
      className={`${styles.step} ${isActive ? styles.stepActive : ''} ${styles['step_' + step.type]}`}
      id={`step-${step.id}`}
    >
      {/* Step header (clickable) */}
      <button className={styles.stepHeader} onClick={onClick}>
        <div className={styles.stepLeft}>
          <span className={styles.stepNum}>{step.num === 0 ? '✦' : String(step.num).padStart(2, '0')}</span>
          <div className={styles.stepTitles}>
            <span className={styles.stepArabic}>{step.arabic}</span>
            <span className={styles.stepLabel}>{step.label}</span>
            <span className={styles.stepSub}>{step.subtitle}</span>
          </div>
        </div>
        <div className={styles.stepRight}>
          <Badge type={step.type} />
          <svg
            className={`${styles.stepChevron} ${isActive ? styles.stepChevronOpen : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"
          >
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {isActive && (
        <div className={styles.stepBody}>
          {/* Illustration */}
          <div className={styles.illustration}>
            {step.illustration}
          </div>

          {/* Description */}
          <p className={styles.stepDesc}>{step.desc}</p>

          {/* Items */}
          <div className={styles.itemsList}>
            {step.items.map((item, i) => (
              <ItemCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────
   LEGEND
───────────────────────────────────────*/
function Legend() {
  return (
    <div className={styles.legend}>
      {Object.entries(TYPE_META).map(([k, v]) => (
        <span key={k} className={`${styles.legendItem} ${styles['badge_' + k]}`}>
          <span className={styles.legendDot} />
          <strong>{v.label}</strong> — {v.en}
        </span>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────
   PAGE
───────────────────────────────────────*/

export default function SalatGuide({ theme, toggleTheme }) {
  const [activeStep, setActiveStep] = useState(1)

  return (
    <Layout theme={theme} toggleTheme={toggleTheme}>
      <Head>
        <title>Salat Guide — Tarteel</title>
        <meta name="description" content="A comprehensive step-by-step guide to Salat (Islamic prayer): postures, duas, dhikr, transliteration, translation, and what is fard, wajib, or sunnah." />
      </Head>

      <div className={styles.page}>

        {/* ── Hero ── */}
        <header className={styles.hero}>
          <div className={styles.heroBismillah}>الصَّلَاة</div>
          <h1 className={styles.heroTitle}>Salat Guide</h1>
          <p className={styles.heroSub}>Every step, posture, dua, and dhikr — with transliteration, translation, and ruling</p>
          <blockquote className={styles.heroVerse}>
            <p className={styles.heroVerseAr}>وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ</p>
            <p className={styles.heroVerseEn}>"Establish prayer, give zakah, and bow with those who bow."</p>
            <cite className={styles.heroVerseSrc}>Al-Baqarah 2:43</cite>
          </blockquote>
        </header>

        <Legend />

        {/* ── Steps ── */}
        <div className={styles.steps}>
          {STEPS.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              isActive={activeStep === step.num}
              onClick={() => setActiveStep(activeStep === step.num ? null : step.num)}
            />
          ))}
        </div>

        <footer className={styles.footer}>
          <p>References: Sahih Bukhari · Sahih Muslim · Abu Dawud · Ibn Majah · Al-Nasai</p>
          <p className={styles.footerNote}>Rulings follow the Hanafi/Shafi'i majority position. Minor differences exist between the four madhabs.</p>
        </footer>
      </div>
    </Layout>
  )
}

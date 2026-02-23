import { useState, useEffect } from 'react'
import LeftSidebar from './LeftSidebar'
import styles from '../styles/Layout.module.css'

export default function Layout({
  children,
  theme,
  toggleTheme,
  // Right sidebar props passed in from surah page
  rightSidebarContent,
  rightSidebarOpen,
  onRightSidebarClose,
}) {
  const [leftOpen, setLeftOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // On desktop, default left sidebar to open
  useEffect(() => {
    if (!isMobile) setLeftOpen(true)
    else setLeftOpen(false)
  }, [isMobile])

  // Expose toggleLeft globally so nav buttons in pages can call it
  useEffect(() => {
    window.__tarteel_toggleLeft = () => setLeftOpen(v => !v)
    window.__tarteel_leftOpen = leftOpen
    return () => {
      delete window.__tarteel_toggleLeft
    }
  }, [leftOpen])

  return (
    <div
      className={`${styles.root} ${rightSidebarOpen ? styles.withRight : ''}`}
      data-left={leftOpen ? 'open' : 'closed'}
    >
      {/* Left sidebar */}
      <LeftSidebar
        isOpen={leftOpen}
        onClose={() => setLeftOpen(false)}
      />

      {/* Main content area */}
      <div className={`${styles.main} ${leftOpen && !isMobile ? styles.mainShifted : ''} ${rightSidebarOpen && !isMobile ? styles.mainShiftedRight : ''}`}>
        {/* Mobile top bar with sidebar toggle */}
        <div className={styles.mobileBar}>
          <button
            className={styles.sidebarToggle}
            onClick={() => setLeftOpen(v => !v)}
            aria-label="Toggle surah list"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className={styles.mobileBrand}>
            <span className={styles.mobileBrandAr}>ت</span>
            Tarteel
          </span>
          <div className={styles.mobileRight}>
            <button
              className={styles.themeToggleMobile}
              onClick={toggleTheme}
              title="Switch theme"
            >
              {theme === 'african' ? '🌙' : '🌿'}
            </button>
            {rightSidebarContent && (
              <button
                className={`${styles.transToggle} ${rightSidebarOpen ? styles.transToggleOn : ''}`}
                onClick={rightSidebarOpen ? onRightSidebarClose : rightSidebarContent?.onOpen}
                aria-label="Toggle transliteration"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m5 8 6 6M4 14l6-6 2-2M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {children}
      </div>

      {/* Right sidebar (slot) */}
      {rightSidebarContent}
    </div>
  )
}

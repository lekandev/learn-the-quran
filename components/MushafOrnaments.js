// ── Reusable mushaf-style ornamental elements ──────────────

export function CornerOrnament({ size = 48, className = '', style = {} }) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
    >
      {/* Outer diamond */}
      <path d="M2 24 L24 2 L46 24 L24 46 Z" stroke="currentColor" strokeWidth="0.9" />
      {/* Inner diamond */}
      <path d="M10 24 L24 10 L38 24 L24 38 Z" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.5" />
      {/* Corner lines */}
      <line x1="2" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="1" />
      <line x1="2" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="1" />
      {/* Center dot */}
      <circle cx="24" cy="24" r="2.5" fill="currentColor" />
    </svg>
  )
}

export function SideVine({ height = 200, className = '', style = {} }) {
  const mid = height / 2
  return (
    <svg className={className} style={style} width="16" height={height} viewBox={`0 0 16 ${height}`} fill="none">
      <line x1="8" y1="0" x2="8" y2={height} stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.4" />
      {/* Nodes every 40px */}
      {Array.from({ length: Math.floor(height / 40) }).map((_, i) => {
        const y = (i + 1) * 40
        return (
          <g key={i}>
            <circle cx="8" cy={y} r="2" stroke="currentColor" strokeWidth="0.8" fill="none" />
            <circle cx="8" cy={y} r="0.8" fill="currentColor" />
          </g>
        )
      })}
      {/* Centre diamond */}
      <path
        d={`M8 ${mid - 6} L14 ${mid} L8 ${mid + 6} L2 ${mid} Z`}
        stroke="currentColor" strokeWidth="0.8" fill="none"
      />
    </svg>
  )
}

export function HorizontalDivider({ className = '', style = {} }) {
  return (
    <svg className={className} style={style} width="100%" height="20" viewBox="0 0 300 20" preserveAspectRatio="none" fill="none">
      <line x1="0" y1="10" x2="130" y2="10" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.4" />
      <path d="M140 10 L150 4 L160 10 L150 16 Z" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="150" cy="10" r="1.5" fill="currentColor" />
      <line x1="170" y1="10" x2="300" y2="10" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.4" />
    </svg>
  )
}

export function MushafBorderFrame({ children, className = '' }) {
  return (
    <div className={className} style={{ position: 'relative' }}>
      {/* Top-left */}
      <CornerOrnament style={{
        position: 'absolute', top: -4, left: -4,
        color: 'var(--frame-orn, var(--brand))',
        opacity: 0.55,
        pointerEvents: 'none',
      }} size={40} />
      {/* Top-right */}
      <CornerOrnament style={{
        position: 'absolute', top: -4, right: -4,
        color: 'var(--frame-orn, var(--brand))',
        opacity: 0.55,
        transform: 'scaleX(-1)',
        pointerEvents: 'none',
      }} size={40} />
      {/* Bottom-left */}
      <CornerOrnament style={{
        position: 'absolute', bottom: -4, left: -4,
        color: 'var(--frame-orn, var(--brand))',
        opacity: 0.55,
        transform: 'scaleY(-1)',
        pointerEvents: 'none',
      }} size={40} />
      {/* Bottom-right */}
      <CornerOrnament style={{
        position: 'absolute', bottom: -4, right: -4,
        color: 'var(--frame-orn, var(--brand))',
        opacity: 0.55,
        transform: 'scale(-1)',
        pointerEvents: 'none',
      }} size={40} />
      {children}
    </div>
  )
}

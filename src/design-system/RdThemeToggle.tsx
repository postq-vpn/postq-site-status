'use client'

import { setRdTheme, useRdTheme, type RdTheme } from './theme'

/** Theme-specific <RdImg> variants are lazy and hidden, so they'd only start
 *  loading once shown and pop in after the switch. Warm them up when the
 *  button is hovered, focused or touched, before the click. */
function preloadVariants(theme: RdTheme) {
  document.querySelectorAll<HTMLImageElement>(`.rd-page .rd-v-${theme}`).forEach((img) => {
    img.loading = 'eager'
  })
}

/* The switch is instant. It used to be a circular reveal (View Transitions
   API), but snapshotting the page with its frosted-glass layers stuttered. */
export default function RdThemeToggle({ className = '' }: { className?: string }) {
  const theme = useRdTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      aria-label={next === 'dark' ? 'Включить тёмную тему' : 'Включить светлую тему'}
      aria-pressed={theme === 'dark'}
      onPointerEnter={() => preloadVariants(next)}
      onFocus={() => preloadVariants(next)}
      onClick={() => setRdTheme(next)}
      className={`rd-icon-btn ${className}`}
    >
      {/* Sun and moon share one SVG; CSS on html[data-rd-theme] picks the
          shape, so the right icon is there before hydration. */}
      <svg aria-hidden className="rd-theme-icon" width="23" height="23" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <g className="rd-theme-icon__moon">
          <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
        </g>
        <g className="rd-theme-icon__sun">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </g>
      </svg>
    </button>
  )
}

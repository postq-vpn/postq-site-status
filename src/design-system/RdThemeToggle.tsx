'use client'

import { setRdTheme, useRdTheme, type RdTheme } from './theme'

type ViewTransitionDoc = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void>; finished: Promise<void> }
}

/** Theme-specific <RdImg> variants are lazy and hidden, so they'd only start
 *  loading after the switch and pop in mid-reveal. Load them first (capped). */
function preloadVariants(theme: RdTheme) {
  const imgs = document.querySelectorAll<HTMLImageElement>(`.rd-page .rd-v-${theme}`)
  const loads = Array.from(imgs, (img) => {
    img.loading = 'eager'
    return img.decode().catch(() => {})
  })
  return Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 300))])
}

/** Switches the theme with a circular reveal growing from the button
 *  (View Transitions API); instant where unsupported or motion is reduced. */
async function switchTheme(next: RdTheme, button: HTMLButtonElement) {
  const doc = document as ViewTransitionDoc
  if (!doc.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setRdTheme(next)
    return
  }
  await preloadVariants(next)

  const rect = button.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

  const root = doc.documentElement
  root.classList.add('rd-theme-vt')
  const vt = doc.startViewTransition(() => setRdTheme(next))
  // Drop the class only once the pseudo-elements are gone; earlier, the
  // browser's default cross-fade would kick in and flash the old theme.
  vt.finished.finally(() => root.classList.remove('rd-theme-vt'))
  vt.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 500, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
    .catch(() => {})
}

export default function RdThemeToggle({ className = '' }: { className?: string }) {
  const theme = useRdTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      aria-label={next === 'dark' ? 'Включить тёмную тему' : 'Включить светлую тему'}
      aria-pressed={theme === 'dark'}
      onClick={(e) => switchTheme(next, e.currentTarget)}
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

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import RdIcon from '@/design-system/RdIcon'
import RdImg from '@/design-system/RdImg'
import RdThemeToggle from '@/design-system/RdThemeToggle'
import { RD_HELP, RD_HOME, RD_IP } from './routes'

const NAV = [
  { label: 'Главная', href: RD_HOME },
  { label: 'Подписка', href: `${RD_HOME}#pricing` },
  { label: 'Как подключиться', href: `${RD_HOME}#howto` },
  { label: 'FAQ', href: `${RD_HOME}#faq` },
]

const USEFUL = [
  { label: 'Справочный центр', href: RD_HELP },
  { label: 'Статус серверов', href: 'https://status.postq.space' },
  { label: 'Узнать мой IP', href: RD_IP },
]

/** Same-page nav links (#pricing, or the home link while on home) scroll
 *  smoothly instead of jumping; links to other pages navigate as usual. */
function smoothScrollTo(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  const url = new URL(href, location.href)
  if (url.origin !== location.origin || url.pathname !== location.pathname) return
  const target = url.hash ? document.getElementById(url.hash.slice(1)) : document.body
  if (!target) return
  e.preventDefault()
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (url.hash) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  history.pushState(null, '', url.pathname + url.hash)
}

const LOGIN_URL = 'https://web.postq.space'
const LOGIN_CLASS = 'rounded-[15px] bg-[var(--rd-action)] px-6 py-3 text-[16px] font-medium leading-5 text-[var(--rd-on-action)] transition-colors hover:bg-[var(--rd-action-hover)]'
/* Every frosted layer here also gets will-change: backdrop-filter. Chrome
   otherwise re-composites the blur a frame or two late whenever layers are
   rebuilt (theme switch, preloader leaving, dropdown opening), and the bar
   blinks out for that moment. Same fix as the old help-search dropdown. */
const RD_GLASS = 'shadow-[var(--rd-shadow)] backdrop-blur-xl will-change-[backdrop-filter]'
/** Frosted pill used for each separate piece of the bar on phones. */
const RD_PILL = 'max-sm:bg-[var(--rd-nav-bg)] max-sm:shadow-[var(--rd-shadow)] max-sm:backdrop-blur-xl max-sm:will-change-[backdrop-filter]'

export default function RdHeader() {
  const [usefulOpen, setUsefulOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const usefulRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Desktop: "Полезное" opens on hover; a short delay on leave forgives the
  // cursor briefly slipping off. Touch devices fall back to click.
  const hoverOpen = (open: boolean) => {
    if (!matchMedia('(hover: hover)').matches) return
    clearTimeout(closeTimer.current)
    if (open) setUsefulOpen(true)
    else closeTimer.current = setTimeout(() => setUsefulOpen(false), 150)
  }
  useEffect(() => () => clearTimeout(closeTimer.current), [])

  useEffect(() => {
    if (!usefulOpen) return
    const onDown = (e: MouseEvent) => {
      if (!usefulRef.current?.contains(e.target as Node)) setUsefulOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setUsefulOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [usefulOpen])

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-2 sm:px-4 lg:top-7">
      {/* On phones the bar splits in two: the logo and the menu button are
          separate pills (RD_PILL), and the shared background below is hidden. */}
      <div className="relative isolate mx-auto max-w-[1472px] sm:p-4">
        {/* Background lives on its own layer: a backdrop-filter on an ancestor
            would stop the dropdown's own blur from seeing the page. */}
        <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 hidden rounded-[25px] sm:block bg-[var(--rd-nav-bg)] ${RD_GLASS}`} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <a href={RD_HOME} aria-label="PostqVPN — на главную" className={`shrink-0 ${RD_PILL} flex h-14 items-center rounded-[25px] px-4 sm:h-auto sm:px-0`}>
              <RdImg name="nav-logo" width={154} height={31} className="block h-[26px] w-auto sm:h-[31px]" />
            </a>
            <nav aria-label="Основная навигация" className="hidden items-center gap-8 lg:flex">
              {NAV.map(item => (
                <a key={item.href} href={item.href} onClick={e => smoothScrollTo(e, item.href)} className="text-[16px] text-[var(--rd-nav-link)] transition-colors hover:text-[var(--rd-heading)]">
                  {item.label}
                </a>
              ))}
              <div ref={usefulRef} className="relative" onMouseEnter={() => hoverOpen(true)} onMouseLeave={() => hoverOpen(false)}>
                <button
                  type="button"
                  aria-expanded={usefulOpen}
                  aria-haspopup="true"
                  // Mouse click while hover already opened it shouldn't close it;
                  // keyboard (detail 0) and touch still toggle.
                  onClick={e => setUsefulOpen(v => (e.detail > 0 && matchMedia('(hover: hover)').matches) || !v)}
                  className={`flex cursor-pointer items-center gap-1 text-[16px] transition-colors hover:text-[var(--rd-heading)] ${usefulOpen ? 'text-[var(--rd-heading)]' : 'text-[var(--rd-nav-link)]'}`}
                >
                  Полезное
                  <RdIcon name="nav-chevron-mono" size={13} className={`transition-transform duration-300 ${usefulOpen ? 'rotate-180' : ''}`} />
                </button>
                {/* pt bridges the gap down to the panel so hover isn't lost on the way;
                    the panel is centred under the trigger and sits below the navbar
                    background (-z-20 vs -z-10), so it slides out from under it.
                    The slide stays on this wrapper and the fade on the panel itself:
                    an ancestor with opacity < 1 cuts the panel's backdrop blur off
                    from the page, so it showed see-through until the fade ended. */}
                <div
                  inert={!usefulOpen}
                  className={`absolute left-1/2 top-full -z-20 -translate-x-1/2 pt-8 transition-[translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${usefulOpen ? 'translate-y-0' : 'pointer-events-none -translate-y-4'}`}
                >
                  <div className={`flex min-w-[220px] flex-col gap-1 rounded-[20px] p-2 bg-[var(--rd-menu-bg)] ${RD_GLASS} transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${usefulOpen ? 'opacity-100' : 'opacity-0'}`}>
                    {USEFUL.map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setUsefulOpen(false)} className="rounded-[12px] px-4 py-3 text-[16px] text-[var(--rd-heading)] transition-colors hover:bg-[var(--rd-icon-btn)]">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <RdThemeToggle className="hidden sm:flex" />
            {/* Language switch (globe-1..3 icons) is in the design but hidden until there's more than Russian. */}
            <a href={LOGIN_URL} className={`hidden sm:block ${LOGIN_CLASS}`}>
              Войти
            </a>
            <button
              type="button"
              aria-label="Меню"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(v => !v)}
              className={`rd-icon-btn lg:hidden ${RD_PILL} max-sm:size-14`}
            >
              <span aria-hidden className="flex w-[18px] flex-col gap-[5px]">
                <span className={`h-[2px] rounded bg-[var(--rd-heading)] transition-transform ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
                <span className={`h-[2px] rounded bg-[var(--rd-heading)] transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`h-[2px] rounded bg-[var(--rd-heading)] transition-transform ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
              </span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            aria-label="Мобильная навигация"
            className={`mt-3 flex flex-col gap-1 lg:hidden ${RD_PILL} max-sm:rounded-[25px] max-sm:p-3 sm:border-t sm:border-[var(--rd-divider)] sm:pt-3`}
          >
            {[...NAV, ...USEFUL].map(item => (
              <Link key={item.href} href={item.href} onClick={e => { setMenuOpen(false); smoothScrollTo(e, item.href) }} className="rounded-[12px] px-3 py-3 text-[16px] text-[var(--rd-heading)] hover:bg-[var(--rd-icon-btn)]">
                {item.label}
              </Link>
            ))}
            {/* Phones only: the bar has no room for these, so they live here. */}
            <div className="mt-2 flex items-center gap-3 sm:hidden">
              <a href={LOGIN_URL} className={`flex-1 text-center ${LOGIN_CLASS}`}>
                Войти
              </a>
              <RdThemeToggle />
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

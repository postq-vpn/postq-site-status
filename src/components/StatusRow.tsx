'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'
import RdImg from '@/design-system/RdImg'

interface Props {
  label: ReactNode
  status: ReactNode
  /** Opens a panel with `children` (the uptime history); without it the row is static. */
  children?: ReactNode
}

/** One line of a status list: name on the left, status on the right, and an
 *  optional history panel that expands like the site's FAQ. */
export default function StatusRow({ label, status, children }: Props) {
  const [open, setOpen] = useState(false)
  // The panel's content (uptime bars) isn't in the server HTML; it's built in
  // idle time right after load, so a tap only has to animate, never to create
  // DOM in the same frame the animation starts (that was the first-open hitch).
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (mounted || !children) return
    const ric = window.requestIdleCallback
    if (ric) {
      const id = ric(() => setMounted(true), { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }
    // Safari has no requestIdleCallback.
    const id = setTimeout(() => setMounted(true), 300)
    return () => clearTimeout(id)
  }, [mounted, children])
  const panelId = useId()
  const expandable = Boolean(children)

  const head = (
    <>
      <span className="rd-p-lg min-w-0 flex-1 text-[var(--rd-heading)]">{label}</span>
      {status}
      {expandable && (
        <RdImg
          name="faq-chevron"
          width={24}
          height={24}
          className={`shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'rotate-180' : ''}`}
        />
      )}
    </>
  )

  if (!expandable) {
    return <div className="flex items-center gap-4 px-5 py-5 sm:px-6">{head}</div>
  }

  return (
    // contain: layout paint: the panel's height changes every frame while it
    // animates; this keeps that relayout/repaint inside this row instead of
    // invalidating the rest of the list.
    <div className="[contain:layout_paint]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => { setMounted(true); setOpen(v => !v) }}
        className="flex w-full cursor-pointer items-center gap-4 px-5 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rd-action)] sm:px-6"
      >
        {head}
      </button>
      <div id={panelId} role="region" inert={!open} className="rd-faq-panel" data-open={open}>
        <div className="rd-faq-panel__inner">
          {mounted && <div className="flex flex-col gap-5 px-5 pb-6 sm:px-6">{children}</div>}
        </div>
      </div>
    </div>
  )
}

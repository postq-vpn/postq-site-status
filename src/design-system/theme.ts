'use client'

import { useSyncExternalStore } from 'react'
import { RD_THEME_ATTR, RD_THEME_STORAGE_KEY } from './theme-script'

export type RdTheme = 'light' | 'dark'

function read(): RdTheme {
  return document.documentElement.getAttribute(RD_THEME_ATTR) === 'dark' ? 'dark' : 'light'
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [RD_THEME_ATTR] })
  return () => observer.disconnect()
}

export function useRdTheme(): RdTheme {
  return useSyncExternalStore(subscribe, read, () => 'light')
}

export function setRdTheme(theme: RdTheme) {
  document.documentElement.setAttribute(RD_THEME_ATTR, theme)
  try {
    localStorage.setItem(RD_THEME_STORAGE_KEY, theme)
  } catch {
    // Private mode / blocked storage — the choice just won't persist.
  }
}

import type { CSSProperties } from 'react'

/** Monochrome SVG from /public/redesign/<path>.svg painted with `currentColor`
 *  through a CSS mask, so the colour comes from a token class on this element
 *  or its parent (e.g. `text-[var(--rd-caption)]`) and works in both themes. */
export default function RdIcon({
  name,
  size,
  className = '',
}: {
  name: string
  size: number
  className?: string
}) {
  const style = {
    width: size,
    height: size,
    '--rd-icon-src': `url("/redesign/${name}.svg")`,
  } as CSSProperties
  return <span aria-hidden className={`rd-icon ${className}`} style={style} />
}

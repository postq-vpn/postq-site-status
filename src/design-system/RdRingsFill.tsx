/** Faint concentric rings behind the hero (Figma's "Concentric patterns" fill).
 *  Pure CSS — see .rd-rings in postq.css; the colour follows the theme through
 *  --rd-rings. Give it a positioned box, e.g. `absolute inset-0`. */
export default function RdRingsFill({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`rd-rings ${className}`}>
      <div />
    </div>
  )
}

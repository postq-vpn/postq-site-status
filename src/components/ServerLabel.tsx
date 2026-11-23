import type { ComponentType } from 'react'

type IconProps = { size?: number; className?: string }

/* Solid versions of the globe / bot marks. The cut-out lines are painted in the
   card colour (--rd-surface), so they read as holes in both themes. */
function GlobeFilled({ size = 20, className }: IconProps) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <g fill="none" stroke="var(--rd-surface)" strokeWidth="1.6" strokeLinecap="round">
        <path d="M2.5 12h19" />
        <path d="M12 2.5a14.5 14.5 0 0 1 3.8 9.5 14.5 14.5 0 0 1-3.8 9.5 14.5 14.5 0 0 1-3.8-9.5A14.5 14.5 0 0 1 12 2.5z" />
      </g>
    </svg>
  )
}

function BotFilled({ size = 20, className }: IconProps) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M12 8V4H8M2 14h2M20 14h2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="8" width="16" height="12" rx="3" fill="currentColor" />
      <rect x="8" y="12" width="2.4" height="4" rx="1.2" fill="var(--rd-surface)" />
      <rect x="13.6" y="12" width="2.4" height="4" rx="1.2" fill="var(--rd-surface)" />
    </svg>
  )
}

type LucideIcon = ComponentType<IconProps>

const EMOJI_ICONS: Partial<Record<number, LucideIcon>> = {
  0x1F310: GlobeFilled, // 🌐
  0x1F916: BotFilled,   // 🤖
}

export type NamePrefix =
  | { type: 'flag'; code: string; cleanName: string }
  | { type: 'icon'; Icon: LucideIcon; cleanName: string }
  | { type: 'none'; cleanName: string }

/** Splits a leading flag emoji (→ country code) or a known emoji (→ icon) off a server name. */
export function parseNamePrefix(name: string): NamePrefix {
  const chars = [...name]
  if (chars.length === 0) return { type: 'none', cleanName: name }

  const cp0 = chars[0].codePointAt(0) ?? 0

  // Pair of regional indicator symbols → country flag
  if (chars.length >= 2) {
    const cp1 = chars[1].codePointAt(0) ?? 0
    if (cp0 >= 0x1F1E6 && cp0 <= 0x1F1FF && cp1 >= 0x1F1E6 && cp1 <= 0x1F1FF) {
      const code = (
        String.fromCharCode(cp0 - 0x1F1E6 + 65) +
        String.fromCharCode(cp1 - 0x1F1E6 + 65)
      ).toLowerCase()
      return { type: 'flag', code, cleanName: name.slice(chars[0].length + chars[1].length).trimStart() }
    }
  }

  const Icon = EMOJI_ICONS[cp0]
  if (Icon) return { type: 'icon', Icon, cleanName: name.slice(chars[0].length).trimStart() }

  return { type: 'none', cleanName: name }
}

/** Flag (or icon) + the name without its emoji. */
export default function ServerLabel({ name, suffix }: { name: string; suffix?: string }) {
  const prefix = parseNamePrefix(name)
  return (
    <span className="flex min-w-0 items-center gap-3">
      {prefix.type === 'flag' && (
        // SVG flags are sharp at any pixel density; object-cover crops every
        // country's own proportions (DE 5:3, PL 8:5, …) into one 4:3 tile, and
        // the inset ring keeps white edges (FI, PL) from melting into the card.
        <span className="relative block h-[18px] w-6 shrink-0 overflow-hidden rounded-[3px] after:absolute after:inset-0 after:rounded-[3px] after:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)] after:content-['']">
          <img
            src={`https://flagcdn.com/${prefix.code}.svg`}
            width={24}
            height={18}
            alt={prefix.code.toUpperCase()}
            decoding="async"
            className="block size-full object-cover"
          />
        </span>
      )}
      {/* Same 24px column as the flags, so names line up; at 24px the round
          mark (a 20px circle in a 24px box) weighs the same as a 24×18 flag. */}
      {prefix.type === 'icon' && (
        <span className="flex h-[18px] w-6 shrink-0 items-center justify-center text-[var(--rd-caption)]">
          <prefix.Icon size={24} className="shrink-0" />
        </span>
      )}
      <span className="truncate">
        {prefix.cleanName}
        {suffix && <span className="uppercase text-[var(--rd-caption)]"> {suffix}</span>}
      </span>
    </span>
  )
}

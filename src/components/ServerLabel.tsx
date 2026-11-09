import { Bot, Globe, type LucideIcon } from 'lucide-react'

const EMOJI_ICONS: Partial<Record<number, LucideIcon>> = {
  0x1F310: Globe, // 🌐
  0x1F916: Bot,   // 🤖
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
        <img
          src={`https://flagcdn.com/24x18/${prefix.code}.png`}
          srcSet={`https://flagcdn.com/48x36/${prefix.code}.png 2x`}
          width={24}
          height={18}
          alt={prefix.code.toUpperCase()}
          className="block shrink-0 rounded-[3px]"
        />
      )}
      {prefix.type === 'icon' && <prefix.Icon size={20} className="shrink-0 text-[var(--rd-placeholder)]" />}
      <span className="truncate">
        {prefix.cleanName}
        {suffix && <span className="uppercase text-[var(--rd-caption)]"> {suffix}</span>}
      </span>
    </span>
  )
}

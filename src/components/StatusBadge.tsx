export type Tone = 'ok' | 'warn' | 'bad'

const TONE: Record<Tone, string> = {
  ok: 'bg-[var(--st-ok-bg)] text-[var(--st-ok)]',
  warn: 'bg-[var(--st-warn-bg)] text-[var(--st-warn)]',
  bad: 'bg-[var(--st-bad-bg)] text-[var(--st-bad)]',
}

/** Coloured pill: "Работает", "Не работает", "2/3 онлайн". */
export default function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`rd-p-md inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1.5 ${TONE[tone]}`}>
      {children}
    </span>
  )
}

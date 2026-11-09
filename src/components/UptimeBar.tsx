import type { DayStatus } from '../lib/history-db'

interface UptimeBarProps {
  history: DayStatus[]
  /** Short host label (e.g. "de3"); "?" for IP-only addresses, omitted when
   *  empty (e.g. non-VPN services). */
  subdomain?: string
  /** Current state of this member, shown as a dot next to the subdomain inside a group. */
  alive?: boolean
}

const STATUS_COLOR: Record<DayStatus['status'], string> = {
  online: 'bg-[var(--st-ok)]',
  partial: 'bg-[var(--st-warn)]',
  offline: 'bg-[var(--st-bad)]',
  // Not a real status — an empty slot for days before history started.
  nodata: 'bg-[var(--st-nodata)]',
}

function formatDay(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}.${m}.${y}`
}

function tooltipFor(day: DayStatus): string {
  const label = formatDay(day.date)
  if (day.status === 'nodata') return `${label} · нет данных`
  if (day.status === 'online') return `${label} · всё работало`
  if (day.status === 'offline') return `${label} · не работало весь день`
  return `${label} · ${day.uptimePct?.toFixed(1)}% аптайм (был сбой)`
}

/** 90 days of uptime, one bar per day, oldest on the left. Bars share the
 *  width, so the whole period fits on any screen without scrolling. */
export default function UptimeBar({ history, subdomain, alive }: UptimeBarProps) {
  const known = history.filter(d => d.status !== 'nodata')
  const avgUptime = known.length > 0
    ? known.reduce((sum, d) => sum + (d.uptimePct ?? 0), 0) / known.length
    : null

  return (
    <div className="flex flex-col gap-2">
      <div className="rd-p-md flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 uppercase text-[var(--rd-heading)]">
          {alive !== undefined && (
            <span aria-hidden className={`size-2 rounded-full ${alive ? 'bg-[var(--st-ok)]' : 'bg-[var(--st-bad)]'}`} />
          )}
          {subdomain}
        </span>
        {avgUptime !== null && <span className="text-[var(--rd-caption)]">{avgUptime.toFixed(1)}% аптайм</span>}
      </div>
      {history.length > 0 && (
        <div className="flex h-8 gap-[2px] max-sm:gap-px">
          {history.map(day => (
            <span
              key={day.date}
              title={tooltipFor(day)}
              className={`min-w-px flex-1 rounded-[2px] ${STATUS_COLOR[day.status]}`}
            />
          ))}
        </div>
      )}
      <div className="flex justify-between text-[13px] leading-4 text-[var(--rd-placeholder)]">
        <span>{history.length} дней назад</span>
        <span>сегодня</span>
      </div>
    </div>
  )
}

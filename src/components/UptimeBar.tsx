import { memo } from 'react'
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
  if (day.status === 'nodata') return `${label}, нет данных`
  if (day.status === 'online') return `${label}, всё работало`
  if (day.status === 'offline') return `${label}, не работало весь день`
  return `${label}, ${day.uptimePct?.toFixed(1)}% аптайм (был сбой)`
}

/** Days shown on phones: 90 bars at 1px gaps turned into a barcode there. */
const MOBILE_DAYS = 30

function average(days: DayStatus[]): number | null {
  const known = days.filter(d => d.status !== 'nodata')
  return known.length > 0 ? known.reduce((sum, d) => sum + (d.uptimePct ?? 0), 0) / known.length : null
}

/** Uptime history, one bar per day, oldest on the left. Bars share the width,
 *  so the period fits on any screen without scrolling: the full 90 days from
 *  sm up, the last 30 on phones. Switched by CSS alone (both are in the HTML),
 *  so server and client render the same markup. */
function UptimeBar({ history, subdomain, alive }: UptimeBarProps) {
  const cutoff = Math.max(0, history.length - MOBILE_DAYS)
  const avgUptime = average(history)
  const avgMobile = average(history.slice(cutoff))

  return (
    <div className="flex flex-col gap-2">
      <div className="rd-p-md flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 uppercase text-[var(--rd-heading)]">
          {alive !== undefined && (
            <span aria-hidden className={`size-2 rounded-full ${alive ? 'bg-[var(--st-ok)]' : 'bg-[var(--st-bad)]'}`} />
          )}
          {subdomain}
        </span>
        {avgUptime !== null && <span className="text-[var(--rd-caption)] max-sm:hidden">{avgUptime.toFixed(1)}% аптайм</span>}
        {avgMobile !== null && <span className="text-[var(--rd-caption)] sm:hidden">{avgMobile.toFixed(1)}% аптайм</span>}
      </div>
      {history.length > 0 && (
        <div className="flex h-8 gap-[2px]">
          {history.map((day, i) => (
            <span
              key={day.date}
              title={tooltipFor(day)}
              className={`min-w-px flex-1 rounded-[2px] ${STATUS_COLOR[day.status]} ${i < cutoff ? 'max-sm:hidden' : ''}`}
            />
          ))}
        </div>
      )}
      <div className="flex justify-between text-[13px] leading-4 text-[var(--rd-placeholder)]">
        <span className="max-sm:hidden">{history.length} дней назад</span>
        <span className="sm:hidden">{history.length - cutoff} дней назад</span>
        <span>сегодня</span>
      </div>
    </div>
  )
}

/** Memoised: polls that change nothing for this server skip its 90 segments. */
export default memo(UptimeBar)

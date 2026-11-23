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

const STATUS_FILL: Record<DayStatus['status'], string> = {
  online: 'var(--st-ok)',
  partial: 'var(--st-warn)',
  offline: 'var(--st-bad)',
  // Not a real status — an empty slot for days before history started.
  nodata: 'var(--st-nodata)',
}

/* Bar geometry in SVG units. The SVG stretches to the row width with
   preserveAspectRatio="none", so these are proportions: 2-unit gaps between
   8.5-unit bars come out at ~2px gaps on both a 950px desktop row (90 days)
   and a 300px phone row (30 days), with the 2px corner radius barely skewed. */
const BAR = 8.5
const GAP = 2
const HEIGHT = 32

/** One <svg> instead of a flex row of 90 <span>s: to layout it's a single
 *  replaced box, so expanding a row (whose height animates frame by frame)
 *  doesn't re-flow 90 children per bar per frame. Tooltips stay native via
 *  <title>; they're only worth the bytes where there's a hover (desktop). */
function Bars({ days, titles, className }: { days: DayStatus[]; titles: boolean; className: string }) {
  const width = days.length * (BAR + GAP) - GAP
  return (
    <svg
      viewBox={`0 0 ${width} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={`block h-8 w-full ${className}`}
      role="img"
      aria-label={`Аптайм за ${days.length} дней`}
    >
      {days.map((day, i) => (
        <rect key={day.date} x={i * (BAR + GAP)} width={BAR} height={HEIGHT} rx={2} fill={STATUS_FILL[day.status]}>
          {titles && <title>{tooltipFor(day)}</title>}
        </rect>
      ))}
    </svg>
  )
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
        <>
          <Bars days={history} titles className="max-sm:hidden" />
          <Bars days={history.slice(cutoff)} titles={false} className="sm:hidden" />
        </>
      )}
      <div className="flex justify-between text-[13px] leading-4 text-[var(--rd-placeholder)]">
        <span className="max-sm:hidden">{history.length} дней назад</span>
        <span className="sm:hidden">{history.length - cutoff} дней назад</span>
        <span>сегодня</span>
      </div>
    </div>
  )
}

/** Memoised: polls that change nothing for this server skip re-rendering it. */
export default memo(UptimeBar)

'use client'

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import ServerCard from './ServerCard'
import ServerGroup from './ServerGroup'
import IncidentHistory from './IncidentHistory'
import type { Tone } from './StatusBadge'
import { Info, LoaderCircle } from 'lucide-react'
import type { ServerStatus } from '../lib/xray'
import type { HistoryByName, Incident } from '../lib/history-db'
import { cleanBaseName } from '../lib/format'

interface Props {
  /** false in the local dev mock: the fixtures stay put, nothing is polled. */
  live: boolean
  initialServers: ServerStatus[]
  initialServices: ServerStatus[]
  initialHistory: HistoryByName
  initialIncidents: Incident[]
  initialUpdatedAt: string
}

/** Groups servers that share the same flag + country name into one location.
 *  Each group renders as a single collapsible card (ServerGroup); a country
 *  with only one server renders as a normal ServerCard. */
function groupByLocation(list: ServerStatus[]): [string, ServerStatus[]][] {
  const groups = new Map<string, ServerStatus[]>()
  list.forEach((server, i) => {
    const base = cleanBaseName(server.name)
    const key = base || `${server.name}__${i}`
    groups.set(key, [...(groups.get(key) ?? []), server])
  })
  return Array.from(groups.entries())
}

function formatUpdatedAt(date: Date): string {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow',
  })
}

/** Sets state only when the payload really changed. Polls usually return the
 *  same data, and a fresh-but-equal array would re-render every row (and every
 *  one of the ~1,500 uptime segments) for nothing. */
function setIfChanged<T>(set: Dispatch<SetStateAction<T>>, next: T) {
  set((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
}

const STATUS_POLL_MS = 30_000
const HISTORY_POLL_MS = 5 * 60_000

/** Runs `fn` every `ms` while the tab is visible; catches up right away when
 *  the tab comes back if a run was due meanwhile. */
function usePoll(enabled: boolean, ms: number, fn: () => void) {
  useEffect(() => {
    if (!enabled) return
    let last = Date.now() // initial data came with the HTML
    let timer: ReturnType<typeof setInterval> | undefined
    const run = () => { last = Date.now(); fn() }
    const start = () => {
      clearInterval(timer)
      if (Date.now() - last >= ms) run()
      timer = setInterval(run, ms)
    }
    const onVisibility = () => (document.hidden ? clearInterval(timer) : start())
    if (!document.hidden) timer = setInterval(run, ms)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  // fn only closes over stable state setters
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ms])
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    return res.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}

const statusArt = (tone: Tone, format: 'avif' | 'webp') =>
  [300, 600].map(w => `/redesign/status/server-${tone}-${w}.${format} ${w}w`).join(', ')

export default function StatusClient({
  live, initialServers, initialServices, initialHistory, initialIncidents, initialUpdatedAt,
}: Props) {
  const [servers, setServers] = useState(initialServers)
  const [services, setServices] = useState(initialServices)
  const [history, setHistory] = useState(initialHistory)
  const [incidents, setIncidents] = useState(initialIncidents)
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt)

  usePoll(live, STATUS_POLL_MS, async () => {
    const json = await getJson<{ servers?: ServerStatus[]; services?: ServerStatus[]; checkedAt?: string }>('/api/status')
    if (!json) return
    if (json.servers?.length) setIfChanged(setServers, json.servers)
    if (json.services?.length) setIfChanged(setServices, json.services)
    setUpdatedAt(formatUpdatedAt(json.checkedAt ? new Date(json.checkedAt) : new Date()))
  })
  usePoll(live, HISTORY_POLL_MS, async () => {
    const [h, inc] = await Promise.all([
      getJson<HistoryByName>('/api/history'),
      getJson<Incident[]>('/api/incidents'),
    ])
    if (h) setIfChanged(setHistory, h)
    if (inc) setIfChanged(setIncidents, inc)
  })

  const groups = useMemo(() => groupByLocation(servers), [servers])

  const online = servers.filter((s) => s.alive).length
  const total = servers.length
  const allOnline = total > 0 && online === total
  const allOffline = total > 0 && online === 0
  const loading = total === 0

  const tone: Tone = allOnline ? 'ok' : allOffline ? 'bad' : 'warn'
  const statusHeadline = loading
    ? 'Загружаем данные…'
    : allOnline ? 'Всё работает'
    : allOffline ? 'Ничего не работает :('
    : 'Что-то не работает'

  return (
    <main className="rd-container rd-main">
      <div className="mx-auto flex w-full max-w-[1008px] flex-col gap-(--rd-space-section)">
        {/* Status art: a 3D server rack whose lights match the state, placed like
            postq-site's card art: it hangs off the right edge and the card clips it.
            Trimmed AVIF/WebP at 300/600 px (public/redesign/status). */}
        <section className="rd-card relative overflow-hidden lg:px-16">
          {!loading && (
            <picture aria-hidden className="pointer-events-none absolute -right-5 -top-4 w-[104px] select-none sm:right-4 sm:top-6 sm:w-[190px] lg:right-12 lg:top-7 lg:w-[220px]">
              <source type="image/avif" srcSet={statusArt(tone, 'avif')} sizes="(min-width: 1024px) 220px, (min-width: 640px) 190px, 104px" />
              <source type="image/webp" srcSet={statusArt(tone, 'webp')} sizes="(min-width: 1024px) 220px, (min-width: 640px) 190px, 104px" />
              <img src={`/redesign/status/server-${tone}-300.webp`} alt="" width={600} height={617} fetchPriority="high" draggable={false} className="block h-auto w-full select-none [-webkit-user-drag:none]" />
            </picture>
          )}
          <div className={`relative flex flex-col gap-3 sm:gap-(--rd-space-title) ${loading ? '' : 'sm:pr-[200px] lg:pr-[280px]'}`}>
            {/* Phones: only the headline makes room for the art; the subtitle runs underneath it. */}
            <h1 className={`rd-h3 text-[var(--rd-heading)] max-sm:text-[22px] max-sm:leading-7 ${loading ? '' : 'max-sm:pr-[88px]'}`}>
              {loading && <LoaderCircle aria-hidden className="mr-2 inline size-6 animate-spin align-[-3px] text-[var(--rd-placeholder)]" />}
              {statusHeadline}
            </h1>
            <p className="rd-p-lg text-[var(--rd-caption)]">
              {/* Phones drop "серверов" and "МСК" so it stays short. */}
              {!loading && <>{online} из {total} <span className="max-sm:hidden">серверов </span>онлайн, </>}
              обновлено в {updatedAt}<span className="max-sm:hidden"> МСК</span>
            </p>
          </div>
        </section>

        {servers.length > 0 ? (
          <>
            {services.length > 0 && (
              <section className="flex flex-col gap-(--rd-space-group)">
                <h2 className="rd-h4 text-[var(--rd-heading)]">Инфраструктура</h2>
                <div className="divide-y divide-[var(--rd-divider)] rounded-[var(--rd-radius-md)] bg-[var(--rd-surface)]">
                  {services.map((svc) => <ServerCard key={svc.name} {...svc} history={history[svc.name]} />)}
                </div>
              </section>
            )}
            <section className="flex flex-col gap-(--rd-space-group)">
              <h2 className="rd-h4 text-[var(--rd-heading)]">VPN-серверы</h2>
              <div className="divide-y divide-[var(--rd-divider)] rounded-[var(--rd-radius-md)] bg-[var(--rd-surface)]">
                {groups.map(([base, group]) =>
                  group.length > 1
                    ? <ServerGroup key={base} baseName={base} servers={group} history={history} />
                    : <ServerCard key={base} {...group[0]} name={base} history={history[group[0].name]} />
                )}
              </div>
              <p className="rd-p-md flex gap-2 px-1 text-[var(--rd-caption)]">
                <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
                {/* Non-breaking spaces keep one-letter words ("с", "в", "В") from hanging at a line end. */}
                <span className="text-pretty">Доступность проверяется с&nbsp;сервера в&nbsp;Москве. В&nbsp;других регионах результаты могут отличаться.</span>
              </p>
            </section>
            <IncidentHistory incidents={incidents} />
          </>
        ) : (
          <div className="rd-card rd-p-lg text-center text-[var(--rd-caption)]">
            Данные загружаются. Пожалуйста, подождите…
          </div>
        )}
      </div>
    </main>
  )
}

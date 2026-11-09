'use client'

import { useEffect, useState } from 'react'
import ServerCard from './ServerCard'
import ServerGroup from './ServerGroup'
import IncidentHistory from './IncidentHistory'
import type { Tone } from './StatusBadge'
import { CircleCheck, CircleX, LoaderCircle, TriangleAlert } from 'lucide-react'
import type { ServerStatus } from '../../app/api/status/route'
import type { HistoryByName, DayStatus, Incident } from '../lib/history-db'
import { cleanBaseName } from '../lib/format'

interface Props {
  initialServers: ServerStatus[]
  initialServices: ServerStatus[]
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

/** Фиктивная 90-дневная история для дев-мока: почти всегда online, с редкими инцидентами. */
function mockHistory(names: string[]): HistoryByName {
  const days = 90
  const result: HistoryByName = {}
  names.forEach((name, ni) => {
    const history: DayStatus[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const incident = (i + ni * 7) % 23 === 0
      const status: DayStatus['status'] = incident ? 'partial' : 'online'
      history.push({
        date,
        status,
        uptimePct: incident ? 92 : 100,
        totalSamples: 288,
        aliveSamples: incident ? 265 : 288,
      })
    }
    result[name] = history
  })
  return result
}

/** Фиктивные инциденты для дев-мока. */
function mockIncidents(): Incident[] {
  const now = Date.now()
  return [
    { name: '🇳🇱 Нидерланды', subdomain: '?', startAt: now - 2 * 24 * 60 * 60 * 1000, endAt: now - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000, durationMs: 25 * 60 * 1000 },
    { name: '🌐 Личный кабинет', subdomain: '', startAt: now - 2 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000, endAt: now - 2 * 24 * 60 * 60 * 1000 - 50 * 60 * 1000, durationMs: 10 * 60 * 1000 },
    { name: '🇷🇺 Россия #3', subdomain: 'ru3', startAt: now - 9 * 24 * 60 * 60 * 1000, endAt: now - 9 * 24 * 60 * 60 * 1000 + 70 * 60 * 1000, durationMs: 70 * 60 * 1000 },
  ]
}

const TONE_ICON_BG: Record<Tone, string> = {
  ok: 'bg-[var(--st-ok-bg)] text-[var(--st-ok)]',
  warn: 'bg-[var(--st-warn-bg)] text-[var(--st-warn)]',
  bad: 'bg-[var(--st-bad-bg)] text-[var(--st-bad)]',
}

export default function StatusClient({ initialServers, initialServices = [] }: Props) {
  const [servers, setServers] = useState<ServerStatus[]>(initialServers)
  const [services, setServices] = useState<ServerStatus[]>(initialServices)
  const [history, setHistory] = useState<HistoryByName>({})
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [now, setNow] = useState(() => new Date().toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow',
  }))

  useEffect(() => {
    // DEV MOCK: VPN servers replaced with fixtures (xray-checker not running locally).
    // Services use real initial data from the server component — no override needed.
    if (process.env.NODE_ENV === 'development') {
      const mockServers = [
        { name: '🇩🇪 Германия', protocol: 'vless', alive: true, latency: 412, subdomain: 'de1' },
        { name: '🇫🇮 Финляндия', protocol: 'vless', alive: true, latency: 298, subdomain: 'fi1' },
        { name: '🇳🇱 Нидерланды', protocol: 'vless', alive: false, latency: 0, subdomain: '?' },
        { name: '🇵🇱 Польша', protocol: 'vless', alive: true, latency: 387, subdomain: 'pl1' },
        { name: '🇷🇺 Россия #1', protocol: 'vless', alive: true, latency: 440, subdomain: 'ru1' },
        { name: '🇷🇺 Россия #2', protocol: 'vless', alive: true, latency: 402, subdomain: 'ru2' },
        { name: '🇷🇺 Россия #3', protocol: 'vless', alive: false, latency: 0, subdomain: 'ru3' },
        { name: '🇷🇺 Россия #4', protocol: 'vless', alive: true, latency: 425, subdomain: 'ru4' },
        { name: '🇷🇺 Россия #5', protocol: 'vless', alive: true, latency: 488, subdomain: 'ru5' },
      ]
      setServers(mockServers)
      setHistory(mockHistory([...mockServers.map((s) => s.name), ...initialServices.map((s) => s.name)]))
      setIncidents(mockIncidents())
      return
    }
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status')
        const json = await res.json()
        if (json.servers?.length) setServers(json.servers)
        if (json.services?.length) setServices(json.services)
        setNow(new Date().toLocaleString('ru-RU', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow',
        }))
      } catch { }
    }
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history')
        const json = await res.json()
        setHistory(json)
      } catch { }
    }
    const fetchIncidents = async () => {
      try {
        const res = await fetch('/api/incidents')
        const json = await res.json()
        setIncidents(json)
      } catch { }
    }
    fetchStatus()
    fetchHistory()
    fetchIncidents()
    const statusInterval = setInterval(fetchStatus, 30000)
    const historyInterval = setInterval(fetchHistory, 5 * 60 * 1000)
    const incidentsInterval = setInterval(fetchIncidents, 5 * 60 * 1000)
    return () => {
      clearInterval(statusInterval)
      clearInterval(incidentsInterval)
      clearInterval(historyInterval)
    }
  }, [initialServices])

  const online = servers.filter((s) => s.alive).length
  const total = servers.length
  const allOnline = total > 0 && online === total
  const allOffline = total > 0 && online === 0
  const loading = total === 0

  const tone: Tone = allOnline ? 'ok' : allOffline ? 'bad' : 'warn'
  const StatusIcon = tone === 'ok' ? CircleCheck : tone === 'warn' ? TriangleAlert : CircleX
  const statusHeadline = loading
    ? 'Загружаем данные…'
    : allOnline ? 'Всё работает'
    : allOffline ? 'Ничего не работает :('
    : 'Что-то не работает'

  return (
    <main className="rd-container rd-main">
      <div className="mx-auto flex w-full max-w-[1008px] flex-col gap-(--rd-space-section)">
        <section className="rd-card flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8 lg:px-16">
          <span aria-hidden className={`flex size-16 shrink-0 items-center justify-center rounded-full lg:size-20 ${loading ? 'bg-[var(--rd-chip)] text-[var(--rd-placeholder)]' : TONE_ICON_BG[tone]}`}>
            {loading ? <LoaderCircle className="size-8 animate-spin lg:size-10" /> : <StatusIcon className="size-8 lg:size-10" strokeWidth={2} />}
          </span>
          <div className="flex flex-col gap-(--rd-space-title)">
            <h1 className="rd-h3 text-[var(--rd-heading)]">{statusHeadline}</h1>
            <p className="rd-p-lg text-[var(--rd-caption)]">
              {!loading && <>{online} из {total} серверов онлайн · </>}обновлено {now} МСК
            </p>
          </div>
        </section>

        {servers.length > 0 ? (
          <>
            {services.length > 0 && (
              <section className="flex flex-col gap-(--rd-space-group)">
                <h2 className="rd-h4 text-[var(--rd-heading)]">Инфраструктура</h2>
                <div className="divide-y divide-[var(--rd-divider)] rounded-[var(--rd-radius-md)] bg-[var(--rd-surface)]">
                  {services.map((svc, i) => <ServerCard key={i} {...svc} history={history[svc.name]} />)}
                </div>
              </section>
            )}
            <section className="flex flex-col gap-(--rd-space-group)">
              <h2 className="rd-h4 text-[var(--rd-heading)]">VPN-серверы</h2>
              <div className="divide-y divide-[var(--rd-divider)] rounded-[var(--rd-radius-md)] bg-[var(--rd-surface)]">
                {groupByLocation(servers).map(([base, group]) =>
                  group.length > 1
                    ? <ServerGroup key={base} baseName={base} servers={group} history={history} />
                    : <ServerCard key={base} {...group[0]} name={base} history={history[group[0].name]} />
                )}
              </div>
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

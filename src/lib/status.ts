import { cdnLabel, overrideCdnServers } from './cdn-override'
import { getDailyHistory, getIncidents, type HistoryByName, type Incident } from './history-db'
import { fetchServices, fetchXrayServers, isHiddenServer, type ServerStatus } from './xray'

export interface StatusSnapshot {
  servers: ServerStatus[]
  services: ServerStatus[]
  checkedAt: number
}

/** A full check (xray-checker + two HEAD probes + TLS handshakes to the CDN
 *  origins) takes up to several seconds. The page and /api/status share one
 *  result for this long, and concurrent callers share one in-flight check,
 *  so a burst of visitors never fans out into a burst of probes. */
const SNAPSHOT_TTL_MS = 30_000

let cached: StatusSnapshot | null = null
let inFlight: Promise<StatusSnapshot> | null = null

async function loadSnapshot(): Promise<StatusSnapshot> {
  const [servers, services] = await Promise.all([
    fetchXrayServers({ cache: 'no-store' }),
    fetchServices().catch(() => [] as ServerStatus[]),
  ])
  await overrideCdnServers(servers)
  return { servers, services, checkedAt: Date.now() }
}

export function getStatusSnapshot(): Promise<StatusSnapshot> {
  if (cached && Date.now() - cached.checkedAt < SNAPSHOT_TTL_MS) return Promise.resolve(cached)
  inFlight ??= loadSnapshot()
    .then((snap) => (cached = snap))
    .finally(() => { inFlight = null })
  return inFlight
}

export function getHistorySafe(days = 90): HistoryByName {
  try {
    return getDailyHistory(days)
  } catch (err) {
    console.error('[history]', err)
    return {}
  }
}

/** Snapshots store whatever label was current when sampled, so older rows can
 *  still carry a hidden server or a pre-"ruN" Russia label — normalise on read. */
export function getPublicIncidents(): Incident[] {
  try {
    return getIncidents()
      .filter((i) => !isHiddenServer(i.name))
      .map((i) => ({ ...i, subdomain: cdnLabel(i.name) ?? i.subdomain }))
  } catch (err) {
    console.error('[incidents]', err)
    return []
  }
}

/** "14:05" in Moscow time (the check runs every 30 s, so the date is always
 *  today) — formatted once on the server so the first client render matches
 *  it exactly (no hydration mismatch). */
export function formatCheckedAt(unixMs: number): string {
  return new Date(unixMs).toLocaleTimeString('ru-RU', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow',
  })
}

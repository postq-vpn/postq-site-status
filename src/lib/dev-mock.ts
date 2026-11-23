import type { DayStatus, HistoryByName, Incident } from './history-db'
import type { ServerStatus } from './xray'

/** Local `npm run dev` without xray-checker: fixtures rendered on the server,
 *  so the first paint is already final (nothing gets swapped in after mount). */
export const MOCK_SERVERS: ServerStatus[] = [
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

const DAY = 24 * 60 * 60 * 1000

/** 90 days, almost always online, with a rare incident. */
export function mockHistory(names: string[]): HistoryByName {
  const result: HistoryByName = {}
  names.forEach((name, ni) => {
    const history: DayStatus[] = []
    for (let i = 89; i >= 0; i--) {
      const date = new Date(Date.now() - i * DAY).toISOString().slice(0, 10)
      const incident = (i + ni * 7) % 23 === 0
      history.push({
        date,
        status: incident ? 'partial' : 'online',
        uptimePct: incident ? 92 : 100,
        totalSamples: 288,
        aliveSamples: incident ? 265 : 288,
      })
    }
    result[name] = history
  })
  return result
}

export function mockIncidents(): Incident[] {
  const now = Date.now()
  return [
    { name: '🇳🇱 Нидерланды', subdomain: '?', startAt: now - 2 * DAY, endAt: now - 2 * DAY + 25 * 60 * 1000, durationMs: 25 * 60 * 1000 },
    { name: '🌐 Личный кабинет', subdomain: 'web', startAt: now - 2 * DAY - 60 * 60 * 1000, endAt: now - 2 * DAY - 50 * 60 * 1000, durationMs: 10 * 60 * 1000 },
    { name: '🇷🇺 Россия #3', subdomain: 'ru3', startAt: now - 9 * DAY, endAt: now - 9 * DAY + 70 * 60 * 1000, durationMs: 70 * 60 * 1000 },
  ]
}

import tls from 'tls'
import type { ServerStatus } from '../../app/api/status/route'

// xray-checker can't reach these servers because Beeline CDN blocks non-Russian IPs.
// We check their origin servers directly via TLS handshake instead.
// Keyed by the "#N" in the host remark ("🇷🇺 Россия #N | БС") — must be kept in
// sync with RemnaWave's host list whenever hosts are renumbered or re-pointed.
// Can't be derived from the xray-checker response: #1's address is a raw IP
// (the CDN hostname only lives in its SNI, which /api/v1/proxies doesn't expose).
const CDN_ORIGIN_MAP: Record<number, string> = {
  1: 'se4.postq.space', // 188.72.103.3, SNI cdn-se4.postq.space
  2: 'pl1.postq.space', // cdn-pl1.postq.space
  3: 'de2.postq.space', // cdn-de2.postq.space
  4: 'de4.postq.space', // cdn-de4.postq.space
  5: 'se3.postq.space', // cdn-se3.postq.space
}

function cdnNumber(name: string): number | null {
  const match = name.match(/Россия #(\d+)/)
  return match ? Number(match[1]) : null
}

/** Display label for a Russia CDN server ("ru1", "ru2", …), or null for any
 *  other server. Shown instead of the host's own subdomain so the status page
 *  doesn't reveal which origin backs which Russia entry. */
export function cdnLabel(name: string): string | null {
  const n = cdnNumber(name)
  return n === null ? null : `ru${n}`
}

function checkTlsConnect(hostname: string): Promise<{ alive: boolean; latency: number }> {
  return new Promise((resolve) => {
    const t = Date.now()
    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, rejectUnauthorized: false },
      () => { socket.destroy(); resolve({ alive: true, latency: Date.now() - t }) }
    )
    socket.setTimeout(5000)
    socket.on('timeout', () => { socket.destroy(); resolve({ alive: false, latency: 0 }) })
    socket.on('error', () => { socket.destroy(); resolve({ alive: false, latency: 0 }) })
  })
}

export async function overrideCdnServers(servers: ServerStatus[]): Promise<void> {
  await Promise.all(
    servers.map(async (server) => {
      const n = cdnNumber(server.name)
      if (n === null) return
      server.subdomain = `ru${n}`
      const origin = CDN_ORIGIN_MAP[n]
      if (!origin) return
      const r = await checkTlsConnect(origin)
      server.alive = r.alive
      server.latency = r.latency
    })
  )
}

import { NextResponse } from 'next/server'
import { getStatusSnapshot } from '@/lib/status'
import type { ServerStatus } from '@/lib/xray'

export type { ServerStatus }

export const dynamic = 'force-dynamic'

export interface StatusResponse {
  online: number
  total: number
  servers: ServerStatus[]
  services: ServerStatus[]
  checkedAt: string
}

export async function GET() {
  try {
    // Shared 30 s snapshot (src/lib/status.ts) — the page renders from the same one.
    const { servers, services, checkedAt } = await getStatusSnapshot()
    const online = servers.filter((s) => s.alive).length

    const body: StatusResponse = {
      online,
      total: servers.length,
      servers,
      services,
      checkedAt: new Date(checkedAt).toISOString(),
    }

    return NextResponse.json(body, {
      headers: {
        'Access-Control-Allow-Origin': 'https://postq.space',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    })
  } catch (err) {
    console.error('[/api/status]', err)
    return NextResponse.json(
      { online: 0, total: 0, servers: [], checkedAt: new Date().toISOString() },
      { status: 200 } // return 200 so the widget doesn't show error state
    )
  }
}

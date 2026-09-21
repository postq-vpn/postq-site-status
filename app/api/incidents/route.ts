import { NextResponse } from 'next/server'
import { cdnLabel } from '@/lib/cdn-override'
import { getIncidents } from '@/lib/history-db'
import { isHiddenServer } from '@/lib/xray'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Snapshots store whatever label was current when sampled, so older rows can
    // still carry a hidden server or a pre-"ruN" Russia label — normalise on read.
    const incidents = getIncidents()
      .filter((i) => !isHiddenServer(i.name))
      .map((i) => ({ ...i, subdomain: cdnLabel(i.name) ?? i.subdomain }))
    return NextResponse.json(incidents)
  } catch (err) {
    console.error('[/api/incidents]', err)
    return NextResponse.json([], { status: 200 })
  }
}

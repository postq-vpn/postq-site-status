import { NextResponse } from 'next/server'
import { getPublicIncidents } from '@/lib/status'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(getPublicIncidents())
}

import StatusClient from '@/components/StatusClient'
import { MOCK_SERVERS, mockHistory, mockIncidents } from '@/lib/dev-mock'
import { formatCheckedAt, getHistorySafe, getPublicIncidents, getStatusSnapshot } from '@/lib/status'

export const dynamic = 'force-dynamic'

export default async function StatusPage() {
  const { servers, services, checkedAt } = await getStatusSnapshot()

  // DEV MOCK: no xray-checker locally — render fixtures (services stay real).
  if (process.env.NODE_ENV === 'development' && !process.env.XRAY_CHECKER_URL) {
    return (
      <StatusClient
        live={false}
        initialServers={MOCK_SERVERS}
        initialServices={services}
        initialHistory={mockHistory([...MOCK_SERVERS, ...services].map((s) => s.name))}
        initialIncidents={mockIncidents()}
        initialUpdatedAt={formatCheckedAt(checkedAt)}
      />
    )
  }

  // Everything the page shows is in the first HTML: no rows gaining a chevron
  // or the incident list swapping in once client-side fetches land.
  return (
    <StatusClient
      live
      initialServers={servers}
      initialServices={services}
      initialHistory={getHistorySafe(90)}
      initialIncidents={getPublicIncidents()}
      initialUpdatedAt={formatCheckedAt(checkedAt)}
    />
  )
}

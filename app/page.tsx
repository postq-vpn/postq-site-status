import StatusClient from '@/components/StatusClient'
import { overrideCdnServers } from '@/lib/cdn-override'
import { fetchXrayServers, fetchServices, type ServerStatus } from '@/lib/xray'

export default async function StatusPage() {
  const [servers, services] = await Promise.all([
    fetchXrayServers({ cache: 'no-store' }),
    fetchServices().catch(() => [] as ServerStatus[]),
  ])
  await overrideCdnServers(servers)
  return <StatusClient initialServers={servers} initialServices={services} />
}

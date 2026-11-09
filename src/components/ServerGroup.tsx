import StatusBadge from './StatusBadge'
import StatusRow from './StatusRow'
import ServerLabel from './ServerLabel'
import UptimeBar from './UptimeBar'
import type { ServerStatus } from '../../app/api/status/route'
import type { HistoryByName } from '../lib/history-db'

interface ServerGroupProps {
  baseName: string
  servers: ServerStatus[]
  history: HistoryByName
}

/** Servers sharing one flag collapse into a single location row; expanded, each
 *  member shows its subdomain and uptime strip, not its raw (possibly suffixed) name. */
export default function ServerGroup({ baseName, servers, history }: ServerGroupProps) {
  const online = servers.filter(s => s.alive).length
  const total = servers.length
  const tone = online === total ? 'ok' : online > 0 ? 'warn' : 'bad'

  return (
    <StatusRow
      label={<ServerLabel name={baseName} />}
      status={<StatusBadge tone={tone}>{online}/{total} онлайн</StatusBadge>}
    >
      {servers.map((s, i) => (
        <UptimeBar key={i} subdomain={s.subdomain} alive={s.alive} history={history[s.name] ?? []} />
      ))}
    </StatusRow>
  )
}

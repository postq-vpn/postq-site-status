import StatusBadge from './StatusBadge'
import StatusRow from './StatusRow'
import ServerLabel from './ServerLabel'
import UptimeBar from './UptimeBar'
import type { DayStatus } from '../lib/history-db'

interface ServerCardProps {
  name: string
  protocol: string
  alive: boolean
  latency: number
  subdomain?: string
  history?: DayStatus[]
}

/** A single server or service: one row, its 90-day history on expand. */
export default function ServerCard({ name, alive, subdomain, history }: ServerCardProps) {
  return (
    <StatusRow
      label={<ServerLabel name={name} />}
      status={<StatusBadge tone={alive ? 'ok' : 'bad'}>{alive ? 'Работает' : 'Не работает'}</StatusBadge>}
    >
      {history && history.length > 0 ? <UptimeBar history={history} subdomain={subdomain} /> : null}
    </StatusRow>
  )
}

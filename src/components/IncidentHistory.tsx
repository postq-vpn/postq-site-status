import ServerLabel from './ServerLabel'
import { cleanBaseName, formatDuration } from '../lib/format'
import type { Incident } from '../lib/history-db'

interface IncidentHistoryProps {
  incidents: Incident[]
}

function formatDate(unixMs: number): string {
  return new Date(unixMs).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow',
  })
}

function formatTime(unixMs: number): string {
  return new Date(unixMs).toLocaleTimeString('ru-RU', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow',
  })
}

/** Groups incidents (already ordered newest-first) into consecutive runs by
 *  their MSK calendar date, preserving that order. */
function groupByDate(incidents: Incident[]): [string, Incident[]][] {
  const groups: [string, Incident[]][] = []
  for (const incident of incidents) {
    const date = formatDate(incident.startAt)
    const last = groups[groups.length - 1]
    if (last && last[0] === date) last[1].push(incident)
    else groups.push([date, [incident]])
  }
  return groups
}

export default function IncidentHistory({ incidents }: IncidentHistoryProps) {
  return (
    <section className="flex flex-col gap-(--rd-space-group)">
      <h2 className="rd-h4 text-[var(--rd-heading)]">История инцидентов</h2>

      {incidents.length === 0 ? (
        <div className="rd-card rd-p-lg text-center text-[var(--rd-caption)]">
          Инцидентов за последние 90 дней не было
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groupByDate(incidents).map(([date, dayIncidents]) => (
            <div key={date} className="rounded-[var(--rd-radius-md)] bg-[var(--rd-surface)]">
              <h3 className="rd-h6 border-b border-[var(--rd-divider)] px-5 py-5 text-[var(--rd-heading)] sm:px-6">{date}</h3>
              <ul className="divide-y divide-[var(--rd-divider)]">
                {dayIncidents.map((incident, i) => (
                  <li key={i} className="flex flex-col gap-2 px-5 py-5 sm:px-6">
                    <p className="rd-p-lg flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--rd-heading)]">
                      <ServerLabel name={cleanBaseName(incident.name)} suffix={incident.subdomain ? `(${incident.subdomain})` : undefined} />
                      <span>не отвечал на проверки</span>
                    </p>
                    <p className="rd-p-md flex flex-wrap justify-between gap-x-3 gap-y-1 text-[var(--rd-caption)]">
                      <span>с {formatTime(incident.startAt)} МСК</span>
                      <span>простой {formatDuration(incident.durationMs)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

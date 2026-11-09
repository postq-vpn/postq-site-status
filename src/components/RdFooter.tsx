import RdImg from '@/design-system/RdImg'
import Link from 'next/link'
import { RD_HELP, RD_HOME, RD_IP, RD_PRIVACY, RD_TERMS } from './routes'

const SOCIAL = [
  { label: 'Бот в Telegram', href: 'https://t.me/postq_vpn_bot' },
  { label: 'Новости в Telegram', href: 'https://t.me/postq_news' },
  { label: 'Threads', href: 'https://www.threads.com/@postq_vpn' },
]

const COLUMNS = [
  {
    title: 'Продукт',
    links: [
      { label: 'Личный кабинет', href: 'https://web.postq.space' },
      { label: 'Подписка', href: `${RD_HOME}#pricing` },
      { label: 'Как подключиться', href: `${RD_HOME}#howto` },
      { label: 'FAQ', href: `${RD_HOME}#faq` },
    ],
  },
  {
    title: 'Помощь',
    links: [
      { label: 'Справочный центр', href: RD_HELP },
      { label: 'Поддержка', href: 'https://t.me/postq_vpn_support_bot' },
      { label: 'VPN на роутере', href: `${RD_HELP}/vpn-on-router` },
      { label: 'Узнать мой IP', href: RD_IP },
    ],
  },
]

const PAYMENTS = [
  { src: 'pay-mir', label: 'МИР', w: 38, h: 18 },
  { src: 'pay-visa', label: 'Visa', w: 32, h: 18 },
  { src: 'pay-mastercard', label: 'Mastercard', w: 27, h: 18 },
  { src: 'pay-btc', label: 'Bitcoin', w: 13, h: 18 },
  { src: 'pay-ton', label: 'TON', w: 24, h: 24 },
  { src: 'pay-eth', label: 'Ethereum', w: 12, h: 18 },
  { src: 'pay-usdt', label: 'USDT', w: 17, h: 18 },
]

/** Third-party services open in a new tab; our own (postq) links stay in place. */
const external = (href: string) =>
  href.startsWith('http') && !href.includes('postq') ? { target: '_blank', rel: 'noopener noreferrer' } : {}

export default function RdFooter() {
  return (
    <footer className="rd-footer rd-container mt-(--rd-space-section) pb-10 lg:pb-20">
      <div className="flex flex-col gap-10 rounded-[25px] bg-[var(--rd-surface)] p-6 drop-shadow-[0px_4px_20px_rgba(0,0,0,0.05)] sm:p-8 md:gap-12 lg:p-12">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-center md:gap-12">
          <div className="flex flex-col gap-8 md:gap-12">
            <div className="flex flex-col gap-6">
              <RdImg name="logo" alt="PostqVPN" width={154} height={31} />
              <div className="rd-p-md flex flex-col gap-3 text-[var(--rd-caption)]">
                <p>© 2026 PostqVPN</p>
                <p>Доступ к любым сайтам без логов и слежки</p>
              </div>
            </div>
            <div className="rd-p-md flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8">
              {SOCIAL.map(l => (
                <a key={l.href} href={l.href} className="rd-link" {...external(l.href)}>{l.label}</a>
              ))}
            </div>
          </div>

          <nav aria-label="Ссылки в подвале" className="grid grid-cols-2 gap-6 sm:flex sm:gap-16">
            {COLUMNS.map(col => (
              <div key={col.title} className="flex flex-col gap-4">
                <p className="rd-p-lg text-[var(--rd-heading)]">{col.title}</p>
                <ul className="rd-p-md flex flex-col gap-3 whitespace-nowrap">
                  {col.links.map(l => (
                    <li key={l.href}>
                      <Link href={l.href} className="rd-link" {...external(l.href)}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-6 border-t-2 border-[var(--rd-divider)] pt-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="rd-p-md flex flex-wrap gap-x-8 gap-y-3">
              <Link href={RD_PRIVACY} target="_blank" className="rd-link">Политика конфиденциальности</Link>
              <Link href={RD_TERMS} target="_blank" className="rd-link">Пользовательское соглашение</Link>
              <a href="mailto:hello@postq.space" className="rd-link">hello@postq.space</a>
            </div>
            {/* Phones: spread across the full width instead of a row that stops short. */}
            <ul aria-label="Способы оплаты" className="flex flex-wrap items-center justify-between gap-4 sm:justify-start sm:gap-6">
              {PAYMENTS.map(p => (
                <li key={p.src}>
                  <RdImg name={p.src} alt={p.label} width={p.w} height={p.h} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

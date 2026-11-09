import type { Metadata } from 'next'
import { RD_HOME } from '@/components/routes'

export const metadata: Metadata = {
  title: 'Страница не найдена',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <main className="rd-container rd-main">
      <section className="flex flex-col items-center gap-(--rd-space-card) px-2 py-16 text-center lg:py-24">
        <p className="font-bold leading-none text-[var(--rd-action)] text-[clamp(96px,16vw,200px)]">404</p>
        <div className="flex flex-col gap-(--rd-space-title)">
          <h1 className="rd-h3 text-[var(--rd-heading)]">Это единственное, что мы не можем разблокировать</h1>
          <p className="rd-p-lg text-[var(--rd-caption)]">Такой страницы не существует.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="/" className="rd-btn">К статусу серверов</a>
          <a href={RD_HOME} className="rd-btn-soft rd-btn-soft--lg">На postq.space</a>
        </div>
      </section>
    </main>
  )
}

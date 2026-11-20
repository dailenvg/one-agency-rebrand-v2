import { motion } from 'motion/react'
import { company } from '../data/concepts'
import { fadeUp, stagger, viewport } from '../lib/motion'
import { CriteriaIcon } from './ui/CriteriaIcon'
import { CornerTicks, GhostNumber, Highlight, Reveal, SectionHeading } from './ui/primitives'

const criteria = [
  { k: 'favicon' as const, title: 'Read at favicon size', body: 'The mark has to hold up in a browser tab, an ad avatar and a chat bubble.' },
  { k: 'one' as const, title: 'Carry the ONE', body: 'The idea of one team, one system and one number should live inside the logo.' },
  { k: 'colour' as const, title: 'Own a colour, accessibly', body: 'A colour nobody else in performance marketing owns, with contrast that passes.' },
  { k: 'sister' as const, title: 'Sit beside ConversionIQ.ai', body: 'Sister brands should feel related on a deck, without looking like the same company.' },
]

export function Brief() {
  return (
    <section id="brief" className="guides bg-surface py-section">
      <div className="container-x">
        <SectionHeading
          index="01"
          eyebrow="The brief"
          title={
            <>
              The work outgrew the <Highlight>mark.</Highlight>
            </>
          }
          body={company.about}
        />

        <div className="mt-stack grid gap-y-8 lg:grid-cols-4">
          <Reveal className="lg:col-span-2 lg:pr-12">
            <p className="label text-muted">{company.positioning}</p>
            <p className="mt-3 font-shell text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-semibold tracking-tight">{company.promise}</p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-2">
            <p className="max-w-[46ch] border-l-2 border-accent-text pl-5 text-muted text-pretty">{company.founders}</p>
          </Reveal>
        </div>

        <Reveal className="mt-module flex items-baseline justify-between gap-4 border-b border-line pb-4">
          <h3 className="font-shell text-xl font-semibold tracking-tight">What the new mark must do</h3>
          <span className="label text-muted tabular-nums">04 criteria</span>
        </Reveal>
        <motion.ul variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={viewport} className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {criteria.map((c, i) => (
            <motion.li
              key={c.title}
              variants={fadeUp}
              className="relative isolate flex min-h-[300px] flex-col justify-between overflow-hidden rounded-brand-lg bg-bg p-6 shadow-soft"
            >
              <GhostNumber className="-z-10">{String(i + 1).padStart(2, '0')}</GhostNumber>
              <CornerTicks />
              <div className="flex justify-end">
                <CriteriaIcon kind={c.k} delay={i * 0.35} />
              </div>
              <div>
                <p className="font-shell text-xl font-semibold tracking-tight">{c.title}</p>
                <p className="mt-2 text-sm text-muted text-pretty">{c.body}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

import { AnimatePresence, motion } from 'motion/react'
import { ArrowClockwise, Check, CaretDown, FilmSlate, House, List, LockSimple, MagnifyingGlass, PlusSquare, UserCircle, X } from '@phosphor-icons/react'
import { type CSSProperties, type ReactNode } from 'react'
import { company, type Concept, type Mode } from '../data/concepts'
import { inkOn } from '../lib/color'
import { iconUri, logoUrl, wideLogo } from '../lib/logos'
import { duration, ease, fadeUp, stagger, viewport } from '../lib/motion'
import { displayStyle } from '../lib/type'
import { useTheme } from '../theme/context'
import { KitModule, Tile } from './KitModule'
import { Pattern } from './Pattern'

const modeOn = (bg: string): Mode => (inkOn(bg) === '#FFFFFF' ? 'dark' : 'light')

/** A logo stage whose background and artwork crossfade when the light/dark switch flips. */
function LogoStage({ c, kind, mode, label, className, imgClass }: { c: Concept; kind: 'primary' | 'alt' | 'mark'; mode: Mode; label: string; className: string; imgClass: string }) {
  const bg = mode === 'light' ? c.theme.light.surface : c.theme.dark.heroBg
  return (
    <motion.figure
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      animate={{ backgroundColor: bg }}
      transition={{ backgroundColor: { duration: duration.component, ease: ease.out } }}
      className={`relative grid place-items-center overflow-hidden rounded-brand-md shadow-soft ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.img
          key={mode}
          src={logoUrl(c.id, kind, mode)}
          alt={`${c.name} ${label} on ${mode}`}
          className={imgClass}
          initial={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
          transition={{ duration: duration.component, ease: ease.out }}
        />
      </AnimatePresence>
      <figcaption className={`label absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] backdrop-blur ${mode === 'dark' ? 'bg-black/35 text-white/85' : 'bg-white/85 text-black/70'}`}>
        {label}
      </figcaption>
    </motion.figure>
  )
}

/** The three lockups on the page mode's background, so the light/dark switch in the nav previews both versions. */
export function Logo() {
  const { concept: c, mode } = useTheme()
  return (
    <KitModule id="logo" title="Logo" intro={c.idea}>
      <p className="label mb-3 text-muted">Three lockups</p>
      <LogoStage c={c} kind="primary" mode={mode} label={c.primaryLabel} className="aspect-[16/9]" imgClass="max-h-[36%] w-auto max-w-[62%]" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <LogoStage c={c} kind="alt" mode={mode} label={c.altLabel} className="aspect-[4/3]" imgClass="max-h-[34%] w-auto max-w-[76%]" />
        <LogoStage c={c} kind="mark" mode={mode} label="Mark" className="aspect-[4/3]" imgClass="max-h-[44%] w-auto max-w-[56%]" />
      </div>
      <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport} className="mt-5 flex items-start gap-2 text-sm text-muted">
        <LockSimple size={16} className="mt-0.5 shrink-0" /> {c.type.logotype}
      </motion.p>
    </KitModule>
  )
}

function RuleTile({ ok, label, children, style }: { ok: boolean; label: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <motion.li variants={fadeUp} className="flex flex-col overflow-hidden rounded-brand-md bg-surface shadow-soft">
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden p-6" style={style}>
        {children}
        <span className={`absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-full text-white ${ok ? 'bg-[#1F9D55]' : 'bg-[#E5484D]'}`}>
          {ok ? <Check size={14} weight="bold" /> : <X size={14} weight="bold" />}
        </span>
      </div>
      <p className="px-4 py-3 text-sm font-medium">{label}</p>
    </motion.li>
  )
}

export function Guidelines() {
  const { concept: c, mode } = useTheme()
  const { light, dark } = c.theme
  // Construction, spacing and misuse tiles sit on the page mode's neutrals; the brand colour and reversed examples stay fixed.
  const t = c.theme[mode]
  const dos = [
    { label: 'Use it on brand colours', style: { background: light.accent }, src: logoUrl(c.id, wideLogo(c.id), modeOn(light.accent)) },
    { label: 'Reverse it on dark', style: { background: dark.heroBg }, src: logoUrl(c.id, wideLogo(c.id), 'dark') },
    { label: 'Give it room to breathe', style: { background: t.surface }, src: logoUrl(c.id, wideLogo(c.id), mode), small: true },
  ]
  const donts = [
    { label: 'Do not stretch', style: { transform: 'scaleX(1.45)' } },
    { label: 'Do not recolour', style: { filter: 'hue-rotate(140deg) saturate(1.4)' } },
    { label: 'Do not rotate', style: { transform: 'rotate(-14deg)' } },
    { label: 'Do not add effects', style: { filter: 'drop-shadow(6px 8px 0 rgba(0,0,0,0.35)) blur(0.6px)' } },
  ]
  return (
    <KitModule id="guidelines" title="Logo guidelines" intro="How the mark is built and the rules that keep it consistent: construction, clear space, minimum sizes, and what to do and avoid.">
      <Tile label="Construction" className="relative grid aspect-[16/9] place-items-center md:aspect-[21/8]" style={{ background: t.surface }}>
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `linear-gradient(${t.line} 1px, transparent 1px), linear-gradient(90deg, ${t.line} 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            backgroundPosition: 'center',
          }}
        />
        <div aria-hidden className="absolute top-1/2 left-1/2 aspect-square h-[78%] -translate-1/2 rounded-full border border-dashed" style={{ borderColor: t.accentText }} />
        <div aria-hidden className="absolute inset-x-0 top-1/2 h-px border-t border-dashed" style={{ borderColor: t.accentText }} />
        <div aria-hidden className="absolute inset-y-0 left-1/2 w-px border-l border-dashed" style={{ borderColor: t.accentText }} />
        <img src={logoUrl(c.id, 'mark', mode)} alt={`${c.name} mark on construction grid`} className="relative max-h-[58%] w-auto max-w-[60%]" />
      </Tile>

      <div className="mt-3 grid gap-3 md:grid-cols-[1.4fr_1fr]">
        <Tile label="Clear space" className="grid aspect-[16/10] place-items-center" style={{ background: t.surface }}>
          <div className="relative p-[clamp(18px,4vw,40px)]">
            <div aria-hidden className="absolute inset-0 rounded-md border border-dashed" style={{ borderColor: t.accentText, background: `color-mix(in srgb, ${t.accentText} 7%, transparent)` }} />
            {(['top-0 left-1/2 -translate-x-1/2', 'bottom-0 left-1/2 -translate-x-1/2', 'left-0 top-1/2 -translate-y-1/2', 'right-0 top-1/2 -translate-y-1/2'] as const).map((pos) => (
              <span key={pos} className={`label absolute ${pos} px-1 text-[10px]`} style={{ color: t.accentText }}>
                x
              </span>
            ))}
            <img src={logoUrl(c.id, 'primary', mode)} alt="Logo with clear space" className="relative h-[clamp(56px,10vw,110px)] w-auto" />
          </div>
        </Tile>
        <Tile label="Minimum size" className="flex flex-col justify-end gap-5 p-6 pt-14" style={{ background: t.bg }}>
          {[
            { h: 40, note: 'Print 20mm' },
            { h: 28, note: 'Screen 120px' },
            { h: 18, note: 'Mark only below this' },
          ].map((s) => (
            <div key={s.h} className="flex items-end justify-between gap-4 border-b pb-3" style={{ borderColor: t.line }}>
              <img src={logoUrl(c.id, s.h < 20 ? 'mark' : 'alt', mode)} alt="" style={{ height: s.h }} className="w-auto max-w-[70%]" />
              <span className="label text-[10px]" style={{ color: t.muted }}>
                {s.note}
              </span>
            </div>
          ))}
        </Tile>
      </div>

      <h4 className="label mt-10 mb-3 text-muted">Do</h4>
      <motion.ul variants={stagger(0.06)} initial="hidden" whileInView="show" viewport={viewport} className="grid gap-3 sm:grid-cols-3">
        {dos.map((d) => (
          <RuleTile key={d.label} ok label={d.label} style={d.style}>
            <img src={d.src} alt="" className={d.small ? 'max-h-[20%] w-auto max-w-[44%]' : 'max-h-[34%] w-auto max-w-[72%]'} />
          </RuleTile>
        ))}
      </motion.ul>
      <h4 className="label mt-8 mb-3 text-muted">Don't</h4>
      <motion.ul variants={stagger(0.06)} initial="hidden" whileInView="show" viewport={viewport} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {donts.map((m) => (
          <RuleTile key={m.label} ok={false} label={m.label} style={{ background: t.surface }}>
            <img src={logoUrl(c.id, 'alt', mode)} alt="" className="max-h-[38%] w-auto max-w-[70%]" style={m.style} />
          </RuleTile>
        ))}
      </motion.ul>
    </KitModule>
  )
}

/** The wallpaper is the brand's hero colour in both modes; the app window on it follows the page mode. */
function Laptop({ c, mode }: { c: Concept; mode: Mode }) {
  const d = c.theme.dark
  const t = c.theme[mode]
  const main = c.icons[0]
  const dock = Array.from({ length: 7 })
  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-[88%] rounded-t-[14px] border-[7px] border-b-[10px] border-[#1b1b1d] bg-[#1b1b1d] shadow-[0_30px_50px_-30px_rgba(0,0,0,0.6)]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[4px]" style={{ background: `radial-gradient(120% 90% at 20% 0%, ${d.glow}66, ${d.heroBg} 62%)` }}>
          <div className="absolute inset-x-0 top-0 flex h-[5.5%] items-center justify-between bg-black/35 px-[2.5%] text-[clamp(6px,0.9vw,10px)] text-white/80 backdrop-blur">
            <span className="flex items-center gap-[0.8em]">
              <img src={iconUri(c.id, main, { size: 64 })} alt="" className="h-[1.3em] rounded-[3px]" />
              <strong className="font-semibold">ONE Agency</strong>
              <span className="opacity-70">File</span>
              <span className="opacity-70">View</span>
            </span>
            <span className="opacity-70">Tue 9:41</span>
          </div>
          <div className="absolute top-[13%] left-[9%] w-[58%] overflow-hidden rounded-[6px] shadow-2xl" style={{ background: t.bg }}>
            <div className="flex items-center gap-[1.5%] border-b px-[3%] py-[1.8%]" style={{ borderColor: t.line }}>
              {['#ff5f57', '#febc2e', '#28c840'].map((col) => (
                <span key={col} className="size-[clamp(4px,0.6vw,8px)] rounded-full" style={{ background: col }} />
              ))}
            </div>
            <div className="flex flex-col gap-[0.6em] p-[5%] text-[clamp(6px,0.95vw,11px)]" style={{ color: t.ink }}>
              <img src={logoUrl(c.id, wideLogo(c.id), mode)} alt="" className="h-[1.4em] w-auto self-start" />
              <span className="text-[1.6em] leading-tight font-semibold" style={displayStyle(c)}>
                Growth Audit ready
              </span>
              <span className="flex gap-[4%]">
                {['AI search', 'SEO', 'Reviews', 'CRO'].map((a) => (
                  <span key={a} className="flex-1 rounded-[0.6em] px-[0.6em] py-[0.5em]" style={{ background: t.surface }}>
                    <span className="block opacity-60">{a}</span>
                    <span className="mt-[0.4em] block h-[0.35em] rounded-full" style={{ background: c.gradient }} />
                  </span>
                ))}
              </span>
            </div>
          </div>
          <div className="absolute bottom-[3%] left-1/2 flex -translate-x-1/2 items-end gap-[clamp(3px,0.6vw,8px)] rounded-[clamp(6px,1.2vw,16px)] border border-white/15 bg-white/12 p-[clamp(3px,0.6vw,8px)] backdrop-blur-md">
            {dock.map((_, i) =>
              i === 3 ? (
                <span key={i} className="relative flex flex-col items-center">
                  <span className="label absolute -top-[2.2em] rounded-md bg-black/70 px-[0.6em] py-[0.25em] text-[clamp(5px,0.75vw,9px)] whitespace-nowrap text-white normal-case">ONE Agency</span>
                  <img src={iconUri(c.id, main)} alt="ONE Agency app icon in a laptop dock" className="size-[clamp(18px,3.4vw,44px)] rounded-[22.5%]" />
                  <span className="mt-[2px] size-[3px] rounded-full bg-white/80" />
                </span>
              ) : (
                <span key={i} className="size-[clamp(18px,3.4vw,44px)] rounded-[22.5%] bg-white/18" />
              ),
            )}
          </div>
        </div>
      </div>
      <div className="h-[clamp(8px,1.4vw,16px)] w-full rounded-b-[clamp(8px,1.4vw,18px)] bg-gradient-to-b from-[#d4d5d8] to-[#a7a9ad]">
        <div className="mx-auto h-[45%] w-[16%] rounded-b-[8px] bg-[#8d8f93]" />
      </div>
    </div>
  )
}

/** Instagram chrome in its light or dark appearance, per the page mode. The feed posts keep their own colourways. */
const appChrome = {
  light: { bg: '#FFFFFF', ink: '#111111', soft: 'rgba(0,0,0,0.06)', line: 'rgba(0,0,0,0.1)', muted: 'rgba(0,0,0,0.6)' },
  dark: { bg: '#000000', ink: '#F5F5F5', soft: 'rgba(255,255,255,0.12)', line: 'rgba(255,255,255,0.16)', muted: 'rgba(255,255,255,0.6)' },
} satisfies Record<Mode, Record<string, string>>

function SocialProfile({ c, mode }: { c: Concept; mode: Mode }) {
  const { light, dark } = c.theme
  const t = c.theme[mode]
  const ui = appChrome[mode]
  const main = c.icons[0]
  const posts: ReactNode[] = [
    <Pattern key="p" c={c} className="size-full" />,
    <div key="h" className="grid size-full place-items-center p-[10%] text-center text-[clamp(7px,1vw,11px)] leading-tight" style={{ background: dark.heroBg, color: dark.heroInk, ...displayStyle(c) }}>
      {c.voice.samples[0].text}
    </div>,
    <div key="m" className="grid size-full place-items-center" style={{ background: light.accent }}>
      <img src={logoUrl(c.id, 'mark', modeOn(light.accent))} alt="" className="h-[46%] w-auto max-w-[70%]" />
    </div>,
    <div key="s" className="flex size-full flex-col justify-end p-[10%]" style={{ background: dark.surface, color: dark.ink }}>
      <span className="text-[clamp(10px,1.6vw,18px)] leading-none" style={{ ...displayStyle(c), color: dark.accentText }}>
        80k+
      </span>
      <span className="mt-1 text-[clamp(5px,0.7vw,8px)] opacity-70">leads delivered</span>
    </div>,
    <div key="l" className="grid size-full place-items-center p-[14%]" style={{ background: light.surface }}>
      <img src={logoUrl(c.id, 'primary', 'light')} alt="" className="max-h-full w-auto max-w-full" />
    </div>,
    <div key="g" className="size-full" style={{ background: c.gradient }} />,
    <div key="i" className="grid size-full place-items-center" style={{ background: c.icons[1]?.bg ?? dark.heroBg }}>
      <img src={iconUri(c.id, { ...(c.icons[1] ?? main), bg: 'transparent' }, { size: 256 })} alt="" className="w-[64%]" />
    </div>,
    <div key="q" className="flex size-full items-end p-[10%] text-[clamp(6px,0.85vw,10px)] leading-snug" style={{ background: light.surface2, color: light.ink }}>
      {c.voice.samples[1].text}
    </div>,
    <div key="d" className="grid size-full place-items-center" style={{ background: dark.heroBg }}>
      <img src={logoUrl(c.id, 'mark', 'dark')} alt="" className="h-[42%] w-auto" />
    </div>,
  ]
  const highlights = ['Work', 'Audit', 'AI', 'Team']
  return (
    <div className="mx-auto w-full max-w-[300px] rounded-[38px] border-[8px] border-[#111] shadow-[0_30px_50px_-30px_rgba(0,0,0,0.55)]" style={{ background: ui.bg }}>
      <div className="flex h-[560px] flex-col overflow-hidden rounded-[30px]" style={{ background: ui.bg, color: ui.ink }}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="flex items-center gap-1 text-[15px] font-bold">
            oneagency <CaretDown size={12} />
          </span>
          <span className="flex gap-3">
            <PlusSquare size={20} weight="regular" />
            <List size={20} weight="regular" />
          </span>
        </div>
        <div className="flex items-center gap-4 px-4 pt-1">
          <span className="rounded-full p-[3px]" style={{ background: c.gradient }}>
            <img src={iconUri(c.id, main, { radius: 0.5 })} alt="ONE Agency profile picture" className="size-[68px] rounded-full border-[3px]" style={{ borderColor: ui.bg }} />
          </span>
          <div className="grid flex-1 grid-cols-3 text-center text-[12px] leading-tight">
            {[
              ['248', 'posts'],
              ['18.2K', 'followers'],
              ['312', 'following'],
            ].map(([n, l]) => (
              <span key={l}>
                <strong className="block text-[15px]">{n}</strong>
                {l}
              </span>
            ))}
          </div>
        </div>
        <div className="px-4 pt-2 text-[12px] leading-snug">
          <p className="font-semibold">{company.name}</p>
          <p style={{ color: ui.muted }}>Marketing agency</p>
          <p>{company.positioning}</p>
          <p>{company.promise}</p>
          <p className="font-medium" style={{ color: t.accentText }}>
            oneagency.com
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 px-4 pt-3">
          <span className="rounded-lg py-1.5 text-center text-[12px] font-semibold" style={{ background: t.accent, color: t.accentInk }}>
            Follow
          </span>
          <span className="rounded-lg py-1.5 text-center text-[12px] font-semibold" style={{ background: ui.soft }}>
            Message
          </span>
        </div>
        <div className="flex gap-3 px-4 pt-3">
          {highlights.map((h, i) => (
            <span key={h} className="flex flex-col items-center gap-1 text-[10px]">
              <span className="grid size-12 place-items-center rounded-full border p-[3px]" style={{ borderColor: ui.line }}>
                <span className="grid size-full place-items-center rounded-full" style={{ background: i % 2 ? dark.heroBg : light.surface2 }}>
                  <img src={logoUrl(c.id, 'mark', i % 2 ? 'dark' : 'light')} alt="" className="h-[48%] w-auto max-w-[60%]" />
                </span>
              </span>
              {h}
            </span>
          ))}
        </div>
        <div className="mt-3 grid flex-1 grid-cols-3 content-start gap-[2px] border-t pt-[2px]" style={{ borderColor: ui.line }}>
          {posts.map((p, i) => (
            <div key={i} className="aspect-square overflow-hidden">
              {p}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-around border-t py-2.5" style={{ borderColor: ui.line }}>
          {[House, MagnifyingGlass, PlusSquare, FilmSlate, UserCircle].map((I, i) => (
            <I key={i} size={20} weight={i === 4 ? 'fill' : 'regular'} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function Icon() {
  const { concept: c, mode } = useTheme()
  const t = c.theme[mode]
  return (
    <KitModule id="icon" title="Icon" intro="The mark on a rounded tile becomes the app icon, the desktop dock icon and the social avatar. Four approved colourways.">
      <motion.ul variants={stagger(0.07)} initial="hidden" whileInView="show" viewport={viewport} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {c.icons.map((icon, i) => (
          <motion.li key={icon.bg + i} variants={fadeUp} className="flex flex-col items-center gap-3 rounded-brand-md bg-surface p-5 shadow-soft">
            <img
              src={iconUri(c.id, icon)}
              alt={`${c.name} app icon on ${icon.bg}`}
              className="aspect-square w-full max-w-[150px] rounded-[22.5%] shadow-[0_12px_30px_-12px_rgba(0,0,0,0.45)]"
            />
            <span className="label text-muted">{icon.bg}</span>
          </motion.li>
        ))}
      </motion.ul>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.55fr_1fr]">
        <Tile label="Desktop dock" className="flex min-h-[380px] items-center justify-center px-4 pt-14 pb-8" style={{ background: t.surface }}>
          <Laptop c={c} mode={mode} />
        </Tile>
        <Tile label="Instagram profile" className="flex items-center justify-center px-4 pt-14 pb-8" style={{ background: t.surface2 }}>
          <SocialProfile c={c} mode={mode} />
        </Tile>
      </div>
    </KitModule>
  )
}

export function Favicon() {
  const { concept: c } = useTheme()
  const fav = iconUri(c.id, c.favicon, { size: 64, radius: 0.22 })
  const tabs = [
    { mode: 'light' as const, bar: '#E8E8EA', tab: '#FFFFFF', ink: '#1F1F22', idle: '#5F6168' },
    { mode: 'dark' as const, bar: '#1E1F22', tab: '#35363A', ink: '#F1F1F3', idle: '#9A9BA1' },
  ]
  return (
    <KitModule id="favicon" title="Favicon" intro="Built for a 16-pixel slot. The tile keeps the mark visible on light and dark browser chrome alike. This page's own favicon is using it right now.">
      <div className="grid gap-3">
        {tabs.map((t) => (
          <Tile key={t.mode} className="p-0" style={{ background: t.bar }}>
            <div className="flex items-end gap-1 px-3 pt-3">
              <div className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-t-xl px-3 sm:max-w-[260px]" style={{ background: t.tab, color: t.ink }}>
                <img src={fav} alt="Favicon at 16 pixels" className="size-4 shrink-0" />
                <span className="truncate text-[13px]">ONE Agency · Growth that converts</span>
                <X size={13} className="ml-auto shrink-0 opacity-60" />
              </div>
              <div className="hidden h-10 w-[200px] items-center gap-2.5 px-3 text-[13px] sm:flex" style={{ color: t.idle }}>
                <span className="size-4 rounded-full" style={{ background: t.idle, opacity: 0.4 }} />
                Inbox
              </div>
            </div>
            <div className="flex h-11 items-center gap-3 px-4" style={{ background: t.tab, color: t.idle }}>
              <ArrowClockwise size={14} />
              <span className="flex h-7 flex-1 items-center rounded-full px-3 text-[13px]" style={{ background: t.bar }}>
                oneagency.com
              </span>
            </div>
          </Tile>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[16, 32, 48, 180].map((s) => (
          <Tile key={s} label={`${s}px`} className="flex aspect-square flex-col items-center justify-center gap-3 bg-surface">
            <img src={fav} alt={`Favicon at ${s} pixels`} style={{ width: Math.min(s, 120), height: Math.min(s, 120) }} />
          </Tile>
        ))}
      </div>
    </KitModule>
  )
}

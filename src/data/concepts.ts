export type ConceptId = 'nova' | 'volt' | 'pill' | 'arc'
export type Mode = 'light' | 'dark'
export type PatternKind = 'frames' | 'marks' | 'capsules' | 'orbits'

export interface Swatch {
  name: string
  hex: string
  role: string
  /** Share of a typical layout, used for the proportion bar. */
  share: number
  /** Unsplash photo ID of the image the colour is drawn from, served from public/palette/<id>.webp. */
  photo: string
}

export interface ThemeTokens {
  bg: string
  surface: string
  surface2: string
  ink: string
  muted: string
  line: string
  /** Fill for buttons, highlights and tiles. */
  accent: string
  /** Text on top of `accent`. */
  accentInk: string
  /** Accent used as text or icon colour on `bg` (AA safe). */
  accentText: string
  accent2: string
  heroBg: string
  heroInk: string
  glow: string
}

export interface TypeFace {
  family: string
  stack: string
  weight: number
  stretch?: string
  tracking?: string
  /** Optical size correction so wide faces fit the same headline slot. */
  scale?: number
  /** Capitals only: the lowercase slots repeat the caps, so specimens skip the lowercase row. */
  unicase?: boolean
  weights: string
  note: string
}

export interface AppIcon {
  bg: string
  mode: Mode
  recolor?: Record<string, string>
}

export interface Concept {
  id: ConceptId
  index: string
  name: string
  tagline: string
  idea: string
  /** One-line pitch for the hero card, two lines at most. The card falls back to the opening clause of `idea`. */
  heroPitch?: string
  story: string
  rationale: { title: string; body: string }[]
  primaryLabel: string
  altLabel: string
  palette: Swatch[]
  gradient: string
  theme: Record<Mode, ThemeTokens>
  type: { display: TypeFace; body: TypeFace; logotype: string }
  voice: {
    summary: string
    traits: { name: string; body: string }[]
    say: string[]
    avoid: string[]
    samples: { label: string; text: string }[]
  }
  graphic: { pattern: PatternKind; name: string; body: string; principles: string[] }
  icons: AppIcon[]
  favicon: AppIcon
  radius: { sm: number; md: number; lg: number }
}

const mono = '"Sora", system-ui, sans-serif'

export const concepts: Concept[] = [
  {
    id: 'nova',
    index: '01',
    // Working name.
    name: 'Nova',
    tagline: 'One team. No seams.',
    idea: 'A rounded O that shares its right side with the N. The line that closes the O is the first stroke of the N, so the name runs without a seam.',
    heroPitch: 'A rounded O that shares its side with the N.',
    story:
      'Nova is built on a shared edge. The O is soft on three corners and square on the fourth, where it meets the N, so the line that closes one letter opens the next. The mint-to-violet gradient reads as a shift from idea to impact, and deep plum gives it a premium ground. The wide lowercase agency keeps it friendly, open and made for screens.',
    rationale: [
      { title: 'No seams', body: 'The O and N share one stroke, the way strategy, creative and media share one team.' },
      { title: 'Idea to impact', body: 'Mint shifting into violet reads as an idea turning into results, set on a premium plum ground.' },
      { title: 'Works alone', body: 'The square-cornered O is recognisable on its own as an app icon, avatar or favicon.' },
    ],
    primaryLabel: 'Horizontal lockup',
    altLabel: 'Wordmark',
    palette: [
      { name: 'Mint', hex: '#00FAB3', role: 'Gradient start, accent on dark, highlights', share: 16, photo: 'bHd7tm-2oWU' },
      { name: 'Ultra Violet', hex: '#6203D0', role: 'Primary accent on light, links, buttons', share: 18, photo: '5Q9Gf0WSyLk' },
      { name: 'Deep Plum', hex: '#400257', role: 'Hero surfaces, the reversed lockup, app icon', share: 26, photo: '1uyWq9xVwcE' },
      { name: 'Ink', hex: '#0F1417', role: 'Text, agency in the lockup, dark surfaces', share: 22, photo: 'NYtHU9TLkPE' },
      { name: 'Mist', hex: '#EBEBED', role: 'Supporting neutral: panels and light surfaces', share: 18, photo: 'pHUF3pNk1XA' },
    ],
    gradient: 'linear-gradient(120deg, #00FDBA 0%, #6203D0 90%)',
    theme: {
      // Mint never sets text on light surfaces: on light it is a fill under ink, or a highlight on plum.
      light: {
        bg: '#FFFFFF', surface: '#F5F5F7', surface2: '#EBEBED', ink: '#0F1417', muted: '#575C66',
        line: 'rgba(15,20,23,0.12)', accent: '#6203D0', accentInk: '#FFFFFF', accentText: '#6203D0',
        accent2: '#00FAB3', heroBg: '#400257', heroInk: '#F5F5F7', glow: '#00FAB3',
      },
      dark: {
        bg: '#0F1417', surface: '#161C20', surface2: '#1F262B', ink: '#F5F5F7', muted: '#A4ABB3',
        line: 'rgba(245,245,247,0.12)', accent: '#00FAB3', accentInk: '#0F1417', accentText: '#00FAB3',
        accent2: '#6203D0', heroBg: '#400257', heroInk: '#F5F5F7', glow: '#00FAB3',
      },
    },
    type: {
      display: {
        family: 'Unbounded', scale: 0.8, stack: '"Unbounded", system-ui, sans-serif', weight: 600, tracking: '-0.02em',
        weights: 'Medium 500, SemiBold 600, Bold 700', note: 'Wide and rounded, with the same open stance as the lowercase agency.',
      },
      body: {
        family: 'Plus Jakarta Sans', stack: '"Plus Jakarta Sans", system-ui, sans-serif', weight: 400, weights: 'Regular 400, Medium 500, Bold 700',
        note: 'Open and modern at normal width, so paragraphs read easily under the wide headlines.',
      },
      logotype: 'Custom O and NE capitals with a wide lowercase agency. The O and N share a stroke, so always use the supplied artwork.',
    },
    voice: {
      summary: 'Joined-up and approachable. We speak as one team, from the first idea to the result.',
      traits: [
        { name: 'Joined-up', body: 'Strategy, creative and media speak with one voice. Never "their side" or "our side".' },
        { name: 'Approachable', body: 'Plain words, short sentences, no jargon. Talk to people, not to a brief.' },
        { name: 'Inventive', body: 'Bring a new idea to every update, then show what it did.' },
      ],
      say: ['Ideas into impact. One team, start to finish.', 'Strategy, creative and media at one table.', 'We build the idea, then we run the numbers.'],
      avoid: ['Hand-offs and "not our department"', 'Ideas with no way to measure them', 'Cold, corporate distance'],
      samples: [
        { label: 'Headline', text: 'Make your next move.' },
        { label: 'Social', text: 'Media, creative and AI agents that qualify leads in 91 languages. One team, no seams.' },
        { label: 'CTA', text: 'Plan my next move' },
      ],
    },
    graphic: {
      pattern: 'frames',
      name: 'Frames in orbit',
      body: 'Tall capsule frames in mint, gradient and mist on deep plum, circled by thin mint-to-violet orbit lines.',
      principles: ['Put a face in every frame', 'Orbit lines always run mint to violet', 'The square corner belongs to the O'],
    },
    icons: [
      { bg: '#400257', mode: 'dark' },
      { bg: '#FFFFFF', mode: 'light' },
      { bg: '#00FAB3', mode: 'light', recolor: { '#00FDBA': '#0F1417', '#6203D0': '#0F1417' } },
      { bg: '#6203D0', mode: 'dark' },
    ],
    favicon: { bg: '#400257', mode: 'dark' },
    radius: { sm: 999, md: 24, lg: 40 },
  },
  {
    id: 'volt',
    index: '02',
    name: 'Volt',
    tagline: 'The 1 inside the O.',
    idea: 'Carved stencil capitals with a hidden numeral. The O is cut open to reveal a 1, so the name and the promise share one shape.',
    heroPitch: 'Stencil capitals cut like machined hardware.',
    story:
      'Volt treats the wordmark like a piece of machined hardware. Every letter is cut from a solid block, and the notch in the O becomes a 1 you notice on the second look. Electric lime gives the brand a colour nobody else in performance marketing owns, and deep navy keeps it grounded in serious work.',
    rationale: [
      { title: 'Owns a colour', body: 'Volt lime is unmistakable in a feed, on a slide and on a billboard.' },
      { title: 'Built for small sizes', body: 'The cut 1 survives at 16px, which makes it a strong app icon and favicon.' },
      { title: 'Performance energy', body: 'Heavy, compact letterforms read as speed, output and accountability.' },
    ],
    primaryLabel: 'Stacked lockup',
    altLabel: 'Wordmark',
    palette: [
      { name: 'Volt Lime', hex: '#E1FE03', role: 'Primary accent, highlights, CTAs', share: 24, photo: 'HiNkYqYYUAM' },
      { name: 'Volt Mint', hex: '#0DFD80', role: 'Secondary accent, live states, the mark on navy', share: 10, photo: 'bHd7tm-2oWU' },
      { name: 'Navy', hex: '#001749', role: 'Secondary surfaces, accent text on light', share: 14, photo: 'Jvuvr8nd2lM' },
      { name: 'Black', hex: '#000000', role: 'Logo, text, dark surfaces', share: 36, photo: 'g4kathGT8ko' },
      { name: 'Field', hex: '#F4F6EF', role: 'Supporting neutral: panels and light surfaces', share: 16, photo: 'pHUF3pNk1XA' },
    ],
    gradient: 'linear-gradient(120deg, #E1FE03 0%, #0DFD80 100%)',
    theme: {
      light: {
        bg: '#FFFFFF', surface: '#F4F6EF', surface2: '#E8ECDF', ink: '#000000', muted: '#4D5446',
        line: 'rgba(0,0,0,0.12)', accent: '#E1FE03', accentInk: '#000000', accentText: '#001749',
        accent2: '#001749', heroBg: '#000000', heroInk: '#F4F6EF', glow: '#E1FE03',
      },
      dark: {
        bg: '#0A0A0A', surface: '#141612', surface2: '#1D2019', ink: '#F4F6EF', muted: '#A3AA97',
        line: 'rgba(244,246,239,0.12)', accent: '#E1FE03', accentInk: '#000000', accentText: '#E1FE03',
        accent2: '#0DFD80', heroBg: '#000000', heroInk: '#F4F6EF', glow: '#E1FE03',
      },
    },
    type: {
      display: {
        family: 'one-dvg', scale: 0.74, unicase: true, stack: '"one-dvg", "Unbounded", system-ui, sans-serif', weight: 800,
        tracking: '-0.01em', weights: 'ExtraBold 800', note: 'An original display face drawn for ONE Agency to match the wide stencil capitals.',
      },
      body: {
        family: 'Archivo', stack: '"Archivo", system-ui, sans-serif', weight: 400, weights: 'Regular 400, Medium 500, Semibold 600',
        note: 'A neutral grotesk at normal width, so long copy stays calm beside the wide display.',
      },
      logotype: 'Custom carved stencil capitals. Always use the supplied artwork, never retype it.',
    },
    voice: {
      summary: 'Loud, fast and measurable. Every line earns its place with a number.',
      traits: [
        { name: 'Punchy', body: 'Short sentences that land. If it takes a breath to read, cut it.' },
        { name: 'Proof first', body: 'Lead with the result, then explain how we got it.' },
        { name: 'Restless', body: 'Always talking about the next test, the next win, the next launch.' },
      ],
      say: ['Intent in. Revenue out.', '80,000 leads. One accountable team.', 'We test, we ship, we report.'],
      avoid: ['Hype without a receipt', 'Exclamation marks', 'Buzzwords like synergy or 360'],
      samples: [
        { label: 'Headline', text: 'Intent in. Revenue out.' },
        { label: 'Social', text: '522 cruise-sale leads in 23 days. Next.' },
        { label: 'CTA', text: 'Run my audit' },
      ],
    },
    graphic: {
      pattern: 'marks',
      name: 'Staggered marks',
      body: 'The 1 mark repeated in staggered rows: lime on black, or black on mint.',
      principles: ['Offset every other row by half a tile', 'Lime is a spotlight, use it once per layout', 'Black space is part of the brand'],
    },
    icons: [
      { bg: '#E1FE03', mode: 'light' },
      { bg: '#001749', mode: 'light', recolor: { '#000000': '#0DFD80' } },
      { bg: '#0DFD80', mode: 'light' },
      { bg: '#000000', mode: 'dark' },
    ],
    favicon: { bg: '#E1FE03', mode: 'light' },
    radius: { sm: 8, md: 18, lg: 32 },
  },
  {
    id: 'pill',
    index: '03',
    name: 'Pill',
    tagline: 'One system, intent to revenue.',
    idea: 'The O stretched into a capsule, filled with a gradient from green to violet. A progress bar for the whole funnel.',
    heroPitch: 'The O becomes a progress bar for the funnel.',
    story:
      'Pill turns the operating system into the logo. The capsule reads as a toggle, a progress bar and a pipeline at once, and the gradient travels from green intent to violet revenue. Plum night gives the brand a premium, after-dark confidence, and the mark animates beautifully as a loader or progress indicator.',
    rationale: [
      { title: 'Full funnel', body: 'One shape for the six-step operating system, from capture to monetize.' },
      { title: 'Made to move', body: 'The capsule fills, slides and pulses, which makes it ideal for motion and UI.' },
      { title: 'Premium contrast', body: 'Violet, green and plum stand apart from every competitor in the category.' },
    ],
    primaryLabel: 'Stacked lockup',
    altLabel: 'Horizontal lockup',
    palette: [
      { name: 'Pulse Green', hex: '#43FC5E', role: 'Gradient start, accent on dark', share: 12, photo: 'nERPmYvPNhA' },
      { name: 'Pulse Yellow', hex: '#E5FE27', role: 'Gradient highlight on dark', share: 6, photo: 'SMCQQlSYx4s' },
      { name: 'Ultra Violet', hex: '#6203D0', role: 'Logo, primary accent on light', share: 22, photo: '5Q9Gf0WSyLk' },
      { name: 'Plum Night', hex: '#170032', role: 'Text, dark surfaces, logo boxes', share: 36, photo: '1uyWq9xVwcE' },
      { name: 'Lavender', hex: '#F6F3FB', role: 'Supporting neutral: panels and light surfaces', share: 24, photo: 'VXUhQqO8u5Q' },
    ],
    gradient: 'linear-gradient(90deg, #43FC5E 0%, #6203D0 90%)',
    theme: {
      light: {
        bg: '#FFFFFF', surface: '#F6F3FB', surface2: '#ECE5F7', ink: '#170032', muted: '#5E5470',
        line: 'rgba(23,0,50,0.12)', accent: '#6203D0', accentInk: '#FFFFFF', accentText: '#6203D0',
        accent2: '#43FC5E', heroBg: '#170032', heroInk: '#F6F3FB', glow: '#43FC5E',
      },
      dark: {
        bg: '#10002A', surface: '#1D0A3A', surface2: '#291449', ink: '#F6F3FB', muted: '#B3A8C4',
        line: 'rgba(246,243,251,0.12)', accent: '#43FC5E', accentInk: '#170032', accentText: '#43FC5E',
        accent2: '#E5FE27', heroBg: '#170032', heroInk: '#F6F3FB', glow: '#43FC5E',
      },
    },
    type: {
      display: {
        family: 'Syne', stack: '"Syne", system-ui, sans-serif', weight: 700, tracking: '-0.03em',
        weights: 'Bold 700, ExtraBold 800', note: 'Matches the agency line in the light lockup.',
      },
      body: {
        family: 'Manrope', stack: '"Manrope", system-ui, sans-serif', weight: 500, weights: 'Regular 400, Medium 500, Bold 700',
        note: 'Soft geometry that echoes the capsule corners.',
      },
      logotype: 'Custom capsule O and NE capitals, with Syne Bold for agency. Use the supplied artwork.',
    },
    voice: {
      summary: 'Systematic and accountable. We show the whole pipeline and own every step.',
      traits: [
        { name: 'Systematic', body: 'Explain the process step by step. Clients should see the machine.' },
        { name: 'Accountable', body: 'Own the outcome. Say who does what, and by when.' },
        { name: 'Transparent', body: 'Report from week two, not week twelve. Nothing hidden.' },
      ],
      say: ['Six steps from intent to revenue. One accountable team.', 'We argue about contribution margin, not reach.', 'Reporting from week two.'],
      avoid: ['Channel-only thinking', 'Vanity metrics', 'Blaming the other vendor'],
      samples: [
        { label: 'Headline', text: 'One system, intent to revenue.' },
        { label: 'Social', text: 'Capture. Answer. Qualify. Nurture. Convert. Monetize. One team runs all six.' },
        { label: 'CTA', text: 'Map my funnel' },
      ],
    },
    graphic: {
      pattern: 'capsules',
      name: 'Progress capsules',
      body: 'Rounded capsules that fill, stack and stretch like a funnel report. The gradient always moves from green to violet.',
      principles: ['Capsules show progress, so fill them', 'Gradient direction means intent to revenue', 'Plum night for premium moments'],
    },
    icons: [
      { bg: '#170032', mode: 'dark' },
      { bg: '#6203D0', mode: 'dark' },
      { bg: '#FFFFFF', mode: 'light' },
      { bg: '#43FC5E', mode: 'light', recolor: { '#6203D0': '#170032', '#3FFC61': '#170032' } },
    ],
    favicon: { bg: '#170032', mode: 'dark' },
    radius: { sm: 999, md: 0, lg: 0 },
  },
  {
    id: 'arc',
    index: '04',
    name: 'Arc',
    tagline: 'Growth that keeps rising.',
    idea: 'Two arcs rising together, one carrying the other. Agency and client, or intent and revenue, moving in the same direction.',
    heroPitch: 'Two arcs rising, one carrying the other.',
    story:
      'Arc is the optimist of the set. A large arc lifts a smaller one, like a sunrise or a signal climbing, and the cut between them gives the mark a sense of motion. On black it glows electric yellow. On white it switches to hot pink. Either way it feels like momentum.',
    rationale: [
      { title: 'Momentum', body: 'Rising forms tell a growth story before a single word is read.' },
      { title: 'Two-mode colour', body: 'Yellow on dark and pink on light give the brand two strong, ownable looks.' },
      { title: 'Simple geometry', body: 'Arcs scale to patterns, loaders and motion with no redrawing.' },
    ],
    primaryLabel: 'Stacked lockup',
    altLabel: 'Horizontal lockup',
    palette: [
      { name: 'Arc Yellow', hex: '#FBFF19', role: 'Mark on dark, accent on light, pattern ground', share: 22, photo: 'S53ekmu8KkE' },
      { name: 'Hot Pink', hex: '#FF1F71', role: 'Mark on light, accent on dark, AGENCY', share: 18, photo: 'BLD_RQQglBw' },
      { name: 'Night', hex: '#0C0E09', role: 'Text, dark surfaces', share: 40, photo: 'NYtHU9TLkPE' },
      { name: 'Paper', hex: '#F7F7F2', role: 'Supporting neutral: panels and light surfaces', share: 20, photo: 'DXzDtHsCQFI' },
    ],
    gradient: 'linear-gradient(0deg, #F8F81A 0%, #FE3C66 35.5%, #CB1C5E 66.9%, #0E0D09 100%)',
    theme: {
      light: {
        bg: '#FFFFFF', surface: '#F7F7F2', surface2: '#EDEDE6', ink: '#0C0E09', muted: '#565851',
        line: 'rgba(12,14,9,0.12)', accent: '#FBFF19', accentInk: '#0C0E09', accentText: '#C8004B',
        accent2: '#FF1F71', heroBg: '#0C0E09', heroInk: '#FAFAF7', glow: '#FBFF19',
      },
      dark: {
        bg: '#0C0E09', surface: '#161812', surface2: '#20231B', ink: '#FAFAF7', muted: '#A7AA9F',
        line: 'rgba(250,250,247,0.12)', accent: '#FF1F71', accentInk: '#0C0E09', accentText: '#FBFF19',
        accent2: '#FBFF19', heroBg: '#070806', heroInk: '#FAFAF7', glow: '#FF1F71',
      },
    },
    type: {
      display: {
        family: 'one-dvg', scale: 0.74, unicase: true, stack: '"one-dvg", "Unbounded", system-ui, sans-serif', weight: 800,
        tracking: '-0.01em', weights: 'ExtraBold 800', note: 'An original display face drawn for ONE Agency to match the wide ONE AGENCY capitals.',
      },
      body: {
        family: 'DM Sans', stack: '"DM Sans", system-ui, sans-serif', weight: 400, weights: 'Regular 400, Medium 500, Bold 700',
        note: 'Geometric and friendly, a natural partner for the arcs.',
      },
      logotype: 'Custom arc mark with wide ONE AGENCY capitals. Use the supplied artwork.',
    },
    voice: {
      summary: 'Optimistic and forward. We talk about where the numbers are going.',
      traits: [
        { name: 'Upbeat', body: 'Confident energy without the hype. Celebrate wins with specifics.' },
        { name: 'Bold', body: 'Make the big claim, then back it up in the next line.' },
        { name: 'Forward', body: 'Frame everything as the next step on the way up.' },
      ],
      say: ['From first click to closed deal.', 'Growth that keeps rising, quarter after quarter.', 'Here is the next win.'],
      avoid: ['Dwelling on problems without a fix', 'Vague optimism', 'Cynical humour'],
      samples: [
        { label: 'Headline', text: 'Growth that keeps rising.' },
        { label: 'Social', text: '$9,000 in one day, from one email. Imagine the quarter.' },
        { label: 'CTA', text: 'Get the growth plan' },
      ],
    },
    graphic: {
      pattern: 'orbits',
      name: 'Orbits',
      body: 'Two arc marks locked into a disc and turned in quarter steps across yellow. On black, the arcs rise in staggered rows.',
      principles: ['Turn tiles in quarter steps only', 'Keep the cut, it is the signature', 'Yellow on dark, pink on light'],
    },
    icons: [
      { bg: '#0C0E09', mode: 'dark' },
      { bg: '#FBFF19', mode: 'light' },
      { bg: '#FF1F71', mode: 'light', recolor: { '#FF1F71': '#FFFFFF' } },
      { bg: '#FFFFFF', mode: 'light' },
    ],
    favicon: { bg: '#0C0E09', mode: 'dark' },
    radius: { sm: 999, md: 6, lg: 12 },
  },
]

export const conceptById = Object.fromEntries(concepts.map((c) => [c.id, c])) as Record<ConceptId, Concept>

export const monoStack = mono

/** Facts about ONE Agency, taken from the current site concept. */
export const company = {
  name: 'ONE Agency',
  positioning: 'Business to Human · Engagement Engineering',
  promise: 'We capture intent. Then we convert it.',
  about:
    'ONE Agency builds and runs customer acquisition for national brands in travel, higher education, franchise, healthcare, automotive, retail and home services. Media, creative, engineering and the AI platform that converts the traffic, run by one accountable team.',
  founders:
    'Founded by operators who built and sold companies in the sectors they now market for. ConversionIQ.ai is the sister company: same founders, separate company.',
  stats: [
    { value: '80k+', label: 'Leads delivered for vacation ownership brands' },
    { value: '91', label: 'Languages our AI agents qualify leads in' },
    { value: '6', label: 'Steps from intent to revenue' },
    { value: '2026', label: 'ARDY Award, Best AI Product' },
  ],
  steps: ['Capture', 'Answer', 'Qualify', 'Nurture', 'Convert', 'Monetize'],
  phone: '(689) 205-9923',
}

import { useState } from 'react'
import type { ConceptId } from '../data/concepts'
import { mockups, type MockupKind, type MockupPhoto } from '../data/mockups'

export type LoadState = 'loading' | 'ready' | 'failed'

/** Chip text per kind. */
export const kindLabel: Record<MockupKind, string> = {
  environment: 'Environment',
  print: 'Print',
  merch: 'Merch',
  poster: 'Poster',
  social: 'Social',
  art: 'Art',
}

/** A concept's photos of the given kinds, in manifest order. */
export function photosOf(id: ConceptId, kinds: MockupKind[]) {
  return mockups[id].filter((p) => kinds.includes(p.kind))
}

/**
 * Crop focus (a CSS `object-position`) for photos shown in a frame that is not their own shape, keyed
 * `<concept>/<slug>`. Hand-kept here rather than in src/data/mockups.ts, so `npm run build:mockups` never wipes it; when
 * a photo is renamed or replaced, update its key. Only the Voice mood photo is cropped today (it stretches to the
 * quote's height); the gallery and campaign row show every photo at its own ratio. Unlisted photos crop from the centre.
 */
const focus: Partial<Record<`${ConceptId}/${string}`, string>> = {
  // Each keeps the face in frame down to a ~0.7 portrait crop (tablets, where the quote column is narrow and tall).
  'nova/monochrome-vr-muse-with-orbiting-design-cards': '70% 50%',
  'volt/electric-lime-halftone-muse': '95% 50%',
  'pill/violet-visor-orbiting-creative-worlds': '70% 50%',
}

export const focusOf = (id: ConceptId, slug: string) => focus[`${id}/${slug}`] ?? '50% 50%'

type PhotoKey = `${ConceptId}/${string}`

/** Each manifest photo's `<concept>/<slug>` key, so the helpers below need only the photo the components already hold. */
const keys = new Map<MockupPhoto, PhotoKey>(
  (Object.entries(mockups) as [ConceptId, MockupPhoto[]][]).flatMap(([id, list]) => list.map((p): [MockupPhoto, PhotoKey] => [p, `${id}/${p.slug}`])),
)

/**
 * Alt text, keyed `<concept>/<slug>` like `focus` and hand-kept for the same reason. One sentence on what the photo
 * shows: the object and the concept's colours, not the mark in detail. Unlisted photos fall back to their title.
 */
const alts: Partial<Record<PhotoKey, string>> = {
  'nova/interactive-exhibition-stand': 'ONE Agency exhibition stand in brushed steel with mint and violet portrait banners, a plum carpet and a glowing O on the desk.',
  'nova/branded-creative-loft': 'ONE Agency studio loft with a plum reception wall, a portrait mural reading "Ideas into impact." and a mint-to-violet O on the glass.',
  'nova/modern-mint-and-plum-agency-stationery': 'ONE Agency stationery in white, mint, violet and plum: letterhead, business cards, notebook, envelope, pen and a clear folder.',
  'nova/modern-merch-showcase': 'Model in a plum ONE Agency T-shirt beside a printed tee, grey tote, mint headphones, plum cap and stickered laptop.',
  'nova/mint-and-violet-posters': 'Three ONE Agency posters in light grey and plum with black-and-white portraits, capsule frames and violet and white headlines.',
  'nova/modern-social-creative-grid': 'Six ONE Agency social posts in light grey, plum and mint with portraits, orbit lines and bold headlines.',
  'nova/monochrome-vr-muse-with-orbiting-design-cards': 'Black-and-white portrait of a woman in a violet VR visor, circled by a ribbon of brand tiles and mint and violet orbit lines.',

  // Key visuals (art photos after the Voice mood image), shown under Graphic language.
  'volt/refracted-lime-logo-on-midnight-navy': 'The lime ONE mark glowing through vertical glass slats on a navy-to-green gradient.',
  'arc/luminous-arch-behind-fluted-glass': 'Glowing yellow and pink arches seen through fluted glass, reflected on a black floor.',
  'arc/electric-arch-ribbons-in-motion': 'Glossy yellow, pink and chrome ribbons curling on black beside the ONE Agency logo.',
  'arc/sculptural-ribbons-in-near-black': 'Glossy yellow, pink and chrome ribbons curling through each other on a near-black ground.',
  'volt/premium-exhibition-stand': 'ONE Agency exhibition stand with a lime reception desk, navy wall and green-lit lounge.',
  'volt/lime-navy-office-reception': 'ONE Agency office reception with a navy desk, a lime bench and a black wall logo.',
  'volt/premium-stationery-set': 'ONE Agency stationery in navy, lime and black: folder, letterhead, notebook, business cards and envelope.',
  'volt/accordion-fold-brochure-mockup': 'Accordion-fold ONE Agency brochure in lime, black and navy, with panels for strategy, design and digital.',
  'volt/creative-pass-trio': 'Three ONE Agency lanyard passes in green, navy and lime for production, strategy and creative.',
  'volt/premium-capsule-collection': 'ONE Agency merch in black and lime: T-shirts, cap, tote, navy bottle and notebook.',
  'volt/make-your-mark': 'Lime ONE Agency poster of a seated model under the headline "Make your mark."',
  'volt/urban-poster-triptych': 'Three ONE Agency street posters in lime, black and navy, led by "Think big."',
  'volt/endless-possibilities': 'Glowing lime ONE marks recede across a navy poster reading "One idea. Endless possibilities."',
  'volt/social-media-campaign': 'ONE Agency Instagram profile, six lime, navy and black posts and a matching story.',
  'volt/six-card-editorial-campaign': 'Six ONE Agency social posts in lime, green, navy and black with portraits and bold headlines.',
  'volt/electric-lime-halftone-muse': 'Black-and-white portrait of a woman looking upward against a lime circle on navy.',

  'pill/luminous-capsule-exhibition-stand': 'ONE Agency exhibition stand in deep purple with a green-lit canopy and violet and yellow waves.',
  'pill/luminous-modern-reception': 'ONE Agency reception with a deep purple wall, steel desk and violet and green wave mural.',
  'pill/digital-portrait-pop-up': 'ONE Agency pop-up stand with purple portrait banners, an "Ideas into impact" screen and two kiosks.',
  'pill/kinetic-creative-loft': 'Busy ONE Agency studio loft with purple and lime wall graphics and designers at their desks.',
  'pill/bold-stationery-system': 'ONE Agency stationery in purple, lime and grey: folder, letterhead, business cards, envelope and notebook.',
  'pill/streetwear-merch-editorial': 'Model in a purple ONE Agency T-shirt beside a printed tee, tote, cap and stickered laptop.',
  'pill/bold-digital-poster-trio': 'Three ONE Agency posters in white and deep purple with monochrome portraits and green and lime accents.',
  'pill/social-campaign-grid': 'Six ONE Agency social posts in purple, green and lime beside a phone showing the feed.',
  'pill/six-tile-digital-showcase': 'Six ONE Agency social tiles in purple, green and white with portraits and bold headlines.',
  'pill/violet-visor-orbiting-creative-worlds': 'Woman in a purple VR visor, circled by a ribbon of purple and lime brand tiles.',

  'arc/acid-toned-reception': 'ONE Agency reception with a white arch desk, pink bench, yellow armchair and arch posters.',
  'arc/arch-exhibition-stand': 'Black ONE Agency exhibition stand with giant yellow and pink arches and a white desk.',
  'arc/geometric-stationery-suite': 'ONE Agency stationery in black, pink and yellow: folder, letterhead, business cards, envelope and notebook.',
  'arc/arch-emblem-merch-collection': 'ONE Agency merch with pink and yellow arches: T-shirts, cap, yellow bottle, notebook and tote.',
  'arc/three-bold-arch-posters': 'Three ONE Agency posters in yellow, black and pink with arches and black-and-white portraits.',
  'arc/arch-campaign-grid': 'Six ONE Agency social posts in black, pink and yellow with arches, portraits and a phone.',
  'arc/geometric-icon-grid': 'Nine ONE Agency icons built from pink, yellow and black arches on white.',
  'arc/acid-yellow-and-pink-arch-dreamscape': 'Yellow and pink arches receding down a sunlit white corridor.',

}

/**
 * Display names for the lightbox caption and the campaign chips, where the title cleaned from the filename is long,
 * repeats its chip ("Campaign · Social campaign showcase") or keeps a filename habit ("mockup", "premium"). Short and
 * sentence case. Unlisted photos show their title as is.
 */
const titles: Partial<Record<PhotoKey, string>> = {
  'nova/interactive-exhibition-stand': 'Exhibition stand',
  'nova/branded-creative-loft': 'Creative studio loft',
  'nova/modern-mint-and-plum-agency-stationery': 'Stationery set',
  'nova/modern-merch-showcase': 'Merch showcase',
  'nova/mint-and-violet-posters': 'Poster trio',
  'nova/modern-social-creative-grid': 'Six social posts',
  'nova/monochrome-vr-muse-with-orbiting-design-cards': 'VR muse with orbiting cards',
  'volt/refracted-lime-logo-on-midnight-navy': 'Refracted mark',
  'arc/luminous-arch-behind-fluted-glass': 'Arch behind fluted glass',
  'arc/electric-arch-ribbons-in-motion': 'Ribbons with logo',
  'arc/sculptural-ribbons-in-near-black': 'Sculptural ribbons',
  'volt/premium-exhibition-stand': 'Exhibition stand',
  'volt/lime-navy-office-reception': 'Office reception',
  'volt/premium-stationery-set': 'Stationery set',
  'volt/accordion-fold-brochure-mockup': 'Accordion-fold brochure',
  'volt/creative-pass-trio': 'Lanyard passes',
  'volt/premium-capsule-collection': 'Capsule collection',
  'volt/social-media-campaign': 'Instagram profile and story',
  'volt/six-card-editorial-campaign': 'Six editorial posts',
  'pill/luminous-capsule-exhibition-stand': 'Capsule exhibition stand',
  'pill/luminous-modern-reception': 'Modern reception',
  'pill/kinetic-creative-loft': 'Creative studio loft',
  'pill/social-campaign-grid': 'Post grid and feed',
  'pill/six-tile-digital-showcase': 'Six-tile showcase',
  'arc/arch-emblem-merch-collection': 'Arch merch collection',
  'arc/arch-campaign-grid': 'Arch post grid',
}

const lookup = (map: Partial<Record<PhotoKey, string>>, photo: MockupPhoto) => {
  const key = keys.get(photo)
  return (key && map[key]) || photo.title
}

/**
 * The hero's full-bleed photo per concept, hand-picked (usually from its art photos): the most striking one that leaves
 * the lower left calm and dark for the headline, and that no other concept's hero resembles. `focus` is its
 * `object-position`, keeping the subject in frame down to a phone's tall crop. `portrait` overrides it on portrait screens,
 * for a wide photo whose landscape and phone crops want different subjects. Hand-kept for the same reason as `focus`;
 * a concept left out falls back to its first art photo.
 */
const heroes: Partial<Record<ConceptId, { slug: string; focus: string; portrait?: string }>> = {
  // Landscape keeps the whole "ONE agency" wall sign (it starts 2.5% in). A phone sees about a quarter of the width, too
  // little for the sign, so portrait frames the mural portrait and "Ideas into impact." instead of a cropped logo.
  nova: { slug: 'branded-creative-loft', focus: '8% 40%', portrait: '45% 40%' },
  volt: { slug: 'electric-lime-halftone-muse', focus: '82% 30%' },
  pill: { slug: 'violet-visor-orbiting-creative-worlds', focus: '68% 20%' },
  arc: { slug: 'luminous-arch-behind-fluted-glass', focus: '62% 50%' },
}

/**
 * A concept's hero photo with its crop focus (and the portrait-screen focus, the same unless set), or its first art
 * photo (then first photo) cropped from the centre.
 */
export function heroOf(id: ConceptId): { photo: MockupPhoto; focus: string; portrait: string } {
  const pick = heroes[id]
  const chosen = pick ? mockups[id].find((p) => p.slug === pick.slug) : undefined
  if (pick && chosen) return { photo: chosen, focus: pick.focus, portrait: pick.portrait ?? pick.focus }
  return { photo: photosOf(id, ['art'])[0] ?? mockups[id][0], focus: '50% 50%', portrait: '50% 50%' }
}

/** A photo's alt text, or its title when it has none. */
export const altOf = (photo: MockupPhoto) => lookup(alts, photo)

/** A photo's display name for captions and chips, or its title when it has no override. */
export const titleOf = (photo: MockupPhoto) => lookup(titles, photo)

/** The layoutId a thumbnail shares with its lightbox frame, unique per section so two sections never collide. */
export const photoLayoutId = (scope: string, slug: string) => `photo-${scope}-${slug}`

/** Load state of one photo. `retry` re-requests with a query string, so a cached failure is not served again. */
export function usePhotoLoad(photo: MockupPhoto) {
  const [state, setState] = useState<LoadState>('loading')
  const [attempt, setAttempt] = useState(0)
  const bust = (url: string) => (attempt ? `${url}?retry=${attempt}` : url)
  return {
    state,
    attempt,
    src: bust(photo.src),
    srcSet: `${bust(photo.srcSm)} ${photo.widthSm}w, ${bust(photo.src)} ${photo.width}w`,
    onLoad: () => setState('ready'),
    onError: () => setState('failed'),
    retry: () => {
      setAttempt((a) => a + 1)
      setState('loading')
    },
  }
}

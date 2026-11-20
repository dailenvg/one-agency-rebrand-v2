import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import type { ConceptId } from '../data/concepts'
import { crossfade } from '../lib/motion'
import { heroOf, usePhotoLoad } from '../lib/photos'

/**
 * The hero's full-bleed photo for one concept. It fades in once loaded and out when the concept changes (the parent
 * keys it by concept inside AnimatePresence). Until it loads, or if it fails, the section's hero colour shows through
 * under the scrim, so the copy reads either way and there is nothing to retry.
 *
 * Decorative (empty alt): it is a backdrop to the headline, and every hero photo is described where it appears in the
 * page body, so a screen reader would only hear the same sentence twice, and first, before the h1.
 */
export function HeroPhoto({ id }: { id: ConceptId }) {
  const { photo, focus, portrait } = heroOf(id)
  const { state, src, srcSet, onLoad, onError } = usePhotoLoad(photo)
  const ratio = photo.width / photo.height
  return (
    <motion.img
      src={src}
      srcSet={srcSet}
      // object-cover: on any screen taller than the photo's ratio (every phone and portrait tablet) it renders at the
      // screen's height times that ratio, far wider than 100vw, so a 2x phone would otherwise pick the small file.
      sizes={`(max-aspect-ratio: ${photo.width}/${photo.height}) ${Math.ceil(ratio * 100)}vh, 100vw`}
      alt=""
      width={photo.width}
      height={photo.height}
      fetchPriority="high"
      decoding="async"
      onLoad={onLoad}
      onError={onError}
      // Both crops as variables so a media query can pick: an inline object-position would beat the portrait class.
      className="absolute inset-0 size-full object-cover [object-position:var(--focus)] portrait:[object-position:var(--focus-portrait)]"
      style={{ '--focus': focus, '--focus-portrait': portrait } as CSSProperties}
      variants={crossfade}
      initial="initial"
      animate={state === 'ready' ? 'animate' : 'initial'}
      exit="exit"
    />
  )
}

# ONE Agency · Rebrand Concepts

A themeable presentation site for four ONE Agency logo concepts (01 Nova, 02 Volt, 03 Pill, 04 Arc), each with a full brand kit. Selecting a concept re-skins the whole page: colours, display type, radii, favicon.

```bash
npm install
npm run dev
```

- Share a concept directly with `?concept=nova|volt|pill|arc`. Unknown or retired ids fall back to nova.
- Concept data (palette, tokens, type, voice, graphic language) lives in `src/data/concepts.ts`.
- Logo files in `src/assets/logos` are generated from the Figma boards in `design/figma-exports/boards` (`nova.svg`, `v1.svg`, `v3.svg`, `v4.svg`) by `python3 scripts/build-logos.py`. Re-run it after re-exporting from Figma.
- The one-dvg display face (`src/assets/fonts/one-dvg.ttf` and `.woff2`) is built by `python3 scripts/build-font.py`. It needs fonttools, brotli, skia-pathops and Pillow: `pip3 install --user fonttools brotli skia-pathops pillow`.
- Motion tokens live in `src/lib/motion.ts` (Framer Motion via the `motion` package).

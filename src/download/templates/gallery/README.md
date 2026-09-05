# {{CURATION_TITLE_RAW}}

Run `npm install && npm run dev` from this directory. The slideshow plays on load; use the ☰ menu to browse all sketches and jump to one. Edit `public/gallery.yaml` to change playback timing and order (set `randomize: false` for curation order). Sketch titles and authors come from each sketch's `metadata/metadata.json`; optional `titleOverride` and `authorOverride` properties can be added there.

## Production build

Run `npm ci && npm run build` to build the site into `dist`. The shared Vite build target is ES2022, allowing top-level `await` in bundled modules without per-file wrappers. Playback requires a browser (or OBS browser source) that supports ES2022. Files under `public/sketches` are copied unchanged and run directly in the browser.

## Sketch presentation

The gallery applies shared canvas presentation inside each sketch iframe before revealing it. Canvases are centered at their original size, including after viewport or canvas resizing; oversized canvases are cropped symmetrically. This happens in `applySketchPresentation()` in `main.js`, not in the exported sketch sources or the outer iframe styles. Standalone sketch pages retain their original layout.

## URL parameters

Append query parameters to the slideshow URL to override `gallery.yaml` without editing it:

- `duration` — seconds each slide is shown (e.g. `?duration=30`)
- `shuffle` — `true`/`false` for smart random order
- `autoplay` — `true`/`false` to auto-advance between slides
- `overlay` — `true`/`false` to show/hide the slide-pill
- `blur` — `true`/`false` for the pill's backdrop blur (set `false` to avoid flicker in OBS/CEF sources)
- `shadow` — `true`/`false` for the pill's drop shadow
- `top` — extra pixels added to the slide-pill's top margin (e.g. `?top=45`)
- `backgroundColor` — hex color for the slide-pill background, no leading `#` (e.g. `?backgroundColor=ffffffb3`)

Example: `?duration=30&shuffle=true&autoplay=false`

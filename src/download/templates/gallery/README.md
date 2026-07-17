# {{CURATION_TITLE_RAW}}

Run `npm install && npm run dev` from this directory. The slideshow plays on load; use the "← Grid" button to browse all sketches as a grid. Edit `public/gallery.yaml` to change playback timing and order (set `randomize: false` for curation order). Sketch titles and authors come from each sketch's `metadata/metadata.json`; optional `titleOverride` and `authorOverride` properties can be added there.

## URL parameters

Append query parameters to the slideshow URL to override `gallery.yaml` without editing it:

- `duration` — seconds each slide is shown (e.g. `?duration=30`)
- `shuffle` — `true`/`false` for smart random order
- `autoplay` — `true`/`false` to auto-advance between slides

Example: `?duration=30&shuffle=true&autoplay=false`

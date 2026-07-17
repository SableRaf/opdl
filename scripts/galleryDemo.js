#!/usr/bin/env node
// Dev harness for the gallery template: scaffolds a gallery with 26 test
// sketches (A–Z) so the slideshow crossfade and the scrollable sidebar grid can
// be checked visually without downloading a real curation. The sketches are the
// same two full-viewport templates (Waves/Orbit) alternating, each tinted with a
// per-letter hue so successive slides are easy to tell apart.
// Usage: node scripts/galleryDemo.js [outputDir] [--no-run]
// Default output: build/gallery-demo

const fs = require('fs');
const path = require('path');
const { scaffoldGalleryProject } = require('../src/download/galleryScaffolder');

// 320x180 JPEG thumbnails matching each sketch, embedded so the script has no
// runtime dependencies (the gallery grid expects metadata/thumbnail.jpg).
const THUMB_A = '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';
const THUMB_B = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAC0AUADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5qooorqMgooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACp7C0mv763s7RPMuLiRYokyBuZjgDJ4HJ71BXpv7PdpDcePZJZk3SW1lJLEckbWLImff5XYc+tceYY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';

// The two base templates, parameterized by the letter to display and a base hue
// so every generated sketch is a minor color variation of one of the two.

// Waves: a diagonal gradient that animates through hues offset from `baseHue`.
function wavesHtml(letter, baseHue) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="UTF-8"><title>Demo ${letter}</title>
<style>html,body{margin:0;height:100%;overflow:hidden}canvas{display:block}</style></head>
<body>
<canvas id="c"></canvas>
<script>
const canvas = document.querySelector('#c');
const ctx = canvas.getContext('2d');
const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
addEventListener('resize', resize);
resize();
(function draw(t) {
  const hue = (${baseHue} + t / 40) % 360;
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'hsl(' + hue + ' 80% 55%)');
  gradient.addColorStop(1, 'hsl(' + (hue + 90) + ' 80% 35%)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold ' + Math.min(canvas.width, canvas.height) * 0.4 + 'px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(${JSON.stringify(letter)}, canvas.width / 2, canvas.height / 2);
  requestAnimationFrame(draw);
})(0);
</script>
</body>
</html>
`;
}

// Orbit: a dot circling the letter, its color set by `baseHue`.
function orbitHtml(letter, baseHue) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="UTF-8"><title>Demo ${letter}</title>
<style>html,body{margin:0;height:100%;overflow:hidden;background:#0b1020}canvas{display:block}</style></head>
<body>
<canvas id="c"></canvas>
<script>
const canvas = document.querySelector('#c');
const ctx = canvas.getContext('2d');
const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
addEventListener('resize', resize);
resize();
(function draw(t) {
  ctx.fillStyle = '#0b1020';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold ' + Math.min(canvas.width, canvas.height) * 0.4 + 'px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(${JSON.stringify(letter)}, canvas.width / 2, canvas.height / 2);
  const radius = Math.min(canvas.width, canvas.height) * 0.35;
  const x = canvas.width / 2 + Math.cos(t / 600) * radius;
  const y = canvas.height / 2 + Math.sin(t / 600) * radius;
  ctx.fillStyle = 'hsl(${baseHue} 90% 60%)';
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fill();
  requestAnimationFrame(draw);
})(0);
</script>
</body>
</html>
`;
}

// A–Z: alternate the two templates, giving each letter an evenly-spaced hue.
const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const DEMO_SKETCHES = LETTERS.map((letter, index) => {
  const isWaves = index % 2 === 0;
  const hue = Math.round((index / LETTERS.length) * 360);
  const kind = isWaves ? 'Waves' : 'Orbit';
  return {
    id: `demo-${letter.toLowerCase()}`,
    title: `Demo ${letter} — ${kind}`,
    author: 'opdl demo',
    dir: `demo-${letter.toLowerCase()}_${kind}`,
    thumbnail: isWaves ? THUMB_A : THUMB_B,
    html: (isWaves ? wavesHtml : orbitHtml)(letter, hue),
  };
});

const GALLERY_YAML = `# Playback config (short timings for testing the crossfade)
slideDuration: 4        # seconds each slide is shown
transitionTime: 1.5     # seconds used to crossfade
autoplay: true
`;

async function main() {
  const args = process.argv.slice(2);
  const run = !args.includes('--no-run');
  const outputDir = args.find((arg) => !arg.startsWith('--')) || path.join('build', 'gallery-demo');
  const root = path.resolve(outputDir);

  for (const sketch of DEMO_SKETCHES) {
    const sketchDir = path.join(root, 'public', 'sketches', sketch.dir);
    fs.mkdirSync(path.join(sketchDir, 'metadata'), { recursive: true });
    fs.writeFileSync(path.join(sketchDir, 'index.html'), sketch.html);
    fs.writeFileSync(
      path.join(sketchDir, 'metadata', 'thumbnail.jpg'),
      Buffer.from(sketch.thumbnail, 'base64'),
    );
    fs.writeFileSync(
      path.join(sketchDir, 'metadata', 'metadata.json'),
      JSON.stringify({ title: sketch.title, author: sketch.author }, null, 2),
    );
  }

  const manifest = DEMO_SKETCHES.map((sketch) => ({
    id: sketch.id,
    title: sketch.title,
    author: sketch.author,
    mode: 'html',
    dir: sketch.dir,
    indexPath: `public/sketches/${sketch.dir}/index.html`,
    thumbnailPath: `public/sketches/${sketch.dir}/metadata/thumbnail.jpg`,
    engineURL: '',
    available: true,
  }));
  fs.writeFileSync(
    path.join(root, 'public', 'manifest.json'),
    JSON.stringify({ curationId: 'demo', title: 'Gallery Fade Demo', sketches: manifest }, null, 2),
  );
  fs.writeFileSync(path.join(root, 'public', 'gallery.yaml'), GALLERY_YAML);

  await scaffoldGalleryProject(root, {
    curationId: 'demo',
    curationTitle: 'Gallery Fade Demo',
    manifest,
    run,
  });
  console.log(`Gallery demo ready in ${root}`);
  if (!run) console.log(`Run it with: cd ${outputDir} && npm run dev`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

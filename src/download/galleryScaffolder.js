const fs = require('fs');
const path = require('path');
const { runNpmInstall, createViteConfig, supportsVite } = require('./viteScaffolder');
const { runDevServer } = require('./serverRunner');

const HTML = (title) => `<!doctype html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><link rel="stylesheet" href="./style.css"></head>
<body><main id="grid-view"><header><h1>${escapeHtml(title)}</h1></header><div id="grid" class="card-list"></div></main>
<section id="slideshow-view" hidden><div id="layers"><iframe class="sketch-layer active" scrolling="no"></iframe><iframe class="sketch-layer" scrolling="no"></iframe></div><button id="menu" aria-label="Open projects">☰</button><button id="back" aria-label="Back to gallery">← Grid</button><div id="slide-pill" class="pill"></div><aside id="sidebar"><button id="close" aria-label="Close projects">×</button><div id="sidebar-list" class="card-list"></div></aside><div id="scrim"></div></section>
<script type="module" src="./main.js"></script></body></html>`;

const MAIN = String.raw`import yaml from 'js-yaml';
const [configText, manifestResponse] = await Promise.all([fetch('./gallery.yaml').then(r => r.text()), fetch('./manifest.json')]);
const config = yaml.load(configText) || {}; const manifest = await manifestResponse.json();
const byId = new Map((manifest.sketches || []).map(s => [String(s.id), s]));
const projects = (config.projects || []).flatMap(p => { const item = byId.get(String(p.id)); if (!item) { console.warn('Skipping gallery project missing from manifest:', p.id); return []; } return [{...item, displayTitle: p.titleOverride ?? item.title, displayAuthor: p.authorOverride ?? item.author}]; });
const grid = document.querySelector('#grid'), sidebarList = document.querySelector('#sidebar-list'), view = document.querySelector('#slideshow-view'), gridView = document.querySelector('#grid-view');
const layers = [...document.querySelectorAll('.sketch-layer')]; let active = 0, current = 0, timer, progressFrame, idleTimer;
const duration = Math.max(.1, Number(config.slideDuration) || 8) * 1000, transition = Math.max(0, Number(config.transitionTime) || 1.2);
function thumbUrl(p) { return './sketches/' + encodeURIComponent(p.dir) + '/metadata/thumbnail.jpg'; }
function pillMarkup(p, progress = false) { return '<span><strong>' + escapeText(p.displayTitle) + '</strong><small>' + escapeText(p.displayAuthor) + '</small></span>' + (progress ? '<span class="progress" style="--progress:0" aria-hidden="true"></span>' : ''); }
function escapeText(value) { const node = document.createElement('span'); node.textContent = value || ''; return node.innerHTML; }
function card(p, index) { const button = document.createElement('button'); button.className = 'card'; button.innerHTML = '<img src="' + thumbUrl(p) + '" alt="" loading="lazy"><span class="pill">' + pillMarkup(p) + '</span>'; button.querySelector('img').onerror = e => { e.currentTarget.hidden = true; button.classList.add('no-thumbnail'); }; button.onclick = () => enter(index); return button; }
projects.forEach((p, i) => { grid.append(card(p, i)); sidebarList.append(card(p, i)); });
function isP5V2(url = '') { const m = String(url).match(/p5(?:\.min)?(?:\.js)?(?:@|\/)(\d+)/i); return m && Number(m[1]) >= 2; }
function whenSketchReady(iframe, engineURL) { return new Promise(resolve => { let done = false; const finish = () => { if (!done) { done = true; clearInterval(poll); clearTimeout(timeout); setTimeout(resolve, 150); } }; iframe.addEventListener('load', () => { if (!isP5V2(engineURL)) finish(); }, {once:true}); const poll = setInterval(() => { if (!isP5V2(engineURL)) return; try { const w = iframe.contentWindow; if (w && (w.__p5SetupComplete || w._setupDone || (w.p5 && w.document.querySelector('canvas')))) finish(); } catch {} }, 100); const timeout = setTimeout(finish, 8000); }); }
function sketchUrl(p) { return './sketches/' + encodeURIComponent(p.dir) + '/index.html'; }
async function show(index, immediate = false) { if (!projects.length) return; clearTimeout(timer); cancelAnimationFrame(progressFrame); current = (index + projects.length) % projects.length; const p = projects[current], next = immediate ? active : 1 - active, frame = layers[next]; frame.src = sketchUrl(p); await whenSketchReady(frame, p.engineURL); document.querySelector('#slide-pill').innerHTML = pillMarkup(p, true); frame.style.transitionDuration = transition + 's'; layers[active].style.transitionDuration = transition + 's'; frame.classList.add('active'); if (next !== active) layers[active].classList.remove('active'); active = next; startProgress(); }
function startProgress() { const ring = document.querySelector('.progress'), start = performance.now(); const tick = now => { const elapsed = now - start; if (ring) ring.style.setProperty('--progress', Math.min(1, elapsed / duration)); if (config.autoplay !== false && elapsed >= duration) show(current + 1); else progressFrame = requestAnimationFrame(tick); }; progressFrame = requestAnimationFrame(tick); }
function enter(index) { gridView.hidden = true; view.hidden = false; closeSidebar(); show(index, true); revealMenu(); }
function leave() { clearTimeout(timer); cancelAnimationFrame(progressFrame); view.hidden = true; gridView.hidden = false; layers.forEach(f => { f.src = 'about:blank'; }); }
function openSidebar() { document.body.classList.add('sidebar-open'); } function closeSidebar() { document.body.classList.remove('sidebar-open'); }
function revealMenu() { view.classList.add('controls-visible'); clearTimeout(idleTimer); idleTimer = setTimeout(() => view.classList.remove('controls-visible'), 1600); }
document.querySelector('#menu').onclick = openSidebar; document.querySelector('#close').onclick = closeSidebar; document.querySelector('#scrim').onclick = closeSidebar; document.querySelector('#back').onclick = leave; view.addEventListener('mousemove', revealMenu);
addEventListener('keydown', e => { if (view.hidden) return; if (e.key === 'ArrowRight') show(current + 1); if (e.key === 'ArrowLeft') show(current - 1); if (e.key === 'Escape') document.body.classList.contains('sidebar-open') ? closeSidebar() : leave(); });
`;

const CSS = `*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:system-ui,sans-serif;background:#111;color:#fff}header{padding:2rem}h1{margin:0}.card-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem;padding:1rem 2rem 2rem}.card{position:relative;min-height:180px;padding:0;border:0;border-radius:16px;overflow:hidden;background:#292929;cursor:pointer;text-align:left}.card img{width:100%;height:100%;position:absolute;inset:0;object-fit:cover}.card.no-thumbnail:after{content:'Thumbnail unavailable';position:absolute;inset:0;display:grid;place-items:center;color:#999}.pill{display:flex;align-items:center;gap:.75rem;position:absolute;z-index:5;top:1rem;left:1rem;padding:.55rem .75rem;border-radius:999px;background:#111c;backdrop-filter:blur(8px);max-width:calc(100% - 2rem)}.pill span:first-child{display:flex;flex-direction:column;min-width:0}.pill strong,.pill small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pill small{opacity:.7}#slideshow-view,#layers,.sketch-layer{position:fixed;inset:0;width:100%;height:100%;overflow:hidden}.sketch-layer{border:0;opacity:0;pointer-events:none}.sketch-layer.active{opacity:1;pointer-events:auto}#slide-pill{left:auto;right:1rem}.progress{position:relative;width:28px;height:28px;flex:0 0 auto;border-radius:50%;background:conic-gradient(#fff calc(var(--progress)*1turn),#ffffff33 0)}.progress:after{content:'';position:absolute;inset:4px;border-radius:50%;background:#222}#menu,#back,#close{position:fixed;z-index:8;border:0;border-radius:999px;background:#111c;color:#fff;padding:.75rem;cursor:pointer}#menu{top:1rem;left:1rem;font-size:1.25rem;opacity:0;transition:opacity .25s}#back{right:1rem;bottom:1rem}.controls-visible #menu,.sidebar-open #menu{opacity:1}#sidebar{position:fixed;z-index:10;inset:0 auto 0 0;width:min(380px,90vw);background:#171717;transform:translateX(-100%);transition:transform .3s;overflow:auto;padding-top:3rem}#sidebar .card-list{display:grid;grid-template-columns:1fr;padding:1rem}#sidebar .card{min-height:150px}#close{position:absolute;top:.5rem;right:.5rem;font-size:1.5rem}.sidebar-open #sidebar{transform:none}#scrim{position:fixed;z-index:9;inset:0;background:#0008;opacity:0;pointer-events:none;transition:opacity .3s}.sidebar-open #scrim{opacity:1;pointer-events:auto}[hidden]{display:none!important}`;

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

async function scaffoldGalleryProject(rootDir, options = {}) {
  const { curationId = 'unknown', curationTitle = 'OpenProcessing Gallery', quiet = false, run = false, installFn = runNpmInstall, runDevServerFn = runDevServer } = options;
  fs.mkdirSync(rootDir, { recursive: true });
  if (!supportsVite()) {
    if (!quiet) console.warn(`opdl: Vite 6 requires Node.js 20 or higher. Current version: ${process.version}`);
    return;
  }
  const pkg = { name: `curation-${curationId}-gallery`, version: '1.0.0', private: true, scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' }, dependencies: { 'js-yaml': '^4.1.0' }, devDependencies: { vite: '^6.0.0' } };
  fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify(pkg, null, 2));
  createViteConfig(rootDir);
  fs.writeFileSync(path.join(rootDir, 'index.html'), HTML(curationTitle));
  fs.writeFileSync(path.join(rootDir, 'main.js'), MAIN);
  fs.writeFileSync(path.join(rootDir, 'style.css'), CSS);
  fs.writeFileSync(path.join(rootDir, 'README.md'), `# ${curationTitle}\n\nRun \`npm install && npm run dev\` from this directory. Edit \`public/gallery.yaml\` to reorder or hide projects, change playback timing, or set title/author overrides.\n`);
  if (!quiet) await installFn(rootDir, quiet);
  if (run) await runDevServerFn(rootDir, { vite: true, quiet });
}

module.exports = { scaffoldGalleryProject };

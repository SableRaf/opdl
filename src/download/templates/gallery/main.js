import yaml from "js-yaml";

// Author strings arrive as "Full Name <username>"; drop the <username> suffix.
function stripHandle(value) {
  if (typeof value !== "string") return value;
  return value.replace(/\s*<[^>]*>\s*$/, "").trim() || value;
}

const [configText, manifestResponse] = await Promise.all([
  fetch("./gallery.yaml").then((response) => response.text()),
  fetch("./manifest.json"),
]);
const config = yaml.load(configText) || {};
const manifest = await manifestResponse.json();
const projects = await Promise.all((manifest.sketches || []).map(async (item) => {
  let metadata = {};
  try {
    const response = await fetch(`./sketches/${encodeURIComponent(item.dir)}/metadata/metadata.json`);
    if (response.ok) metadata = await response.json();
    else console.warn("Could not load sketch metadata:", item.id, response.status);
  } catch (error) {
    console.warn("Could not load sketch metadata:", item.id, error);
  }
  const author = typeof metadata.author === "string"
    ? metadata.author
    : metadata.author?.fullname ?? metadata.fullname;
  // The API author field is "Full Name <username>"; show just the name.
  const authorName = stripHandle(author ?? item.author);
  return {
    ...item,
    metadata,
    displayTitle: metadata.titleOverride ?? metadata.title ?? item.title,
    displayAuthor: metadata.authorOverride ?? authorName,
    displayLicense: (metadata.license ?? item.license ?? "").toUpperCase(),
  };
}));

const sidebarList = document.querySelector("#sidebar-list");
const view = document.querySelector("#slideshow-view");
const layers = [...document.querySelectorAll(".sketch-layer")];

// URL query parameters override gallery.yaml, e.g. ?duration=30&shuffle=true&autoplay=false&top=45&overlay=false
const params = new URLSearchParams(location.search);
function numberParam(name, fallback) {
  if (!params.has(name)) return fallback;
  const value = Number(params.get(name));
  return Number.isFinite(value) ? value : fallback;
}
function boolParam(name, fallback) {
  if (!params.has(name)) return fallback;
  const value = params.get(name).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(value)) return true;
  if (["false", "0", "no", "off"].includes(value)) return false;
  return fallback;
}

const duration =
  Math.max(0.1, numberParam("duration", Number(config.slideDuration) || 8)) *
  1000;
const transition = Math.max(0, Number(config.transitionTime) || 1.2);
const randomize = boolParam("shuffle", config.randomize !== false);
const autoplay = boolParam("autoplay", config.autoplay !== false);
let active = 0;
let current = 0;
let order = projects.map((_, index) => index);
let position = 0;
let timer;
let progressFrame;
let idleTimer;
let blankTimer;
let showToken = 0;
let playing = autoplay;
let elapsed = 0;
let lastTick = 0;

function thumbUrl(project) {
  return `./sketches/${encodeURIComponent(project.dir)}/metadata/thumbnail.jpg`;
}

function escapeText(value) {
  const node = document.createElement("span");
  node.textContent = value || "";
  return node.innerHTML;
}

function escapeAttr(value) {
  return escapeText(value).replace(/"/g, "&quot;");
}

function sketchPageUrl(project) {
  const username = project.metadata?.username;
  const visualID = project.metadata?.visualID;
  if (!username || !visualID) return null;
  return `https://openprocessing.org/@${encodeURIComponent(username)}/${encodeURIComponent(visualID)}`;
}

function authorPageUrl(project) {
  const username = project.metadata?.username;
  if (!username) return null;
  return `https://openprocessing.org/@${encodeURIComponent(username)}`;
}

// `links` renders the title/author as anchors to OpenProcessing (used on the
// live slide pill). Cards keep plain text so the whole card stays clickable.
function pillMarkup(project, { progress = false, links = false, menu = false } = {}) {
  const menuButton = menu
    ? '<button type="button" class="pill-menu" aria-label="Show projects" aria-expanded="false"></button>'
    : "";
  const indicator = progress
    ? '<span class="progress" style="--progress:0"><button type="button" class="play-toggle" aria-label="Play"></button></span>'
    : "";
  const title = escapeText(project.displayTitle);
  const author = escapeText(project.displayAuthor);
  const sketchUrl = links ? sketchPageUrl(project) : null;
  const authorUrl = links ? authorPageUrl(project) : null;
  const titleHtml = sketchUrl
    ? `<a class="pill-title" href="${escapeAttr(sketchUrl)}" target="_blank" rel="noopener">${title}</a>`
    : `<strong class="pill-title">${title}</strong>`;
  const authorHtml = authorUrl
    ? `<a class="pill-author" href="${escapeAttr(authorUrl)}" target="_blank" rel="noopener">${author}</a>`
    : `<span class="pill-author">${author}</span>`;
  const license = escapeText(project.displayLicense);
  const licenseHtml = license && license.toUpperCase() !== "NONE"
    ? `<span class="pill-license">CC ${license}</span>`
    : "";
  return `${menuButton}<span class="pill-text">${titleHtml}<small class="pill-by">by ${authorHtml}${licenseHtml}</small></span>${indicator}`;
}

function card(project, index) {
  const button = document.createElement("button");
  button.className = "card";
  button.innerHTML = `<img src="${thumbUrl(project)}" alt="" loading="lazy"><span class="pill">${pillMarkup(project)}</span>`;
  button.querySelector("img").onerror = (event) => {
    event.currentTarget.hidden = true;
    button.classList.add("no-thumbnail");
  };
  button.onclick = () => enter(index);
  return button;
}

const cards = projects.map((project, index) => {
  const element = card(project, index);
  sidebarList.append(element);
  return element;
});

function highlightCurrentCard() {
  cards.forEach((element, index) => {
    element.classList.toggle("is-current", index === current);
  });
}

function isP5V2(url = "") {
  const match = String(url).match(/p5(?:\.min)?(?:\.js)?(?:@|\/)(\d+)/i);
  return match && Number(match[1]) >= 2;
}

function whenSketchReady(iframe, engineURL) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(poll);
      clearTimeout(timeout);
      setTimeout(resolve, 150);
    };
    iframe.addEventListener(
      "load",
      () => {
        if (!isP5V2(engineURL)) finish();
      },
      { once: true },
    );
    const poll = setInterval(() => {
      if (!isP5V2(engineURL)) return;
      try {
        const sketchWindow = iframe.contentWindow;
        if (
          sketchWindow &&
          (sketchWindow.__p5SetupComplete ||
            sketchWindow._setupDone ||
            (sketchWindow.p5 && sketchWindow.document.querySelector("canvas")))
        )
          finish();
      } catch {}
    }, 100);
    const timeout = setTimeout(finish, 8000);
  });
}

function shuffleOrder(avoidFirst) {
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (order.length > 1 && order[0] === avoidFirst) {
    const swap = 1 + Math.floor(Math.random() * (order.length - 1));
    [order[0], order[swap]] = [order[swap], order[0]];
  }
}

function showNext() {
  if (!randomize) return show(current + 1);
  position += 1;
  if (position >= order.length) {
    shuffleOrder(current);
    position = 0;
  }
  return show(order[position]);
}

function showPrevious() {
  if (!randomize) return show(current - 1);
  position = (position - 1 + order.length) % order.length;
  return show(order[position]);
}

function sketchUrl(project) {
  return `./sketches/${encodeURIComponent(project.dir)}/index.html`;
}

async function show(index, immediate = false) {
  if (!projects.length) return;
  clearTimeout(timer);
  clearTimeout(blankTimer);
  cancelAnimationFrame(progressFrame);
  elapsed = 0;
  // Each show() claims a token; a slower load that is superseded by a newer
  // show() (e.g. rapid arrow-key navigation) bails out instead of stomping the
  // active layer once its whenSketchReady() finally resolves.
  const token = ++showToken;
  const previous = active;
  current = (index + projects.length) % projects.length;
  const project = projects[current];
  const next = immediate ? active : 1 - active;
  const frame = layers[next];
  frame.src = sketchUrl(project);
  await whenSketchReady(frame, project.engineURL);
  if (token !== showToken) return;
  // Reflect the current sketch in the URL as ?sketch=<visualID> so the page is
  // shareable/refreshable. replaceState keeps it out of the history stack.
  const visualID = project.metadata?.visualID ?? project.id;
  if (visualID != null) {
    const url = new URL(location.href);
    url.searchParams.set("sketch", String(visualID));
    history.replaceState(history.state, "", url);
  }
  document.querySelector("#pill-header").innerHTML = pillMarkup(project, {
    progress: true,
    links: true,
    menu: true,
  });
  const toggle = document.querySelector(".play-toggle");
  if (toggle) toggle.onclick = togglePlay;
  const pillMenu = document.querySelector(".pill-menu");
  if (pillMenu) pillMenu.onclick = toggleSidebar;
  syncPlayToggle();
  syncSidebarToggle();
  frame.style.transitionDuration = `${transition}s`;
  layers[previous].style.transitionDuration = `${transition}s`;
  frame.classList.add("active");
  if (next !== previous) layers[previous].classList.remove("active");
  active = next;
  highlightCurrentCard();
  startProgress();
  // Once the crossfade finishes, unload the outgoing sketch. Otherwise the
  // previous sketch keeps running its draw loop and holding a full-viewport
  // WebGL context at opacity 0 — two live WebGL contexts at devicePixelRatio is
  // enough to exhaust VRAM and crash the shared GPU process (taking every
  // Chromium/Electron app down with it). Token-guarded so rapid navigation
  // can't blank the wrong layer.
  if (next !== previous) {
    blankTimer = setTimeout(() => {
      if (token === showToken) layers[previous].src = "about:blank";
    }, transition * 1000 + 100);
  }
}

function syncPlayToggle() {
  const toggle = document.querySelector(".play-toggle");
  if (!toggle) return;
  toggle.classList.toggle("is-playing", playing);
  toggle.setAttribute("aria-label", playing ? "Pause" : "Play");
}

function togglePlay() {
  playing = !playing;
  syncPlayToggle();
  startProgress();
}

function startProgress() {
  cancelAnimationFrame(progressFrame);
  const ring = document.querySelector(".progress");
  if (ring) ring.style.setProperty("--progress", Math.min(1, elapsed / duration));
  if (!playing) return; // Paused: freeze the ring, no animation loop.
  lastTick = performance.now();
  const tick = (now) => {
    elapsed += now - lastTick;
    lastTick = now;
    if (ring)
      ring.style.setProperty("--progress", Math.min(1, elapsed / duration));
    if (elapsed >= duration) showNext();
    else progressFrame = requestAnimationFrame(tick);
  };
  progressFrame = requestAnimationFrame(tick);
}

const slidePill = document.querySelector("#slide-pill");

// ?top=45 adds pixels to the slide-pill's default top margin.
const topOffset = numberParam("top", 0);
if (topOffset) slidePill.style.top = `calc(1rem + ${topOffset}px)`;

// ?overlay=false hides the slide-pill; defaults to shown.
if (!boolParam("overlay", true)) slidePill.style.display = "none";

// ?blur=false drops the pill's backdrop-filter blur (and uses a more opaque
// background instead). OBS/CEF browser sources re-sample backdrop-filter over
// the animating sketch behind the pill inconsistently, causing random flicker.
if (!boolParam("blur", true)) slidePill.classList.add("no-blur");

// ?shadow=false drops the pill's drop shadow; defaults to shown.
if (!boolParam("shadow", true)) slidePill.classList.add("no-shadow");

// ?backgroundColor=ffffffb3 overrides the pill's background color. The value is
// a bare hex color (3/4/6/8 digits, no leading #); the inline style wins over
// both the default and no-blur rules.
const backgroundColor = params.get("backgroundColor");
if (backgroundColor && /^([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(backgroundColor)) {
  slidePill.style.background = `#${backgroundColor}`;
}

function syncSidebarToggle() {
  const open = slidePill.classList.contains("expanded");
  const pillMenu = document.querySelector(".pill-menu");
  if (pillMenu) {
    pillMenu.setAttribute("aria-expanded", String(open));
    pillMenu.setAttribute("aria-label", open ? "Hide projects" : "Show projects");
  }
}
function closeSidebar() {
  slidePill.classList.remove("expanded");
  document.body.classList.remove("sidebar-open");
  syncSidebarToggle();
}
function openSidebar() {
  slidePill.classList.add("expanded");
  document.body.classList.add("sidebar-open");
  syncSidebarToggle();
}
function toggleSidebar() {
  if (slidePill.classList.contains("expanded")) closeSidebar();
  else openSidebar();
}
function enter(index) {
  if (randomize) {
    shuffleOrder();
    const at = order.indexOf(index);
    [order[0], order[at]] = [order[at], order[0]];
    position = 0;
  }
  closeSidebar();
  show(index, true);
  revealMenu();
}
function revealMenu() {
  view.classList.add("controls-visible");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => view.classList.remove("controls-visible"), 1600);
}

// While the tab is hidden, tear the sketches down entirely: a backgrounded tab
// still holds every sketch's WebGL context and GPU memory, and switching away
// from a running slideshow of full-viewport shader sketches was enough to
// exhaust VRAM and reset the GPU (crashing all Chromium/Electron apps). Blanking
// both iframes releases the contexts and stops the draw loops; we reload the
// current slide fresh on return, which also avoids the stale-timer jump that a
// paused-then-resumed requestAnimationFrame would otherwise cause.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    showToken += 1; // invalidate any in-flight show()
    clearTimeout(timer);
    clearTimeout(blankTimer);
    cancelAnimationFrame(progressFrame);
    layers.forEach((layer) => {
      layer.classList.remove("active");
      layer.src = "about:blank";
    });
  } else if (projects.length) {
    show(current, true);
  }
});

document.querySelector("#scrim").onclick = closeSidebar;
addEventListener("mousemove", revealMenu);
addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") showNext();
  if (event.key === "ArrowLeft") showPrevious();
  if (event.key === "Escape") closeSidebar();
  if (event.key === " ") {
    event.preventDefault(); // Stop the page from scrolling on spacebar.
    togglePlay();
  }
});

// Pick the starting sketch: an explicit ?sketch=<visualID> wins; otherwise, when
// shuffling, start from a random sketch; otherwise start from the first.
function startIndex() {
  const wanted = params.get("sketch");
  if (wanted != null) {
    const found = projects.findIndex(
      (project) => String(project.metadata?.visualID ?? project.id) === wanted,
    );
    if (found !== -1) return found;
  }
  if (randomize) return Math.floor(Math.random() * projects.length);
  return 0;
}

if (projects.length) enter(startIndex());

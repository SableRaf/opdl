import yaml from "js-yaml";

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
  return {
    ...item,
    metadata,
    displayTitle: metadata.titleOverride ?? metadata.title ?? item.title,
    displayAuthor: metadata.authorOverride ?? author ?? item.author,
  };
}));

const grid = document.querySelector("#grid");
const sidebarList = document.querySelector("#sidebar-list");
const view = document.querySelector("#slideshow-view");
const gridView = document.querySelector("#grid-view");
const layers = [...document.querySelectorAll(".sketch-layer")];
const duration = Math.max(0.1, Number(config.slideDuration) || 8) * 1000;
const transition = Math.max(0, Number(config.transitionTime) || 1.2);
const randomize = config.randomize !== false;
let active = 0;
let current = 0;
let order = projects.map((_, index) => index);
let position = 0;
let timer;
let progressFrame;
let idleTimer;

function thumbUrl(project) {
  return `./sketches/${encodeURIComponent(project.dir)}/metadata/thumbnail.jpg`;
}

function escapeText(value) {
  const node = document.createElement("span");
  node.textContent = value || "";
  return node.innerHTML;
}

function pillMarkup(project, progress = false) {
  const indicator = progress
    ? '<span class="progress" style="--progress:0" aria-hidden="true"></span>'
    : "";
  return `<span><strong>${escapeText(project.displayTitle)}</strong><small>${escapeText(project.displayAuthor)}</small></span>${indicator}`;
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

projects.forEach((project, index) => {
  grid.append(card(project, index));
  sidebarList.append(card(project, index));
});

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
  cancelAnimationFrame(progressFrame);
  current = (index + projects.length) % projects.length;
  const project = projects[current];
  const next = immediate ? active : 1 - active;
  const frame = layers[next];
  frame.src = sketchUrl(project);
  await whenSketchReady(frame, project.engineURL);
  document.querySelector("#slide-pill").innerHTML = pillMarkup(project, true);
  frame.style.transitionDuration = `${transition}s`;
  layers[active].style.transitionDuration = `${transition}s`;
  frame.classList.add("active");
  if (next !== active) layers[active].classList.remove("active");
  active = next;
  startProgress();
}

function startProgress() {
  const ring = document.querySelector(".progress");
  const start = performance.now();
  const tick = (now) => {
    const elapsed = now - start;
    if (ring)
      ring.style.setProperty("--progress", Math.min(1, elapsed / duration));
    if (config.autoplay !== false && elapsed >= duration) showNext();
    else progressFrame = requestAnimationFrame(tick);
  };
  progressFrame = requestAnimationFrame(tick);
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
}
function openSidebar() {
  document.body.classList.add("sidebar-open");
}
function enter(index) {
  if (randomize) {
    shuffleOrder();
    const at = order.indexOf(index);
    [order[0], order[at]] = [order[at], order[0]];
    position = 0;
  }
  gridView.hidden = true;
  view.hidden = false;
  closeSidebar();
  show(index, true);
  revealMenu();
}
function leave() {
  clearTimeout(timer);
  cancelAnimationFrame(progressFrame);
  view.hidden = true;
  gridView.hidden = false;
  layers.forEach((frame) => {
    frame.src = "about:blank";
  });
}
function revealMenu() {
  view.classList.add("controls-visible");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => view.classList.remove("controls-visible"), 1600);
}

document.querySelector("#menu").onclick = openSidebar;
document.querySelector("#close").onclick = closeSidebar;
document.querySelector("#scrim").onclick = closeSidebar;
document.querySelector("#back").onclick = leave;
view.addEventListener("mousemove", revealMenu);
addEventListener("keydown", (event) => {
  if (view.hidden) return;
  if (event.key === "ArrowRight") showNext();
  if (event.key === "ArrowLeft") showPrevious();
  if (event.key === "Escape") {
    if (document.body.classList.contains("sidebar-open")) closeSidebar();
    else leave();
  }
});

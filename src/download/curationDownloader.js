const fs = require('fs');
const path = require('path');
const opdl = require('../index');
const { sanitizeFilename } = require('../utils');
const { scaffoldGalleryProject } = require('./galleryScaffolder');

const RETRY_DELAYS = [1000, 2000];
const sleepDefault = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const is429 = (error) => error?.status === 429 || error?.response?.status === 429;

function authorName(sketch) {
  const author = sketch.author || sketch.user || sketch.createdBy;
  if (typeof author === 'string') return author;
  return author?.fullname || author?.userName || author?.username || sketch.userName || '';
}

function galleryYaml(manifest) {
  const projects = manifest.map((item) =>
    `  - id: ${JSON.stringify(item.id)}\n    title: ${JSON.stringify(item.title)}\n    author: ${JSON.stringify(item.author)}\n    # titleOverride: "My Title"\n    # authorOverride: "My Name"`
  ).join('\n');
  return `# Playback config\nslideDuration: 8        # seconds each slide is shown\ntransitionTime: 1.2     # seconds used to crossfade\nautoplay: true\n# Which projects to display, in order. Remove a project to hide it.\nprojects:\n${projects}${projects ? '\n' : ''}`;
}

async function downloadCuration({
  curationId, client, opdlFn = opdl, scaffoldFn = scaffoldGalleryProject,
  options = {}, sleep = sleepDefault,
}) {
  const curation = await client.getCuration(curationId);
  const limit = Number.isFinite(options.limit) ? options.limit : undefined;
  const listed = await client.getCurationSketches(curationId, {
    limit, offset: options.offset, sort: options.sort,
  });
  const sketches = (Array.isArray(listed) ? listed : []).slice(0, limit);
  const root = path.resolve(options.outputDir || `curation_${curationId}`);
  const sketchesRoot = path.join(root, 'public', 'sketches');
  fs.mkdirSync(sketchesRoot, { recursive: true });
  const manifest = [];
  const failedSketches = [];

  for (let index = 0; index < sketches.length; index += 1) {
    const sketch = sketches[index];
    const id = sketch.visualID ?? sketch.id;
    const title = sketch.title || `Sketch ${id}`;
    const dir = `${id}_${sanitizeFilename(title) || 'untitled'}`;
    const outputDir = path.join(sketchesRoot, dir);
    if (!options.quiet) console.log(`opdl: Downloading sketch ${index + 1}/${sketches.length}: ${title}`);
    let result;
    let lastError;
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt += 1) {
      try {
        result = await opdlFn(id, {
          outputDir,
          downloadAssets: options.downloadAssets !== false,
          downloadThumbnail: options.downloadThumbnail !== false,
          saveMetadata: options.saveMetadata !== false,
          addSourceComments: options.addSourceComments !== false,
          createLicenseFile: options.createLicenseFile !== false,
          createOpMetadata: options.createOpMetadata !== false,
          verbose: options.verbose || false,
          token: options.token,
          vite: false, run: false, quiet: true,
        });
        if (!result?.success) {
          lastError = new Error(result?.sketchInfo?.error || 'Sketch unavailable (private or deleted)');
        }
        break;
      } catch (error) {
        lastError = error;
        if (!is429(error) || attempt === RETRY_DELAYS.length) break;
        await sleep(RETRY_DELAYS[attempt]);
      }
    }
    if (!result?.success) {
      failedSketches.push({ id, title, error: lastError?.message || 'Sketch unavailable (private or deleted)' });
      continue;
    }
    const info = result.sketchInfo || {};
    manifest.push({
      id: info.visualID || id,
      title: info.title || title,
      author: info.author || authorName(sketch),
      mode: info.mode || sketch.mode || '',
      dir,
      indexPath: `public/sketches/${dir}/index.html`,
      thumbnailPath: `public/sketches/${dir}/metadata/thumbnail.jpg`,
      engineURL: info.engineURL || '',
      available: true,
    });
  }

  const title = curation.title || curation.name || `Curation ${curationId}`;
  fs.writeFileSync(path.join(root, 'public', 'manifest.json'), JSON.stringify({ curationId, title, sketches: manifest }, null, 2));
  const yamlPath = path.join(root, 'public', 'gallery.yaml');
  if (!fs.existsSync(yamlPath)) fs.writeFileSync(yamlPath, galleryYaml(manifest));
  await scaffoldFn(root, {
    curationId,
    curationTitle: title,
    manifest,
    templateDir: options.templateDir,
    quiet: options.quiet,
    run: options.run,
  });
  return { success: true, outputPath: root, manifest, failedSketches };
}

module.exports = { downloadCuration, galleryYaml, is429 };

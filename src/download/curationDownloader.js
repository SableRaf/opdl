const fs = require('fs');
const path = require('path');
const opdl = require('../index');
const { sanitizeFilename } = require('../utils');
const { scaffoldGalleryProject } = require('./galleryScaffolder');
const { promptConflictAction } = require('./conflictPrompt');
const { promptFilenameConflictAction } = require('./filenameConflictPrompt');

const RETRY_DELAYS = [1000, 2000];
const sleepDefault = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const is429 = (error) => error?.status === 429 || error?.response?.status === 429;

function authorName(sketch) {
  const author = sketch.author || sketch.user || sketch.createdBy;
  if (typeof author === 'string') return author;
  return author?.fullname || author?.userName || author?.username || sketch.userName || '';
}

function sketchDirExists(outputDir) {
  if (!fs.existsSync(outputDir)) return false;
  if (!fs.statSync(outputDir).isDirectory()) return true;
  return fs.readdirSync(outputDir).length > 0;
}

// Manifest entry for a sketch we kept on disk instead of re-downloading.
// metadata/metadata.json is the offline source of truth; the listed sketch
// data fills any gaps (e.g. metadata saving was disabled on the earlier run).
function existingManifestEntry({ id, title, sketch, dir, outputDir }) {
  let meta = {};
  try {
    meta = JSON.parse(fs.readFileSync(path.join(outputDir, 'metadata', 'metadata.json'), 'utf8'));
  } catch {
    // fall back to listed sketch data
  }
  const metaAuthor = typeof meta.author === 'string' ? meta.author : meta.author?.fullname;
  return {
    id: meta.visualID || id,
    title: meta.title || title,
    author: metaAuthor || meta.fullname || authorName(sketch),
    mode: meta.mode || sketch.mode || '',
    dir,
    indexPath: `public/sketches/${dir}/index.html`,
    thumbnailPath: `public/sketches/${dir}/metadata/thumbnail.jpg`,
    engineURL: meta.engineURL || '',
    available: true,
  };
}

function galleryYaml() {
  return '# Playback config\nslideDuration: 8        # seconds each slide is shown\ntransitionTime: 1.2     # seconds used to crossfade\nautoplay: true\nrandomize: true         # smart random order (plays every sketch before repeating)\n';
}

async function downloadCuration({
  curationId, client, opdlFn = opdl, scaffoldFn = scaffoldGalleryProject,
  onConflict = promptConflictAction, onFilenameConflict = promptFilenameConflictAction,
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
  const skippedSketches = [];
  // 'skip' / 'overwrite' once the user picks an "all remaining" option
  // (or forces a policy up front with --skipExisting / --overwrite).
  let conflictPolicy = options.overwrite ? 'overwrite' : (options.skipExisting ? 'skip' : null);
  let cancelled = false;

  // Policy for uploaded-file-vs-code-object name collisions (see
  // filenameConflictPrompt). Prompt once, then apply to the rest of the run.
  // Passed into each downloadSketch call so the collision — detected inside
  // downloadSketch — is resolved by this shared, batch-aware handler rather
  // than downloadSketch's own per-sketch prompt.
  let filenamePolicy = null;
  const curationFilenameConflict = async ({ filename }) => {
    if (filenamePolicy) return filenamePolicy;
    const action = await onFilenameConflict({ filename, quiet: options.quiet, batch: true });
    if (action.endsWith('-all')) {
      filenamePolicy = action.slice(0, -'-all'.length);
      return filenamePolicy;
    }
    return action;
  };

  for (let index = 0; index < sketches.length; index += 1) {
    const sketch = sketches[index];
    const id = sketch.visualID ?? sketch.id;
    const title = sketch.title || `Sketch ${id}`;
    const dir = `${id}_${sanitizeFilename(title) || 'untitled'}`;
    const outputDir = path.join(sketchesRoot, dir);
    if (sketchDirExists(outputDir)) {
      let action = conflictPolicy;
      if (!action) {
        action = await onConflict({ title, dir, quiet: options.quiet });
        if (action === 'skip-all') conflictPolicy = 'skip';
        else if (action === 'overwrite-all') conflictPolicy = 'overwrite';
      }
      if (action === 'cancel') {
        cancelled = true;
        break;
      }
      if (action === 'skip' || action === 'skip-all') {
        if (!options.quiet) console.log(`opdl: Skipping existing sketch ${index + 1}/${sketches.length}: ${title}`);
        skippedSketches.push({ id, title });
        manifest.push(existingManifestEntry({ id, title, sketch, dir, outputDir }));
        continue;
      }
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
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
          onFilenameConflict: curationFilenameConflict,
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

  if (cancelled) {
    return {
      success: false, cancelled: true, outputPath: root, manifest, failedSketches, skippedSketches,
    };
  }

  const title = curation.title || curation.name || `Curation ${curationId}`;
  fs.writeFileSync(path.join(root, 'public', 'manifest.json'), JSON.stringify({ curationId, title, sketches: manifest }, null, 2));
  const yamlPath = path.join(root, 'public', 'gallery.yaml');
  if (!fs.existsSync(yamlPath)) fs.writeFileSync(yamlPath, galleryYaml());
  await scaffoldFn(root, {
    curationId,
    curationTitle: title,
    manifest,
    templateDir: options.templateDir,
    quiet: options.quiet,
    run: options.run,
  });
  return { success: true, outputPath: root, manifest, failedSketches, skippedSketches };
}

module.exports = { downloadCuration, galleryYaml, is429 };

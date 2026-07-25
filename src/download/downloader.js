const fs = require('fs');
const path = require('path');
const axios = require('axios');

const {
  ensureDirectoryExists,
  resolveAssetFileName,
  resolveAssetUrl,
  dedupeFilename,
  copyDirSync,
} = require('../utils');
const { generateIndexHtml } = require('./htmlGenerator');
const { createLicenseFile } = require('./licenseHandler');
const { createOpMetadata } = require('./metadataWriter');
const { writeCodeFile, resolveCodeFileName } = require('./codeFileWriter');
const { writeTutorial } = require('./tutorialWriter');
const { promptFilenameConflictAction } = require('./filenameConflictPrompt');
const { canonicalizeMode } = require('./sketchMode');

const META_DIR = 'metadata';
const SKETCH_DIR = 'sketch';
const STAGING_SUFFIX = '.opdownload';
const THUMBNAIL_URL_TEMPLATE = 'https://kyoko.openprocessing.org/thumbnails/visualThumbnail{visualID}@2x.jpg';

let promotionCounter = 0;

function resolveFinalDirAndPolicy(outputDir, options = {}) {
  const finalDir = path.resolve(outputDir);
  let policy = null;
  if (!fs.existsSync(finalDir)) {
    policy = 'fresh';
  } else if (options.conflictPolicy) {
    policy = options.conflictPolicy;
  } else if (options.overwrite) {
    policy = 'replace';
  } else if (options.skipExisting) {
    policy = 'skip';
  }
  return { finalDir, policy };
}

function validateMarkerPaths(finalDir, marker) {
  if (!marker || typeof marker !== 'object') {
    throw new Error('Transaction marker is not a valid object');
  }
  const { stagingDir, backupDir, finalDir: markerFinalDir } = marker;
  if (markerFinalDir !== finalDir) {
    throw new Error(`Transaction marker references unexpected destination (${markerFinalDir}); expected ${finalDir}`);
  }
  if (stagingDir !== `${finalDir}${STAGING_SUFFIX}`) {
    throw new Error(`Transaction marker records unexpected staging path (${stagingDir}); expected ${finalDir}${STAGING_SUFFIX}`);
  }
  const backupBasename = path.basename(backupDir);
  const backupParent = path.dirname(backupDir);
  const finalParent = path.dirname(finalDir);
  if (backupParent !== finalParent || !backupBasename.startsWith(`${path.basename(finalDir)}.opdold-`)) {
    throw new Error(`Transaction marker records invalid backup path (${backupDir}); must be a sibling of ${finalDir}`);
  }
}

async function recoverFromMarker(finalDir, options = {}) {
  const markerPath = `${finalDir}.opdtxn`;
  if (!fs.existsSync(markerPath)) {
    return 'resolved';
  }
  let marker;
  try {
    marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
  } catch {
    if (!options.quiet) {
      console.warn(`opdl: transaction marker at ${markerPath} is corrupt; cannot recover`);
    }
    const error = new Error('Transaction recovery failed: corrupt marker');
    error.code = 'recovery_required';
    throw error;
  }
  try {
    validateMarkerPaths(finalDir, marker);
  } catch (validationError) {
    if (!options.quiet) {
      console.warn(`opdl: ${validationError.message}`);
    }
    const error = new Error('Transaction recovery failed: invalid marker paths');
    error.code = 'recovery_required';
    throw error;
  }
  const { stagingDir, backupDir } = marker;
  const finalExists = fs.existsSync(finalDir);
  const backupExists = fs.existsSync(backupDir);
  const stagingExists = fs.existsSync(stagingDir);
  if (!finalExists && backupExists && stagingExists) {
    try {
      fs.renameSync(backupDir, finalDir);
      try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch {}
      try { fs.rmSync(markerPath, { force: true }); } catch {}
      return 'resolved';
    } catch (error) {
      if (!options.quiet) {
        console.warn(`opdl: recovery cleanup failed: ${error.message}`);
      }
      const err = new Error('Transaction recovery failed: cleanup error');
      err.code = 'recovery_required';
      throw err;
    }
  }
  if (!finalExists && backupExists && !stagingExists) {
    const err = new Error(`Transaction recovery failed: staging was already committed (${markerPath}). Backup preserved at ${backupDir}. Inspect both locations and remove the marker to retry.`);
    err.code = 'recovery_required';
    throw err;
  }
  if (!finalExists && !backupExists && stagingExists) {
    const err = new Error(`Transaction recovery failed: state is ambiguous (staging present, backup absent). ${stagingDir} and ${markerPath} are preserved for manual recovery.`);
    err.code = 'recovery_required';
    throw err;
  }
  if (!finalExists && !backupExists && !stagingExists) {
    try {
      fs.rmSync(markerPath, { force: true });
    } catch (error) {
      if (!options.quiet) {
        console.warn(`opdl: recovery cleanup failed: ${error.message}`);
      }
      const err = new Error('Transaction recovery failed: marker cleanup error');
      err.code = 'recovery_required';
      throw err;
    }
    return 'resolved';
  }
  if (finalExists && backupExists && !stagingExists) {
    try {
      fs.rmSync(backupDir, { recursive: true, force: true });
      try { fs.rmSync(markerPath, { force: true }); } catch {}
      return 'resolved';
    } catch (error) {
      if (!options.quiet) {
        console.warn(`opdl: recovery cleanup failed: ${error.message}`);
      }
      const err = new Error('Transaction recovery failed: cleanup error');
      err.code = 'recovery_required';
      throw err;
    }
  }
  if (finalExists && !backupExists && !stagingExists) {
    try {
      fs.rmSync(markerPath, { force: true });
    } catch (error) {
      if (!options.quiet) {
        console.warn(`opdl: recovery cleanup failed: ${error.message}`);
      }
      const err = new Error('Transaction recovery failed: marker cleanup error');
      err.code = 'recovery_required';
      throw err;
    }
    return 'resolved';
  }
  if (finalExists && !backupExists && stagingExists) {
    try {
      fs.rmSync(stagingDir, { recursive: true, force: true });
      try { fs.rmSync(markerPath, { force: true }); } catch {}
      return 'resolved';
    } catch (error) {
      if (!options.quiet) {
        console.warn(`opdl: recovery cleanup failed: ${error.message}`);
      }
      const err = new Error('Transaction recovery failed: cleanup error');
      err.code = 'recovery_required';
      throw err;
    }
  }
  if (finalExists && backupExists && stagingExists) {
    const err = new Error(`Transaction recovery failed: state is ambiguous (all three directories present). Inspect ${finalDir}, ${backupDir}, and ${stagingDir}. ${markerPath} is preserved.`);
    err.code = 'recovery_required';
    throw err;
  }
  const err = new Error(`Transaction recovery failed: unexpected state at ${markerPath}`);
  err.code = 'recovery_required';
  throw err;
}

function prepareStagingDir(stagingDir, finalDir, policy, fsModule = fs) {
  if (fsModule.existsSync(stagingDir)) {
    fsModule.rmSync(stagingDir, { recursive: true, force: true });
  }
  fsModule.mkdirSync(stagingDir, { recursive: true });
  if (policy === 'merge' && fsModule.existsSync(finalDir)) {
    copyDirSync(finalDir, stagingDir, fsModule);
  }
}

function promoteStagingDir(stagingDir, finalDir, fsModule = fs, quiet = false) {
  fsModule.mkdirSync(path.dirname(finalDir), { recursive: true });
  if (!fsModule.existsSync(finalDir)) {
    fsModule.renameSync(stagingDir, finalDir);
    return true;
  }
  const markerPath = `${finalDir}.opdtxn`;
  let backupDir;
  do {
    backupDir = `${finalDir}.opdold-${process.pid}-${promotionCounter++}`;
  } while (fsModule.existsSync(backupDir));
  if (fsModule.existsSync(markerPath)) {
    throw new Error(`opdl: a transaction is already in progress at ${markerPath}`);
  }
  fsModule.writeFileSync(markerPath, JSON.stringify({ stagingDir, backupDir, finalDir }), 'utf8');
  fsModule.renameSync(finalDir, backupDir);
  try {
    fsModule.renameSync(stagingDir, finalDir);
  } catch (error) {
    try { fsModule.rmSync(finalDir, { recursive: true, force: true }); } catch {}
    fsModule.renameSync(backupDir, finalDir);
    try { fsModule.rmSync(markerPath, { force: true }); } catch {}
    throw error;
  }
  for (const [label, target, opts] of [
    ['marker', markerPath, { force: true }],
    ['backup', backupDir, { recursive: true, force: true }],
  ]) {
    try {
      fsModule.rmSync(target, opts);
    } catch (error) {
      if (!quiet) console.warn(`opdl: could not remove ${label} ${target}: ${error.message}`);
    }
  }
  return true;
}

/**
 * Resolve the final filename list for all code parts in one pass, before
 * anything is written, so the sketch folder name (derived from the main .pde
 * or first code file) and the actual writes can never disagree. Dedup uses a
 * temporary Set scoped to this prepass only — the write loop starts fresh
 * (see writeCodeFile), replaying the same names in the same order.
 */
function resolvePrepassFileNames(codeParts, { fallbackBase, defaultExtension, indexedFallback }) {
  const prepassUsedNames = new Set();
  return codeParts.map((codeBlock, index) => {
    const name = resolveCodeFileName({
      title: codeBlock.title,
      index,
      fallbackBase,
      defaultExtension,
      indexedFallback,
    });
    const deduped = dedupeFilename(name, prepassUsedNames);
    prepassUsedNames.add(deduped);
    return deduped;
  });
}

/**
 * Pick the sketch folder name for pjs sketches: the first resolved filename
 * ending in .pde (case-insensitive), extension stripped by actual length so
 * an uppercase .PDE is handled correctly. Falls back to the first resolved
 * code filename when no .pde tab exists (e.g. a pjs sketch with only JS/HTML
 * tabs), and finally to 'sketch' when there are no code parts at all.
 */
function pickSketchName(resolvedFileNames, isPjs) {
  // Defense in depth: resolveCodeFileName already rejects all-dots stems, but
  // the sketch name is joined into a filesystem path, so never let a bare
  // path segment ('.'/'..') through even if a future caller supplies one.
  const safeStem = (stem) => (stem && !/^\.+$/.test(stem) ? stem : 'sketch');
  if (isPjs) {
    const mainPde = resolvedFileNames.find((name) => name.toLowerCase().endsWith('.pde'));
    if (mainPde) {
      const ext = path.extname(mainPde);
      return { sketchName: safeStem(mainPde.slice(0, -ext.length)), mainPde };
    }
  }
  const first = resolvedFileNames[0];
  if (!first) {
    return { sketchName: 'sketch', mainPde: null };
  }
  const ext = path.extname(first);
  const stem = ext ? first.slice(0, -ext.length) : first;
  return { sketchName: safeStem(stem), mainPde: null };
}

/**
 * Resolve the final on-disk filename for every asset — including collision
 * renames — up front, before any code file is written, so the code-reference
 * rewrite map can point at the names the files actually land under.
 *
 * The code filenames are reserved first (the same names the write loop will
 * produce, replayed against a temporary Set), so an asset colliding with a
 * code object is detected here exactly as it was during the download loop.
 * The prompt fires once per collision, in file order, identically to before —
 * it's just moved earlier so its outcome can inform the rewrite map.
 *
 * @returns {Promise<Array<{ file: Object, filename: string|undefined,
 *   assetFileName: string|null }>>} One entry per input file (indices
 *   preserved). `assetFileName` is null for entries with no name or resolved
 *   to 'skip-upload'.
 */
async function planAssetFileNames({ files, reservedCodeNames, onFilenameConflict, quiet }) {
  // Reserve the code filenames the write loop will claim (same order, same
  // dedupe), so asset-vs-code collisions are detected against them.
  const usedNames = new Set();
  for (const name of reservedCodeNames) {
    usedNames.add(dedupeFilename(name, usedNames));
  }

  const plan = [];
  for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
    const file = files[fileIndex];
    const filename = file?.name;
    if (!filename) {
      plan.push({ file, filename, assetFileName: null });
      continue;
    }

    let assetFileName = resolveAssetFileName(filename, fileIndex);
    // A sketch's uploaded files can collide with an authoritative code object
    // of the same name — e.g. a stale index.html left over from an older
    // version that points at files no longer present. Writing it blindly
    // clobbers the code object (causing 404s at runtime), so we surface the
    // conflict and let the user decide.
    if (usedNames.has(assetFileName)) {
      const action = await onFilenameConflict({ filename: assetFileName, quiet });
      if (action === 'skip-upload') {
        plan.push({ file, filename, assetFileName: null });
        continue;
      }
      if (action === 'keep-both') {
        // Code object keeps its canonical name; rename the uploaded file.
        assetFileName = dedupeFilename(assetFileName, usedNames);
      }
      // 'overwrite-code' falls through and reuses the canonical name.
    }
    usedNames.add(assetFileName);
    plan.push({ file, filename, assetFileName });
  }
  return plan;
}

const downloadSketch = async (sketchInfo, options = {}) => {
  const finalOptions = { ...options };
  const sketchId = sketchInfo.sketchId;
  const outputDirInput = finalOptions.outputDir
    ? path.resolve(finalOptions.outputDir)
    : path.resolve(`sketch_${sketchId}`);

  const { finalDir, policy: resolvedPolicy } = resolveFinalDirAndPolicy(outputDirInput, finalOptions);

  await recoverFromMarker(finalDir, { quiet: finalOptions.quiet });

  let policy = resolvedPolicy;
  if (!policy) {
    const { promptConflictAction } = require('./conflictPrompt');
    const onConflict = finalOptions.onConflict || promptConflictAction;
    const action = await onConflict({
      title: sketchInfo.title || `Sketch ${sketchId}`,
      single: true,
      outputDir: finalDir,
      quiet: finalOptions.quiet,
      isInteractive: finalOptions.isInteractive,
      promptFn: finalOptions.promptFn,
    });
    if (action === 'skip') {
      return { skipped: true, outputDir: finalDir };
    }
    if (action === 'cancel') {
      return { cancelled: true, outputDir: finalDir };
    }
    policy = action;
  }

  if (policy === 'skip') {
    return { skipped: true, outputDir: finalDir };
  }
  if (policy === 'cancel') {
    return { cancelled: true, outputDir: finalDir };
  }

  const stagingDir = `${finalDir}${STAGING_SUFFIX}`;
  const cwd = path.resolve(process.cwd());
  if (finalDir === cwd || cwd.startsWith(finalDir + path.sep) || path.dirname(finalDir) === finalDir) {
    throw new Error(`opdl: --outputDir cannot be the current directory, an ancestor of it, or the filesystem root (${finalDir}). Use a subdirectory, e.g. --outputDir ./sketch.`);
  }

  let promoted = false;
  try {
    prepareStagingDir(stagingDir, finalDir, policy);

    const outputDir = stagingDir;
    const shouldAddSourceComments = finalOptions.addSourceComments;
    const onFilenameConflict = finalOptions.onFilenameConflict || promptFilenameConflictAction;

    const isPjs = canonicalizeMode(sketchInfo.metadata?.mode) === 'pjs';
    const codeParts = Array.isArray(sketchInfo.codeParts) ? sketchInfo.codeParts : [];

    const resolverOptions = isPjs
      ? { fallbackBase: 'sketch', defaultExtension: '.pde', indexedFallback: false }
      : { fallbackBase: 'part', defaultExtension: '.js', indexedFallback: true };
    const resolvedFileNames = resolvePrepassFileNames(codeParts, resolverOptions);
    const { sketchName } = pickSketchName(resolvedFileNames, isPjs);
    const sketchDir = path.join(outputDir, SKETCH_DIR, sketchName);
    ensureDirectoryExists(sketchDir);

    const runtimeFiles = [];
    const savedCodeFiles = [];
    const sanitizedCodeParts = [];
    const rootUsedNames = new Set();

    const files = Array.isArray(sketchInfo.files) ? sketchInfo.files : [];
    const assetBaseUrl = sketchInfo.metadata?.fileBase;
    const shouldDownloadAssets = finalOptions.downloadAssets !== false;

    // Resolve the FINAL on-disk asset names — including any collision renames —
    // before writing code, so the reference-rewrite map points at the names the
    // files actually land under (a later keep-both rename must not leave code
    // pointing at the pre-collision name, which would 404 or hit the code
    // object it collided with). The prepass reserves the code filenames first
    // (replaying resolvedFileNames against a temporary Set exactly as the write
    // loop will), so asset-vs-code collisions are detected here identically.
    const assetPlan = shouldDownloadAssets && files.length
      ? await planAssetFileNames({
        files,
        reservedCodeNames: resolvedFileNames,
        onFilenameConflict,
        quiet: finalOptions.quiet,
      })
      : [];

    // Assets are saved under sanitized (and possibly deduped) names; rewrite code
    // references to match so loadImage/loadSound don't 404 into the dev server's
    // HTML fallback.
    const assetRenames = assetPlan
      .filter((entry) => entry.assetFileName && entry.assetFileName !== entry.filename)
      .map((entry) => ({ original: entry.filename, sanitized: entry.assetFileName }));

    for (let index = 0; index < codeParts.length; index += 1) {
      const { codeFilePath, codeFileName, sanitizedCodeBlock } = writeCodeFile({
        outputDir: sketchDir,
        codeBlock: codeParts[index],
        index,
        sketchInfo,
        addSourceComments: shouldAddSourceComments,
        fallbackBase: resolverOptions.fallbackBase,
        defaultExtension: resolverOptions.defaultExtension,
        resolvedFileName: resolvedFileNames[index],
        usedNames: rootUsedNames,
        assetRenames,
      });
      savedCodeFiles.push(codeFilePath);
      sanitizedCodeParts.push(sanitizedCodeBlock);
      runtimeFiles.push(codeFileName);
    }

    if (shouldDownloadAssets && files.length) {
      if (!assetBaseUrl) {
        if (!finalOptions.quiet) {
          console.warn('opdl: metadata.fileBase missing, cannot download assets');
        }
      } else {
        for (const entry of assetPlan) {
          const { filename, assetFileName } = entry;
          if (!filename) {
            if (!finalOptions.quiet) {
              console.warn('opdl: asset entry missing name, skipping');
            }
            continue;
          }
          if (!assetFileName) {
            // Resolved to 'skip-upload' during the prepass.
            continue;
          }
          rootUsedNames.add(assetFileName);

          const assetUrl = resolveAssetUrl(assetBaseUrl, filename);
          if (!assetUrl) {
            if (!finalOptions.quiet) {
              console.warn(`opdl: failed to resolve asset URL for ${filename}`);
            }
            continue;
          }

          try {
            if (finalOptions.verbose) {
              console.log(`opdl: downloading asset ${filename} from ${assetUrl}`);
            }
            const response = await axios.get(assetUrl, { responseType: 'arraybuffer' });
            const assetFilePath = path.join(sketchDir, assetFileName);
            fs.writeFileSync(assetFilePath, response.data);
            runtimeFiles.push(assetFileName);
          } catch (error) {
            if (!finalOptions.quiet) {
              console.warn(`opdl: failed to download asset ${filename}`);
              if (finalOptions.verbose) {
                console.warn(`  URL: ${assetUrl}`);
                console.warn(`  Status: ${error.response?.status ?? 'no response'}`);
                console.warn(`  Error: ${error.message}`);
              }
            }
          }
        }
      }
    }

    const metadataDir = path.join(outputDir, META_DIR);
    ensureDirectoryExists(metadataDir);

    if (finalOptions.saveMetadata) {
      const metadataFilePath = path.join(metadataDir, 'metadata.json');
      const savedMetadata = { ...(sketchInfo.metadata || {}) };
      // The sketch endpoint does not include the resolved author name. Keep it
      // with the sketch so offline consumers do not need a second global index.
      if (!savedMetadata.author && sketchInfo.author) savedMetadata.author = sketchInfo.author;
      fs.writeFileSync(metadataFilePath, JSON.stringify(savedMetadata, null, 2), 'utf8');
    }

    if (finalOptions.downloadThumbnail && sketchInfo.metadata?.visualID) {
      const thumbnailUrl = THUMBNAIL_URL_TEMPLATE.replace('{visualID}', sketchInfo.metadata.visualID);
      try {
        if (finalOptions.verbose) {
          console.log(`opdl: downloading thumbnail from ${thumbnailUrl}`);
        }
        const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
        const thumbnailPath = path.join(metadataDir, 'thumbnail.jpg');
        fs.writeFileSync(thumbnailPath, response.data);
      } catch (error) {
        if (!finalOptions.quiet) {
          console.warn('opdl: unable to download thumbnail');
          if (finalOptions.verbose) {
            console.warn(`  URL: ${thumbnailUrl}`);
            console.warn(`  Status: ${error.response?.status ?? 'no response'}`);
            console.warn(`  Error: ${error.message}`);
          }
        }
      }
    } else if (finalOptions.downloadThumbnail && finalOptions.verbose) {
      console.log('opdl: skipping thumbnail — no visualID in metadata');
    }

    if (sketchInfo.metadata?.mode && sketchInfo.metadata.mode !== 'html') {
      generateIndexHtml(sketchInfo.metadata, sanitizedCodeParts, sketchDir);
    }
    const generatedStyleCssPath = path.join(sketchDir, 'style.css');
    if (fs.existsSync(generatedStyleCssPath) && !runtimeFiles.includes('style.css')) {
      runtimeFiles.push('style.css');
    }
    if (fs.existsSync(path.join(sketchDir, 'index.html')) && !runtimeFiles.includes('index.html')) {
      // Tracked for completeness; the Vite scaffolder excludes index.html from
      // its copy allowlist (Vite owns it) regardless of this list's contents.
      runtimeFiles.push('index.html');
    }

    if (finalOptions.createLicenseFile) {
      createLicenseFile(sketchInfo, outputDir, finalOptions);
    }

    if (finalOptions.createOpMetadata) {
      createOpMetadata(sketchInfo, outputDir, finalOptions);
    }

    if (sketchInfo.tutorial) {
      try {
        writeTutorial(sketchInfo.tutorial, outputDir, sketchInfo, finalOptions);
      } catch (error) {
        if (!finalOptions.quiet) {
          console.warn(`opdl: failed to write tutorial bundle: ${error.message}`);
        }
      }
    }

    promoteStagingDir(stagingDir, finalDir, fs, finalOptions.quiet);
    promoted = true;

    const finalMetadataDir = path.join(finalDir, META_DIR);
    const finalSketchDir = path.join(finalDir, SKETCH_DIR, sketchName);
    const finalCodeFiles = savedCodeFiles.map((p) => path.join(finalDir, path.relative(stagingDir, p)));

    // Set up Vite project if requested
    if (finalOptions.vite) {
      const { scaffoldViteProject } = require('./viteScaffolder');
      await scaffoldViteProject(finalSketchDir, sketchInfo, {
        codeFiles: finalCodeFiles,
        runtimeFiles,
        quiet: finalOptions.quiet,
        run: finalOptions.run,
      });
    } else if (finalOptions.run) {
      // Print success message before starting server (since server will block)
      if (!finalOptions.quiet) {
        console.log(`Sketch downloaded to: ${finalDir}`);
      }
      // Run simple HTTP server for non-Vite projects
      const { runDevServer } = require('./serverRunner');
      await runDevServer(finalSketchDir, { vite: false, quiet: finalOptions.quiet });
    }

    return {
      outputDir: finalDir, metadataDir: finalMetadataDir, sketchDir: finalSketchDir, sketchName, codeFiles: finalCodeFiles,
    };
  } finally {
    if (!promoted && fs.existsSync(stagingDir)) {
      try {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      } catch (error) {
        if (!finalOptions.quiet) {
          console.warn(`opdl: could not clean up staging directory: ${error.message}`);
        }
      }
    }
  }
};

module.exports = { downloadSketch };

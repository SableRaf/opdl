const fs = require('fs');
const path = require('path');
const axios = require('axios');

const {
  ensureDirectoryExists,
  sanitizeFilename,
  buildAssetRenameMap,
  resolveAssetUrl,
  dedupeFilename,
} = require('../utils');
const { generateIndexHtml } = require('./htmlGenerator');
const { createLicenseFile } = require('./licenseHandler');
const { createOpMetadata } = require('./metadataWriter');
const { writeCodeFile } = require('./codeFileWriter');
const { writeTutorial } = require('./tutorialWriter');
const { promptFilenameConflictAction } = require('./filenameConflictPrompt');

const META_DIR = 'metadata';
const THUMBNAIL_URL_TEMPLATE = 'https://kyoko.openprocessing.org/thumbnails/visualThumbnail{visualID}@2x.jpg';

const downloadSketch = async (sketchInfo, options = {}) => {
  const finalOptions = { ...options };
  const sketchId = sketchInfo.sketchId;
  const outputDir = finalOptions.outputDir
    ? path.resolve(finalOptions.outputDir)
    : path.resolve(`sketch_${sketchId}`);

  ensureDirectoryExists(outputDir);
  const shouldAddSourceComments = finalOptions.addSourceComments;
  const onFilenameConflict = finalOptions.onFilenameConflict || promptFilenameConflictAction;

  const savedCodeFiles = [];
  const sanitizedCodeParts = [];
  const codeParts = Array.isArray(sketchInfo.codeParts) ? sketchInfo.codeParts : [];
  const rootUsedNames = new Set();

  const files = Array.isArray(sketchInfo.files) ? sketchInfo.files : [];
  // Assets are saved under sanitized names; rewrite code references to match so
  // loadImage/loadSound don't 404 into the dev server's HTML fallback.
  const assetRenames = buildAssetRenameMap(files);

  for (let index = 0; index < codeParts.length; index += 1) {
    const { codeFilePath, sanitizedCodeBlock } = writeCodeFile({
      outputDir,
      codeBlock: codeParts[index],
      index,
      sketchInfo,
      addSourceComments: shouldAddSourceComments,
      fallbackBase: 'part',
      usedNames: rootUsedNames,
      assetRenames,
    });
    savedCodeFiles.push(codeFilePath);
    sanitizedCodeParts.push(sanitizedCodeBlock);
  }

  const assetBaseUrl = sketchInfo.metadata?.fileBase;
  const shouldDownloadAssets = finalOptions.downloadAssets !== false;

  if (shouldDownloadAssets && files.length) {
    if (!assetBaseUrl) {
      if (!finalOptions.quiet) {
        console.warn('opdl: metadata.fileBase missing, cannot download assets');
      }
    } else {
      for (const file of files) {
        const filename = file?.name;
        if (!filename) {
          if (!finalOptions.quiet) {
            console.warn('opdl: asset entry missing name, skipping');
          }
          continue;
        }

        let assetFileName = sanitizeFilename(filename) || path.basename(filename);
        // A sketch's uploaded files can collide with an authoritative code
        // object of the same name — e.g. a stale index.html left over from an
        // older version that points at files no longer present. Writing it
        // blindly clobbers the code object (causing 404s at runtime), so we
        // surface the conflict and let the user decide.
        if (rootUsedNames.has(assetFileName)) {
          const action = await onFilenameConflict({
            filename: assetFileName,
            quiet: finalOptions.quiet,
          });
          if (action === 'skip-upload') {
            continue;
          }
          if (action === 'keep-both') {
            // Code object keeps its canonical name; rename the uploaded file.
            assetFileName = dedupeFilename(assetFileName, rootUsedNames);
          }
          // 'overwrite-code' falls through and reuses the canonical name.
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
          const assetFilePath = path.join(outputDir, assetFileName);
          fs.writeFileSync(assetFilePath, response.data);
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
    generateIndexHtml(sketchInfo.metadata, sanitizedCodeParts, outputDir);
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

  // Set up Vite project if requested
  if (finalOptions.vite) {
    const { scaffoldViteProject } = require('./viteScaffolder');
    await scaffoldViteProject(outputDir, sketchInfo, {
      codeFiles: savedCodeFiles,
      quiet: finalOptions.quiet,
      run: finalOptions.run,
    });
  } else if (finalOptions.run) {
    // Print success message before starting server (since server will block)
    if (!finalOptions.quiet) {
      console.log(`Sketch downloaded to: ${outputDir}`);
    }
    // Run simple HTTP server for non-Vite projects
    const { runDevServer } = require('./serverRunner');
    await runDevServer(outputDir, { vite: false, quiet: finalOptions.quiet });
  }

  return { outputDir, metadataDir, codeFiles: savedCodeFiles };
};

module.exports = { downloadSketch };

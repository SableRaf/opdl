const fs = require('fs');
const path = require('path');
const axios = require('axios');

const { ensureDirectoryExists, sanitizeFilename, resolveAssetUrl } = require('./utils');
const { generateIndexHtml } = require('./htmlGenerator');
const { buildCommentBlock } = require('./codeAttributor');
const { createLicenseFile } = require('./licenseHandler');
const { createOpMetadata } = require('./metadataWriter');

const META_DIR = 'metadata';
const THUMBNAIL_URL_TEMPLATE = 'https://openprocessing-usercontent.s3.amazonaws.com/thumbnails/visualThumbnail{visualID}@2x.jpg';

const downloadSketch = async (sketchInfo, options = {}) => {
  const finalOptions = { ...options };
  const sketchId = sketchInfo.sketchId;
  const outputDir = finalOptions.outputDir
    ? path.resolve(finalOptions.outputDir)
    : path.resolve(`sketch_${sketchId}`);

  ensureDirectoryExists(outputDir);
  const shouldAddSourceComments = finalOptions.addSourceComments;

  const savedCodeFiles = [];
  const sanitizedCodeParts = [];
  const codeParts = Array.isArray(sketchInfo.codeParts) ? sketchInfo.codeParts : [];

  for (let index = 0; index < codeParts.length; index += 1) {
    const codeBlock = codeParts[index];
    const name = codeBlock.title || `part_${index + 1}`;
    let codeFileName = path.basename(name);
    let fileExtension = path.extname(codeFileName);

    if (!fileExtension) {
      fileExtension = '.js';
      codeFileName += fileExtension;
    }

    codeFileName = sanitizeFilename(codeFileName) || `part_${index + 1}.js`;
    const codeFilePath = path.join(outputDir, codeFileName);
    let fileContent = codeBlock.code || '';
    if (shouldAddSourceComments && !fileContent.includes('Downloaded with opdl')) {
      const commentBlock = buildCommentBlock(sketchInfo, fileExtension);
      fileContent = `${commentBlock}${fileContent.startsWith('\n') ? '' : '\n'}${fileContent}`;
    }
    fs.writeFileSync(codeFilePath, fileContent, 'utf8');

    savedCodeFiles.push(codeFilePath);
    sanitizedCodeParts.push({ ...codeBlock, title: codeFileName });
  }

  const assetBaseUrl = sketchInfo.metadata?.fileBase;
  const files = Array.isArray(sketchInfo.files) ? sketchInfo.files : [];
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

        const assetUrl = resolveAssetUrl(assetBaseUrl, filename);
        if (!assetUrl) {
          if (!finalOptions.quiet) {
            console.warn(`opdl: failed to resolve asset URL for ${filename}`);
          }
          continue;
        }

        try {
          const response = await axios.get(assetUrl, { responseType: 'arraybuffer' });
          const assetFileName = sanitizeFilename(filename) || path.basename(filename);
          const assetFilePath = path.join(outputDir, assetFileName);
          fs.writeFileSync(assetFilePath, response.data);
        } catch (error) {
          if (!finalOptions.quiet) {
            console.warn(`opdl: failed to download asset ${filename}`);
          }
        }
      }
    }
  }

  const metadataDir = path.join(outputDir, META_DIR);
  ensureDirectoryExists(metadataDir);

  if (finalOptions.saveMetadata) {
    const metadataFilePath = path.join(metadataDir, 'metadata.json');
    fs.writeFileSync(metadataFilePath, JSON.stringify(sketchInfo.metadata || {}, null, 2), 'utf8');
  }

  if (finalOptions.downloadThumbnail && sketchInfo.metadata?.visualID) {
    try {
      const thumbnailUrl = THUMBNAIL_URL_TEMPLATE.replace('{visualID}', sketchInfo.metadata.visualID);
      const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
      const thumbnailPath = path.join(metadataDir, 'thumbnail.jpg');
      fs.writeFileSync(thumbnailPath, response.data);
    } catch (error) {
      if (!finalOptions.quiet) {
        console.warn('opdl: unable to download thumbnail');
      }
    }
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

  // Set up Vite project if requested
  if (finalOptions.vite) {
    const { scaffoldViteProject } = require('./viteScaffolder');
    await scaffoldViteProject(outputDir, sketchInfo, {
      codeFiles: savedCodeFiles,
      quiet: finalOptions.quiet,
    });
  }

  return { outputDir, metadataDir, codeFiles: savedCodeFiles };
};

module.exports = { downloadSketch };

const fs = require('fs');
const path = require('path');
const sanitize = require('sanitize-filename');

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const sanitizeFilename = (filename) => {
  return sanitize(filename).trim().replace(/\s+/g, '_');
};

const resolveAssetUrl = (assetBaseUrl, filename) => {
  if (!assetBaseUrl || !filename) {
    return '';
  }

  if (assetBaseUrl.startsWith('http')) {
    const cleanedAssetBaseUrl = assetBaseUrl.endsWith('/') ? assetBaseUrl.slice(0, -1) : assetBaseUrl;
    const cleanedFilename = filename.startsWith('/') ? filename.slice(1) : filename;
    return `${cleanedAssetBaseUrl}/${cleanedFilename}`;
  }

  if (assetBaseUrl.startsWith('/')) {
    const baseOpenProcessingUrl = 'https://openprocessing.org';
    const cleanedAssetBaseUrl = assetBaseUrl.endsWith('/') ? assetBaseUrl.slice(0, -1) : assetBaseUrl;
    const cleanedFilename = filename.startsWith('/') ? filename.slice(1) : filename;
    return `${baseOpenProcessingUrl}${cleanedAssetBaseUrl}/${cleanedFilename}`;
  }

  return '';
};

module.exports = {
  ensureDirectoryExists,
  sanitizeFilename,
  resolveAssetUrl,
};

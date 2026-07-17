const fs = require('fs');
const path = require('path');
const sanitize = require('sanitize-filename');

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const sanitizeFilename = (filename) => {
  return sanitize(filename)
    // Keep only characters that survive being served over HTTP unchanged.
    // Punctuation like '#' (URL fragment), '?' (query), '%' (percent-escape),
    // and ',' is legal in filenames but gets percent-encoded in the fetch URL,
    // and many static servers (GitHub Pages, python http.server) don't decode
    // it back to the file path — so the gallery can't find the sketch or its
    // thumbnail. Allow letters (incl. Unicode), digits, spaces, '.', '-', '_';
    // drop everything else. Spaces then collapse into underscores below.
    .replace(/[^\p{L}\p{N}\s._-]/gu, '')
    .trim()
    .replace(/\s+/g, '_');
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

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

/**
 * Build the list of asset filename rewrites the download performs.
 *
 * Asset files are saved under `sanitizeFilename(name)` (see downloader.js), which
 * turns e.g. "Bottle slide.m4a" into "Bottle_slide.m4a". The sketch code still
 * references the original name, so without rewriting, the request 404s and the
 * dev server's HTML fallback reaches loadSound/loadImage — surfacing as an
 * opaque "Unable to decode audio data" EncodingError. Returns only the entries
 * whose on-disk name differs from the original.
 *
 * @param {Array<{name?: string}>} files - Asset entries from the API.
 * @returns {Array<{original: string, sanitized: string}>}
 */
const buildAssetRenameMap = (files) => {
  const renames = [];
  if (!Array.isArray(files)) {
    return renames;
  }
  for (const file of files) {
    const original = file?.name;
    if (!original) {
      continue;
    }
    // Mirror exactly what downloader.js writes to disk.
    const sanitized = sanitizeFilename(original) || path.basename(original);
    if (sanitized && sanitized !== original) {
      renames.push({ original, sanitized });
    }
  }
  return renames;
};

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Rewrite asset references in a code string to match sanitized on-disk names.
 *
 * Does all substitutions in a single left-to-right pass over the original code
 * so a replacement's output is never re-scanned. Originals are ordered
 * longest-first in the alternation so an asset name that is a substring of a
 * longer one (e.g. "slide.m4a" inside "Bottle slide.m4a") can't shadow it.
 *
 * @param {string} code - Source code that may reference assets by original name.
 * @param {Array<{original: string, sanitized: string}>} renames
 * @returns {string}
 */
const rewriteAssetReferences = (code, renames) => {
  if (!code || !Array.isArray(renames) || !renames.length) {
    return code;
  }
  const lookup = new Map();
  const ordered = [...renames]
    .filter(({ original, sanitized }) => original && original !== sanitized)
    .sort((a, b) => b.original.length - a.original.length);
  if (!ordered.length) {
    return code;
  }
  for (const { original, sanitized } of ordered) {
    if (!lookup.has(original)) {
      lookup.set(original, sanitized);
    }
  }
  const pattern = new RegExp(ordered.map(({ original }) => escapeRegExp(original)).join('|'), 'g');
  return code.replace(pattern, (match) => (lookup.has(match) ? lookup.get(match) : match));
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

/**
 * Return a filename not already present in `usedNames`, appending _2, _3, …
 * before the extension until it is unique. Does not mutate `usedNames`.
 * @param {string} filename - Desired filename (may already be taken)
 * @param {Set<string>} usedNames - Names already claimed in the target directory
 * @returns {string} A filename absent from usedNames
 */
const dedupeFilename = (filename, usedNames) => {
  if (!usedNames.has(filename)) {
    return filename;
  }
  const ext = path.extname(filename);
  const base = filename.slice(0, filename.length - ext.length);
  let suffix = 2;
  let candidate = `${base}_${suffix}${ext}`;
  while (usedNames.has(candidate)) {
    suffix += 1;
    candidate = `${base}_${suffix}${ext}`;
  }
  return candidate;
};

module.exports = {
  ensureDirectoryExists,
  sanitizeFilename,
  buildAssetRenameMap,
  rewriteAssetReferences,
  resolveAssetUrl,
  dedupeFilename,
};

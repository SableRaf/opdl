const fs = require('fs');
const path = require('path');

const { sanitizeFilename, rewriteAssetReferences, dedupeFilename } = require('../utils');
const { buildCommentBlock, shouldAddAttribution } = require('./codeAttributor');

/**
 * Pure filename resolution: sanitize/fallback/extension handling, no dedup.
 *
 * The extension is captured from the raw title before sanitization, because
 * `path.extname('.pde')` is `''` — a title that IS the extension (e.g. '.pde')
 * has no stem, so it must be special-cased rather than concatenated (naive
 * handling would yield '.pde.pde'). Deduplication against sibling files is
 * deliberately not part of this function; callers own that with
 * `dedupeFilename` + a `usedNames` Set.
 *
 * @param {Object} params
 * @param {string} [params.title] - Raw title from the API.
 * @param {number} params.index - Zero-based index for the indexed fallback.
 * @param {string} [params.fallbackBase='part'] - Base name when title is missing/unusable.
 * @param {string} [params.defaultExtension='.js'] - Extension applied when the title has none.
 * @param {boolean} [params.indexedFallback=true] - Whether the fallback includes `_${index + 1}`.
 * @returns {string}
 */
function resolveCodeFileName({
  title,
  index,
  fallbackBase = 'part',
  defaultExtension = '.js',
  indexedFallback = true,
}) {
  const raw = path.basename(title || '');
  const isBareExtension = raw.toLowerCase() === defaultExtension.toLowerCase();
  const originalExt = isBareExtension ? defaultExtension : path.extname(raw);
  const intendedExt = originalExt || defaultExtension;
  const rawStem = isBareExtension ? '' : raw.slice(0, raw.length - originalExt.length);
  const fallbackStem = indexedFallback ? `${fallbackBase}_${index + 1}` : fallbackBase;
  const sanitized = sanitizeFilename(`${rawStem}${intendedExt}`);
  const sanitizedStem = sanitized.toLowerCase().endsWith(intendedExt.toLowerCase())
    ? sanitized.slice(0, -intendedExt.length)
    : '';
  return sanitizedStem ? sanitized : `${fallbackStem}${intendedExt}`;
}

/**
 * Validate a caller-supplied resolved filename before trusting it as a write
 * target: must be a bare basename (no traversal/absolute paths), equal to its
 * own sanitized form, have a nonempty stem, and resolve inside outputDir.
 *
 * @param {string} resolvedFileName
 * @param {string} outputDir
 * @returns {boolean}
 */
function isValidResolvedFileName(resolvedFileName, outputDir) {
  if (typeof resolvedFileName !== 'string' || !resolvedFileName) {
    return false;
  }
  if (resolvedFileName !== path.basename(resolvedFileName)) {
    return false;
  }
  if (sanitizeFilename(resolvedFileName) !== resolvedFileName) {
    return false;
  }
  const ext = path.extname(resolvedFileName);
  // A name that IS its own extension (e.g. '.js') has no real stem — Node's
  // path.extname returns '' for dotfiles, so this must be special-cased
  // rather than trusting `stem = resolvedFileName` in that branch.
  const isBareExtension = !ext && resolvedFileName.startsWith('.');
  const stem = ext ? resolvedFileName.slice(0, -ext.length) : resolvedFileName;
  if (isBareExtension || !stem) {
    return false;
  }
  const resolved = path.resolve(outputDir, resolvedFileName);
  const resolvedOutputDir = path.resolve(outputDir);
  if (resolved !== path.join(resolvedOutputDir, resolvedFileName)) {
    return false;
  }
  return resolved === resolvedOutputDir || resolved.startsWith(`${resolvedOutputDir}${path.sep}`);
}

/**
 * Write a single code block to disk, deduplicating filename collisions inside outputDir.
 *
 * @param {Object} params
 * @param {string} params.outputDir - Destination directory (must already exist).
 * @param {Object} params.codeBlock - { title, code } from the API.
 * @param {number} params.index - Zero-based index for fallback naming.
 * @param {Object} params.sketchInfo - Used by buildCommentBlock for attribution.
 * @param {boolean} params.addSourceComments - Whether to prepend the attribution block.
 * @param {string} [params.fallbackBase='part'] - Base name when title is missing.
 * @param {string} [params.defaultExtension='.js'] - Extension applied when the title has none.
 * @param {string} [params.resolvedFileName] - Precomputed filename from a prepass; validated,
 *   and rejected (throws) if unsafe. When omitted, resolved internally via resolveCodeFileName.
 * @param {Set<string>} params.usedNames - Caller-owned Set; mutated to track collisions.
 * @param {Array<{original: string, sanitized: string}>} [params.assetRenames=[]] -
 *   Asset filename rewrites to apply to the code so references match the
 *   sanitized names written to disk.
 * @returns {{ codeFilePath: string, sanitizedCodeBlock: Object, codeFileName: string }}
 */
function writeCodeFile({
  outputDir,
  codeBlock,
  index,
  sketchInfo,
  addSourceComments,
  fallbackBase = 'part',
  defaultExtension = '.js',
  resolvedFileName,
  usedNames,
  assetRenames = [],
}) {
  if (!usedNames || typeof usedNames.has !== 'function') {
    throw new Error('writeCodeFile: usedNames Set is required');
  }

  let codeFileName;
  if (resolvedFileName !== undefined) {
    if (!isValidResolvedFileName(resolvedFileName, outputDir)) {
      throw new Error(`writeCodeFile: invalid resolvedFileName "${resolvedFileName}"`);
    }
    codeFileName = resolvedFileName;
  } else {
    codeFileName = resolveCodeFileName({
      title: codeBlock.title,
      index,
      fallbackBase,
      defaultExtension,
    });
  }
  const fileExtension = path.extname(codeFileName) || defaultExtension;

  // De-dup within outputDir. When resolvedFileName came from a prepass that
  // already deduped against its own temporary Set, replaying the same names
  // in the same order against a fresh usedNames Set here is a no-op — it's
  // still required so rootUsedNames ends up populated for downstream
  // asset-collision logic.
  codeFileName = dedupeFilename(codeFileName, usedNames);
  usedNames.add(codeFileName);

  const codeFilePath = path.join(outputDir, codeFileName);
  const rewrittenCode = rewriteAssetReferences(codeBlock.code || '', assetRenames);
  let fileContent = rewrittenCode;
  if (addSourceComments && shouldAddAttribution(fileExtension) && !fileContent.includes('Downloaded with opdl')) {
    const commentBlock = buildCommentBlock(sketchInfo, fileExtension);
    fileContent = `${commentBlock}${fileContent.startsWith('\n') ? '' : '\n'}${fileContent}`;
  }
  fs.writeFileSync(codeFilePath, fileContent, 'utf8');

  return {
    codeFilePath,
    codeFileName,
    sanitizedCodeBlock: { ...codeBlock, title: codeFileName, code: rewrittenCode },
  };
}

module.exports = { writeCodeFile, resolveCodeFileName };

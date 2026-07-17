const fs = require('fs');
const path = require('path');

const { sanitizeFilename, rewriteAssetReferences, dedupeFilename } = require('../utils');
const { buildCommentBlock } = require('./codeAttributor');

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
  usedNames,
  assetRenames = [],
}) {
  if (!usedNames || typeof usedNames.has !== 'function') {
    throw new Error('writeCodeFile: usedNames Set is required');
  }

  const name = codeBlock.title || `${fallbackBase}_${index + 1}`;
  let codeFileName = path.basename(name);
  let fileExtension = path.extname(codeFileName);

  if (!fileExtension) {
    fileExtension = '.js';
    codeFileName += fileExtension;
  }

  codeFileName = sanitizeFilename(codeFileName) || `${fallbackBase}_${index + 1}.js`;
  // Recompute the extension after sanitization (in case sanitize stripped it).
  fileExtension = path.extname(codeFileName) || '.js';

  // De-dup within outputDir.
  codeFileName = dedupeFilename(codeFileName, usedNames);
  usedNames.add(codeFileName);

  const codeFilePath = path.join(outputDir, codeFileName);
  const rewrittenCode = rewriteAssetReferences(codeBlock.code || '', assetRenames);
  let fileContent = rewrittenCode;
  if (addSourceComments && !fileContent.includes('Downloaded with opdl')) {
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

module.exports = { writeCodeFile };

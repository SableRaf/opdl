const fs = require('fs');
const path = require('path');

const { sanitizeFilename } = require('../utils');
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
  if (usedNames.has(codeFileName)) {
    const ext = path.extname(codeFileName);
    const base = codeFileName.slice(0, codeFileName.length - ext.length);
    let suffix = 2;
    let candidate = `${base}_${suffix}${ext}`;
    while (usedNames.has(candidate)) {
      suffix += 1;
      candidate = `${base}_${suffix}${ext}`;
    }
    codeFileName = candidate;
  }
  usedNames.add(codeFileName);

  const codeFilePath = path.join(outputDir, codeFileName);
  let fileContent = codeBlock.code || '';
  if (addSourceComments && !fileContent.includes('Downloaded with opdl')) {
    const commentBlock = buildCommentBlock(sketchInfo, fileExtension);
    fileContent = `${commentBlock}${fileContent.startsWith('\n') ? '' : '\n'}${fileContent}`;
  }
  fs.writeFileSync(codeFilePath, fileContent, 'utf8');

  return {
    codeFilePath,
    codeFileName,
    sanitizedCodeBlock: { ...codeBlock, title: codeFileName },
  };
}

module.exports = { writeCodeFile };

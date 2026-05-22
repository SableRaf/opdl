const fs = require('fs');
const path = require('path');

const { ensureDirectoryExists } = require('../utils');
const { writeCodeFile } = require('./codeFileWriter');

const META_DIR = 'metadata';
const TUTORIAL_DIR = 'tutorial';

function extractStatus(error) {
  if (!error) return null;
  if (typeof error.status === 'number') return error.status;
  if (typeof error.response?.status === 'number') return error.response.status;
  return null;
}

function normalizeFailedPages(failedPages) {
  return (failedPages || []).map((entry) => ({
    pageNumber: entry.pageNumber,
    error: entry.error?.message || String(entry.error || 'Unknown error'),
    status: extractStatus(entry.error),
  }));
}

/**
 * Write a tutorial bundle to disk alongside the existing sketch download.
 *
 * @param {Object} bundle - { tutorial, pages, failedPages } from fetchTutorialBundle.
 * @param {string} outputDir - Sketch output directory.
 * @param {Object} sketchInfo - For code-file attribution.
 * @param {Object} [options]
 * @param {boolean} [options.saveMetadata]
 * @param {boolean} [options.addSourceComments]
 * @param {boolean} [options.quiet]
 * @returns {{ pagesWritten: number, failedPages: Array }}
 */
function writeTutorial(bundle, outputDir, sketchInfo, options = {}) {
  if (!bundle || !bundle.tutorial) {
    return { pagesWritten: 0, failedPages: [] };
  }

  const { tutorial, pages = [], failedPages = [] } = bundle;
  const normalizedFailedPages = normalizeFailedPages(failedPages);

  if (options.saveMetadata) {
    const metadataDir = path.join(outputDir, META_DIR);
    ensureDirectoryExists(metadataDir);
    const tutorialMetaPath = path.join(metadataDir, 'tutorial.json');
    const payload = { ...tutorial, failedPages: normalizedFailedPages };
    fs.writeFileSync(tutorialMetaPath, JSON.stringify(payload, null, 2), 'utf8');
  }

  const tutorialRoot = path.join(outputDir, TUTORIAL_DIR);
  const mode = tutorial.tutorialMode;
  let pagesWritten = 0;

  for (const page of pages) {
    const pageNumber = Number(page.pageNumber);
    if (!Number.isFinite(pageNumber) || pageNumber <= 0) {
      continue;
    }

    const pageDir = path.join(tutorialRoot, `page_${pageNumber}`);
    ensureDirectoryExists(pageDir);

    const markdown = String(page.markdown ?? '');
    fs.writeFileSync(path.join(pageDir, 'README.md'), markdown, 'utf8');

    if (mode === 'normal' && Array.isArray(page.codeObjects) && page.codeObjects.length) {
      const pageUsedNames = new Set();
      page.codeObjects.forEach((codeBlock, index) => {
        writeCodeFile({
          outputDir: pageDir,
          codeBlock,
          index,
          sketchInfo,
          addSourceComments: !!options.addSourceComments,
          fallbackBase: 'code',
          usedNames: pageUsedNames,
        });
      });
    }

    pagesWritten += 1;
  }

  if (normalizedFailedPages.length > 0 && !options.quiet) {
    const list = normalizedFailedPages.map((f) => f.pageNumber).join(', ');
    console.warn(`opdl: tutorial pages failed to download: ${list}`);
  }

  return { pagesWritten, failedPages: normalizedFailedPages };
}

module.exports = { writeTutorial };

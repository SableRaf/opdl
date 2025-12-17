const fs = require('fs');
const path = require('path');

const LICENSE_NAMES = {
  by: 'CC BY 4.0 International',
  'by-sa': 'CC BY-SA 4.0 International',
  'by-nd': 'CC BY-ND 4.0 International',
  'by-nc': 'CC BY-NC 4.0 International',
  'by-nc-sa': 'CC BY-NC-SA 4.0 International',
  'by-nc-nd': 'CC BY-NC-ND 4.0 International',
};

const getLicenseDisplay = (licenseCode) => {
  if (!licenseCode) {
    return 'Not specified';
  }
  return LICENSE_NAMES[licenseCode] || licenseCode;
};

const buildCommentBlock = (sketchInfo) => {
  const title = sketchInfo.title || sketchInfo.metadata?.title || 'Untitled';
  const author = sketchInfo.author || sketchInfo.metadata?.fullname || 'Unknown';
  const licenseDisplay = getLicenseDisplay(sketchInfo.metadata?.license);
  const sourceUrl = `https://openprocessing.org/sketch/${sketchInfo.sketchId}`;

  const lines = [
    '/*',
    ` * Title: ${title}`,
    ` * Author: ${author}`,
    ` * Source: ${sourceUrl}`,
    ` * License: ${licenseDisplay}`,
    ' *',
  ];

  if (sketchInfo.isFork && sketchInfo.parent?.sketchID) {
    const parentTitle = sketchInfo.parent.title || 'Unknown title';
    const parentAuthor = sketchInfo.parent.author || 'Unknown author';
    const parentUrl = `https://openprocessing.org/sketch/${sketchInfo.parent.sketchID}`;
    lines.push(` * Forked from: ${parentTitle} by ${parentAuthor}`);
    lines.push(` * Fork source: ${parentUrl}`);
    lines.push(' *');
  }

  lines.push(' * Downloaded with opdl (OpenProcessing Downloader)');
  lines.push(' * https://github.com/sableRaf/opdl');
  lines.push(' */');
  lines.push('');

  return lines.join('\n');
};

const addSourceComments = (sketchInfo, codeFilePaths = [], options = {}) => {
  const { quiet = false } = options;
  if (!codeFilePaths.length) {
    return;
  }

  const commentBlock = buildCommentBlock(sketchInfo);
  for (const targetPath of codeFilePaths) {
    try {
      const normalizedPath = path.resolve(targetPath);
      const content = fs.readFileSync(normalizedPath, 'utf8');
      if (content.includes('Downloaded with opdl')) {
        continue;
      }
      fs.writeFileSync(normalizedPath, `${commentBlock}${content.startsWith('\n') ? '' : '\n'}${content}`, 'utf8');
    } catch (error) {
      if (!quiet) {
        console.warn(`opdl: failed to add attribution to ${targetPath}: ${error.message}`);
      }
    }
  }
};

module.exports = { buildCommentBlock };

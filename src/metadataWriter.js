const fs = require('fs');
const path = require('path');

const formatList = (items, formatter) => {
  if (!Array.isArray(items) || !items.length) {
    return 'None';
  }
  return items.map((item) => `- ${formatter ? formatter(item) : item}`).join('\n');
};

const createOpMetadata = (sketchInfo, outputDir, options = {}) => {
  const metadata = sketchInfo.metadata || {};
  const { quiet = false } = options;
  const title = metadata.title || sketchInfo.title || 'Untitled';
  const author = sketchInfo.author || metadata.fullname || 'Unknown';
  const sourceUrl = `https://openprocessing.org/sketch/${sketchInfo.sketchId}`;
  const license = metadata.license || 'Not specified';
  const description = metadata.description || 'No description provided.';
  const createdOn = metadata.createdOn || 'N/A';
  const updatedOn = metadata.updatedOn || 'N/A';
  const mode = metadata.mode || 'Unknown';
  const engine = metadata.engineURL || 'N/A';
  const tags = metadata.tags || [];
  const assets = sketchInfo.files || [];
  const libraries = metadata.libraries || sketchInfo.libraries || [];
  const downloadDate = new Date().toISOString().split('T')[0];

  const lines = [
    `# ${title}`,
    '',
    `**Author:** ${author}`,
    `**OpenProcessing URL:** ${sourceUrl}`,
    `**License:** ${license}`,
    '',
    '## Description',
    description,
    '',
    '## Details',
    `- **Created:** ${createdOn}`,
    `- **Last Updated:** ${updatedOn}`,
    `- **Mode:** ${mode}`,
    `- **Engine:** ${engine}`,
    '',
  ];

  if (sketchInfo.isFork && sketchInfo.parent?.sketchID) {
    const parentTitle = sketchInfo.parent.title || 'Unknown title';
    const parentAuthor = sketchInfo.parent.author || 'Unknown author';
    const parentUrl = `https://openprocessing.org/sketch/${sketchInfo.parent.sketchID}`;
    lines.push('## Fork Information');
    lines.push(`This sketch is a fork of [${parentTitle}](${parentUrl}) by ${parentAuthor}`);
    lines.push('');
  }

  lines.push('## Assets');
  lines.push(formatList(assets, (asset) => asset.name || 'Unnamed asset'));
  lines.push('');
  lines.push('## Libraries');
  lines.push(
    Array.isArray(libraries) && libraries.length
      ? libraries
          .map((library) => `- ${library.url || library}`)
          .join('\n')
      : 'None'
  );
  lines.push('');
  lines.push('## Tags');
  lines.push(tags.length ? tags.join(', ') : 'None');
  lines.push('');
  lines.push('---');
  lines.push(`*Downloaded with [opdl](https://github.com/nestofbirbs/openprocessing-downloader) on ${downloadDate}*`);

  const filePath = path.join(outputDir, 'OPENPROCESSING.md');
  try {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  } catch (error) {
    if (!quiet) {
      console.warn(`opdl: failed to write OPENPROCESSING.md: ${error.message}`);
    }
  }
};

module.exports = { createOpMetadata };

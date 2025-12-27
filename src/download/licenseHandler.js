const fs = require('fs');
const path = require('path');

const LICENSES = {
  by: {
    name: 'Creative Commons Attribution 4.0 International',
    url: 'https://creativecommons.org/licenses/by/4.0/',
    description:
      'This work may be shared and adapted for any purpose, provided appropriate credit is given and changes are indicated.',
  },
  'by-sa': {
    name: 'Creative Commons Attribution-ShareAlike 4.0 International',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    description:
      'You may remix, adapt, and build upon this work even for commercial purposes as long as you credit the creator and license your new creations under identical terms.',
  },
  'by-nd': {
    name: 'Creative Commons Attribution-NoDerivatives 4.0 International',
    url: 'https://creativecommons.org/licenses/by-nd/4.0/',
    description:
      'You may copy and redistribute the work in any medium or format, but it must remain unchanged and complete.',
  },
  'by-nc': {
    name: 'Creative Commons Attribution-NonCommercial 4.0 International',
    url: 'https://creativecommons.org/licenses/by-nc/4.0/',
    description:
      'You may remix, adapt, and build upon this work non-commercially and credit the creator.',
  },
  'by-nc-sa': {
    name: 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    description:
      'You may remix, adapt, and build upon this work non-commercially, credit the creator, and license your contributions under the same terms.',
  },
  'by-nc-nd': {
    name: 'Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International',
    url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
    description:
      'You may copy and redistribute the work non-commercially, but you may not distribute derivative works.',
  },
};

const buildLicenseContent = (sketchInfo) => {
  const title = sketchInfo.title || sketchInfo.metadata?.title || 'Untitled';
  const author = sketchInfo.author || sketchInfo.metadata?.fullname || 'Unknown';
  const sourceUrl = `https://openprocessing.org/sketch/${sketchInfo.sketchId}`;
  const creationDate = sketchInfo.metadata?.createdOn;
  const parsedCreationYear = creationDate ? new Date(creationDate).getFullYear() : NaN;
  const year = Number.isNaN(parsedCreationYear) ? new Date().getFullYear() : parsedCreationYear;
  const licenseCode = sketchInfo.metadata?.license;

  if (!licenseCode) {
    return `License Not Specified\n\nThe author did not specify a license for this sketch. Use it carefully and reach out to the creator if you need permissions.\n\nTitle: ${title}\nAuthor: ${author}\nSource: ${sourceUrl}\nYear: ${year}\n`;
  }

  const template = LICENSES[licenseCode];
  if (!template) {
    return `Creative Commons license (${licenseCode})\n\nTitle: ${title}\nAuthor: ${author}\nSource: ${sourceUrl}\nYear: ${year}\n`;
  }

  return `${template.name}\n\n${template.description}\n\nTitle: ${title}\nAuthor: ${author}\nSource: ${sourceUrl}\nYear: ${year}\n\nTo view a copy of this license, visit:\n${template.url}\n`;
};

const createLicenseFile = (sketchInfo, outputDir, options = {}) => {
  const { quiet = false } = options;
  const content = buildLicenseContent(sketchInfo);
  const licensePath = path.join(outputDir, 'LICENSE');

  try {
    fs.writeFileSync(licensePath, content, 'utf8');
  } catch (error) {
    if (!quiet) {
      console.warn(`opdl: failed to write LICENSE: ${error.message}`);
    }
  }
};

module.exports = { createLicenseFile };

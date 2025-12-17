const fs = require('fs');
const path = require('path');

const generateIndexHtml = (metadata, codeParts, outputDir) => {
  let engineURL = metadata.engineURL ? metadata.engineURL.replace(/\\/g, '') : '';

  if (engineURL.startsWith('/')) {
    engineURL = `https://openprocessing.org${engineURL}`;
  }

  const htmlHeadStart = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <!-- keep the line below for OpenProcessing compatibility -->
    <script src="https://openprocessing.org/openprocessing_sketch.js"></script>
    <script src="${engineURL}"></script>
`;

  const libraries = (metadata.libraries || [])
    .map((lib) => `<script src="${lib.url}"></script>`)
    .join('\n    ');
  const librariesSection = libraries ? `    ${libraries}\n` : '';

  const scriptTags = (codeParts || [])
    .filter((part) => part.title && part.title.endsWith('.js'))
    .map((part) => `<script src="${part.title}"></script>`)
    .join('\n    ');
  const scriptTagsSection = scriptTags ? `    ${scriptTags}\n` : '';

  const scriptTagsDefault = (codeParts || [])
    .filter((part) => part.title && !part.title.includes('.'))
    .map((part) => `<script src="${part.title}.js"></script>`)
    .join('\n    ');
  const scriptTagsDefaultSection = scriptTagsDefault ? `    ${scriptTagsDefault}\n` : '';

  const cssLinkTags = (codeParts || [])
    .filter((part) => part.title && part.title.endsWith('.css'))
    .map((part) => `<link rel="stylesheet" type="text/css" href="${part.title}">`)
    .join('\n    ');
  const cssLinkTagsSection = cssLinkTags ? `    ${cssLinkTags}\n` : '';

  const htmlContent = `${htmlHeadStart}${librariesSection}${scriptTagsSection}${scriptTagsDefaultSection}${cssLinkTagsSection}</head>

<body>

</body>

</html>`;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(outputPath, htmlContent, 'utf8');
};

module.exports = { generateIndexHtml };

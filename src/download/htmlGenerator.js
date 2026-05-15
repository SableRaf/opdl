const fs = require('fs');
const path = require('path');

const DEFAULT_STYLESHEET = `body {
  padding: 0;
  margin: 0;
}
`;

const generateIndexHtml = (metadata, codeParts, outputDir) => {
  const parts = codeParts || [];
  const hasExistingHtml = parts.some((part) => part.title === 'index.html');

  if (hasExistingHtml) {
    return;
  }

  const hasExistingCss = parts.some(
    (part) => part.title && part.title.toLowerCase().endsWith('.css')
  );

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

  const scriptTags = parts
    .filter((part) => part.title && part.title.endsWith('.js'))
    .map((part) => `<script src="${part.title}"></script>`)
    .join('\n    ');
  const scriptTagsSection = scriptTags ? `    ${scriptTags}\n` : '';

  const scriptTagsDefault = parts
    .filter((part) => part.title && !part.title.includes('.'))
    .map((part) => `<script src="${part.title}.js"></script>`)
    .join('\n    ');
  const scriptTagsDefaultSection = scriptTagsDefault ? `    ${scriptTagsDefault}\n` : '';

  const cssLinkTags = parts
    .filter((part) => part.title && part.title.endsWith('.css'))
    .map((part) => `<link rel="stylesheet" type="text/css" href="${part.title}">`)
    .join('\n    ');
  const cssLinkTagsSection = cssLinkTags ? `    ${cssLinkTags}\n` : '';

  const defaultCssLinkSection = hasExistingCss
    ? ''
    : `    <link rel="stylesheet" type="text/css" href="style.css">\n`;

  const htmlContent = `${htmlHeadStart}${librariesSection}${scriptTagsSection}${scriptTagsDefaultSection}${cssLinkTagsSection}${defaultCssLinkSection}</head>

<body>

</body>

</html>`;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(outputPath, htmlContent, 'utf8');

  if (!hasExistingCss) {
    const stylesheetPath = path.join(outputDir, 'style.css');
    fs.writeFileSync(stylesheetPath, DEFAULT_STYLESHEET, 'utf8');
  }
};

module.exports = { generateIndexHtml, DEFAULT_STYLESHEET };

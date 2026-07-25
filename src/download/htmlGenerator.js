const fs = require('fs');
const path = require('path');
const { canonicalizeMode } = require('./sketchMode');

const DEFAULT_STYLESHEET = `body {
  padding: 0;
  margin: 0;
}
`;

// In p5.js and processing.js modes, center the canvas in the viewport and use a
// neutral grey backdrop so the sketch reads clearly against the page (matching
// how sketches are framed on OpenProcessing).
const CENTERED_STYLESHEET = `body {
  padding: 0;
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #808080;
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

  const cssLinkTags = parts
    .filter((part) => part.title && part.title.endsWith('.css'))
    .map((part) => `<link rel="stylesheet" type="text/css" href="${part.title}">`)
    .join('\n    ');
  const cssLinkTagsSection = cssLinkTags ? `    ${cssLinkTags}\n` : '';

  const defaultCssLinkSection = hasExistingCss
    ? ''
    : `    <link rel="stylesheet" type="text/css" href="style.css">\n`;

  const isPjs = canonicalizeMode(metadata.mode) === 'pjs';
  const pdeParts = isPjs
    ? parts.filter((part) => part.title && part.title.toLowerCase().endsWith('.pde'))
    : [];

  let scriptTagsSection;
  let scriptTagsDefaultSection;
  let bodyContent;

  if (isPjs && pdeParts.length) {
    // pjs with .pde tabs: Processing.js concatenates all .pde sources listed
    // on a canvas's data-processing-sources; explicit .js helper tabs stay
    // plain scripts. No sketch.properties, no inline text/processing (avoids
    // </script> corruption).
    const pdeSources = pdeParts.map((part) => part.title).join(' ');
    const jsHelperTags = parts
      .filter((part) => part.title && part.title.toLowerCase().endsWith('.js'))
      .map((part) => `<script src="${part.title}"></script>`)
      .join('\n    ');
    scriptTagsSection = jsHelperTags ? `    ${jsHelperTags}\n` : '';
    scriptTagsDefaultSection = '';
    bodyContent = `<canvas data-processing-sources="${pdeSources}"></canvas>\n`;
  } else {
    if (isPjs && !metadata.__silencePjsFallbackWarning) {
      console.warn('opdl: pjs sketch has no .pde files; falling back to <script src> wiring');
    }
    const scriptTags = parts
      .filter((part) => part.title && part.title.endsWith('.js'))
      .map((part) => `<script src="${part.title}"></script>`)
      .join('\n    ');
    scriptTagsSection = scriptTags ? `    ${scriptTags}\n` : '';

    const scriptTagsDefault = parts
      .filter((part) => part.title && !part.title.includes('.'))
      .map((part) => `<script src="${part.title}.js"></script>`)
      .join('\n    ');
    scriptTagsDefaultSection = scriptTagsDefault ? `    ${scriptTagsDefault}\n` : '';
    bodyContent = '';
  }

  const htmlContent = `${htmlHeadStart}${librariesSection}${scriptTagsSection}${scriptTagsDefaultSection}${cssLinkTagsSection}${defaultCssLinkSection}</head>

<body>
${bodyContent}
</body>

</html>`;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(outputPath, htmlContent, 'utf8');

  if (!hasExistingCss) {
    const stylesheetPath = path.join(outputDir, 'style.css');
    // Processing.js sketches may report their mode as "pjs" or "processingjs"
    // depending on the endpoint/version; canonicalizeMode collapses both to
    // "pjs" so either triggers the centered layout.
    const centeredModes = ['p5js', 'pjs'];
    const stylesheet = centeredModes.includes(canonicalizeMode(metadata.mode))
      ? CENTERED_STYLESHEET
      : DEFAULT_STYLESHEET;
    fs.writeFileSync(stylesheetPath, stylesheet, 'utf8');
  }
};

module.exports = {
  generateIndexHtml,
  DEFAULT_STYLESHEET,
  CENTERED_STYLESHEET,
  // Backwards-compatible alias for the previous p5js-only name.
  P5_STYLESHEET: CENTERED_STYLESHEET,
};

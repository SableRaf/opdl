const fs = require('fs');
const path = require('path');
const { runNpmInstall, createViteConfig, supportsVite } = require('./viteScaffolder');
const { runDevServer } = require('./serverRunner');

const DEFAULT_TEMPLATE_DIR = path.join(__dirname, 'templates', 'gallery');
const TEMPLATE_FILES = ['index.html', 'main.js', 'style.css'];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));
}

function renderTemplate(content, values) {
  return content.replace(/\{\{([A-Z_]+)\}\}/g, (placeholder, key) => (
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : placeholder
  ));
}

function writeGalleryTemplates(rootDir, templateDir, values) {
  for (const fileName of TEMPLATE_FILES) {
    const sourcePath = path.join(templateDir, fileName);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Gallery template is missing required file: ${sourcePath}`);
    }
    const content = fs.readFileSync(sourcePath, 'utf8');
    fs.writeFileSync(path.join(rootDir, fileName), renderTemplate(content, values), 'utf8');
  }
}

async function scaffoldGalleryProject(rootDir, options = {}) {
  const {
    curationId = 'unknown',
    curationTitle = 'OpenProcessing Gallery',
    templateDir = DEFAULT_TEMPLATE_DIR,
    quiet = false,
    run = false,
    installFn = runNpmInstall,
    runDevServerFn = runDevServer,
  } = options;

  fs.mkdirSync(rootDir, { recursive: true });
  if (!supportsVite()) {
    if (!quiet) {
      console.warn(`opdl: Vite 6 requires Node.js 20 or higher. Current version: ${process.version}`);
    }
    return;
  }

  const packageJson = {
    name: `curation-${curationId}-gallery`,
    version: '1.0.0',
    private: true,
    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
    dependencies: { 'js-yaml': '^4.1.0' },
    devDependencies: { vite: '^6.0.0' },
  };
  fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  createViteConfig(rootDir);
  writeGalleryTemplates(rootDir, path.resolve(templateDir), {
    CURATION_TITLE: escapeHtml(curationTitle),
  });
  fs.writeFileSync(
    path.join(rootDir, 'README.md'),
    `# ${curationTitle}\n\nRun \`npm install && npm run dev\` from this directory. Edit \`public/gallery.yaml\` to change playback timing. Sketch titles and authors come from each sketch's \`metadata/metadata.json\`; optional \`titleOverride\` and \`authorOverride\` properties can be added there.\n`,
  );

  if (!quiet) await installFn(rootDir, quiet);
  if (run) await runDevServerFn(rootDir, { vite: true, quiet });
}

module.exports = {
  DEFAULT_TEMPLATE_DIR,
  scaffoldGalleryProject,
  writeGalleryTemplates,
};

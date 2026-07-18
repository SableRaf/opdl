const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { runDevServer } = require('./serverRunner');
const { canonicalizeMode } = require('./sketchMode');
const { sanitizeFilename } = require('../utils');

/**
 * Escape special characters in a string so it can be used safely in a RegExp
 * @param {string} str
 * @returns {string}
 */
function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Shell-quote a path for the completion message's `cd` command (single
 * quotes, with embedded `'` escaped), so directories containing spaces
 * produce a runnable command.
 * @param {string} p
 * @returns {string}
 */
function shellQuote(p) {
  return `'${p.replace(/'/g, "'\\''")}'`;
}

/**
 * Build the `cd <path> && npm run dev` completion message. Uses a relative
 * path from cwd when possible (falls back to absolute if the relative path
 * escapes upward), shell-quoted so spaces in the path don't break the command.
 * @param {string} outputDir
 * @returns {string}
 */
function buildCompletionMessage(outputDir) {
  const relative = path.relative(process.cwd(), outputDir);
  const displayPath = relative && !relative.startsWith('..') && !path.isAbsolute(relative)
    ? relative
    : outputDir;
  return `opdl: Run \`cd ${shellQuote(displayPath)} && npm run dev\` to start the development server.`;
}

/**
 * Scaffolds a Vite project in the specified output directory
 * @param {string} outputDir - Directory containing the downloaded sketch
 * @param {Object} sketchInfo - Sketch metadata and information
 * @param {Object} options - Scaffolding options
 * @param {Array} options.codeFiles - Array of saved code file paths
 * @param {Array<string>} [options.runtimeFiles] - Runtime file allowlist (pjs only)
 * @param {boolean} options.quiet - Suppress output messages
 * @param {boolean} options.run - Automatically run dev server after setup
 * @param {Function} [options.runDevServerFn] - Test hook for runDevServer
 */
async function scaffoldViteProject(outputDir, sketchInfo, options = {}) {
  const {
    codeFiles = [],
    runtimeFiles = [],
    quiet = false,
    run = false,
    runDevServerFn = runDevServer,
  } = options;

  // Check Node version - Vite 6 requires Node 20+
  const nodeVersion = process.version;
  if (!supportsVite(nodeVersion)) {
    if (!quiet) {
      console.warn(`opdl: Vite 6 requires Node.js 20 or higher. Current version: ${nodeVersion}`);
      console.warn('opdl: Skipping Vite setup. Please upgrade Node.js to use --vite flag.');
    }
    return;
  }

  // Check if there are any code files
  if (codeFiles.length === 0) {
    if (!quiet) {
      console.warn('opdl: No code files found. Skipping Vite setup.');
    }
    return;
  }

  const mode = sketchInfo.metadata?.mode;
  const isPjs = canonicalizeMode(mode) === 'pjs';
  // For HTML mode, check if an HTML file exists
  // HTML mode means user wrote their own HTML, which we won't modify
  const isHtmlMode = mode === 'html';

  // Check if package.json already exists
  const packageJsonPath = path.join(outputDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    if (!quiet) {
      console.log('opdl: package.json already exists. Skipping Vite scaffolding.');
    }
    return;
  }

  if (!quiet) {
    console.log('opdl: Setting up Vite project structure...');
  }

  try {
    if (isPjs) {
      await scaffoldPjsViteProject(outputDir, sketchInfo, runtimeFiles);
    } else {
      await scaffoldGenericViteProject(outputDir, sketchInfo, codeFiles, isHtmlMode);
    }

    // Run npm install unless quiet mode
    if (!quiet) {
      console.log('opdl: Installing Vite dependencies...');
      await runNpmInstall(outputDir, quiet);
      console.log('opdl: Vite project setup complete!');

      if (!run) {
        console.log(buildCompletionMessage(outputDir));
      }
    } else {
      // In quiet mode, still create the project structure but skip npm install
      console.log('opdl: Vite project structure created. Run "npm install" to install dependencies.');
    }

    // Run dev server if --run flag is set
    if (run) {
      await runDevServerFn(outputDir, { vite: true, quiet });
    }
  } catch (error) {
    if (!quiet) {
      console.error('opdl: Error setting up Vite project:', error.message);
    }
    throw error;
  }
}

/**
 * Generic (p5js/html) Vite scaffold: moves code to src/ and assets to
 * public/, then rewrites index.html accordingly. Unchanged behavior from
 * before the pjs branch was introduced — just extracted into its own function.
 */
async function scaffoldGenericViteProject(outputDir, sketchInfo, codeFiles, isHtmlMode) {
  // Create src directory
  const srcDir = path.join(outputDir, 'src');
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  // Create public directory for assets
  const publicDir = path.join(outputDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Move code files to src directory (but not HTML files - Vite expects those in root)
  const movedCodeFiles = [];
  for (const codeFilePath of codeFiles) {
    const fileName = path.basename(codeFilePath);
    const ext = path.extname(fileName).toLowerCase();

    // Skip HTML files - they should stay in root for Vite
    if (ext === '.html' || ext === '.htm') {
      continue;
    }

    const newPath = path.join(srcDir, fileName);
    fs.renameSync(codeFilePath, newPath);
    movedCodeFiles.push(fileName);
  }

  // Move asset files to public directory
  const files = fs.readdirSync(outputDir);
  const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.mp3', '.wav', '.ogg', '.mp4', '.webm', '.json', '.txt'];

  // Certain config/metadata files must remain in the project root and should not be treated as assets
  const rootConfigFiles = new Set([
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'tsconfig.json',
    'jsconfig.json',
    '.gitignore',
    '.gitignore.txt',
    '.npmrc',
    'vite.config.js',
  ]);

  for (const file of files) {
    const fullPath = path.join(outputDir, file);

    // Skip directories
    try {
      if (fs.statSync(fullPath).isDirectory()) {
        continue;
      }
    } catch (e) {
      continue;
    }

    const ext = path.extname(file).toLowerCase();

    // Only consider known asset extensions
    if (!assetExtensions.includes(ext)) {
      continue;
    }

    // Skip files that should stay in the project root (e.g., config and metadata files)
    if (rootConfigFiles.has(file.toLowerCase())) {
      continue;
    }

    const oldPath = fullPath;
    const newPath = path.join(publicDir, file);
    fs.renameSync(oldPath, newPath);
  }

  // Create package.json
  createPackageJson(outputDir, sketchInfo);

  // Create vite.config.js
  createViteConfig(outputDir);

  // Update index.html for Vite
  const indexHtmlPath = path.join(outputDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    if (isHtmlMode) {
      // For HTML mode, update paths to point to src/ and public/
      updateHtmlModeFilePaths(indexHtmlPath, movedCodeFiles, outputDir);
    } else {
      // For generated HTML, completely rewrite script tags
      updateIndexHtmlForVite(indexHtmlPath, movedCodeFiles);
    }
  }
}

/**
 * pjs Vite scaffold: moves nothing. The dual-purpose folder (runnable in the
 * Processing PDE and served by Vite) is preserved by leaving .pde/.js/.css
 * and downloaded assets at the project root — data-processing-sources,
 * helper <script src>, and loadImage relative paths all resolve unchanged in
 * dev. Only package.json and a pjs vite.config.js (with a build-time copy
 * plugin) are added; index.html is left untouched.
 */
async function scaffoldPjsViteProject(outputDir, sketchInfo, runtimeFiles) {
  const allowlist = buildRuntimeFileAllowlist(outputDir, runtimeFiles);
  createPackageJson(outputDir, sketchInfo);
  createPjsViteConfig(outputDir, allowlist);
}

/**
 * Validate and dedupe the runtime file list the downloader says it produced,
 * for embedding into the pjs vite.config.js copy plugin. The sketch dir isn't
 * guaranteed pristine (repeat downloads, manual edits), so this never trusts
 * "everything in the directory" — only entries the downloader itself wrote,
 * and only if they're safe basenames that still exist on disk at scaffold time
 * (skipped otherwise; the copy plugin also re-checks and warns at build time).
 */
function buildRuntimeFileAllowlist(outputDir, runtimeFiles) {
  const seen = new Set();
  const allowlist = [];
  for (const entry of runtimeFiles || []) {
    if (typeof entry !== 'string' || !entry) continue;
    if (entry.toLowerCase() === 'index.html') continue; // Vite owns index.html
    if (entry !== path.basename(entry)) continue;
    if (sanitizeFilename(entry) !== entry) continue;
    if (seen.has(entry)) continue;
    seen.add(entry);
    allowlist.push(entry);
  }
  return allowlist;
}

function supportsVite(nodeVersion = process.version) {
  return parseInt(nodeVersion.slice(1).split('.')[0], 10) >= 20;
}

/**
 * Creates package.json with Vite dependencies
 * @param {string} outputDir - Output directory path
 * @param {Object} sketchInfo - Sketch metadata
 */
function createPackageJson(outputDir, sketchInfo) {
  const sketchId = sketchInfo.sketchId || 'unknown';
  const sketchTitle = sketchInfo.metadata?.title || `Sketch ${sketchId}`;
  const author = sketchInfo.author || '';

  const packageJson = {
    name: `sketch-${sketchId}`,
    version: '1.0.0',
    private: true,
    description: sketchTitle,
    ...(author && { author }),
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
    devDependencies: {
      vite: '^6.0.0',
    },
  };

  const packageJsonPath = path.join(outputDir, 'package.json');
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
}

/**
 * Creates vite.config.js
 * @param {string} outputDir - Output directory path
 */
function createViteConfig(outputDir) {
  const viteConfigContent = `import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
`;

  const viteConfigPath = path.join(outputDir, 'vite.config.js');
  fs.writeFileSync(viteConfigPath, viteConfigContent, 'utf8');
}

/**
 * Creates vite.config.js for pjs sketches: the dev server serves the project
 * root as-is (nothing moved, so data-processing-sources / helper <script src>
 * / loadImage paths resolve unchanged), and an inline closeBundle plugin
 * copies only the validated runtime file allowlist into dist/ at build time
 * — never "everything in the directory", since repeat downloads or manual
 * edits could otherwise leak a stray .env or debug log into the published
 * build. Files missing at build time are skipped with a warning rather than
 * failing the build; each resolved source/destination is re-checked to stay
 * within the project root / dist/ as a defense-in-depth measure.
 * @param {string} outputDir - Output directory path (the sketch dir)
 * @param {Array<string>} allowlist - Validated runtime file basenames
 */
function createPjsViteConfig(outputDir, allowlist) {
  const runtimeFilesLiteral = JSON.stringify(allowlist);
  const viteConfigContent = `import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Runtime files this download produced (.pde/.js/.css/downloaded assets).
// Validated and deduplicated by opdl at download time; index.html is
// excluded here because Vite owns it.
const runtimeFiles = ${runtimeFilesLiteral};

function copyPjsRuntimeFiles() {
  return {
    name: 'opdl-copy-pjs-runtime-files',
    closeBundle() {
      const projectRoot = path.resolve(__dirname);
      const distDir = path.resolve(__dirname, 'dist');
      for (const fileName of runtimeFiles) {
        const srcPath = path.resolve(projectRoot, fileName);
        const destPath = path.resolve(distDir, fileName);
        if (!srcPath.startsWith(projectRoot + path.sep) && srcPath !== projectRoot) {
          continue;
        }
        if (!destPath.startsWith(distDir + path.sep) && destPath !== distDir) {
          continue;
        }
        if (!fs.existsSync(srcPath)) {
          console.warn(\`opdl: runtime file missing at build time, skipping: \${fileName}\`);
          continue;
        }
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(srcPath, destPath);
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [copyPjsRuntimeFiles()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
`;

  const viteConfigPath = path.join(outputDir, 'vite.config.js');
  fs.writeFileSync(viteConfigPath, viteConfigContent, 'utf8');
}

/**
 * Updates index.html to work with Vite
 * For p5.js sketches, we load scripts as regular (non-module) scripts
 * to maintain global scope for setup(), draw(), etc.
 * @param {string} indexHtmlPath - Path to index.html
 * @param {Array<string>} codeFiles - Array of code file names
 */
function updateIndexHtmlForVite(indexHtmlPath, codeFiles) {
  let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

  // Remove local script tags but keep CDN scripts
  const lines = htmlContent.split('\n');
  const updatedLines = lines.map(line => {
    const trimmed = line.trim();

    // Skip non-script lines
    if (!trimmed.includes('<script')) {
      return line;
    }

    // Keep CDN scripts (http:// or https://)
    if (trimmed.includes('http://') || trimmed.includes('https://')) {
      return line;
    }

    // Remove local script tags - we'll add Vite-served versions
    if (trimmed.match(/<script\s+src=["'][^"']*\.js["']/)) {
      return null;
    }

    return line;
  }).filter(line => line !== null);

  htmlContent = updatedLines.join('\n');

  // Add script tags for each JS file in src/ (as regular scripts, not modules)
  // This preserves global scope for p5.js global mode
  if (!htmlContent.includes('/src/')) {
    const jsFiles = codeFiles.filter(f => f.endsWith('.js'));
    const scriptTags = jsFiles.map(file => `    <script src="/src/${file}"></script>`).join('\n');

    htmlContent = htmlContent.replace(
      '</head>',
      `${scriptTags}\n</head>`
    );
  }

  fs.writeFileSync(indexHtmlPath, htmlContent, 'utf8');
}

/**
 * Updates file paths in HTML mode sketches to point to src/ or public/
 * @param {string} indexHtmlPath - Path to index.html
 * @param {Array<string>} movedCodeFiles - Array of code file names moved to src/
 * @param {string} outputDir - Output directory path
 */
function updateHtmlModeFilePaths(indexHtmlPath, movedCodeFiles, outputDir) {
  let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

  // Get list of files in public directory
  const publicDir = path.join(outputDir, 'public');
  const publicFiles = fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : [];

  // Update script src paths for files that were moved to src/
  for (const fileName of movedCodeFiles) {
    // Match variations: src="file.js", src='file.js', src = "file.js", etc.
    const escName = escapeRegExp(fileName);
    const srcRegex = new RegExp(`(src\\s*=\\s*["'])${escName}(["'])`, 'g');
    htmlContent = htmlContent.replace(srcRegex, `$1/src/${fileName}$2`);
  }

  // Update link href paths for CSS files in src/
  for (const fileName of movedCodeFiles) {
    if (fileName.endsWith('.css')) {
      const escName = escapeRegExp(fileName);
      const hrefRegex = new RegExp(`(href\\s*=\\s*["'])${escName}(["'])`, 'g');
      htmlContent = htmlContent.replace(hrefRegex, `$1/src/${fileName}$2`);
    }
  }

  // Update paths for asset files in public/
  for (const fileName of publicFiles) {
    // For assets, we reference them directly from root (Vite serves public/ at root)
    // But if they're referenced with a path, update it
    const escName = escapeRegExp(fileName);
    const srcRegex = new RegExp(`(src\\s*=\\s*["'])${escName}(["'])`, 'g');
    const hrefRegex = new RegExp(`(href\\s*=\\s*["'])${escName}(["'])`, 'g');

    // Assets in public/ are served from root, so just /filename
    htmlContent = htmlContent.replace(srcRegex, `$1/${fileName}$2`);
    htmlContent = htmlContent.replace(hrefRegex, `$1/${fileName}$2`);
  }

  fs.writeFileSync(indexHtmlPath, htmlContent, 'utf8');
}

/**
 * Runs npm install in the output directory
 * @param {string} outputDir - Output directory path
 * @param {boolean} quiet - Suppress output
 * @returns {Promise<void>}
 */
function runNpmInstall(outputDir, quiet) {
  return new Promise((resolve, reject) => {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawn(npm, ['install'], {
      cwd: outputDir,
      stdio: quiet ? 'ignore' : 'inherit',
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`npm install exited with code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

module.exports = {
  scaffoldViteProject,
  runNpmInstall,
  createViteConfig,
  createPjsViteConfig,
  supportsVite,
  buildCompletionMessage,
};

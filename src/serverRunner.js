const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

/**
 * Opens a URL in the default browser
 * @param {string} url - URL to open
 * @param {Object} [overrides] - Dependency overrides for testing
 * @param {string} [overrides.platform] - Platform identifier
 * @param {Function} [overrides.spawnFn] - Spawn implementation
 */
function openBrowser(url, overrides = {}) {
  const { platform = process.platform, spawnFn = spawn } = overrides;
  let parsedUrl;
  try {
    // Validate URL to guard against arbitrary command fragments
    parsedUrl = new URL(url);
  } catch {
    return;
  }

  let command;
  let args;

  if (platform === 'darwin') {
    command = 'open';
    args = [parsedUrl.toString()];
  } else if (platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '', parsedUrl.toString()];
  } else {
    // Linux and other Unix-like systems
    command = 'xdg-open';
    args = [parsedUrl.toString()];
  }

  const child = spawnFn(command, args, {
    stdio: 'ignore',
    detached: true,
  });

  if (child && typeof child.on === 'function') {
    child.on('error', () => {
      // Silently fail - browser opening is a nice-to-have feature
      // The user can still manually open the URL
    });
  }
}

/**
 * Runs the development server for a project
 * @param {string} outputDir - Directory containing the project
 * @param {Object} options - Server options
 * @param {boolean} options.vite - Whether this is a Vite project
 * @param {boolean} options.quiet - Suppress output messages
 * @returns {Promise<void>}
 */
async function runDevServer(outputDir, options = {}) {
  const { vite = false, quiet = false } = options;

  if (vite) {
    await runViteServer(outputDir, quiet);
  } else {
    await runSimpleHttpServer(outputDir, quiet);
  }
}

/**
 * Runs Vite dev server
 * @param {string} outputDir - Directory containing the Vite project
 * @param {boolean} quiet - Suppress output messages
 * @returns {Promise<void>}
 * @param {Object} [overrides] - Dependency overrides for testing
 * @param {typeof fs} [overrides.fsModule]
 * @param {Function} [overrides.spawnFn]
 * @param {string} [overrides.platform]
 */
function runViteServer(outputDir, quiet, overrides = {}) {
  const { fsModule = fs, spawnFn = spawn, platform = process.platform } = overrides;
  return new Promise((resolve, reject) => {
    // Check if package.json exists
    const packageJsonPath = path.join(outputDir, 'package.json');
    if (!fsModule.existsSync(packageJsonPath)) {
      reject(new Error('package.json not found. Cannot run Vite server.'));
      return;
    }

    if (!quiet) {
      console.log('\nopdl: Starting Vite development server...');
      console.log('opdl: Press Ctrl+C to stop the server.\n');
    }

    const npm = platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawnFn(npm, ['run', 'dev'], {
      cwd: outputDir,
      stdio: 'inherit',
    });

    if (child && typeof child.on === 'function') {
      child.on('error', (error) => {
        if (!quiet) {
          console.error('opdl: Error starting Vite server:', error.message);
        }
        reject(error);
      });
    }

    // Vite server runs indefinitely, so we resolve immediately
    // The user will need to Ctrl+C to stop it
    resolve();
  });
}

/**
 * Runs a simple HTTP server for non-Vite projects
 * Uses Node's built-in http module
 * @param {string} outputDir - Directory to serve
 * @param {boolean} quiet - Suppress output messages
 * @returns {Promise<void>}
 * @param {Object} [overrides] - Dependency overrides for testing
 * @param {typeof http} [overrides.httpModule]
 * @param {typeof fs} [overrides.fsModule]
 * @param {typeof path} [overrides.pathModule]
 * @param {Function} [overrides.openBrowserFn]
 * @param {Function} [overrides.setTimeoutFn]
 * @param {boolean} [overrides.resolveOnStart]
 */
function runSimpleHttpServer(outputDir, quiet, overrides = {}) {
  const {
    httpModule = http,
    fsModule = fs,
    pathModule = path,
    openBrowserFn = openBrowser,
    setTimeoutFn = setTimeout,
    resolveOnStart = false,
  } = overrides;

  return new Promise((resolve, reject) => {
    const PORT = 3000;
    const MIME_TYPES = {
      '.html': 'text/html',
      '.htm': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.glsl': 'text/plain',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.txt': 'text/plain',
    };

    const server = httpModule.createServer((req, res) => {
      // Sanitize the URL to prevent directory traversal
      let filePath = req.url === '/' ? '/index.html' : req.url;

      // Remove query strings
      const queryStringIndex = filePath.indexOf('?');
      if (queryStringIndex !== -1) {
        filePath = filePath.substring(0, queryStringIndex);
      }

      // Resolve the file path
      const fullPath = pathModule.join(outputDir, filePath);

      // Ensure the requested file is within outputDir (prevent directory traversal)
      const resolvedFullPath = pathModule.resolve(fullPath);
      const resolvedOutputDir = pathModule.resolve(outputDir);
      const fullRoot = pathModule.parse(resolvedFullPath).root.toLowerCase();
      const outputRoot = pathModule.parse(resolvedOutputDir).root.toLowerCase();
      const dirWithSep = resolvedOutputDir.endsWith(pathModule.sep)
        ? resolvedOutputDir
        : resolvedOutputDir + pathModule.sep;
      const withinOutputDir =
        resolvedFullPath === resolvedOutputDir || resolvedFullPath.startsWith(dirWithSep);

      if (fullRoot !== outputRoot || !withinOutputDir) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
      }

      // Check if file exists
      fsModule.stat(fullPath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }

        // Determine content type
        const ext = pathModule.extname(fullPath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        // Read and serve the file
        fsModule.readFile(fullPath, (err, data) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
            return;
          }

          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        });
      });
    });

    server.listen(PORT, () => {
      const url = `http://localhost:${PORT}/`;

      if (!quiet) {
        console.log('\nopdl: HTTP server started!');
        console.log(`opdl: Local: ${url}`);
        console.log(`opdl: Serving files from: ${pathModule.basename(outputDir)}`);
        console.log('opdl: Press Ctrl+C to stop the server.\n');
      }

      // Open browser after a short delay to ensure server is ready
      setTimeoutFn(() => {
        openBrowserFn(url);
      }, 500);

      if (resolveOnStart) {
        resolve();
      }
      // Otherwise keep the promise pending to keep the server running
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        if (!quiet) {
          console.error(`opdl: Port ${PORT} is already in use. Please close other applications using this port.`);
        }
        reject(error);
      } else {
        if (!quiet) {
          console.error('opdl: Error starting HTTP server:', error.message);
        }
        reject(error);
      }
    });
  });
}

module.exports = { runDevServer, openBrowser, runViteServer, runSimpleHttpServer };

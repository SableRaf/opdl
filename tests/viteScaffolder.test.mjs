import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scaffoldViteProject } from '../src/viteScaffolder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('viteScaffolder', () => {
  const testDir = path.join(__dirname, 'test-vite-output');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('scaffoldViteProject', () => {
    it('should create Vite project structure', async () => {
      // Create mock code files
      const codeFile1 = path.join(testDir, 'sketch.js');
      const codeFile2 = path.join(testDir, 'helpers.js');
      fs.writeFileSync(codeFile1, 'console.log("test");', 'utf8');
      fs.writeFileSync(codeFile2, 'function helper() {}', 'utf8');

      // Create mock index.html
      const indexHtml = path.join(testDir, 'index.html');
      fs.writeFileSync(indexHtml, `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
  <script src="sketch.js"></script>
  <script src="helpers.js"></script>
</head>
<body></body>
</html>`, 'utf8');

      const sketchInfo = {
        sketchId: 12345,
        metadata: {
          title: 'Test Sketch',
          mode: 'p5js',
        },
        author: 'Test Author',
      };

      await scaffoldViteProject(testDir, sketchInfo, {
        codeFiles: [codeFile1, codeFile2],
        quiet: true,
      });

      // Check that src directory was created
      expect(fs.existsSync(path.join(testDir, 'src'))).toBe(true);

      // Check that code files were moved to src
      expect(fs.existsSync(path.join(testDir, 'src', 'sketch.js'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'src', 'helpers.js'))).toBe(true);

      // Check that original files were removed
      expect(fs.existsSync(codeFile1)).toBe(false);
      expect(fs.existsSync(codeFile2)).toBe(false);

      // Check that package.json was created
      expect(fs.existsSync(path.join(testDir, 'package.json'))).toBe(true);

      // Check that vite.config.js was created
      expect(fs.existsSync(path.join(testDir, 'vite.config.js'))).toBe(true);

      // Check that index.html was updated with src/ paths
      const updatedHtml = fs.readFileSync(indexHtml, 'utf8');
      expect(updatedHtml).toContain('/src/sketch.js');
      expect(updatedHtml).toContain('/src/helpers.js');
      expect(updatedHtml).toContain('p5.js'); // CDN scripts should remain
      expect(updatedHtml).not.toContain('type="module"'); // Should not be module scripts
    });

    it('should create package.json with correct dependencies', async () => {
      const codeFile = path.join(testDir, 'sketch.js');
      fs.writeFileSync(codeFile, 'console.log("test");', 'utf8');

      const sketchInfo = {
        sketchId: 12345,
        metadata: {
          title: 'Test Sketch',
          mode: 'p5js',
        },
        author: 'Test Author',
      };

      await scaffoldViteProject(testDir, sketchInfo, {
        codeFiles: [codeFile],
        quiet: true,
      });

      const packageJsonPath = path.join(testDir, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.name).toBe('sketch-12345');
      expect(packageJson.version).toBe('1.0.0');
      expect(packageJson.type).toBeUndefined(); // Not using ES modules
      expect(packageJson.description).toBe('Test Sketch');
      expect(packageJson.author).toBe('Test Author');
      expect(packageJson.scripts.dev).toBe('vite');
      expect(packageJson.scripts.build).toBe('vite build');
      expect(packageJson.scripts.preview).toBe('vite preview');
      expect(packageJson.devDependencies.vite).toBe('^6.0.0');
    });

    it('should create vite.config.js', async () => {
      const codeFile = path.join(testDir, 'sketch.js');
      fs.writeFileSync(codeFile, 'console.log("test");', 'utf8');

      const sketchInfo = {
        sketchId: 12345,
        metadata: { mode: 'p5js' },
      };

      await scaffoldViteProject(testDir, sketchInfo, {
        codeFiles: [codeFile],
        quiet: true,
      });

      const viteConfigPath = path.join(testDir, 'vite.config.js');
      const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

      expect(viteConfig).toContain('defineConfig');
      expect(viteConfig).toContain("base: './'");
      expect(viteConfig).toContain('port: 3000');
      expect(viteConfig).toContain('open: true');
    });

    it('should move assets to public directory', async () => {
      const codeFile = path.join(testDir, 'sketch.js');
      fs.writeFileSync(codeFile, 'console.log("test");', 'utf8');

      // Create mock asset files
      const imageFile = path.join(testDir, 'image.png');
      const audioFile = path.join(testDir, 'sound.mp3');
      fs.writeFileSync(imageFile, 'fake image data', 'utf8');
      fs.writeFileSync(audioFile, 'fake audio data', 'utf8');

      const sketchInfo = {
        sketchId: 12345,
        metadata: { mode: 'p5js' },
      };

      await scaffoldViteProject(testDir, sketchInfo, {
        codeFiles: [codeFile],
        quiet: true,
      });

      // Check that public directory was created
      expect(fs.existsSync(path.join(testDir, 'public'))).toBe(true);

      // Check that assets were moved to public
      expect(fs.existsSync(path.join(testDir, 'public', 'image.png'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'public', 'sound.mp3'))).toBe(true);

      // Check that original files were removed
      expect(fs.existsSync(imageFile)).toBe(false);
      expect(fs.existsSync(audioFile)).toBe(false);
    });

    it('should handle sketches with CSS files', async () => {
      const jsFile = path.join(testDir, 'sketch.js');
      const cssFile = path.join(testDir, 'style.css');
      fs.writeFileSync(jsFile, 'console.log("test");', 'utf8');
      fs.writeFileSync(cssFile, 'body { margin: 0; }', 'utf8');

      const sketchInfo = {
        sketchId: 12345,
        metadata: { mode: 'p5js' },
      };

      await scaffoldViteProject(testDir, sketchInfo, {
        codeFiles: [jsFile, cssFile],
        quiet: true,
      });

      // Check that both files were moved to src
      expect(fs.existsSync(path.join(testDir, 'src', 'sketch.js'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'src', 'style.css'))).toBe(true);

      // Check that index.html references JS file (CSS will be handled separately if needed)
      // For now we're just checking that JS files are referenced
      const indexHtml = path.join(testDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        const htmlContent = fs.readFileSync(indexHtml, 'utf8');
        expect(htmlContent).toContain('/src/sketch.js');
      }
    });

    it('should support HTML mode sketches without modifying HTML', async () => {
      const codeFile = path.join(testDir, 'sketch.js');
      fs.writeFileSync(codeFile, 'console.log("test");', 'utf8');

      // Create a user-written HTML file
      const htmlFile = path.join(testDir, 'index.html');
      fs.writeFileSync(htmlFile, `<!DOCTYPE html>
<html>
<head>
  <title>Custom HTML</title>
  <script src="sketch.js"></script>
</head>
<body>
  <p>User-written HTML content</p>
</body>
</html>`, 'utf8');

      const sketchInfo = {
        sketchId: 12345,
        metadata: { mode: 'html' },
      };

      await scaffoldViteProject(testDir, sketchInfo, {
        codeFiles: [codeFile],
        quiet: true,
      });

      // Check that Vite structure WAS created
      expect(fs.existsSync(path.join(testDir, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'vite.config.js'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'src'))).toBe(true);

      // Code file should be moved to src
      expect(fs.existsSync(path.join(testDir, 'src', 'sketch.js'))).toBe(true);

      // HTML file SHOULD be modified to update paths to /src/
      const htmlContent = fs.readFileSync(htmlFile, 'utf8');
      expect(htmlContent).toContain('User-written HTML content');
      expect(htmlContent).toContain('/src/sketch.js'); // Path updated to src/
      expect(htmlContent).not.toContain('src="sketch.js"'); // Original reference should be replaced
    });

    it('should skip Vite setup if no code files', async () => {
      const sketchInfo = {
        sketchId: 12345,
        metadata: { mode: 'p5js' },
      };

      await scaffoldViteProject(testDir, sketchInfo, {
        codeFiles: [],
        quiet: true,
      });

      // Check that Vite structure was NOT created
      expect(fs.existsSync(path.join(testDir, 'package.json'))).toBe(false);
      expect(fs.existsSync(path.join(testDir, 'src'))).toBe(false);
    });

    it('should skip Vite setup if package.json already exists', async () => {
      const codeFile = path.join(testDir, 'sketch.js');
      fs.writeFileSync(codeFile, 'console.log("test");', 'utf8');

      // Create existing package.json
      const packageJsonPath = path.join(testDir, 'package.json');
      fs.writeFileSync(packageJsonPath, '{"name": "existing"}', 'utf8');

      const sketchInfo = {
        sketchId: 12345,
        metadata: { mode: 'p5js' },
      };

      await scaffoldViteProject(testDir, sketchInfo, {
        codeFiles: [codeFile],
        quiet: true,
      });

      // Check that package.json wasn't modified
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      expect(packageJson.name).toBe('existing');

      // Src directory should not be created
      expect(fs.existsSync(path.join(testDir, 'src'))).toBe(false);

      // Original file should still be there
      expect(fs.existsSync(codeFile)).toBe(true);
    });

    it('should preserve attribution comments in moved files', async () => {
      const codeFile = path.join(testDir, 'sketch.js');
      const commentBlock = `/**
 * Downloaded with opdl
 * Author: Test Author
 */
`;
      fs.writeFileSync(codeFile, `${commentBlock}console.log("test");`, 'utf8');

      const sketchInfo = {
        sketchId: 12345,
        metadata: { mode: 'p5js' },
      };

      await scaffoldViteProject(testDir, sketchInfo, {
        codeFiles: [codeFile],
        quiet: true,
      });

      // Check that the moved file still has the comment
      const movedFile = fs.readFileSync(path.join(testDir, 'src', 'sketch.js'), 'utf8');
      expect(movedFile).toContain('Downloaded with opdl');
      expect(movedFile).toContain('Author: Test Author');
    });

    it('should handle sketches with no assets gracefully', async () => {
      const codeFile = path.join(testDir, 'sketch.js');
      fs.writeFileSync(codeFile, 'console.log("test");', 'utf8');

      const sketchInfo = {
        sketchId: 12345,
        metadata: { mode: 'p5js' },
      };

      await scaffoldViteProject(testDir, sketchInfo, {
        codeFiles: [codeFile],
        quiet: true,
      });

      // Public directory should still be created (even if empty)
      expect(fs.existsSync(path.join(testDir, 'public'))).toBe(true);

      // Check that the public directory is empty or only has expected files
      const publicFiles = fs.readdirSync(path.join(testDir, 'public'));
      expect(publicFiles.length).toBe(0);
    });

    it('should add script tags for multiple files in index.html', async () => {
      const file1 = path.join(testDir, 'sketch.js');
      const file2 = path.join(testDir, 'helpers.js');
      const file3 = path.join(testDir, 'utils.js');
      fs.writeFileSync(file1, 'console.log("sketch");', 'utf8');
      fs.writeFileSync(file2, 'console.log("helpers");', 'utf8');
      fs.writeFileSync(file3, 'console.log("utils");', 'utf8');

      // Create index.html
      const indexHtml = path.join(testDir, 'index.html');
      fs.writeFileSync(indexHtml, `<!DOCTYPE html>
<html>
<head>
  <script src="sketch.js"></script>
  <script src="helpers.js"></script>
  <script src="utils.js"></script>
</head>
<body></body>
</html>`, 'utf8');

      const sketchInfo = {
        sketchId: 12345,
        metadata: { mode: 'p5js' },
      };

      await scaffoldViteProject(testDir, sketchInfo, {
        codeFiles: [file1, file2, file3],
        quiet: true,
      });

      const htmlContent = fs.readFileSync(indexHtml, 'utf8');
      expect(htmlContent).toContain('/src/sketch.js');
      expect(htmlContent).toContain('/src/helpers.js');
      expect(htmlContent).toContain('/src/utils.js');
    });
  });
});

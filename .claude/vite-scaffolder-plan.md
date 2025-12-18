# Implementation Plan: Add `--vite` Flag for Vite Project Setup

## Issue Reference
GitHub Issue #4: Add `--vite` arg to optionally set up a Vite project in the sketch folder

## Overview
Add a `--vite` flag to the opdl CLI that, when enabled during sketch download, will scaffold a Vite project in the sketch output directory. This will make downloaded sketches ready to run in a modern development environment with hot module reloading, build tooling, and better IDE support.

## User Experience

### Current Behavior
```bash
opdl 1142958
# Creates: sketch_1142958/ with index.html and raw files
```

### New Behavior with --vite Flag
```bash
opdl 1142958 --vite
# Creates: sketch_1142958/ with Vite project structure
```

### Expected Output Structure
```
sketch_1142958/
├── package.json          # Vite dependencies
├── vite.config.js        # Vite configuration
├── index.html            # Modified to work with Vite
├── src/
│   ├── sketch.js         # Main sketch file(s)
│   └── [other code files]
├── public/               # Assets moved here
│   └── [images, sounds, etc.]
├── metadata/
│   ├── metadata.json
│   └── thumbnail.jpg
├── LICENSE
└── OPENPROCESSING.md
```

## Implementation Steps

### 1. CLI Argument Parsing ([cli.js](src/cli.js))

**Location**: `src/cli.js:131-179` (parseOptions function)

**Changes**:
- Add `--vite` boolean flag parsing
- Add `vite` property to ParsedCommand typedef (line 8-26)

**Implementation**:
```javascript
// In ParsedCommand typedef (add to options property):
@property {boolean} [options.vite] - Set up Vite project structure

// In parseOptions function (line ~153):
else if (arg === '--vite') options.vite = true;
```

### 2. Default Options ([index.js](src/index.js))

**Location**: `src/index.js:4-13`

**Changes**:
- Add `vite: false` to defaultOptions

**Implementation**:
```javascript
const defaultOptions = {
  outputDir: null,
  downloadAssets: true,
  downloadThumbnail: true,
  saveMetadata: true,
  addSourceComments: true,
  createLicenseFile: true,
  createOpMetadata: true,
  quiet: false,
  vite: false, // NEW
};
```

### 3. Create Vite Project Scaffolder (NEW FILE)

**File**: `src/viteScaffolder.js`

**Purpose**: Handle all Vite-specific project setup

**Key Functions**:
- `scaffoldViteProject(outputDir, sketchInfo, options)` - Main orchestrator
- `createPackageJson(outputDir, sketchInfo)` - Generate package.json with Vite dependencies
- `createViteConfig(outputDir, sketchInfo)` - Create vite.config.js
- `reorganizeForVite(outputDir, codeFiles)` - Move files to src/ and assets to public/
- `updateIndexHtmlForVite(outputDir, sketchInfo, codeParts)` - Modify HTML for Vite module system
- `createMainEntry(outputDir, codeParts)` - Create main.js entry point if needed

**Dependencies**:
- Node.js `fs`, `path` modules
- `child_process` for running `npm install`

**Key Design Decisions**:

1. **Template Selection**: Use `vanilla` template as base since OpenProcessing sketches are typically vanilla JS
   - For p5.js sketches, keep p5.js loaded via CDN initially (user can migrate to npm later)
   - Document how users can switch to npm-based p5.js if desired

2. **Asset Handling**:
   - Move all assets to `public/` directory
   - Update asset references in code if needed
   - Vite will serve public/ assets at root

3. **Code Organization**:
   - Move all `.js` and `.css` files to `src/`
   - Keep attribution comments
   - Preserve file structure

4. **HTML Transformation**:
   - Keep OpenProcessing compatibility script
   - Keep library CDN links (p5.js, etc.) in HTML
   - Convert script tags to use Vite's module system
   - Add `<script type="module" src="/src/main.js"></script>` as entry point

5. **Package Installation**:
   - Run `npm install` automatically (unless --quiet flag prevents it)
   - Provide clear feedback about installation progress
   - Handle npm install failures gracefully

**Example package.json**:
```json
{
  "name": "sketch-{sketchId}",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^6.0.0"
  }
}
```

**Example vite.config.js**:
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
```

### 4. Integrate Vite Scaffolder into Downloader ([downloader.js](src/downloader.js))

**Location**: `src/downloader.js:127` (end of downloadSketch function)

**Changes**:
- After all files are downloaded, check if `options.vite === true`
- If true, call `scaffoldViteProject(outputDir, sketchInfo, options)`

**Implementation**:
```javascript
// At the end of downloadSketch, before return
if (finalOptions.vite) {
  const { scaffoldViteProject } = require('./viteScaffolder');
  await scaffoldViteProject(outputDir, sketchInfo, {
    codeFiles: savedCodeFiles,
    quiet: finalOptions.quiet,
  });
}

return { outputDir, metadataDir, codeFiles: savedCodeFiles };
```

### 5. Update HTML Generator ([htmlGenerator.js](src/htmlGenerator.js))

**Location**: `src/htmlGenerator.js`

**Changes**:
- Add optional `isVite` parameter to `generateIndexHtml`
- When `isVite` is true, modify HTML structure to work with Vite's module system
- Keep existing behavior when `isVite` is false

**Key Modifications for Vite**:
```javascript
// Add at end of head:
if (isVite) {
  return htmlContent.replace('</head>',
    '    <script type="module" src="/src/main.js"></script>\n</head>');
}
```

### 6. Update Documentation

**Files to Update**:
- [README.md](README.md): Add `--vite` to options table
- [HELP.md](HELP.md): Add `--vite` flag documentation with examples
- [bin/opdl.js](bin/opdl.js): Update help text

**README.md Changes** (around line 88):
```markdown
| `vite` | `false` | Set up a Vite project structure for modern development. |
```

**HELP.md Changes** (around line 117-118):
```markdown
    --skipAssets           Skip downloading asset files
    --vite                 Set up Vite project structure
```

Add new examples section:
```markdown
  # Vite project setup
  opdl 1142958 --vite
  opdl sketch download 1142958 --vite --outputDir ./projects
```

**bin/opdl.js Changes** (around line 117):
```
    --skipAssets           Skip downloading asset files
    --vite                 Set up Vite project structure
```

### 7. Testing Strategy

**New Test File**: `tests/viteScaffolder.test.mjs`

**Test Cases**:
1. Should create Vite project structure when --vite flag is true
2. Should create package.json with correct dependencies
3. Should create vite.config.js
4. Should move code files to src/ directory
5. Should move assets to public/ directory
6. Should update index.html with module script
7. Should preserve attribution comments in moved files
8. Should handle sketches with no assets
9. Should handle sketches with multiple code files
10. Should not run npm install when --quiet flag is set
11. Should maintain backward compatibility (no Vite when flag is false)

**Update Existing Test**: `tests/downloader.test.mjs`
- Add test case for --vite option
- Verify file structure matches Vite expectations
- Mock file system operations for Vite scaffolding

**Update Existing Test**: `tests/index.test.mjs`
- Add integration test for complete download with --vite flag
- Verify end-to-end behavior

## Technical Considerations

### Dependencies
- **No new runtime dependencies**: Vite will be installed as a devDependency in the generated project
- Use only Node.js built-in modules for scaffolding (fs, path, child_process)

### Error Handling
1. If npm install fails, warn user but don't fail the download
2. If directory reorganization fails, rollback or warn user
3. Provide clear error messages for debugging

### Backwards Compatibility
- Default behavior (without --vite) remains unchanged
- Existing tests should continue to pass
- No breaking changes to API or CLI

### Edge Cases to Handle
1. **HTML-mode sketches**: OpenProcessing supports HTML-mode where users write custom HTML. Should we skip Vite setup for these?
   - **Decision**: Skip Vite setup for `metadata.mode === 'html'`, show warning message

2. **Sketches with no code parts**: Some sketches might be HTML-only
   - **Decision**: Skip Vite setup, show warning

3. **Network issues during npm install**: npm might fail
   - **Decision**: Catch error, warn user, leave package.json for manual install

4. **Existing Vite project**: User runs opdl twice on same directory
   - **Decision**: Don't re-scaffold if package.json exists, show message

5. **Asset references in code**: Code might reference assets by path
   - **Decision**: Document this as a potential issue users need to fix manually
   - In the future, could parse and update references automatically

### Performance Considerations
- npm install can be slow, provide progress feedback
- File operations should be atomic where possible
- Consider adding `--vite-skip-install` flag for faster scaffolding without install

## Implementation Order

1. ✅ Create plan document (this file)
2. Add CLI argument parsing in `cli.js`
3. Update default options in `index.js`
4. Create `viteScaffolder.js` with core logic
5. Integrate vite scaffolder into `downloader.js`
6. Update `htmlGenerator.js` for Vite compatibility
7. Write comprehensive tests in `viteScaffolder.test.mjs`
8. Update existing tests for backwards compatibility
9. Update documentation (README.md, HELP.md, bin/opdl.js)
10. Test end-to-end with real sketches
11. Update package.json version (follow semantic versioning)

## Future Enhancements (Out of Scope)

1. **Template Selection**: Add `--vite-template` to choose React, Vue, etc.
2. **npm vs npx**: Allow `--vite-use-npx` to avoid installing Vite locally
3. **TypeScript Support**: Add `--vite-typescript` flag
4. **Auto-migrate p5.js**: Automatically convert CDN p5.js to npm package
5. **Asset Path Rewriting**: Automatically update asset references in code
6. **Hot Reload Config**: Pre-configure p5.js for proper hot reload

## Questions for User

Before implementation, clarify:

1. **npm install behavior**: Should we always run `npm install` automatically, or provide a flag to skip it?
   - **Recommendation**: Run by default, skip when `--quiet` is set, add `--vite-skip-install` flag [OK]

2. **Package manager choice**: Should we detect/support yarn, pnpm, or just use npm?
   - **Recommendation**: Start with npm only, add others in future if requested [OK]

3. **Node version requirement**: opdl requires Node 14+, but Vite 6 requires Node 20+
   - **Recommendation**: Check Node version before scaffolding, show error if too old
   - Alternative: Use older Vite version for compatibility [NO]

4. **Directory structure preference**: Keep metadata/ at root or move inside src/?
   - **Recommendation**: Keep at root since it's not part of the sketch source [OK]

## Success Criteria

- [ ] `opdl 1142958 --vite` creates a working Vite project
- [ ] Running `npm run dev` in the output directory starts development server
- [ ] Sketch runs correctly in the browser with Vite
- [ ] All existing tests pass
- [ ] New tests provide adequate coverage (>80%)
- [ ] Documentation is complete and clear
- [ ] No breaking changes to existing behavior
- [ ] Works with various sketch types (p5.js, Processing.js, vanilla JS)

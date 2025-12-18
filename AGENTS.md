# AGENTS.md

This file provides guidance to coding agents (such as Claude, Codex, or GitHub Copilot) when working with code in this repository.

## Project Overview

**opdl** (OpenProcessing Downloader) is a Node.js CLI tool that downloads OpenProcessing sketches with full metadata preservation, asset downloading, and attribution. It supports both programmatic API usage and command-line operations for sketches, users, and curations.

- **Language**: JavaScript (CommonJS, Node 14+)
- **Entry Points**:
  - CLI: `bin/opdl.js`
  - Programmatic: `src/index.js`
- **Testing**: Vitest with mocked axios/nock for API requests
- **Key Dependencies**: axios (HTTP), sanitize-filename (security)

## Development Commands

### Testing
```bash
npm test                 # Run all tests (Vitest)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

### Local Development
```bash
# Test CLI locally
node bin/opdl.js 2063664

# Install globally for testing
npm link
opdl 2063664

# Unlink when done
npm unlink -g opdl

# View help
opdl --help
```

### Documentation

See the [HELP.md](HELP.md) file for a full list of CLI options and flags.

### Running Single Tests
```bash
# Run a specific test file
npx vitest run tests/downloader.test.mjs

# Run tests matching a pattern
npx vitest run tests/cli

# Watch a specific test file
npx vitest tests/fieldSelector.test.mjs
```

## Architecture

### Core Download Flow

1. **Entry Point** ([src/index.js](src/index.js)) - Main API export, merges options, orchestrates flow
2. **Fetcher** ([src/fetcher.js](src/fetcher.js)) - Calls OpenProcessing API for sketch metadata
3. **Downloader** ([src/downloader.js](src/downloader.js)) - Downloads code, assets, generates HTML
4. **Output Generation** - Creates LICENSE, OPENPROCESSING.md, adds attribution comments

### CLI Architecture

**Command Flow**: `bin/opdl.js` → [src/cli.js](src/cli.js) (parser) → `src/commands/*` (handlers) → API client

**CLI Parser** ([src/cli.js](src/cli.js)):
- Parses args into structured `ParsedCommand` objects
- Supports shortcut syntax: `opdl 2063664` → `opdl sketch download 2063664`
- Handles both `--flag=value` and `--flag value` syntax
- Routes to appropriate command handlers

**Command Handlers** ([src/commands/](src/commands/)):
- `sketch.js` - Download/info for sketches
- `user.js` - User profiles and lists (sketches, followers, following)
- `curation.js` - Curation info and sketch lists
- `fields.js` - Field discovery for API entities

### API Client

**Unified Client** ([src/api/client.js](src/api/client.js)):
- `OpenProcessingClient` class wraps all API endpoints
- Supports optional API key via constructor (env: `OP_API_KEY`)
- Methods: `getSketch()`, `getUser()`, `getUserSketches()`, `getCuration()`, etc.

### Field Selection System

**Field Registry** ([src/fieldRegistry.js](src/fieldRegistry.js)):
- Centralized field definitions for sketch, user, curation entities
- Supports nested field sets (e.g., `user.sketches`, `curation.sketches`)
- Used for field discovery (`opdl fields`) and validation

**Field Selector** ([src/fieldSelector.js](src/fieldSelector.js)):
- `selectFields(data, fields, fieldSetName)` - Extracts specified fields from API responses
- Validates fields against registry (warns on invalid fields)
- Handles `--info all` and `--info field1,field2` syntax

**Output Formatters** ([src/formatters.js](src/formatters.js)):
- `formatAsTable(data, fields)` - ASCII table output
- `formatAsJson(data)` - JSON output
- Used by all info/list commands

### Utilities

**Core Utilities** ([src/utils.js](src/utils.js)):
- `sanitizeFilename()` - Uses `sanitize-filename` package (CRITICAL for security)
- `ensureDirectoryExists()` - Creates directories recursively
- `resolveAssetUrl()` - Constructs full URLs for sketch assets

**HTML Generator** ([src/htmlGenerator.js](src/htmlGenerator.js)):
- Generates `index.html` for downloaded sketches
- Handles p5.js library imports, CSS files, code file references

**Code Attributor** ([src/codeAttributor.js](src/codeAttributor.js)):
- `buildCommentBlock()` - Creates attribution headers for code files
- Includes sketch title, author, license, OpenProcessing link

**License Handler** ([src/licenseHandler.js](src/licenseHandler.js)):
- `createLicenseFile()` - Generates LICENSE file from sketch metadata
- Handles Creative Commons licenses (CC BY-SA, etc.)

**Metadata Writer** ([src/metadataWriter.js](src/metadataWriter.js)):
- `createOpMetadata()` - Generates OPENPROCESSING.md with sketch info
- Saves raw API response as `metadata/metadata.json`

## Key Patterns

### Security-First Design
- **Never bypass `sanitizeFilename()`** - All user-controlled filenames must be sanitized
- **Path traversal prevention** - All output paths use `path.resolve()` and stay within target directory
- **API response validation** - Check for required fields before processing
- No API keys or credentials in code/tests

### Separation of Concerns
- **Core logic** (`src/index.js`, `src/downloader.js`) - Independent of CLI
- **CLI layer** (`src/cli.js`, `src/commands/*`) - Thin wrapper around core API
- **Utilities** (`src/utils.js`) - Reusable, single-purpose functions
- **Formatters/Selectors** - Isolated presentation logic

### Testing Philosophy
- Tests use Vitest with ES modules (`.mjs` files ONLY. No CommonJS in tests)
- Mock external APIs with `nock` for HTTP, axios mocks for API client
- Tests should fail before fixes (red-green-refactor)
- Coverage includes edge cases: hidden sketches, missing files, API errors
- Test files mirror source structure: `tests/downloader.test.mjs` tests `src/downloader.js`

## Common Development Tasks

### Adding a New CLI Command
1. Add command parsing logic to [src/cli.js](src/cli.js) `parseArgs()`
2. Create handler in `src/commands/*.js` (or add to existing)
3. Call API client methods from [src/api/client.js](src/api/client.js)
4. Use field selector/formatters for output
5. Add tests in `tests/cli.test.mjs`

### Adding a New API Endpoint
1. Add method to `OpenProcessingClient` class in [src/api/client.js](src/api/client.js)
2. Add JSDoc type definitions if new entity (see [src/types/api.js](src/types/api.js))
3. Register field set in [src/fieldRegistry.js](src/fieldRegistry.js) if needed
4. Update command handlers to use new endpoint

### Adding a New Field Set
1. Add field definitions to [src/fieldRegistry.js](src/fieldRegistry.js)
2. Register with `fieldRegistry.register()`
3. Update `opdl fields` output (automatic via registry)
4. Add tests for field validation in `tests/fieldSelector.test.mjs`

## Output Structure

Downloaded sketches create this structure:
```
sketch_{id}/
├── index.html              # Generated HTML entry point
├── sketch.js               # Code files with attribution comments
├── [assets]/               # Images, sounds, data files
├── LICENSE                 # Creative Commons or other license
├── OPENPROCESSING.md       # Human-readable metadata
└── metadata/
    ├── metadata.json       # Raw API response
    └── thumbnail.jpg       # Visual thumbnail (if enabled)
```

## Important Files

- [src/index.js](src/index.js) - Main programmatic API entry point
- [src/downloader.js](src/downloader.js) - Core download orchestration
- [src/api/client.js](src/api/client.js) - Unified API client (all endpoints)
- [src/cli.js](src/cli.js) - CLI argument parser
- [src/commands/](src/commands/) - Command handlers (sketch, user, curation, fields)
- [src/fieldRegistry.js](src/fieldRegistry.js) - Field definitions for all entities
- [src/fieldSelector.js](src/fieldSelector.js) - Field extraction from API responses
- [src/formatters.js](src/formatters.js) - Output formatting (table, JSON)
- [src/utils.js](src/utils.js) - Core utilities (CRITICAL: filename sanitization)

## Non-Negotiable Requirements (from Code Review Guidelines)

1. **Library-Oriented**: Shared modules for validation, sanitization, HTML generation, asset handling
2. **Security-First**: Never relax path traversal, filename sanitization, or API validation checks
3. **Attribution & Licensing**: Always preserve sketch licensing, generate attribution comments and LICENSE files
4. **Testing Mindset**: New features require tests; existing tests must fail before fixes

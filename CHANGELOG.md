# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Complete API Client**: New `OpenProcessingClient` class with all 14 documented API endpoints
  - Sketch endpoints: `getSketch()`, `getSketchCode()`, `getSketchFiles()`, `getSketchLibraries()`, `getSketchForks()`, `getSketchHearts()`
  - User endpoints: `getUser()`, `getUserSketches()`, `getUserFollowers()`, `getUserFollowing()`, `getUserHearts()`
  - Curation endpoints: `getCuration()`, `getCurationSketches()`
  - Tag endpoint: `getTags()`
- **HTTP 429 Rate Limit Detection**: Automatic detection with descriptive error messages including retry guidance
- **DownloadService**: New service layer for orchestrating multi-call sketch downloads
- **Public API Exports**: `OpenProcessingClient` and `downloadSketch` now exported from main module
- **Type Definitions**: Comprehensive JSDoc types for all API entities (Sketch, User, Curation, etc.)
- **Centralized Validation**:
  - `validateListOptions()` for pagination parameters (limit, offset, sort)
  - `validateTagsOptions()` for tag duration parameters
  - Enhanced error messages with retry guidance

### Changed
- **Architecture**: Reorganized codebase into layered structure
  - `src/api/` - API client and validation
  - `src/download/` - Download service and utilities
  - `src/cli/` - CLI parser and commands
- **OpenProcessingClient Constructor**: Now accepts optional API key for authenticated requests
- **Error Handling**: More descriptive error messages for private/hidden sketches and rate limits

### Improved
- **Test Coverage**: Added 71 new tests (297 → 368 total)
  - 35 tests for API client methods
  - 14 tests for DownloadService orchestration
  - 22 tests for new validation functions
- **Code Organization**: Clear separation of concerns between API, service, and CLI layers
- **Backward Compatibility**: All existing functionality preserved through re-exports

### Technical Details
- API client uses axios with response interceptors for centralized error handling
- Service layer implements graceful degradation for optional data (files, libraries, parent sketches)
- Validation layer returns structured `ValidationResult` objects with retry hints
- All imports updated to reflect new directory structure
- Maintained CommonJS module system (Node.js >= 14.0.0)

### Developer Notes
The refactoring establishes a clean three-layer architecture:
1. **API Layer** (`src/api/`): Direct 1:1 mapping to OpenProcessing API endpoints
2. **Service Layer** (`src/download/`): Orchestrates multiple API calls for complex operations
3. **CLI Layer** (`src/cli/`): Command-line interface and user interaction

This architecture enables:
- Direct API access via `OpenProcessingClient` for custom integrations
- Higher-level operations via `DownloadService` for common workflows
- Simple CLI usage via `opdl` command for end users

## [0.4.3] - Previous Release
- Previous version baseline

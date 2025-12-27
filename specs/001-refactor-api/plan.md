# Implementation Plan: OpenProcessing API Architecture Refactor

**Branch**: `001-refactor-api` | **Date**: 2025-12-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-refactor-api/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor the OpenProcessing API architecture to provide complete coverage of all 14 API endpoints, eliminate redundancy between client.js and fetcher.js by establishing a single source of truth for API calls, centralize validation logic, and reorganize the codebase into clear layers (api/, download/, cli/). This refactor maintains 100% backward compatibility while improving maintainability and enabling future feature additions like authentication and write operations.

## Technical Context

**Language/Version**: JavaScript (Node.js >= 14.0.0, CommonJS)
**Primary Dependencies**: axios (^1.7.7) for HTTP requests, sanitize-filename (^1.6.3) for filesystem safety
**Storage**: Local filesystem for downloaded sketches, no database
**Testing**: Vitest (^4.0.16) with nock (^14.0.10) for HTTP mocking, coverage via @vitest/coverage-v8
**Target Platform**: Cross-platform CLI (Linux, macOS, Windows) + npm library
**Project Type**: Single project (CLI + library)
**Performance Goals**: API call latency must not increase >5% from current baseline, maintain existing download speed
**Constraints**: No breaking changes to public API, maintain >90% test coverage, no new npm dependencies
**Scale/Scope**: ~20 source files currently, refactoring to organized structure with 3 main directories (api/, download/, cli/)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Library-First Architecture ✅ PASS

**Requirement**: Separate API layer (client) from business logic (services) from presentation (CLI)

**This Feature**:
- Creates clear `src/api/` layer with client.js (1:1 API mapping) and validator.js (centralized validation)
- Establishes `src/download/` service layer for orchestrating multi-call operations
- Maintains `src/cli/` presentation layer as thin wrapper consuming library functions
- Preserves public API exports in `src/index.js` for backward compatibility

**Status**: ✅ Aligns perfectly - this refactor enforces the layered architecture

### II. CLI-Centric Interface ✅ PASS

**Requirement**: Primary use case is download (`opdl <sketchId>`), extended capabilities via subcommands

**This Feature**:
- Maintains existing download workflow unchanged (backward compatibility)
- Enhances CLI subcommands by exposing new API capabilities (user hearts, sketch forks, tags)
- No changes to command-line interface or output format
- All new functionality additive, not breaking

**Status**: ✅ Preserves existing CLI behavior while enabling future enhancements

### III. Data Integrity & Attribution ✅ PASS

**Requirement**: Preserve creator attribution, licensing, and metadata in downloads

**This Feature**:
- Does not modify download content generation (attribution, licenses, metadata)
- Changes only HOW data is fetched (client layer), not WHAT is saved
- Download service maintains same `sketchInfo` structure for content generators

**Status**: ✅ No impact - refactor is internal to data fetching, not content generation

### IV. Graceful Degradation ✅ PASS

**Requirement**: Downloads succeed with maximum available data, structured errors

**This Feature**:
- Centralizes validation in `validator.js` for consistent error handling
- Maintains existing error recovery patterns in download orchestration
- No changes to retry logic or timeout configuration

**Status**: ✅ Improves consistency of error handling through centralized validation

### V. Test Coverage & Quality ✅ PASS

**Requirement**: >85% test coverage, new features should include tests

**This Feature**:
- Requires maintaining >90% coverage (stricter than constitution minimum)
- All refactored modules must have corresponding test files
- Uses existing test infrastructure (Vitest + nock)

**Status**: ✅ Meets and exceeds coverage requirements

### Overall Gate Result: ✅ PASS

All constitution principles are satisfied. No violations require justification.

---

## Constitution Check - Post-Design Re-Evaluation

*Re-evaluated after Phase 1 design completion (research, data model, contracts, quickstart)*

### I. Library-First Architecture ✅ PASS (CONFIRMED)

**Design Validation**:
- API layer (`src/api/`): client.js provides 14 methods with 1:1 API mapping ✓
- Service layer (`src/download/`): service.js orchestrates multi-call operations ✓
- CLI layer (`src/cli/`): commands consume service, not direct API ✓
- Public API (`src/index.js`): Exports opdl() function and OpenProcessingClient ✓

**Contracts Review**: [contracts/client-methods.md](contracts/client-methods.md) shows clean separation

**Status**: ✅ Design enforces layered architecture with proper boundaries

### II. CLI-Centric Interface ✅ PASS (CONFIRMED)

**Design Validation**:
- Primary download use case (`opdl <sketchId>`) remains unchanged ✓
- New API endpoints available but not required for core workflow ✓
- CLI can optionally expose new features (getUserHearts, getTags) without breaking existing commands ✓

**Backward Compatibility**: [quickstart.md](quickstart.md) Phase 4 verifies identical CLI behavior

**Status**: ✅ Design preserves CLI simplicity while enabling future enhancements

### III. Data Integrity & Attribution ✅ PASS (CONFIRMED)

**Design Validation**:
- SketchInfo structure unchanged from current fetchSketchInfo() ✓
- Content generators (htmlGenerator, codeAttributor, licenseHandler) not modified ✓
- Service layer just changes HOW data is fetched, not WHAT is saved ✓

**Data Model Review**: [data-model.md](data-model.md) SketchInfo maintains all attribution fields

**Status**: ✅ Design does not impact attribution or licensing preservation

### IV. Graceful Degradation ✅ PASS (CONFIRMED)

**Design Validation**:
- ValidationResult includes `canRetry` field for transient errors ✓
- Service layer handles partial failures (parent sketch unavailable) ✓
- Centralized validation provides consistent error messages ✓
- Download succeeds with maximum available data (files, libraries optional) ✓

**Error Handling**: [contracts/client-methods.md](contracts/client-methods.md) documents consistent error flow

**Status**: ✅ Design improves error handling consistency through centralized validation

### V. Test Coverage & Quality ✅ PASS (CONFIRMED)

**Design Validation**:
- Quickstart includes test examples for all new methods ✓
- Test structure mirrors source structure (tests/api/, tests/download/, tests/cli/) ✓
- Uses existing Vitest + nock infrastructure ✓
- Coverage requirement maintained at >90% (exceeds constitution's >85%) ✓

**Testing Strategy**: [quickstart.md](quickstart.md) provides comprehensive test examples

**Status**: ✅ Design includes testing strategy that meets and exceeds requirements

### Overall Post-Design Result: ✅ PASS

All five constitution principles remain satisfied after design phase. The design artifacts (research.md, data-model.md, contracts/, quickstart.md) demonstrate:

1. Clear layered architecture with proper separation
2. Backward compatibility maintained
3. Attribution and licensing preservation
4. Improved error handling and graceful degradation
5. Comprehensive testing strategy

**Ready to proceed to Phase 2 (Task Generation)**: No design changes required.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── api/                    # API layer (NEW - organized)
│   ├── client.js          # OpenProcessingClient class (1:1 API mapping)
│   ├── validator.js       # Centralized validation functions
│   └── types.js           # JSDoc type definitions for API entities
│
├── download/              # Download service layer (NEW - organized)
│   ├── service.js         # Download orchestration service
│   ├── downloader.js      # Main download logic (refactored)
│   ├── htmlGenerator.js   # HTML content generation (moved)
│   ├── codeAttributor.js  # Attribution comments (moved)
│   ├── licenseHandler.js  # License file generation (moved)
│   ├── metadataWriter.js  # Metadata JSON/MD generation (moved)
│   ├── serverRunner.js    # Dev server for --run flag (moved)
│   └── viteScaffolder.js  # Vite scaffold for --vite flag (moved)
│
├── cli/                   # CLI presentation layer (NEW - organized)
│   ├── index.js           # Main CLI router (moved from cli.js)
│   ├── formatters.js      # Output formatters (moved)
│   ├── fields.js          # Field registry + selector (merged)
│   └── commands/          # Command handlers
│       ├── sketch.js      # Sketch commands (moved)
│       ├── user.js        # User commands (moved)
│       └── curation.js    # Curation commands (moved)
│
├── index.js               # Public API entry point (STAYS AT ROOT)
├── utils.js               # Shared utilities (STAYS AT ROOT)
└── fetcher.js             # DEPRECATED - will have re-exports with warnings

tests/
├── api/                   # API layer tests
│   ├── client.test.mjs
│   └── validator.test.mjs
├── download/              # Download service tests
│   ├── service.test.mjs
│   └── downloader.test.mjs
└── cli/                   # CLI tests
    └── commands/
        ├── sketch.test.mjs
        ├── user.test.mjs
        └── curation.test.mjs
```

**Structure Decision**: Single project with 3-layer architecture (api/, download/, cli/). This matches the "Library-First Architecture" principle from the constitution. Root-level index.js and utils.js remain for backward compatibility. Tests mirror source structure for maintainability.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all gates passed. This section is not applicable.

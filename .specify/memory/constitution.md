# opdl Constitution

<!--
Sync Impact Report:
Version: 1.1.0 (Scope Expansion Update)
Modified Principles:
  - I. Library-First Architecture - Expanded to clarify API wrapper role
  - II. CLI-Centric Interface - Updated to reflect full CLI capabilities
Added Sections: None
Removed Sections: None
Templates Status:
  ✅ plan-template.md - Aligned (Constitution Check section references this file)
  ✅ spec-template.md - Aligned (Requirements section compatible)
  ✅ tasks-template.md - Aligned (Test-optional approach matches principle V)
Follow-up TODOs: None
-->

## Core Principles

### I. Library-First Architecture

opdl is a library providing both programmatic access and CLI interfaces to the OpenProcessing API. Every feature must:

- Separate API layer (client) from business logic (services) from presentation (CLI)
- Provide clean programmatic API via `require('opdl')` for the primary download use case
- Maintain 1:1 mapping between OpenProcessing API endpoints and client methods
- Use centralized validation layer for all API responses and inputs
- Expose CLI functionality as a thin wrapper that consumes library functions
- Maintain backward compatibility for the public API (`index.js` exports)

**Rationale:** Clear separation of concerns enables opdl to serve as both a standalone CLI tool and an embeddable library. The client layer provides complete API coverage, while services orchestrate complex operations like sketch downloads.

### II. CLI-Centric Interface

The CLI provides comprehensive access to OpenProcessing API functionality:

- **Primary use case:** Download sketches with `opdl <sketchId>` (zero-config convenience)
- **Extended capabilities:** Query users, sketches, curations via subcommands (`opdl sketch info`, `opdl user sketches`)
- Commands follow standard UNIX conventions (stdin/args → stdout, errors → stderr)
- Support both human-readable and machine-readable output (`--json` flag)
- Provide helpful error messages with actionable guidance
- Default to sensible behaviors (auto-naming directories, including metadata, showing relevant fields)
- Optional flags enhance rather than complicate the base experience

**Rationale:** opdl serves dual purposes: simple sketch downloading for beginners and comprehensive API exploration for power users. The CLI must remain intuitive for the common case while exposing full API capabilities.

### III. Data Integrity & Attribution

Every sketch download must preserve creator attribution and licensing:

- Attribution comments MUST be prepended to all code files (unless explicitly disabled)
- LICENSE files MUST be generated when license information is available
- Metadata MUST be preserved in both structured (JSON) and human-readable (Markdown) formats
- Original sketch URLs and author information MUST be retained
- No modification of original code beyond attribution comments

**Rationale:** Respect for creators is non-negotiable. OpenProcessing is a community platform, and opdl must honor authorship and licenses.

### IV. Graceful Degradation

Downloads should succeed with maximum available data, even when partial failures occur:

- Asset download failures log warnings but do not abort the operation
- Missing optional metadata fields do not prevent download completion
- Network retries and timeouts are configured reasonably
- Errors are structured and informative (API errors, validation errors, filesystem errors distinguished)
- Private sketches and hidden code are detected early with clear error messages

**Rationale:** Real-world usage involves unreliable networks, incomplete API responses, and edge cases. Robust error handling improves user trust.

### V. Test Coverage & Quality

Code quality is maintained through comprehensive testing:

- New features SHOULD include tests (unit, integration, or both)
- Bug fixes MUST include regression tests
- Test coverage target: >85% (monitored via `npm run test:coverage`)
- Tests use realistic mock data from OpenProcessing API responses
- Manual testing required for CLI output formatting and dev server features

**Rationale:** Tests prevent regressions and document expected behavior. However, tests are not mandatory for every change (e.g., documentation, formatting) to avoid bureaucratic overhead.

## Developer Workflow

### Code Organization

opdl follows a layered architecture with clear separation of concerns:

- **src/api/**: OpenProcessing API client (`client.js`), validation (`validator.js`), and types (`types.js`)
  - 1:1 mapping to OpenProcessing REST API endpoints
  - Centralized response validation and error handling
  - No business logic, pure API wrapper

- **src/download/**: Sketch download feature (service layer + content generators)
  - `service.js`: Orchestrates multiple API calls to aggregate sketch data
  - `downloader.js`: Main download orchestration
  - Content generators: HTML, attribution, license, metadata
  - Dev tools: server runner (`--run`), Vite scaffolder (`--vite`)

- **src/cli/**: Command-line interface infrastructure
  - Main CLI router (`index.js`)
  - Field management (registry, selector, definitions) for customizable output
  - Output formatters (human-readable and JSON)
  - Command handlers (`commands/`): sketch, user, curation

- **Root exports** (`src/index.js`, `src/utils.js`): Public API maintains backward compatibility

Files are grouped by feature/layer to improve discoverability and maintainability. The architecture prevents circular dependencies and enables isolated testing.

### Refactoring Guidelines

- Maintain backward compatibility for public API (`opdl()` function)
- Use re-exports temporarily when reorganizing internal modules
- Update tests to mirror source structure (`tests/api/`, `tests/download/`, `tests/cli/`)
- Document breaking changes in CHANGELOG with migration guidance

### Adding New Features

Follow these guidelines based on feature type:

**For New OpenProcessing API Endpoints:**
1. Add endpoint method to `src/api/client.js` (1:1 mapping)
2. Add response validation to `src/validator.js`
3. Add JSDoc types to `src/api/types.js`
4. Write client tests in `tests/api/client.test.mjs`
5. Optionally expose via CLI command in `src/cli/commands/`

**For Download Enhancements:**
1. Evaluate if it requires new API data (add to service layer)
2. Add orchestration logic to `src/download/service.js`
3. Add file generation/processing to appropriate content generator
4. Update `src/download/downloader.js` if orchestration changes
5. Write service tests in `tests/download/service.test.mjs`

**For CLI Enhancements:**
1. Add command handler to `src/cli/commands/` or extend existing
2. Add field definitions to `src/cli/fields.js` for new data types
3. Update formatters in `src/cli/formatters.js` if needed
4. Write CLI tests in `tests/cli/commands/`
5. Update HELP.md with usage examples

**General Requirements:**
- Write tests covering success paths and expected error cases
- Update documentation (README, HELP.md) with examples
- Maintain backward compatibility for public API

## Security & Privacy

- No user credentials or API keys are stored
- Network requests use HTTPS (HTTP auto-upgraded)
- No telemetry or analytics data collected
- Downloaded content written to user-specified directories only
- Sanitize filenames to prevent directory traversal attacks
- Validate API responses to prevent code injection via malicious metadata

## Governance

This constitution serves as the authoritative guide for opdl development. All code reviews, feature proposals, and architectural decisions must align with these principles.

**Amendment Process:**
- Proposals must include rationale and impact assessment
- Breaking changes to core principles require major version bump
- New principles or sections warrant minor version bump
- Clarifications and wording improvements are patch-level changes

**Compliance:**
- Pull requests should reference relevant principles when applicable
- Deviations from principles require explicit justification in PR description
- Maintainers may challenge implementations that violate core principles

**Version**: 1.1.0 | **Ratified**: 2025-12-27 | **Last Amended**: 2025-12-27

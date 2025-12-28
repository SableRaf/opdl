# Research: OpenProcessing API Architecture Refactor

**Feature Branch**: `001-refactor-api`
**Date**: 2025-12-27

## Overview

This document consolidates architectural research and decisions for refactoring the OpenProcessing API client architecture. Since all technical context was clear from the spec (no NEEDS CLARIFICATION items), this research focuses on existing patterns, best practices, and design decisions.

## Current State Analysis

### Existing Architecture Patterns

**Client Layer** (`src/api/client.js`):
- Already partially implemented with OpenProcessingClient class
- Uses axios with baseURL configuration and optional auth headers
- Implements 7 of 14 endpoints (getSketch, getSketchCode, getSketchFiles, getSketchLibraries, getUser, getUserSketches, getCuration)
- Calls validator functions but doesn't validate all responses consistently
- Missing: getUserFollowers, getUserFollowing, getUserHearts, getSketchForks, getSketchHearts, getCurationSketches, getTags

**Fetcher Layer** (`src/fetcher.js`):
- Legacy implementation that makes direct axios calls
- Implements fetchSketchInfo() which aggregates multiple API calls
- Has its own error handling separate from client
- Creates the sketchInfo structure used by download logic
- **Problem**: Duplicates HTTP logic from client.js

**Validator Layer** (`src/validator.js`):
- Centralized validation with VALIDATION_REASONS and standard MESSAGES
- Provides validateSketch(), validateUser(), validateCuration()
- Returns structured ValidationResult with {valid, reason, message, data, canRetry}
- Missing: validateListOptions(), validateTagsOptions(), validation for new endpoints

**Current Issues Identified**:
1. Redundancy: Both client.js and fetcher.js make HTTP calls
2. Incomplete API coverage: 7/14 endpoints implemented in client
3. Inconsistent validation: Some endpoints validate, some don't
4. Business logic in fetcher: fetchSketchInfo() mixes API calls with orchestration
5. Flat file structure: 17 files at src/ root makes navigation difficult

## Architectural Decisions

### Decision 1: Three-Layer Architecture

**Decision**: Organize code into api/, download/, cli/ directories with clear separation of concerns

**Rationale**:
- Aligns with "Library-First Architecture" constitution principle
- Prevents circular dependencies and improves testability
- Makes codebase easier to navigate for new contributors
- Supports future growth (authentication, write operations)

**Alternatives Considered**:
- Keep flat structure: Rejected because it doesn't scale and violates constitution
- Feature-based folders: Rejected because opdl is primarily organized by technical layer, not business features
- Monorepo with packages: Rejected as over-engineering for a single-package project

### Decision 2: Service Layer Pattern

**Decision**: Create `src/download/service.js` to orchestrate multi-call operations, replacing fetcher.js business logic

**Rationale**:
- Separates "how to call API" (client) from "what data to aggregate" (service)
- Enables reuse of orchestration logic in both CLI and programmatic API
- Service layer can compose multiple client calls without knowing HTTP details
- Maintains backward compatibility by keeping same sketchInfo structure

**Pattern**:
```javascript
// Service orchestrates client calls
class DownloadService {
  constructor(client) {
    this.client = client;
  }

  async getCompleteSketchInfo(id) {
    const sketch = await this.client.getSketch(id);
    const code = await this.client.getSketchCode(id);
    const files = await this.client.getSketchFiles(id);
    const libraries = await this.client.getSketchLibraries(id);
    const author = await this.client.getUser(sketch.userId);

    // If fork, fetch parent
    if (sketch.parentVisualId) {
      const parent = await this.client.getSketch(sketch.parentVisualId);
      const parentAuthor = await this.client.getUser(parent.userId);
      // ...
    }

    return {
      sketchId: id,
      author: author.username,
      title: sketch.title,
      codeParts: code,
      files,
      libraries,
      metadata: sketch,
      parent: { /* ... */ }
    };
  }
}
```

**Alternatives Considered**:
- Keep orchestration in downloader.js: Rejected because downloader should handle file I/O, not API orchestration
- Put orchestration in client: Rejected because client should be 1:1 with API endpoints
- Create separate aggregator module: Rejected as "service" is more conventional naming for business logic layer

### Decision 3: Centralized Validation

**Decision**: All API response and request validation goes through `src/api/validator.js`

**Rationale**:
- Single source of truth for validation rules and error messages
- Consistent error handling across all API operations
- Easy to update validation when OpenProcessing API changes
- Prevents duplicated validation logic

**New Validation Functions Required**:
- `validateListOptions(options)`: Validate limit, offset, sort parameters
- `validateTagsOptions(options)`: Validate tags endpoint options (duration, limit)
- Extend `validateSketch()` to handle code responses (already partially done)

**Alternatives Considered**:
- Validation in each client method: Rejected as it leads to duplication and inconsistency
- No validation, trust API: Rejected because it makes debugging harder and violates graceful degradation principle
- JSON Schema validation: Rejected as adding a dependency; JSDoc + manual validation sufficient for current needs

### Decision 4: Backward Compatibility Strategy

**Decision**: Use re-exports and deprecation warnings during transition

**Approach**:
1. Create new organized structure (api/, download/, cli/)
2. Keep old files as re-exports with deprecation warnings
3. Update internal imports to use new locations
4. Document migration path in CHANGELOG
5. Remove deprecated re-exports in next major version

**Example**:
```javascript
// src/fetcher.js (deprecated re-export)
const { DownloadService } = require('./download/service');
console.warn('WARNING: fetcher.js is deprecated. Use src/download/service.js instead.');
module.exports = { fetchSketchInfo: /* wrap new service */ };
```

**Rationale**:
- Maintains public API compatibility (requirement)
- Gives users time to migrate
- Enables gradual rollout rather than big-bang refactor

**Alternatives Considered**:
- Immediate removal: Rejected as it breaks backward compatibility
- Permanent re-exports: Rejected as it prevents cleanup and maintains technical debt
- Dual implementation: Rejected as it doubles maintenance burden

### Decision 5: JSDoc for Type Safety

**Decision**: Use comprehensive JSDoc type annotations instead of converting to TypeScript

**Rationale**:
- No new dependencies or build step required
- Existing codebase already uses JSDoc patterns
- Provides IDE autocomplete and type checking
- Sufficient type safety for current project size
- Can convert to TypeScript later if needed

**Type Definitions Required**:
- API entities: Sketch, User, Curation, Tag
- List items: UserSketchItem, SketchForkItem, UserFollowerItem, etc.
- Options: ListOptions, TagsOptions
- Validation: ValidationResult (already exists)

**Alternatives Considered**:
- Convert to TypeScript: Rejected as out of scope for this refactor, adds complexity
- No types: Rejected as it reduces developer experience and increases bugs
- Flow: Rejected as less popular than JSDoc/TypeScript, additional dependency

## Best Practices Research

### Error Handling Patterns

**Current Pattern**: validator.js returns `{valid, reason, message, data, canRetry}`

**Best Practice**: Continue using structured error results rather than throwing exceptions for expected errors

**Rationale**:
- Distinguishes between "sketch is private" (expected) vs "network timeout" (exceptional)
- Enables graceful degradation (constitution principle IV)
- Caller can decide how to handle (throw, log, retry, fallback)

**Implementation**:
- Client methods throw Error for unexpected failures (network, invalid response)
- Client methods throw Error with validation.message for expected API errors (private, not found)
- Service methods return rich objects with error information
- CLI layer presents errors to user

### REST API Client Patterns

**Pattern Identified**: 1:1 mapping between API endpoints and client methods

**OpenProcessing API Structure**:
- `/api/sketch/{id}` → `getSketch(id)`
- `/api/sketch/{id}/code` → `getSketchCode(id)`
- `/api/user/{id}` → `getUser(id)`
- `/api/user/{id}/sketches` → `getUserSketches(id, options)`

**Best Practice**: Maintain this 1:1 mapping, don't combine or split endpoints in client

**Rationale**:
- Makes client predictable and easy to understand
- Direct correspondence to API documentation
- Service layer handles combining multiple calls
- Future API changes map clearly to client changes

### Testing Strategy

**Current Setup**: Vitest + nock for HTTP mocking

**Best Practice Approach**:
1. **Unit tests** for validator.js (pure functions, no I/O)
2. **Integration tests** for client.js (mock HTTP with nock)
3. **Integration tests** for service.js (mock client methods)
4. **E2E tests** for CLI (mock API responses, verify output)

**Coverage Requirements**:
- Maintain >90% coverage (stricter than constitution's >85%)
- Test both success paths and error cases
- Use realistic mock data from actual OpenProcessing API responses

### File Organization

**Examined Patterns**:
- **By layer**: api/, services/, cli/ (chosen)
- **By feature**: sketch/, user/, curation/
- **By type**: models/, controllers/, views/

**Decision**: Layer-based organization

**Rationale**:
- opdl is a thin wrapper around a REST API, naturally organized by technical layer
- Feature-based would create more directories with fewer files each
- Layer-based aligns with "Library-First Architecture" principle

## Migration Strategy

### Phase Approach

**Phase 1: API Layer** (Foundation)
- Complete client.js with all 14 endpoints
- Add missing validation functions
- Create comprehensive JSDoc types
- Move to src/api/ directory
- Write tests for new endpoints

**Phase 2: Service Layer** (Orchestration)
- Create download service
- Migrate fetchSketchInfo logic
- Update downloader.js to use service
- Deprecate fetcher.js with re-exports

**Phase 3: CLI Layer** (Reorganization)
- Move CLI files to src/cli/
- Merge fieldRegistry + fieldSelector
- Organize commands/ subdirectory
- Update imports

**Phase 4: Cleanup** (Finalization)
- Update all internal imports
- Run full test suite
- Update documentation
- Verify backward compatibility

**Rationale**: Bottom-up approach (API → Service → CLI) ensures each layer builds on solid foundation

## Technology Stack Summary

**Current Stack** (no changes):
- **Runtime**: Node.js >= 14.0.0
- **HTTP Client**: axios ^1.7.7
- **Testing**: Vitest ^4.0.16 + nock ^14.0.10
- **Utilities**: sanitize-filename ^1.6.3

**Architecture Patterns**:
- Three-layer architecture (API, Service, CLI)
- Centralized validation
- Service layer for orchestration
- JSDoc for type safety
- Structured error handling

**No New Dependencies**: Refactor uses existing tools and patterns

## Future Considerations

### Authentication Layer Design

**Current**: apiKey parameter in OpenProcessingClient constructor (prepared but not used)

**Future**: Token-based auth for write operations
- Constructor already supports optional apiKey
- Axios instance already includes auth headers conditionally
- Just needs token management (storage, refresh) when write endpoints are added

### Write Operations Support

**Prepared For**:
- Client can support POST/PATCH/DELETE by adding methods
- Validator can extend to request body validation
- Service layer can orchestrate write operations
- Error handling already supports permission errors (401, 403)

**Not Blocking This Refactor**: Write operations are future enhancement, foundation being laid now

## Conclusion

All architectural decisions align with constitution principles and existing patterns. No NEEDS CLARIFICATION items remain. Ready to proceed to Phase 1 (Design & Contracts).

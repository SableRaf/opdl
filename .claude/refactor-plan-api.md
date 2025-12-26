# OpenProcessing API Architecture Refactor Plan

## Executive Summary

This plan addresses redundancy between `client.js` and `fetcher.js`, improves alignment with the OpenProcessing API structure, centralizes input validation, and promotes DRY principles throughout the codebase.

## Current Architecture Analysis

### Current State

**client.js** (`src/api/client.js`)
- Provides clean API wrapper with `OpenProcessingClient` class
- Methods map 1:1 to OpenProcessing API endpoints
- Uses centralized validation from `validator.js`
- Currently used by: CLI commands (`sketch.js`, `user.js`, `curation.js`)
- **Currently supports 10 out of 14 API endpoints:**
  - ✅ `GET /api/user/:id` → `getUser()`
  - ✅ `GET /api/user/:id/sketches` → `getUserSketches()`
  - ✅ `GET /api/user/:id/followers` → `getUserFollowers()`
  - ✅ `GET /api/user/:id/following` → `getUserFollowing()`
  - ✅ `GET /api/sketch/:id` → `getSketch()`
  - ✅ `GET /api/sketch/:id/code` → `getSketchCode()`
  - ✅ `GET /api/sketch/:id/files` → `getSketchFiles()`
  - ✅ `GET /api/sketch/:id/libraries` → `getSketchLibraries()`
  - ✅ `GET /api/curation/:id` → `getCuration()`
  - ✅ `GET /api/curation/:id/sketches` → `getCurationSketches()`
- **Missing endpoints (4):**
  - ❌ `GET /api/user/:id/hearts`
  - ❌ `GET /api/sketch/:id/forks`
  - ❌ `GET /api/sketch/:id/hearts`
  - ❌ `GET /api/tags`

**fetcher.js** (`src/fetcher.js`)
- High-level orchestration for sketch downloads
- `fetchSketchInfo()`: Aggregates multiple API calls into single sketch object
- `fetchUserInfo()`: Simple user data fetcher (duplicates client functionality)
- Uses low-level `fetchData()` helper with axios
- Currently used by: `index.js` (main download flow), `downloader.js`
- **Redundancy:** Direct axios calls instead of using `OpenProcessingClient`
- **Validation:** Mixes validation with data fetching logic

### Redundancy Issues

1. **Duplicate HTTP Logic**
   - `fetcher.js` uses `axios.get()` directly
   - `client.js` uses `axios.create()` with configured instance
   - Both handle error responses independently

2. **Duplicate User Fetching**
   - `fetcher.fetchUserInfo()` - Used in download flow
   - `client.getUser()` - Used in CLI commands
   - Same endpoint, different implementations

3. **Inconsistent Validation**
   - `client.js`: Validates responses, throws errors
   - `fetcher.js`: Validates responses, returns error objects
   - Different error handling patterns for same API

4. **Missing Coverage**
   - Several API endpoints not exposed by client
   - No unified pagination handling
   - No centralized list options type

## OpenProcessing API Structure

Based on `openprocessingapi.md`, the API has this structure:

### Resource Hierarchy
```
User
├── GET /api/user/:id (info)
├── GET /api/user/:id/sketches (list)
├── GET /api/user/:id/followers (list)
├── GET /api/user/:id/following (list)
└── GET /api/user/:id/hearts (list) [MISSING]

Sketch
├── GET /api/sketch/:id (info)
├── GET /api/sketch/:id/code [MISSING from client]
├── GET /api/sketch/:id/files (list)
├── GET /api/sketch/:id/libraries (list)
├── GET /api/sketch/:id/forks (list) [MISSING]
└── GET /api/sketch/:id/hearts (list) [MISSING]

Curation
├── GET /api/curation/:id (info)
└── GET /api/curation/:id/sketches (list)

Tags
└── GET /api/tags (list) [MISSING]
```

### List Endpoints Pattern
All list endpoints support:
- `limit` (number): Maximum results
- `offset` (number): Skip N results
- `sort` ('asc'|'desc'): Sort order
- Response header: `hasMore` (boolean)

## Proposed Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI LAYER                               │
│  (bin/opdl.js, src/cli.js, src/commands/*.js)                  │
└────────────┬────────────────────────────────┬───────────────────┘
             │                                │
             │ Download Flow                  │ Info/Query Flow
             ▼                                ▼
┌────────────────────────┐          ┌─────────────────────────┐
│   MAIN ENTRY POINT     │          │   COMMAND HANDLERS      │
│   src/index.js         │          │   sketch/user/curation  │
│   opdl(sketchId)       │          │                         │
└────────────┬───────────┘          └──────────┬──────────────┘
             │                                  │
             │ Uses                             │ Uses
             ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DOWNLOAD FEATURE (NEW)                        │
│                   src/download/                                 │
│                                                                 │
│  service.js:                                                    │
│  • getCompleteSketchInfo(id)  ← Orchestrates API calls         │
│                                                                 │
│  downloader.js:                                                 │
│  • downloadSketch()           ← Main download orchestration    │
│                                                                 │
│  Content Generators:                                            │
│  • htmlGenerator.js           ← Generate index.html            │
│  • codeAttributor.js          ← Add attribution comments       │
│  • licenseHandler.js          ← Create LICENSE file            │
│  • metadataWriter.js          ← Write metadata.json            │
│                                                                 │
│  Dev Tools:                                                     │
│  • serverRunner.js            ← Run sketch (--run flag)        │
│  • viteScaffolder.js          ← Setup Vite (--vite flag)       │
└────────────┬────────────────────────────────────┬──────────────┘
             │                                    │
             │ Uses client for all API calls      │ Direct use
             ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                               │
│                   src/api/client.js                             │
│               OpenProcessingClient class                        │
│                                                                 │
│  User Endpoints:            Sketch Endpoints:                  │
│  • getUser(id)              • getSketch(id)                    │
│  • getUserSketches()        • getSketchCode(id)                │
│  • getUserFollowers()       • getSketchFiles(id)               │
│  • getUserFollowing()       • getSketchLibraries(id)           │
│  • getUserHearts() [NEW]    • getSketchForks(id) [NEW]         │
│                             • getSketchHearts(id) [NEW]        │
│  Curation Endpoints:                                           │
│  • getCuration(id)          Other:                             │
│  • getCurationSketches()    • getTags(options) [NEW]           │
│                                                                 │
│  Responsibilities:                                              │
│  - 1:1 mapping to OpenProcessing API                           │
│  - HTTP request/response handling                              │
│  - Validate all responses                                      │
│  - Throw errors for invalid data                               │
└────────────┬────────────────────────────────────┬──────────────┘
             │                                    │
             │ Validates with                     │ Makes HTTP with
             ▼                                    ▼
┌──────────────────────────┐          ┌─────────────────────────┐
│   VALIDATION LAYER       │          │    HTTP CLIENT          │
│   src/validator.js       │          │    axios                │
│                          │          │                         │
│  • validateSketch()      │          │  Configured instance    │
│  • validateUser()        │          │  Base URL set           │
│  • validateCuration()    │          │  Auth headers           │
│  • validateId()          │          └─────────────────────────┘
│  • validateListOptions() │
│  • validateTagsOptions() │
│                          │
│  VALIDATION_REASONS      │
│  MESSAGES (constants)    │
└──────────────────────────┘

LEGACY (To be deprecated):
┌──────────────────────────┐
│   src/fetcher.js         │  ← Re-exports from download/service
│   fetchSketchInfo()      │     for backward compatibility
│   fetchUserInfo()        │     (Add deprecation warnings)
└──────────────────────────┘
```

### Data Flow Examples

**Example 1: Download Sketch** (Current main use case)
```
User runs: opdl 123456

1. CLI → index.js → opdl(123456)
2. index.js → download/service.getCompleteSketchInfo(123456)
3. Service makes parallel calls via Client:
   ├── Client.getSketch(123456) → validates → metadata
   ├── Client.getSketchCode(123456) → validates → code
   ├── Client.getSketchFiles(123456) → validates → files
   └── Client.getSketchLibraries(123456) → validates → libraries
4. Service detects fork → Client.getSketch(parentId) → parent metadata
5. Service enriches → Client.getUser(userId) → author info
6. Service returns complete sketchInfo object
7. index.js → download/downloader.downloadSketch(sketchInfo)
8. Downloader orchestrates:
   - Writes code files (with codeAttributor for attribution)
   - Writes assets
   - Generates index.html (htmlGenerator)
   - Creates LICENSE (licenseHandler)
   - Writes metadata.json (metadataWriter)
9. If --vite flag: viteScaffolder sets up Vite project
10. If --run flag: serverRunner starts dev server
```

**Example 2: Get Sketch Info** (CLI query)
```
User runs: opdl sketch 123456 --info title,author

1. CLI → sketch.js → handleSketchCommand()
2. sketch.js → Client.getSketch(123456)
3. Client validates response → returns metadata
4. sketch.js → fieldSelector.selectFields()
5. sketch.js → formatters.formatObject()
6. CLI displays: { title: "...", author: "..." }
```

**Example 3: Get Sketch Forks** (New functionality)
```
User runs: opdl sketch forks 123456 --limit 10

1. CLI → sketch.js → handleSketchCommand({ subcommand: 'forks' })
2. sketch.js → Client.getSketchForks(123456, { limit: 10 })
3. Client validates list options
4. Client makes HTTP request
5. Client validates response
6. Client returns array of fork objects
7. sketch.js → formatters.formatArray()
8. CLI displays fork list
```

### Layer Responsibilities

**CLI Layer** (`bin/opdl.js`, `src/cli.js`, `src/commands/*.js`)
- Parse command-line arguments
- Route to appropriate handlers
- Format and display output
- Handle user-facing errors

**Service Layer** (`src/services/*.js`) [NEW]
- Orchestrate multiple API calls
- Aggregate data from multiple endpoints
- Transform API data to domain objects
- Handle business logic (e.g., "if fork, fetch parent")
- Return rich objects for download/display

**Client Layer** (`src/api/client.js`)
- 1:1 mapping to OpenProcessing REST API
- Handle HTTP requests/responses
- Validate all API responses
- Throw errors for invalid data
- No business logic, pure API wrapper

**Validation Layer** (`src/validator.js`)
- Centralized validation rules
- Standard error messages
- Type checking for API responses
- Input validation (IDs, options)
- Stateless validation functions

**Domain Layer** (`src/*.js`)
- File system operations
- Code generation (HTML, attribution)
- Metadata writing
- License handling
- No direct HTTP calls

### 1. Enhanced Client Layer (`src/api/client.js`)

**Goal:** Complete, 1:1 mapping to OpenProcessing API

**Changes:**
- ✅ Add 4 missing endpoints to achieve complete API coverage:
  - `getUserHearts(userId, options)` - Get sketches a user has hearted
  - `getSketchForks(id, options)` - Get forks of a sketch
  - `getSketchHearts(id, options)` - Get users who hearted a sketch
  - `getTags(options)` - Get popular tags (with duration param)
- ✅ Add validation to `getSketchCode()` (currently lacks it)
- ✅ Add centralized types for list options
- ✅ Consistent validation and error handling across all methods
- ✅ Support for `hasMore` header detection

**Type Definitions:**
```javascript
/**
 * @typedef {Object} ListOptions
 * @property {number} [limit] - Maximum results
 * @property {number} [offset] - Results to skip
 * @property {'asc'|'desc'} [sort] - Sort order
 */

/**
 * @typedef {Object} TagsOptions
 * @property {number} [limit]
 * @property {number} [offset]
 * @property {'thisWeek'|'thisMonth'|'thisYear'|'anytime'} [duration]
 */
```

### 2. Service Layer (`src/services/sketch.js` - NEW)

**Goal:** High-level orchestration for complex operations

**Responsibilities:**
- Aggregate multiple API calls
- Transform API responses into application domain objects
- Handle derived/computed fields
- Business logic for downloads

**Key Functions:**
```javascript
// Replaces current fetcher.fetchSketchInfo()
async function getCompleteSketchInfo(sketchId, options = {})

// New helpers
async function getSketchWithParent(sketchId)
async function getSketchWithAuthor(sketchId)
```

**Benefits:**
- Clear separation: client = API, service = business logic
- Reusable by both CLI and download flow
- Uses internal client for all API calls (DRY)

### 3. Centralized Validation (`src/validator.js`)

**Current State:** Already well-structured! ✅

**Enhancement Needed:**
- ✅ Add validation for list options
- ✅ Add validation for pagination parameters
- ✅ Validate `duration` parameter for tags

**New Functions:**
```javascript
/**
 * Validate list options
 * @param {Object} options - List options to validate
 * @returns {ValidationResult}
 */
function validateListOptions(options)

/**
 * Validate tags options
 * @param {Object} options - Tags options to validate
 * @returns {ValidationResult}
 */
function validateTagsOptions(options)
```

### 4. Migration Path

**Phase 1: Extend Client** (No Breaking Changes)
- Add missing endpoints to `OpenProcessingClient`
- Add type definitions for all API entities
- Add comprehensive JSDoc types

**Phase 2: Create Service Layer**
- Create `src/services/sketch.js`
- Implement `getCompleteSketchInfo()` using client
- Keep `fetcher.js` as backward-compatible wrapper

**Phase 3: Migrate Consumers**
- Update `index.js` to use service layer
- Update `downloader.js` to use service layer
- Deprecate `fetcher.js` functions (add warnings)

**Phase 4: Remove Redundancy**
- Delete `fetcher.js`
- Update all imports

## Files Requiring Updates

### High Priority - Direct API Changes

1. **`src/api/client.js`** ⭐
   - Add 5 missing endpoints
   - Add list options types
   - Add JSDoc for all API entity types

2. **`src/validator.js`** ⭐
   - Add `validateListOptions()`
   - Add `validateTagsOptions()`
   - Export option validator types

3. **`src/services/sketch.js`** ⭐ (NEW FILE)
   - Create service layer
   - Migrate `fetchSketchInfo()` logic
   - Use client for all API calls

### Medium Priority - Consumer Updates

4. **`src/index.js`**
   - Replace `fetchSketchInfo()` with service layer
   - Import from `services/sketch.js` instead of `fetcher.js`

5. **`src/downloader.js`**
   - May need updates if service layer changes data structure
   - Review sketchInfo object shape

6. **`src/commands/sketch.js`**
   - Add support for new endpoints (forks, hearts, code)
   - May want to expose as subcommands

7. **`src/commands/user.js`**
   - Add `hearts` subcommand using new client method

8. **`src/commands/fields.js`**
   - Add field definitions for new data types (forks, hearts)

### Low Priority - Documentation & Cleanup

9. **`src/fetcher.js`**
   - Phase 3: Add deprecation warnings
   - Phase 4: Delete file

10. **`tests/fetcher.test.mjs`**
    - Migrate to test service layer instead
    - May need new `tests/services/sketch.test.mjs`

11. **`tests/client.test.mjs`** (NEW FILE)
    - Add tests for client methods
    - Test all 5 new endpoints

12. **`src/types/api.js`**
    - Add JSDoc types for all API entities:
      - `@typedef {Object} Sketch`
      - `@typedef {Object} User`
      - `@typedef {Object} Curation`
      - `@typedef {Object} SketchFork`
      - `@typedef {Object} SketchHeart`
      - `@typedef {Object} UserFollower`
      - `@typedef {Object} UserFollowing`
      - `@typedef {Object} Tag`

## Validation Centralization

### Current Validation Locations

✅ **Already Centralized:**
- `validateSketch()` - Used by client and fetcher
- `validateUser()` - Used by client
- `validateCuration()` - Used by client
- `validateId()` - Used by all commands

❌ **Needs Centralization:**
- List options validation - Currently scattered
- ID validation - Inconsistently applied (fetcher.js line 76 duplicates validator logic)
- Response data validation - Some in fetcher, some in validator

### Recommended Changes

1. **Remove duplicate ID validation from fetcher.js**
   - Line 76: Replace manual check with `validateId()`
   - Ensures consistent error messages

2. **Add list options validation**
   ```javascript
   // In validator.js
   const validateListOptions = (options = {}) => {
     const { limit, offset, sort } = options;

     if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
       return { valid: false, message: 'limit must be a positive integer' };
     }

     if (offset !== undefined && (!Number.isInteger(offset) || offset < 0)) {
       return { valid: false, message: 'offset must be a non-negative integer' };
     }

     if (sort !== undefined && !['asc', 'desc'].includes(sort)) {
       return { valid: false, message: 'sort must be "asc" or "desc"' };
     }

     return { valid: true, data: { limit, offset, sort } };
   };
   ```

3. **Use validation in client methods**
   - All list methods validate options before making request
   - Fail fast with clear error messages

## DRY Improvements

### 1. Eliminate Duplicate User Fetching

**Before:**
```javascript
// fetcher.js
const fetchUserInfo = async (userId, options = {}) => {
  const { data, error } = await fetchData(
    `https://openprocessing.org/api/user/${userId}`,
    `user ${userId}`,
    options
  );
  if (error) return {};
  return data || {};
};

// client.js
async getUser(id) {
  const response = await this.client.get(`/api/user/${id}`, ...);
  const validation = validateUser(response.data);
  // ...
}
```

**After:**
```javascript
// Service layer uses client
const client = new OpenProcessingClient();
const user = await client.getUser(userId); // Single implementation
```

### 2. Eliminate Duplicate HTTP Configuration

**Before:**
- `fetcher.js`: Creates axios instance per request
- `client.js`: Uses configured axios instance

**After:**
- Only `client.js` makes HTTP requests
- All other code uses client

### 3. Eliminate Duplicate Error Handling

**Before:**
- `fetcher.js`: Returns `{ data, error }` objects
- `client.js`: Throws errors
- Consumers need to handle both patterns

**After:**
- Client throws errors (API layer)
- Service layer catches and transforms (business layer)
- Consistent error handling pattern

## Testing Strategy

### New Tests Required

1. **`tests/api/client.test.mjs`** (NEW)
   - Test all 5 new endpoints
   - Test validation integration
   - Test list options handling
   - Mock axios responses with nock

2. **`tests/services/sketch.test.mjs`** (NEW)
   - Test `getCompleteSketchInfo()`
   - Test orchestration logic
   - Mock client responses
   - Test error propagation

3. **`tests/validator.test.mjs`** (UPDATE)
   - Add tests for `validateListOptions()`
   - Add tests for `validateTagsOptions()`
   - Already comprehensive! ✅

### Test Migration

1. Migrate relevant tests from `fetcher.test.mjs` to service layer tests
2. Keep integration tests that verify end-to-end flow
3. Remove tests for deprecated `fetcher.js` functions

## File Organization Refactor

### Current Structure Issues

The current `src/` directory has 17 files at the root level with no clear grouping:

```
src/
├── api/
│   └── client.js                    # Good: API layer
├── commands/
│   ├── curation.js                  # Good: CLI commands
│   ├── fields.js
│   ├── sketch.js
│   └── user.js
├── types/
│   └── api.js                       # Good: Type definitions
├── cli.js                           # ❌ CLI - should be organized
├── codeAttributor.js                # ❌ Domain logic - scattered
├── downloader.js                    # ❌ Domain logic - scattered
├── fetcher.js                       # ❌ To be replaced by service
├── fieldRegistry.js                 # ❌ Output formatting - scattered
├── fieldSelector.js                 # ❌ Output formatting - scattered
├── formatters.js                    # ❌ Output formatting - scattered
├── htmlGenerator.js                 # ❌ Domain logic - scattered
├── index.js                         # ✅ Main entry point - OK at root
├── licenseHandler.js                # ❌ Domain logic - scattered
├── metadataWriter.js                # ❌ Domain logic - scattered
├── serverRunner.js                  # ❌ Dev tooling - scattered
├── utils.js                         # ✅ Utils - OK at root
├── validator.js                     # ❌ Should be in api/ or lib/
└── viteScaffolder.js                # ❌ Dev tooling - scattered
```

**Problems:**
1. ❌ No clear separation between API, business logic, CLI, and utilities
2. ❌ Related functionality scattered (formatters, field handling)
3. ❌ Domain logic (download, generation) mixed with infrastructure
4. ❌ Validator at root instead of with API layer

### Proposed Structure

```
src/
├── index.js                         # Main entry point (download sketch)
├── utils.js                         # General utilities
│
├── api/                             # API & Validation Layer
│   ├── client.js                    # OpenProcessing API client
│   ├── validator.js                 # ✨ MOVED: Validation logic
│   └── types.js                     # ✨ MOVED: API entity type definitions
│
├── download/                        # ✨ NEW: Sketch Download Feature
│   ├── service.js                   # ✨ NEW: Aggregates API data
│   ├── downloader.js                # ✨ MOVED: Download orchestration
│   ├── codeAttributor.js            # ✨ MOVED: Code attribution
│   ├── htmlGenerator.js             # ✨ MOVED: HTML generation
│   ├── licenseHandler.js            # ✨ MOVED: License creation
│   ├── metadataWriter.js            # ✨ MOVED: Metadata writing
│   ├── serverRunner.js              # ✨ MOVED: Dev server (--run flag)
│   └── viteScaffolder.js            # ✨ MOVED: Vite project setup (--vite flag)
│
├── cli/                             # ✨ NEW: CLI Infrastructure
│   ├── index.js                     # ✨ MOVED: Main CLI handler
│   ├── fields.js                    # ✨ MOVED: Field definitions
│   ├── fieldRegistry.js             # ✨ MOVED: Field registry
│   ├── fieldSelector.js             # ✨ MOVED: Field selection
│   ├── formatters.js                # ✨ MOVED: Output formatting
│   └── commands/                    # ✨ MOVED: CLI Command Handlers
│       ├── sketch.js
│       ├── user.js
│       └── curation.js
```

### Rationale by Directory

**`src/api/`** - External Interface Layer
- Everything that talks to OpenProcessing API
- `client.js` - HTTP requests
- `validator.js` - Response validation
- `types.js` - API entity type definitions (JSDoc typedefs)
- Pure API concerns, no business logic
- Self-contained API module

**`src/download/`** - Sketch Download Feature (NEW)
- **Complete feature module** for downloading sketches
- `service.js` - Orchestrates API calls, aggregates data (replaces fetcher)
- `downloader.js` - Main download orchestration
- Content generators - HTML, attribution, license, metadata
- Dev tools - Server runner (--run), Vite scaffolder (--vite)
- Self-contained: uses API client, produces files, can run server
- Everything needed to download and run a sketch in one place

**`src/cli/`** - CLI Infrastructure (NEW)
- **Complete CLI module** - everything CLI-related in one place
- Main CLI router (`index.js`) - imported by `bin/opdl.js`
- Field management (registry, selector, definitions)
- Output formatting (for display)
- Command handlers (`commands/`) - sketch, user, curation
- Uses API client directly for queries
- Uses download service for downloads

**Root (`src/`)** - Entry Points & Core Utils
- `index.js` - Main programmatic API (kept for backward compatibility)
- `utils.js` - General utilities

### Migration Map

| Current Location | New Location | Reason |
|-----------------|--------------|--------|
| `src/cli.js` | `src/cli/index.js` | CLI infrastructure |
| `src/validator.js` | `src/api/validator.js` | API-specific validation |
| `src/fieldRegistry.js` | `src/cli/fieldRegistry.js` | CLI output |
| `src/fieldSelector.js` | `src/cli/fieldSelector.js` | CLI output |
| `src/formatters.js` | `src/cli/formatters.js` | CLI output |
| `src/commands/fields.js` | `src/cli/fields.js` | Field definitions |
| `src/commands/sketch.js` | `src/cli/commands/sketch.js` | CLI command handler |
| `src/commands/user.js` | `src/cli/commands/user.js` | CLI command handler |
| `src/commands/curation.js` | `src/cli/commands/curation.js` | CLI command handler |
| `src/types/api.js` | `src/api/types.js` | API type definitions |
| `src/fetcher.js` | `src/download/service.js` | Sketch download service (refactored) |
| `src/downloader.js` | `src/download/downloader.js` | Download orchestration |
| `src/codeAttributor.js` | `src/download/codeAttributor.js` | Content generation |
| `src/htmlGenerator.js` | `src/download/htmlGenerator.js` | Content generation |
| `src/licenseHandler.js` | `src/download/licenseHandler.js` | Content generation |
| `src/metadataWriter.js` | `src/download/metadataWriter.js` | Content generation |
| `src/serverRunner.js` | `src/download/serverRunner.js` | Run downloaded sketch |
| `src/viteScaffolder.js` | `src/download/viteScaffolder.js` | Setup Vite for sketch |

### Import Path Updates

**Before:**
```javascript
const { validateSketch } = require('./validator');
const { downloadSketch } = require('./downloader');
const { formatObject } = require('./formatters');
```

**After:**
```javascript
const { validateSketch } = require('./api/validator');
const { downloadSketch } = require('./download/downloader');
const { formatObject } = require('./cli/formatters');
```

### Benefits of New Structure

1. **Clear Layering**
   - API ↔ Services ↔ Domain
   - Easy to understand data flow
   - Prevents circular dependencies

2. **Improved Discoverability**
   - Want to change CLI? → Look in `cli/` (including all commands)
   - Want to modify API? → Look in `api/`
   - Want to change download logic? → Look in `download/`
   - Everything for sketch downloading in one place
   - Everything for CLI in one place

3. **Better Testing**
   - Test API layer in isolation
   - Mock services for command tests
   - Mock client for service tests

4. **Easier Maintenance**
   - Related files grouped together
   - Clear boundaries between concerns
   - Easier to find what needs changing

5. **Future Extensibility**
   - Add new services easily
   - Add new commands easily
   - Add new output formats in `cli/`

### File Count Comparison

**Before:**
- Root: 17 files
- Organized: 3 subdirs (api/, commands/, types/)
- Total: 20 files in 4 locations

**After:**
- Root: 2 files (index.js, utils.js)
- Organized: 3 subdirs (api/, download/, cli/)
- Total: 20 files in 4 locations (better grouped)
- api/ is self-contained (client, validator, types)
- cli/ contains commands/ subdir
- download/ is self-contained feature module

### Implementation Approach

**Option A: Big Bang Migration** (Not Recommended)
- Move all files at once
- High risk of breaking imports

**Option B: Gradual Migration** (Recommended)
1. Create new directories
2. Copy files to new locations (don't delete old ones yet)
3. Update imports in new structure
4. Add re-exports in old locations for backward compat:
   ```javascript
   // src/validator.js (old location)
   module.exports = require('./api/validator');
   ```
5. Update all internal imports gradually
6. Remove re-exports once all imports updated
7. Delete old files

**Option C: Hybrid Approach** (Best for this project)
- Do file moves as part of refactor sprints
- Sprint 1: Move API-related (validator → api/)
- Sprint 2: Create download/ feature directory (service + all download helpers)
- Sprint 3: Group CLI files
- Each sprint maintains backward compatibility

### Breaking Changes

**Public API** (`index.js` export)
- ✅ NO BREAKING CHANGES
- `require('opdl')` still works
- Main download function unchanged

**Internal Imports**
- ❌ ALL INTERNAL IMPORTS WILL CHANGE
- Re-exports can provide backward compatibility
- Need to update all `require()` statements

**Binary Entry Point** (`bin/opdl.js`)
- Needs update to `require('../src/cli')` instead of `require('../src/cli.js')`
- Minor change, easy to handle

### Testing Impact

**Test File Organization** (mirror src/ structure)
```
tests/
├── api/
│   ├── client.test.mjs          # ✨ NEW
│   ├── validator.test.mjs       # ✨ MOVED
│   └── types.test.mjs           # ✨ NEW (optional - for type validation)
├── download/                     # ✨ NEW: Download feature tests
│   ├── service.test.mjs         # ✨ NEW (replaces fetcher.test.mjs)
│   ├── downloader.test.mjs      # ✨ MOVED
│   ├── codeAttributor.test.mjs  # ✨ MOVED
│   ├── htmlGenerator.test.mjs   # ✨ MOVED
│   ├── licenseHandler.test.mjs  # ✨ MOVED
│   ├── metadataWriter.test.mjs  # ✨ MOVED
│   ├── serverRunner.test.mjs    # ✨ MOVED
│   └── viteScaffolder.test.mjs  # ✨ MOVED
├── cli/
│   ├── index.test.mjs           # ✨ MOVED (from cli.test.mjs)
│   ├── fieldSelector.test.mjs   # ✨ MOVED
│   ├── formatters.test.mjs      # ✨ MOVED
│   └── commands/                # ✨ MOVED: Command handler tests
│       ├── sketch.test.mjs      # (existing test moved)
│       ├── user.test.mjs        # (existing test moved)
│       └── curation.test.mjs    # (existing test moved)
├── utils.test.mjs
└── index.test.mjs
```

## Implementation Order

### Phase 1: API Layer Enhancement (No Breaking Changes)

**Sprint 1.1: Complete API Coverage**
1. Add JSDoc types to `src/api/types.js` (or create it if moving from `src/types/api.js`)
2. Add validation functions to `src/validator.js`:
   - `validateListOptions()`
   - `validateTagsOptions()`
3. Add 4 missing endpoints to `src/api/client.js`:
   - `getUserHearts(userId, options)`
   - `getSketchForks(id, options)`
   - `getSketchHearts(id, options)`
   - `getTags(options)`
4. Add validation to existing `getSketchCode()` method
5. Write tests for new client methods in `tests/api/client.test.mjs`

**Sprint 1.2: Move Validator and Types to API Layer**
6. Create `src/api/validator.js` (copy from `src/validator.js`)
7. Move `src/types/api.js` → `src/api/types.js`
8. Update `src/api/client.js` to import from `./validator` and `./types`
9. Add re-exports for backward compatibility:
   - `src/validator.js`: `module.exports = require('./api/validator')`
   - `src/types/api.js`: `module.exports = require('../api/types')`
10. Update tests:
   - `tests/validator.test.mjs` → `tests/api/validator.test.mjs`
   - Update imports in tests to use new paths
11. Verify all tests pass

### Phase 2: Service Layer Creation

**Sprint 2.1: Create Download Feature Directory**
1. Create `src/download/` directory
2. Create `src/download/service.js`:
   - Port `fetchSketchInfo()` logic from `src/fetcher.js`
   - Rename to `getCompleteSketchInfo(id, options)`
   - Uses `OpenProcessingClient` for all API calls
   - Same return structure as current `fetchSketchInfo()`
3. Write comprehensive service tests in `tests/download/service.test.mjs`
4. Verify service works independently

**Sprint 2.2: Move Download Files**
5. Move files to `src/download/` with re-exports:
   - `downloader.js`
   - `codeAttributor.js`
   - `htmlGenerator.js`
   - `licenseHandler.js`
   - `metadataWriter.js`
   - `serverRunner.js`
   - `viteScaffolder.js`
6. Update imports within download/ files
7. Move corresponding tests to `tests/download/`

**Sprint 2.3: Backward Compatible Wrapper**
8. Update `src/fetcher.js` to re-export from download service:
   ```javascript
   const { getCompleteSketchInfo } = require('./download/service');
   const fetchSketchInfo = async (sketchId, options) => {
     return getCompleteSketchInfo(sketchId, options);
   };
   module.exports = { fetchSketchInfo };
   ```
9. Run existing `fetcher.test.mjs` to verify backward compatibility

### Phase 3: File Organization

**Sprint 3.1: Organize API Layer**
1. Already done in Sprint 1.2 ✅

**Sprint 3.2: Organize CLI Layer**
2. Create `src/cli/` and `src/cli/commands/` directories
3. Move files with re-exports for backward compatibility:
   - `src/cli.js` → `src/cli/index.js`
   - `src/formatters.js` → `src/cli/formatters.js`
   - `src/fieldSelector.js` → `src/cli/fieldSelector.js`
   - `src/fieldRegistry.js` → `src/cli/fieldRegistry.js`
   - `src/commands/fields.js` → `src/cli/fields.js`
   - `src/commands/sketch.js` → `src/cli/commands/sketch.js`
   - `src/commands/user.js` → `src/cli/commands/user.js`
   - `src/commands/curation.js` → `src/cli/commands/curation.js`
4. Update imports within CLI files to use new paths
5. Add re-exports at old locations
6. Update `bin/opdl.js` to require `../src/cli`
7. Move tests to `tests/cli/` (including commands/ subdir)
8. Verify CLI works

### Phase 4: Update Consumers to Use Service Layer

**Sprint 4.1: Update Main Entry Point**
1. Update `src/index.js`:
   - Import from `./download/service` instead of `./fetcher`
   - Import from `./download/downloader`
2. Run integration tests
3. Verify backward compatibility

**Sprint 4.2: Update Command Handlers**
4. Update `src/cli/commands/sketch.js`:
   - Add support for new endpoints (forks, hearts)
   - Use `getSketchForks()`, `getSketchHearts()`
5. Update `src/cli/commands/user.js`:
   - Add `hearts` subcommand using `getUserHearts()`
6. Update field definitions in `src/cli/fields.js`:
   - Add field sets for forks, hearts
7. Test new CLI commands

**Sprint 4.3: Update All Internal Imports**
8. Update all files to use new import paths (remove re-exports dependency)
9. Search codebase for old import patterns
10. Update systematically
11. Run full test suite

### Phase 5: Cleanup and Documentation

**Sprint 5.1: Remove Re-exports**
1. Remove re-export files at old locations:
   - `src/validator.js` (now in api/)
   - `src/types/` directory (now api/types.js)
   - `src/cli.js` (now cli/index.js)
   - `src/formatters.js` (now in cli/)
   - `src/fieldSelector.js` (now in cli/)
   - `src/fieldRegistry.js` (now in cli/)
   - `src/commands/` directory (now in cli/commands/)
   - `src/downloader.js` (now in download/)
   - `src/codeAttributor.js` (now in download/)
   - `src/htmlGenerator.js` (now in download/)
   - `src/licenseHandler.js` (now in download/)
   - `src/metadataWriter.js` (now in download/)
   - `src/serverRunner.js` (now in download/)
   - `src/viteScaffolder.js` (now in download/)
2. Delete empty directories: `src/commands/`, `src/types/`
3. Verify all tests still pass
4. Verify CLI still works

**Sprint 5.2: Deprecate and Remove Fetcher**
4. Add deprecation warnings to `src/fetcher.js`:
   ```javascript
   console.warn('Warning: fetcher.js is deprecated. Use download/service.js instead.');
   ```
5. Update documentation to recommend download service
6. After one release cycle:
   - Delete `src/fetcher.js`
   - Delete `tests/fetcher.test.mjs`
7. Update CHANGELOG

**Sprint 5.3: Documentation**
8. Update README with new architecture
9. Add architecture diagram to docs
10. Update CONTRIBUTING.md with new structure
11. Add migration guide for any external users
12. Update JSDoc in all files

### Phase 6: Verification and Release

**Sprint 6.1: Final Testing**
1. Run full test suite: `npm test`
2. Run coverage report: `npm run test:coverage`
3. Verify >90% coverage maintained
4. Manual testing:
   - Download sketches
   - Use all CLI commands
   - Test --vite and --run flags
   - Test error cases

**Sprint 6.2: Release Preparation**
5. Update version number (minor version bump due to new features)
6. Update CHANGELOG.md with all changes
7. Review all diffs one more time
8. Create PR with comprehensive description
9. Get code review
10. Merge and tag release

### Sprint Dependency Chart

```
Phase 1 (API Layer)
├─ Sprint 1.1 (API Coverage)
└─ Sprint 1.2 (Move Validator)
          ↓
Phase 2 (Download Feature)
├─ Sprint 2.1 (Create Download Service)
├─ Sprint 2.2 (Move Download Files)
└─ Sprint 2.3 (Backward Compat)
          ↓
Phase 3 (File Org) ← Can be done in parallel with Phase 2
├─ Sprint 3.1 (API) ✅ Done in Phase 1
└─ Sprint 3.2 (CLI)
          ↓
Phase 4 (Migration)
├─ Sprint 4.1 (Entry Point)
├─ Sprint 4.2 (Commands)
└─ Sprint 4.3 (All Imports)
          ↓
Phase 5 (Cleanup)
├─ Sprint 5.1 (Remove Re-exports)
├─ Sprint 5.2 (Remove Fetcher)
└─ Sprint 5.3 (Documentation)
          ↓
Phase 6 (Release)
├─ Sprint 6.1 (Testing)
└─ Sprint 6.2 (Release Prep)
```

## Benefits Summary

### For Maintainability
- ✅ Single source of truth for API calls (client)
- ✅ Clear separation of concerns (client vs service vs domain)
- ✅ Consistent error handling patterns
- ✅ Easier to add new endpoints (follow established pattern)

### For Testing
- ✅ Easy to mock client in service tests
- ✅ Easy to mock service in integration tests
- ✅ Validation logic testable in isolation
- ✅ Reduced test duplication

### For Features
- ✅ Complete API coverage (all endpoints available)
- ✅ Type safety through JSDoc
- ✅ Consistent list handling with pagination
- ✅ Extensible for future API additions

### For DRY
- ✅ No duplicate HTTP logic
- ✅ No duplicate validation logic
- ✅ No duplicate user fetching
- ✅ Centralized error messages
- ✅ Reusable list options validation

## Risk Assessment

### Low Risk
- Adding new client methods (backward compatible)
- Adding validation functions (backward compatible)
- Creating service layer (new code, doesn't affect existing)

### Medium Risk
- Migrating `index.js` to use service layer
  - **Mitigation:** Comprehensive tests, keep fetcher.js temporarily

- Changing error handling patterns
  - **Mitigation:** Service layer can transform errors to match current expectations

### High Risk
- Deleting `fetcher.js`
  - **Mitigation:** Only do in final sprint after thorough testing
  - Add deprecation warnings first
  - Ensure 100% test coverage of replacement code

## Open Questions

1. **Should we keep backward compatibility with fetcher.js indefinitely?**
   - Recommendation: Add deprecation warning, remove in next major version

2. **Should service layer return same object shape as current fetchSketchInfo()?**
   - Recommendation: Yes, to minimize breaking changes. Can evolve later.

3. **Should we add pagination helpers to client?**
   - Recommendation: Yes, add `hasMore` header detection and auto-pagination utilities

4. **Should we add response caching?**
   - Recommendation: Not in this refactor. Add later if needed.

5. **Should we expose new endpoints via CLI immediately?**
   - Recommendation: Add in Sprint 3 as optional enhancements

## Success Criteria

✅ All API endpoints from `openprocessingapi.md` are available in client
✅ Zero duplicate HTTP request logic
✅ Zero duplicate validation logic
✅ All validation happens in `validator.js`
✅ Service layer uses client for all API calls
✅ Tests maintain >90% coverage
✅ No breaking changes to public API (download functionality)
✅ Clear deprecation path for `fetcher.js`
✅ Complete JSDoc type coverage for API entities
✅ CLI commands work with new architecture

## Appendix: API Entity Types

These types should be added to `src/types/api.js`:

```javascript
/**
 * @typedef {Object} ListOptions
 * @property {number} [limit] - Maximum number of results
 * @property {number} [offset] - Number of results to skip
 * @property {'asc'|'desc'} [sort] - Sort order
 */

/**
 * @typedef {Object} Sketch
 * @property {string} visualID - Sketch ID
 * @property {string} title - Sketch title
 * @property {string} [description] - Sketch description
 * @property {string} mode - Sketch mode (p5js, processingjs, html)
 * @property {string} userID - Author user ID
 * @property {string} [parentID] - Parent sketch ID if fork
 * @property {string} [createdOn] - Creation timestamp
 * @property {string} [updatedOn] - Last update timestamp
 */

/**
 * @typedef {Object} User
 * @property {string} userID - User ID
 * @property {string} fullname - User's full name
 * @property {string} [bio] - User biography
 * @property {string} memberSince - Member since timestamp
 * @property {string} [website] - User website
 * @property {string} [location] - User location
 */

/**
 * @typedef {Object} UserSketchItem
 * @property {string} visualID - Sketch ID
 * @property {string} title - Sketch title
 * @property {string} [description] - Sketch description
 */

/**
 * @typedef {Object} UserFollowerItem
 * @property {string} userID - User ID
 * @property {string} fullname - User's full name
 * @property {string} membershipType - Membership type
 * @property {string} followedOn - Followed timestamp
 */

/**
 * @typedef {Object} SketchForkItem
 * @property {string} visualID - Forked sketch ID
 * @property {string} title - Sketch title
 * @property {string} userID - Fork author user ID
 * @property {string} fullname - Fork author name
 * @property {string} createdOn - Fork creation timestamp
 * @property {string} updatedOn - Fork last update timestamp
 */

/**
 * @typedef {Object} SketchHeartItem
 * @property {string} userID - User who hearted
 * @property {string} fullname - User's full name
 * @property {string} createdOn - Heart timestamp
 */

/**
 * @typedef {Object} Curation
 * @property {string} title - Curation title
 * @property {string} description - Curation description
 * @property {string} createdOn - Creation timestamp
 * @property {string} collectionID - Curation ID
 * @property {string} userID - Creator user ID
 */

/**
 * @typedef {Object} CurationSketchItem
 * @property {string} visualID - Sketch ID
 * @property {string} title - Sketch title
 * @property {string} description - Sketch description
 * @property {string} userID - Sketch author ID
 * @property {string} parentID - Parent sketch ID
 * @property {string} thumbnailUpdatedOn - Thumbnail update timestamp
 * @property {string} fullname - Author name
 * @property {string} membershipType - Author membership type
 * @property {string} status - Sketch status
 * @property {string} submittedOn - Submission timestamp
 */

/**
 * @typedef {Object} Tag
 * @property {string} tag - Tag name
 * @property {string} quantity - Number of sketches with this tag
 */

/**
 * @typedef {Object} TagsOptions
 * @property {number} [limit] - Maximum results
 * @property {number} [offset] - Results to skip
 * @property {'thisWeek'|'thisMonth'|'thisYear'|'anytime'} [duration] - Time period
 */
```

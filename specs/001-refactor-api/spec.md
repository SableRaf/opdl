# Feature Specification: OpenProcessing API Architecture Refactor

**Feature Branch**: `001-refactor-api`
**Created**: 2025-12-27
**Status**: Draft
**Input**: User description: "Refactor OpenProcessing API architecture to eliminate redundancy between client.js and fetcher.js, improve alignment with OpenProcessing API structure, centralize validation, and reorganize file structure"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete API Access (Priority: P1)

As a CLI user or developer, I need access to all 14 OpenProcessing API endpoints so that I can query any data supported by the OpenProcessing API without workarounds or custom implementations.

**Why this priority**: This is the foundation for all other improvements. Without complete API coverage, users are forced to write custom HTTP code or work around missing functionality, defeating the purpose of having an API client.

**Independent Test**: Can be fully tested by calling each of the 14 API methods (getUser, getUserSketches, getUserFollowers, getUserFollowing, getUserHearts, getSketch, getSketchCode, getSketchFiles, getSketchLibraries, getSketchForks, getSketchHearts, getCuration, getCurationSketches, getTags) and verifying they return valid data from the OpenProcessing API.

**Acceptance Scenarios**:

**User Endpoints (5 methods)**:
1. **Given** a valid user ID, **When** I call `getUser(userId)`, **Then** I receive the user's profile information
2. **Given** a valid user ID, **When** I call `getUserSketches(userId, options)`, **Then** I receive a list of the user's sketches
3. **Given** a valid user ID, **When** I call `getUserFollowers(userId, options)`, **Then** I receive a list of the user's followers
4. **Given** a valid user ID, **When** I call `getUserFollowing(userId, options)`, **Then** I receive a list of users the user is following
5. **Given** a valid user ID, **When** I call `getUserHearts(userId, options)`, **Then** I receive a list of sketches the user has hearted

**Sketch Endpoints (7 methods)**:
6. **Given** a valid sketch ID, **When** I call `getSketch(sketchId)`, **Then** I receive the sketch's metadata
7. **Given** a valid sketch ID, **When** I call `getSketchCode(sketchId)`, **Then** I receive the sketch's source code with validation applied
8. **Given** a valid sketch ID, **When** I call `getSketchFiles(sketchId, options)`, **Then** I receive a list of the sketch's asset files
9. **Given** a valid sketch ID, **When** I call `getSketchLibraries(sketchId, options)`, **Then** I receive a list of libraries used by the sketch
10. **Given** a valid sketch ID, **When** I call `getSketchForks(sketchId, options)`, **Then** I receive a list of forks of that sketch
11. **Given** a valid sketch ID, **When** I call `getSketchHearts(sketchId, options)`, **Then** I receive a list of users who hearted that sketch

**Curation Endpoints (2 methods)**:
12. **Given** a valid curation ID, **When** I call `getCuration(curationId)`, **Then** I receive the curation's metadata
13. **Given** a valid curation ID, **When** I call `getCurationSketches(curationId, options)`, **Then** I receive a list of sketches in the curation

**Tags Endpoint (1 method)**:
14. **Given** valid options, **When** I call `getTags({ duration: 'thisWeek', limit: 20 })`, **Then** I receive popular tags for the specified period

**Pagination and Validation**:
15. **Given** any list endpoint (getUserSketches, getUserFollowers, getUserFollowing, getUserHearts, getSketchFiles, getSketchLibraries, getSketchForks, getSketchHearts, getCurationSketches, getTags), **When** I provide pagination options (limit, offset, sort), **Then** the options are validated before the API call and applied correctly to the request

---

### User Story 2 - Single Source of Truth for API Calls (Priority: P1)

As a developer working on the codebase, I need all HTTP requests to OpenProcessing API to go through a single client implementation so that changes, debugging, and error handling are consistent and maintainable.

**Why this priority**: Currently, both client.js and fetcher.js make HTTP calls independently with different error handling patterns. This creates maintenance burden, inconsistent behavior, and duplicated code. This must be fixed before adding new features.

**Independent Test**: Can be tested by searching the codebase for direct axios calls (should only exist in client.js), verifying all API calls use OpenProcessingClient, and confirming error handling is consistent across all API operations.

**Acceptance Scenarios**:

1. **Given** the refactored codebase, **When** I search for `axios.get` or `axios.create`, **Then** I find these calls only in `src/api/client.js`
2. **Given** any API operation (sketch download, user query, curation fetch), **When** an API error occurs, **Then** the error is handled consistently through the client layer validation
3. **Given** a need to add auth headers or modify HTTP configuration, **When** I update the client, **Then** all API calls inherit the change automatically
4. **Given** the download flow, **When** it needs user data, **Then** it uses `client.getUser()` instead of making direct HTTP calls

---

### User Story 3 - Clear Separation of Concerns (Priority: P2)

As a developer maintaining the codebase, I need a clear separation between API communication, business logic, and presentation layers so that I can quickly locate and modify functionality without affecting unrelated code.

**Why this priority**: The current flat file structure with 17 files at the root makes it difficult to understand relationships and responsibilities. Organizing code by concern improves discoverability and reduces cognitive load.

**Independent Test**: Can be tested by examining the directory structure and verifying files are grouped by responsibility (api/, download/, cli/), checking that imports respect layer boundaries (CLI uses download service, service uses API client, client doesn't depend on business logic).

**Acceptance Scenarios**:

1. **Given** the refactored file structure, **When** I want to modify API communication, **Then** I find all API-related code in the `src/api/` directory
2. **Given** the refactored file structure, **When** I want to change sketch download behavior, **Then** I find all download logic, content generators, and dev tools in `src/download/`
3. **Given** the refactored file structure, **When** I want to add a new CLI command, **Then** I find all CLI infrastructure and existing commands in `src/cli/`
4. **Given** any layer, **When** I examine imports, **Then** dependencies flow in one direction: CLI → Download Service → API Client
5. **Given** the download service, **When** it needs to aggregate sketch data, **Then** it orchestrates multiple client calls without making direct HTTP requests

---

### User Story 4 - Backward Compatibility Maintained (Priority: P1)

As an existing user of the opdl tool or npm package, I need the public API and CLI commands to continue working exactly as before so that the refactor doesn't break my workflows or scripts.

**Why this priority**: Breaking changes force users to update their code and can cause unexpected failures. Maintaining backward compatibility ensures a smooth transition and builds user trust.

**Independent Test**: Can be tested by running existing test suites, verifying CLI commands produce identical output, confirming the main `opdl()` function works with the same signature, and checking that all existing features (download, --vite, --run flags) function correctly.

**Acceptance Scenarios**:

1. **Given** the refactored code, **When** a user runs `opdl 123456`, **Then** the sketch downloads exactly as before with identical file structure and content
2. **Given** the refactored code, **When** existing test suites run, **Then** all tests pass without modification
3. **Given** the refactored code, **When** a user imports `const opdl = require('opdl')`, **Then** the function works with the same signature and behavior
4. **Given** CLI commands, **When** a user runs `opdl sketch 123456 --info title,author`, **Then** the output format is identical to the previous version
5. **Given** the --vite and --run flags, **When** used with downloads, **Then** they function exactly as before

---

### User Story 5 - Centralized Validation (Priority: P2)

As a developer adding new API features, I need all validation logic centralized in one place so that validation rules are consistent, error messages are standardized, and I don't duplicate validation code.

**Why this priority**: Scattered validation leads to inconsistent error messages and duplicated logic. Centralization makes it easier to maintain validation rules and ensures users get consistent feedback.

**Independent Test**: Can be tested by verifying all validation functions exist in `src/api/validator.js`, confirming no validation logic exists in client.js beyond calling validator functions, and checking that error messages follow consistent patterns.

**Acceptance Scenarios**:

1. **Given** any API method in the client, **When** it receives a response, **Then** validation is performed by calling a validator function (validateSketch, validateUser, etc.)
2. **Given** the validator module, **When** I need to add list options validation, **Then** I add `validateListOptions()` once and it's used by all list endpoints
3. **Given** any invalid API response, **When** validation runs, **Then** error messages follow the standardized format defined in validator.js
4. **Given** the codebase, **When** I search for validation logic, **Then** it's all located in `src/api/validator.js`

---

### Edge Cases

- What happens when the API returns a 404 for a missing sketch during download orchestration?
- How does the system handle network timeouts when aggregating multiple API calls in the download service?
- What happens when a list endpoint returns `hasMore: true` but the user doesn't request more pages?
- How does backward compatibility work if fetcher.js is eventually removed?
- What happens when validation fails for optional fields in API responses?
- How does the system handle breaking changes in the OpenProcessing API in the future?

## Requirements *(mandatory)*

### Functional Requirements

#### API Client Completeness
- **FR-001**: Client MUST provide methods for all 14 OpenProcessing API endpoints
- **FR-002**: Client MUST implement `getUserHearts(userId, options)` for fetching sketches a user has hearted
- **FR-003**: Client MUST implement `getSketchForks(id, options)` for fetching forks of a sketch
- **FR-004**: Client MUST implement `getSketchHearts(id, options)` for fetching users who hearted a sketch
- **FR-005**: Client MUST implement `getTags(options)` for fetching popular tags with duration filtering
- **FR-006**: Client MUST add validation to the existing `getSketchCode()` method
- **FR-007**: All list endpoint methods MUST accept ListOptions (limit, offset, sort) parameters
- **FR-008**: All list endpoint methods MUST validate options before making HTTP requests

#### Validation Centralization
- **FR-009**: System MUST validate all list options through `validateListOptions()` in validator.js
- **FR-010**: System MUST validate tags options through `validateTagsOptions()` in validator.js
- **FR-011**: All API response validation MUST occur in validator.js functions
- **FR-012**: Validation functions MUST return consistent ValidationResult objects with `{ valid, message, data }` structure
- **FR-013**: System MUST NOT duplicate validation logic across multiple files

#### Single Source of Truth
- **FR-014**: All HTTP requests to OpenProcessing API MUST go through the OpenProcessingClient class
- **FR-015**: System MUST eliminate direct axios calls outside of client.js
- **FR-016**: Download service MUST use OpenProcessingClient methods instead of making direct HTTP requests
- **FR-017**: All API operations MUST share the same axios instance configuration

#### Service Layer
- **FR-018**: System MUST create a download service that orchestrates multiple API calls
- **FR-019**: Download service MUST implement `getCompleteSketchInfo(id, options)` to aggregate sketch data
- **FR-020**: Download service MUST use client methods for all API calls
- **FR-021**: Download service MUST handle business logic like "if fork, fetch parent sketch"
- **FR-022**: System MUST maintain the same sketchInfo object structure as current `fetchSketchInfo()`

#### File Organization
- **FR-023**: API-related code (client, validator, types) MUST be located in `src/api/` directory
- **FR-024**: Download-related code (service, downloader, content generators, dev tools) MUST be located in `src/download/` directory
- **FR-025**: CLI-related code (command handlers, formatters, field handling) MUST be located in `src/cli/` directory
- **FR-026**: System MUST provide re-exports at old file locations during transition for backward compatibility
- **FR-027**: Main entry point (`src/index.js`) MUST remain at root for backward compatibility

#### Backward Compatibility
- **FR-028**: Public API function `opdl()` MUST maintain identical signature and behavior
- **FR-029**: All existing CLI commands MUST continue to work with identical output
- **FR-030**: Existing test suites MUST pass without modification
- **FR-031**: Download functionality (including --vite and --run flags) MUST work exactly as before
- **FR-032**: System MUST provide deprecation path for fetcher.js with warnings before removal

#### Type Definitions
- **FR-033**: System MUST define JSDoc types for all API entities (Sketch, User, Curation, etc.)
- **FR-034**: System MUST define JSDoc types for all list item types (UserSketchItem, SketchForkItem, etc.)
- **FR-035**: System MUST define ListOptions type for pagination parameters
- **FR-036**: System MUST define TagsOptions type for tags endpoint parameters
- **FR-037**: All client methods MUST have comprehensive JSDoc documentation with type information

### Key Entities

- **OpenProcessingClient**: API client class that provides 1:1 mapping to OpenProcessing REST API endpoints
- **Download Service**: Orchestration layer that aggregates multiple API calls into rich domain objects
- **Validator**: Centralized validation module with functions for each API entity type and options
- **API Entities**: Data structures returned by the OpenProcessing API (Sketch, User, Curation, Tag)
- **List Items**: Simplified data structures for list endpoints (UserSketchItem, SketchForkItem, UserFollowerItem, etc.)
- **List Options**: Pagination and sorting parameters (limit, offset, sort)
- **Sketch Info**: Aggregated object containing complete sketch data (metadata, code, files, libraries, parent, author)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 14 OpenProcessing API endpoints are accessible through client methods with 100% coverage
- **SC-002**: Zero direct axios calls exist outside of `src/api/client.js` (verified by code search)
- **SC-003**: All existing test suites pass with 100% success rate without modification
- **SC-004**: Code coverage remains above 90% for all refactored modules
- **SC-005**: All API client methods have JSDoc type annotations with 100% coverage
- **SC-006**: File organization shows clear separation with 3 main directories (api/, download/, cli/) containing logically grouped modules
- **SC-007**: Main `opdl()` function maintains identical behavior verified by integration tests
- **SC-008**: All CLI commands produce identical output format verified by snapshot tests
- **SC-009**: Download time for sketches remains within 5% of current performance
- **SC-010**: Number of files at src/ root reduces from 17 to 2 (index.js, utils.js)
- **SC-011**: All validation logic consolidated into single validator.js module (verified by code search showing no validation in other files)
- **SC-012**: Download service successfully aggregates data from multiple client methods without direct HTTP calls

## Assumptions

1. **OpenProcessing API Stability**: The OpenProcessing API structure documented in openprocessingapi.md is accurate and stable
2. **Test Coverage**: Existing test suite adequately covers current functionality to catch regressions
3. **No Breaking API Changes**: OpenProcessing will not make breaking API changes during the refactor period
4. **Backward Compatibility Window**: Users can tolerate deprecation warnings for fetcher.js for at least one release cycle before removal
5. **Performance Acceptable**: Slight overhead from additional abstraction layers (service layer) is acceptable if within 5% of current performance
6. **No External Dependencies**: No external packages currently depend on internal file structure (only public API)
7. **Migration Time**: Gradual migration approach is acceptable and preferred over big-bang refactor
8. **JSDoc Sufficient**: JSDoc type annotations provide sufficient type safety without requiring TypeScript conversion
9. **Re-export Strategy**: Temporary re-exports at old file locations are acceptable for maintaining backward compatibility during transition
10. **Single Axios Instance**: Using a shared axios instance for all requests won't cause concurrency or configuration conflicts

## Dependencies

- **OpenProcessing API**: All endpoints documented in openprocessingapi.md must remain available and stable
- **axios library**: HTTP client used for making API requests
- **Existing test infrastructure**: Jest/Mocha test framework and existing test patterns
- **Node.js file system APIs**: For file organization and directory creation
- **CLI framework**: Existing command-line parsing and routing infrastructure

## Constraints

- **No Breaking Changes**: Public API and CLI interface must remain unchanged
- **Backward Compatibility Required**: Existing code using opdl must continue to work without modification
- **Test Coverage Threshold**: Must maintain above 90% code coverage throughout refactor
- **Performance Budget**: API call latency must not increase by more than 5%
- **No New Dependencies**: Refactor should not require adding new npm packages
- **Gradual Migration**: Must be implemented in phases to reduce risk of breakage
- **Documentation Required**: All new code must have comprehensive JSDoc documentation

## Future Considerations

The refactored architecture doesn't need to include these features immediately but should be designed to accommodate future enhancements to the OpenProcessing API. Planned features include:

### Token-Based Authentication Support

Token-based authentication for write operations (currently in beta). The refactored architecture should be designed to accommodate future authentication features:

- **Authentication Layer**: The `OpenProcessingClient` class should support optional Bearer token authentication through constructor configuration or setter methods
- **Token Storage**: Consider secure token storage mechanisms (environment variables, config files, system keychain)
- **Auth Headers**: The shared axios instance configuration should conditionally include `Authorization: Bearer <token>` headers when tokens are available
- **Permission Errors**: Validator should handle new error codes related to authentication (401 Unauthorized, 403 Forbidden, 423 Locked)

### Write Endpoint Support (CRUD Operations)

The OpenProcessing API beta includes write endpoints for sketch and code management. Future versions of opdl should support:

#### Sketch Write Operations
- **Create Sketches**: `createSketch(data)` - POST /api/sketch with JSON body containing title, license, description, instructions, mode, isDraft, isPrivate, tags
- **Update Sketches**: `updateSketch(visualID, data)` - PATCH/PUT /api/sketch/{visualID} with partial sketch data
- **Delete Sketches**: `deleteSketch(visualID)` - DELETE /api/sketch/{visualID}

#### Code Tab/File Write Operations
- **Create Code Files**: `createSketchCode(visualID, title, data)` - POST /api/sketch/{visualID}/code/{title} with JSON or plain text body
- **Update Code Files**: `updateSketchCode(visualID, title, data)` - PATCH/PUT /api/sketch/{visualID}/code/{title} with JSON or plain text body
- **Delete Code Files**: `deleteSketchCode(visualID, title?)` - DELETE /api/sketch/{visualID}/code/{title} or DELETE /api/sketch/{visualID}/code to delete all

#### Content Type Handling
- **JSON Mode**: Most write requests require `Content-Type: application/json` with valid JSON body
- **Plain Text Mode**: Code endpoints also accept `Content-Type: text/plain` for raw code strings
- **Error Handling**: Validator should handle 415 Unsupported Media Type and 400 Invalid JSON body errors

#### Validation Requirements
- **Sketch Data Validation**: Validate title length (max 60), description/instructions (max 600), license values, mode values, privacy settings
- **Tags Validation**: Accept both array and comma-separated string formats for tags
- **Required vs Optional Fields**: Create operations require title; update operations require at least one updatable field

#### Permission and State Validation
- **Ownership Checks**: Write operations require user to be sketch owner
- **Locked State**: Handle 423 Locked errors when sketch is frozen (class deadline or curation freeze)
- **Draft/Privacy States**: Support isDraft (boolean) and isPrivate (0=public, 1=private, 2=classOnly, 3=profOnly)

### File Upload Support

The API may eventually support file uploads for sketch assets. Architecture considerations:

- **Multipart Form Data**: Add support for `Content-Type: multipart/form-data` in the HTTP client
- **Binary Data Handling**: Extend validator to handle binary file validation (size limits, file types)
- **Upload Progress**: Consider progress tracking for large file uploads
- **Asset Management**: Extend `getSketchFiles()` to support POST/DELETE operations for asset files

### CLI Enhancement Opportunities

Write endpoint support would enable new CLI workflows:

- **Sketch Management Commands**: `opdl create`, `opdl update`, `opdl delete` for sketch CRUD operations
- **Code Editing Commands**: `opdl code upload`, `opdl code update`, `opdl code delete` for code file management
- **Batch Operations**: Upload multiple code files from local directory to OpenProcessing sketch
- **Sync Workflows**: Bidirectional sync between local filesystem and OpenProcessing sketches
- **Template Generation**: Create sketches from local templates with predefined structure

### Architecture Implications

The refactored architecture should anticipate these future features:

1. **Client Layer**: Design `OpenProcessingClient` to support both GET and write methods (POST/PATCH/PUT/DELETE) with different content types
2. **Service Layer**: Download service may become "SketchService" handling both read and write orchestration
3. **Validator Layer**: Extend validator to handle request body validation in addition to response validation
4. **Error Handling**: Standardize handling of write-specific errors (415, 423, ownership validation)
5. **Testing Strategy**: Add integration tests that mock write operations and validate request payloads
6. **Backward Compatibility**: Write features should be additive and not break existing read-only workflows

### Security Considerations

Write operations introduce new security concerns:

- **Token Security**: Never log or expose API tokens in error messages or debug output
- **Input Sanitization**: Validate and sanitize all user input before sending to API
- **Rate Limiting**: Respect API rate limits for write operations (may differ from read limits)
- **Confirmation Prompts**: CLI should require confirmation for destructive operations (delete)
- **Audit Logging**: Consider logging write operations for debugging and accountability



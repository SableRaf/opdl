# Implementation Plan: Unified Validation System

## Overview
Replace the ad-hoc private sketch handling with a centralized validation system that works across all OpenProcessing resource types (sketches, users, curations).

## Problem Statement
The current implementation (commit `efd25de`) introduces scattered validation logic:
- Multiple boolean flags (`hiddenCode`, `privateSketch`) serving similar purposes
- Duplicate validation checks in multiple locations
- Inconsistent error handling across resource types
- No validation for users and curations despite potential private/unavailable states

## Solution Architecture

### Core Validation Module (`src/validator.js`)
Create a new module that provides:
- Unified validation results with consistent shape: `{ valid, reason, message, data }`
- Standard validation reasons: `not_found`, `private`, `code_hidden`, `deleted`, `api_error`, `invalid_id`
- Resource-specific validators: `validateSketch()`, `validateUser()`, `validateCuration()`
- Reusable helper functions for common validation patterns

### Data Model Changes

#### Current sketch info structure:
```javascript
{
  hiddenCode: boolean,      // Remove
  privateSketch: boolean,   // Remove
  error: string,                 // Deprecated but kept for compatibility
  // ... other fields
}
```

#### New sketch info structure:
```javascript
{
  available: boolean,           // NEW: Simple availability flag
  unavailableReason: string|null, // NEW: Specific reason if unavailable
  error: string,                 // Deprecated but kept for compatibility
  // ... other fields
}
```

## Implementation Steps

### Step 1: Create the Validation Module
**File**: `src/validator.js` (new file)

- Define `ValidationResult` type and constants
- Implement `validateResponse()` - common response validation
- Implement `isPrivateResponse()` - detect private resources
- Implement `isCodeHidden()` - detect hidden code
- Implement `validateSketch()` - sketch-specific validation
- Implement `validateUser()` - user-specific validation
- Implement `validateCuration()` - curation-specific validation
- Export public API and constants

Note: prefer keeping the validator independent of networking; it should operate on API responses so it can be reused by both `src/fetcher.js` and any higher-level callers that use `src/api/client.js`.

### Step 2: Add Tests for Validation Module
**File**: `tests/validator.test.mjs` (new file)

Test coverage for:
- Each validation reason (not_found, private, code_hidden, etc.)
- Each resource type (sketch, user, curation)
- Edge cases (null responses, malformed data, etc.)
- Message formatting and consistency

Add a test for "partial availability" (e.g., public user but hidden/skipped sketches) so the validator can express granular availability when applicable.

### Step 3: Refactor `src/fetcher.js`
**Changes**:
- Remove `isSketchCodeHidden()` function (lines 35-45)
- Remove `isSketchPrivate()` function (lines 47-57)
- Remove `HIDDEN_CODE_MESSAGE` and `PRIVATE_SKETCH_MESSAGE` constants (lines 3-4)
- Update `fetchCodeResponse()`:
  - Remove return properties: `isHidden`, `isPrivate`
  - Remove all validation logic (delegate to validator)
  - Return only: `{ codeParts, error }`
- Update `fetchSketchInfo()`:
  - Import `validateSketch` from validator
  - Remove `hiddenCode` and `privateSketch` from sketchInfo object
  - Add `available` and `unavailableReason` fields
  - Replace scattered validation checks with single `validateSketch()` call
  - Early return if `!validation.valid`
  - Remove redundant error handling

Also: consider (but do not require in this pass) switching `src/fetcher.js` to call the `OpenProcessingClient` in `src/api/client.js` instead of using raw `axios` calls — this unifies the network layer. If that's out of scope now, add a TODO comment in `src/fetcher.js` to centralize networking later.

### Step 4: Update `src/index.js`
**Changes**:
- Remove special case checks for `privateSketch` (lines 53-55)
- Remove special case checks for `hiddenCode` (lines 57-59)
- Replace with single check: `if (!sketchInfo.available)`
- Update result object to include `unavailableReason` if needed
- Simplify control flow

Because this project is pre-release, prefer a breaking change for clarity and simplicity: remove `hiddenCode` and `privateSketch` entirely and expose only `available` and `unavailableReason`.
Bump the package major version when releasing this change.

### Step 5: Add Validation to API Client Commands
**Files**: `src/commands/user.js`, `src/commands/curation.js`

- Import appropriate validators
- Add validation after API calls
- Throw descriptive errors for unavailable resources
- Ensure consistent error messaging

Ensure the validator returns CLI-friendly `message` text so command handlers can print `validation.message` directly without additional mapping. For example: `"This sketch is private and cannot be downloaded."` instead of just `"private"`.

### Step 6: Update Tests
**Files**: `tests/fetcher.test.mjs`, `tests/downloader.test.mjs`

- Update tests expecting `hiddenCode` or `privateSketch` to use new fields
- Remove "mark private sketches" test (line 184-199) - covered by validator tests
- Update "hidden code" tests to use `available` and `unavailableReason`
- Add tests for new validation scenarios
- Ensure all edge cases are covered

Tests should assert the new `available` and `unavailableReason` fields only; backward-compatibility assertions are not required for this pre-release.

### Step 7: Update Documentation
**Files**: `README.md`, API docs (if any)

- Document the new `available` and `unavailableReason` fields
- Mark `hiddenCode` and `privateSketch` as deprecated (if maintaining backward compatibility)
- Document possible `unavailableReason` values
- Update any code examples

Note in the README that the validator's return shape may include a `canRetry` boolean for transient errors (e.g. `api_error`) to help callers decide whether to retry programmatically.

## Backward Compatibility Strategy

This project is pre-release; prefer a breaking change (remove `hiddenCode` and `privateSketch`), bump the major version, and document the new API. Gradual deprecation is available as a future option but is not required now.

## Testing Strategy

### Unit Tests
- Validator logic for all resource types
- All validation reasons and edge cases
- Error message formatting

### Integration Tests
- End-to-end sketch download with various unavailability scenarios
- User command with private users
- Curation command with private curations

### Regression Tests
- Ensure existing functionality unchanged
- Verify error messages are user-friendly
- Check that quiet mode still works

## Success Criteria

- [ ] All validation logic centralized in `src/validator.js`
- [ ] Zero duplicate validation checks across codebase
- [ ] Consistent error handling for sketches, users, and curations
- [ ] All tests passing
- [ ] Code complexity reduced (fewer conditionals, clearer flow)
- [ ] No regression in existing functionality
- [ ] Clear, actionable error messages for users

## Files to Modify

### New Files
- `src/validator.js` - Core validation module
- `tests/validator.test.mjs` - Validator tests

### Modified Files
- `src/fetcher.js` - Remove ad-hoc validation, use validator
- `src/index.js` - Simplify unavailability checks
- `src/commands/user.js` - Add user validation
- `src/commands/curation.js` - Add curation validation
- `tests/fetcher.test.mjs` - Update test expectations
- `tests/downloader.test.mjs` - Update if needed

### Documentation
- `README.md` - Document new fields and behavior

## Estimated Impact

### Lines of Code
- Remove: ~30-40 lines (duplicate validation logic)
- Add: ~150-200 lines (validator module + tests)
- Net: Slight increase, but much better organized

### Complexity
- Reduce cyclomatic complexity in `fetcher.js`
- Eliminate scattered conditionals
- Single source of truth for validation

### Extensibility
- Easy to add new validation reasons
- Easy to add new resource types
- Consistent patterns for all API resources

## Risks and Mitigations

### Risk: Breaking existing integrations
**Mitigation**: Comprehensive test coverage

### Risk: Missing edge cases in validation
**Mitigation**: Thorough testing with real API responses, handle unknown error formats gracefully

### Risk: Performance impact
**Mitigation**: Validation is lightweight, no significant performance impact expected

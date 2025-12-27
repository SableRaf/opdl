# Data Model: OpenProcessing API Architecture Refactor

**Feature Branch**: `001-refactor-api`
**Date**: 2025-12-27

## Overview

This document defines the data structures used throughout the refactored OpenProcessing API architecture. The model is organized into three categories:
1. **API Entities**: Complete objects returned by single-resource endpoints
2. **List Items**: Simplified objects returned by list/collection endpoints
3. **Options & Configuration**: Parameters for API requests and client configuration

## API Entities

These are the complete data structures returned by single-resource endpoints (e.g., `/api/sketch/{id}`, `/api/user/{id}`).

### Sketch Entity

Returned by: `GET /api/sketch/{id}` via `client.getSketch(id)`

**Fields**:
- `visualID` (number): Unique sketch identifier
- `title` (string): Sketch title
- `description` (string): Sketch description
- `instructions` (string): Usage instructions
- `userId` (number): Author's user ID
- `userName` (string): Author's username
- `createdOn` (string): ISO 8601 creation timestamp
- `license` (string): License type (e.g., "CC BY-SA 3.0", "All Rights Reserved")
- `mode` (string): Processing mode (e.g., "p5js", "processingjs", "processing")
- `isDraft` (boolean): Whether sketch is a draft
- `isPrivate` (number): Privacy level (0=public, 1=private, 2=classOnly, 3=profOnly)
- `parentVisualId` (number|null): Parent sketch ID if this is a fork
- `views` (number): View count
- `hearts` (number): Heart count (likes)
- `forks` (number): Fork count
- `tags` (string[]): Array of tag strings

**Validation Rules**:
- Must have `visualID` (number > 0)
- Must have `title` (non-empty string)
- If `success: false` in response, indicates error (private, not found, etc.)

**State Transitions**:
- Draft → Published: `isDraft` changes from true to false (future write operations)
- Public → Private: `isPrivate` changes (future write operations)

### User Entity

Returned by: `GET /api/user/{id}` via `client.getUser(id)`

**Fields**:
- `userId` (number): Unique user identifier
- `username` (string): User's display name
- `firstName` (string): User's first name
- `lastName` (string): User's last name
- `location` (string): User's location
- `about` (string): User bio
- `website` (string): User's website URL
- `createdOn` (string): ISO 8601 registration timestamp
- `sketchCount` (number): Number of sketches created
- `followerCount` (number): Number of followers
- `followingCount` (number): Number of users followed
- `heartCount` (number): Number of hearts received

**Validation Rules**:
- Must have `userId` (number > 0)
- Must have `username` (non-empty string)
- If `success: false` in response, indicates user not found

### Curation Entity

Returned by: `GET /api/curation/{id}` via `client.getCuration(id)`

**Fields**:
- `curationId` (number): Unique curation identifier
- `title` (string): Curation title
- `description` (string): Curation description
- `curatorId` (number): Curator's user ID
- `curatorName` (string): Curator's username
- `createdOn` (string): ISO 8601 creation timestamp
- `sketchCount` (number): Number of sketches in curation
- `isPublic` (boolean): Whether curation is public

**Validation Rules**:
- Must have `curationId` (number > 0)
- Must have `title` (non-empty string)

### Code Entity

Returned by: `GET /api/sketch/{id}/code` via `client.getSketchCode(id)`

**Fields**: Array of code file objects
- `title` (string): File name (e.g., "sketch.js", "particle.js")
- `code` (string): Source code content

**Validation Rules**:
- Must be array (can be empty if no code)
- If `success: false` and `message: "Sketch source code is hidden."`, code is hidden by author
- Each item must have `title` and `code` properties

**Special Cases**:
- Hidden code: Returns `{success: false, message: "Sketch source code is hidden."}`
- Private sketch: Returns `{success: false, message: "private sketch"}`

### Tag Entity

Returned by: `GET /api/tags` via `client.getTags(options)`

**Fields**: Array of tag objects
- `tag` (string): Tag name
- `count` (number): Number of sketches with this tag

**Validation Rules**:
- Must be array
- Each item must have `tag` and `count` properties

## List Items

These are simplified data structures returned by list/collection endpoints. They contain fewer fields than full entities to reduce payload size.

### UserSketchItem

Returned by: `GET /api/user/{id}/sketches` via `client.getUserSketches(id, options)`

**Fields**:
- `visualID` (number): Sketch ID
- `title` (string): Sketch title
- `description` (string): Short description
- `createdOn` (string): Creation timestamp
- `views` (number): View count
- `hearts` (number): Heart count
- `forks` (number): Fork count
- `isDraft` (boolean): Draft status

**Difference from Sketch Entity**: Missing detailed fields like instructions, license, full tag list

### UserFollowerItem / UserFollowingItem

Returned by:
- `GET /api/user/{id}/followers` via `client.getUserFollowers(id, options)`
- `GET /api/user/{id}/following` via `client.getUserFollowing(id, options)`

**Fields**:
- `userId` (number): User ID
- `username` (string): Username
- `location` (string): User location
- `sketchCount` (number): Number of sketches

**Difference from User Entity**: Missing detailed fields like about, website, follower counts

### UserHeartItem

Returned by: `GET /api/user/{id}/hearts` via `client.getUserHearts(id, options)`

**Fields** (sketch that was hearted):
- `visualID` (number): Sketch ID
- `title` (string): Sketch title
- `userName` (string): Sketch author
- `userId` (number): Author's user ID
- `createdOn` (string): Sketch creation timestamp
- `hearts` (number): Heart count

**Difference from Sketch Entity**: Includes author info but less metadata

### SketchFileItem

Returned by: `GET /api/sketch/{id}/files` via `client.getSketchFiles(id, options)`

**Fields**:
- `filename` (string): File name
- `url` (string): Asset URL
- `size` (number): File size in bytes
- `uploadedOn` (string): Upload timestamp

### SketchLibraryItem

Returned by: `GET /api/sketch/{id}/libraries` via `client.getSketchLibraries(id, options)`

**Fields**:
- `name` (string): Library name
- `url` (string): Library URL
- `version` (string): Library version

### SketchForkItem

Returned by: `GET /api/sketch/{id}/forks` via `client.getSketchForks(id, options)`

**Fields** (fork sketch):
- `visualID` (number): Fork sketch ID
- `title` (string): Fork title
- `userName` (string): Fork author
- `userId` (number): Author's user ID
- `createdOn` (string): Fork creation timestamp

### SketchHeartItem

Returned by: `GET /api/sketch/{id}/hearts` via `client.getSketchHearts(id, options)`

**Fields** (user who hearted):
- `userId` (number): User ID
- `username` (string): Username
- `heartedOn` (string): When they hearted the sketch

### CurationSketchItem

Returned by: `GET /api/curation/{id}/sketches` via `client.getCurationSketches(id, options)`

**Fields**:
- `visualID` (number): Sketch ID
- `title` (string): Sketch title
- `userName` (string): Sketch author
- `userId` (number): Author's user ID
- `addedOn` (string): When added to curation

## Options & Configuration

### ListOptions

Used by: All list endpoints (getUserSketches, getUserFollowers, getUserFollowing, getUserHearts, getSketchFiles, getSketchLibraries, getSketchForks, getSketchHearts, getCurationSketches)

**Fields**:
- `limit` (number, optional): Maximum results per page (default varies by endpoint, typically 20-50)
- `offset` (number, optional): Number of results to skip (default 0)
- `sort` (string, optional): Sort order - "asc" or "desc" (default varies by endpoint)

**Validation Rules**:
- `limit`: Must be number > 0 and <= 100 (API limit)
- `offset`: Must be number >= 0
- `sort`: Must be "asc" or "desc" if provided

**Usage Pattern**:
```javascript
const options = { limit: 20, offset: 0, sort: 'desc' };
const sketches = await client.getUserSketches(userId, options);
```

### TagsOptions

Used by: `client.getTags(options)`

**Fields**:
- `duration` (string, optional): Time period - "allTime", "thisYear", "thisMonth", "thisWeek", "today" (default "allTime")
- `limit` (number, optional): Maximum results (default 20)

**Validation Rules**:
- `duration`: Must be one of the allowed values
- `limit`: Must be number > 0 and <= 100

### ValidationResult

Returned by: All validator functions (validateSketch, validateUser, validateCuration, validateListOptions, validateTagsOptions)

**Fields**:
- `valid` (boolean): Whether validation passed
- `reason` (string|null): Specific failure reason from VALIDATION_REASONS ("not_found", "private", "code_hidden", "deleted", "api_error", "invalid_id")
- `message` (string): User-friendly error message
- `data` (any): The original data (validated entity or null on error)
- `canRetry` (boolean): Whether error is transient and retry may succeed

**Usage Pattern**:
```javascript
const validation = validateSketch(apiResponse, { type: 'metadata' });
if (!validation.valid) {
  throw new Error(validation.message);
}
return validation.data;
```

## Service Layer Objects

These objects are created by the service layer to aggregate multiple API calls.

### SketchInfo (Complete Sketch Data)

Created by: `DownloadService.getCompleteSketchInfo(id)` - replaces current `fetchSketchInfo()`

**Fields**:
- `sketchId` (number): Sketch ID
- `isFork` (boolean): Whether sketch is a fork
- `author` (string): Author username
- `title` (string): Sketch title
- `codeParts` (array): Array of {title, code} objects from getSketchCode()
- `files` (array): Asset files from getSketchFiles()
- `libraries` (array): Libraries from getSketchLibraries()
- `mode` (string): Processing mode
- `available` (boolean): Whether sketch is available for download
- `unavailableReason` (string|null): Why unavailable (if applicable)
- `error` (string): Deprecated but kept for backward compatibility
- `parent` (object): Parent sketch info if fork
  - `sketchID` (number|null): Parent sketch ID
  - `author` (string): Parent author username
  - `title` (string): Parent title
- `metadata` (object): Full Sketch entity from getSketch()

**Source API Calls**:
1. `getSketch(id)` → metadata
2. `getSketchCode(id)` → codeParts
3. `getSketchFiles(id)` → files
4. `getSketchLibraries(id)` → libraries
5. `getUser(metadata.userId)` → author info
6. If fork: `getSketch(metadata.parentVisualId)` → parent info
7. If fork: `getUser(parent.userId)` → parent author info

**Purpose**: Provides all data needed for sketch download in single object

## Relationships

```text
Sketch Entity
├── userId → User Entity (author)
├── parentVisualId → Sketch Entity (parent if fork)
└── tags[] → Tag Entity (via getTags)

User Entity
├── getUserSketches() → UserSketchItem[]
├── getUserFollowers() → UserFollowerItem[]
├── getUserFollowing() → UserFollowingItem[]
└── getUserHearts() → UserHeartItem[]

Sketch Entity (extended)
├── getSketchCode() → Code Entity (array of files)
├── getSketchFiles() → SketchFileItem[]
├── getSketchLibraries() → SketchLibraryItem[]
├── getSketchForks() → SketchForkItem[]
└── getSketchHearts() → SketchHeartItem[]

Curation Entity
└── getCurationSketches() → CurationSketchItem[]
```

## Migration Notes

### Backward Compatibility

**SketchInfo Structure**: Must remain identical to current `fetchSketchInfo()` output
- All fields preserved in same positions
- `error` field kept but deprecated (use `unavailableReason`)
- Internal implementation changes but external shape unchanged

**Client API**: New methods are additive
- Existing methods maintain same signatures
- New methods (getUserHearts, getSketchForks, etc.) follow same patterns
- Validation consistent across all methods

### Type Definitions Location

**File**: `src/api/types.js`

All types defined as JSDoc comments for use in other modules:
```javascript
/**
 * @typedef {Object} Sketch
 * @property {number} visualID
 * @property {string} title
 * // ... all fields
 */

/**
 * @typedef {Object} ListOptions
 * @property {number} [limit]
 * @property {number} [offset]
 * @property {string} [sort]
 */
```

Usage in client:
```javascript
/**
 * @param {number} id
 * @param {ListOptions} [options]
 * @returns {Promise<UserSketchItem[]>}
 */
async getUserSketches(id, options = {}) { /* ... */ }
```

## Summary

The data model provides:
1. **Complete API coverage**: All 14 endpoints with proper types
2. **Clear distinctions**: Full entities vs list items vs configuration
3. **Validation consistency**: Standardized ValidationResult across all validators
4. **Service layer support**: SketchInfo aggregates multiple calls
5. **Backward compatibility**: Existing structures preserved

All types will be defined in `src/api/types.js` with comprehensive JSDoc documentation for IDE support and type checking.

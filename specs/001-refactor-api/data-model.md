# Data Model: OpenProcessing API Entities

**Feature Branch**: `001-refactor-api`
**Date**: 2025-12-27
**Source of Truth**: [.claude/openprocessingapi.md](../../.claude/openprocessingapi.md)

## Overview

This document provides complete field mappings for all OpenProcessing API entities. All field names, types, and structures are derived from the official OpenProcessing API documentation to ensure 1:1 API mapping compliance with Constitution Principle I.

**Organization**:
1. **API Entities**: Complete objects returned by single-resource endpoints
2. **List Items**: Simplified objects returned by list/collection endpoints

## API Entities

These are the complete data structures returned by single-resource endpoints.

### Sketch Entity

Returned by: `GET /api/sketch/{id}` via `client.getSketch(id)`

**Fields** (from actual API response):

- `visualID` (number) - Sketch ID (also used for thumbnail URL generation)
- `title` (string) - Sketch title
- `description` (string) - Sketch description
- `instructions` (string) - User instructions for interacting with the sketch
- `tags` (array) - Array of tag strings associated with the sketch
- `license` (string) - License type (e.g., "by-nc-sa")
- `isDraft` (number) - Draft status (0 = published, 1 = draft)
- `createdOn` (string) - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
- `updatedOn` (string | null) - MySQL datetime timestamp, null if never updated
- `filesUpdatedOn` (string | null) - Files update timestamp, null if no file updates
- `thumbnailUpdatedOn` (string) - Thumbnail update timestamp
- `videoUpdatedOn` (string | null) - Video update timestamp, null if no video
- `parentID` (number | null) - Parent sketch ID if this is a fork, null if original
- `engineID` (number) - Processing engine version ID
- `engineURL` (string) - CDN URL for the selected p5.js/processing.js engine
- `fileBase` (string) - S3 base URL for sketch assets
- `isTutorial` (number) - Tutorial flag (0 = not tutorial, 1 = tutorial)
- `isTemplate` (number) - Template flag (0 = not template, 1 = template)
- `hasTimeline` (number) - Timeline feature flag (0 = no timeline, 1 = has timeline)
- `userID` (number) - ID of sketch creator
- `mode` (string) - Sketch mode: "p5js", "processingjs", "html", or "applet"
- `libraries` (array) - Array of Library objects (see Library entity)
- `templateID` (number | null) - Template ID if based on template, null otherwise

**Notes**:
- Numeric flags (isDraft, isTutorial, isTemplate, hasTimeline) are returned as numbers (0 or 1), NOT strings
- IDs (visualID, userID, parentID, engineID, templateID) are returned as numbers, NOT strings
- Timestamps use MySQL datetime format (YYYY-MM-DD HH:MM:SS), NOT ISO 8601
- The `videoUpdatedOn` field was added after the initial API documentation

---

### User Entity

Returned by: `GET /api/user/{id}` via `client.getUser(id)`

**Fields** (from openprocessingapi.md lines 82-90):

- `userID` (string) - Unique user identifier
- `fullname` (string) - User's display name
- `bio` (string) - User biography/description
- `memberSince` (string) - MySQL datetime timestamp of account creation
- `website` (string) - User's website URL
- `location` (string) - User's location string

**Additional Fields** (from list item examples, lines 201-210):

- `membershipType` (string) - Membership tier:
  - "0" = free account
  - "1" = plus account
  - "2" = pro account
  - "3" = educator account

**Notes**:
- `membershipType` appears in list endpoints but not documented in single user endpoint
- All IDs and membership types are strings

---

### Curation Entity

Returned by: `GET /api/curation/{id}` via `client.getCuration(id)`

**Fields** (from openprocessingapi.md lines 812-818):

- `collectionID` (string) - Unique curation identifier
- `title` (string) - Curation title
- `description` (string) - Curation description (can be markdown/long text)
- `createdOn` (string) - MySQL datetime timestamp
- `userID` (string) - ID of curation creator

**Important API Mapping Note**:
- The API returns `collectionID` as the field name (NOT `curationID`)
- Our client methods use parameter name `curationId` for consistency
- Internal mapping: method parameter `curationId` → API field `collectionID`

---

### CodeFile Entity

Returned by: `GET /api/sketch/{id}/code` via `client.getSketchCode(id)` (array of CodeFile objects)

**Fields** (from openprocessingapi.md lines 473-490):

- `codeID` (string) - Unique code file identifier
- `orderID` (string) - Tab order (numeric string: "0" = first tab, "1" = second, etc.)
- `code` (string) - Full source code content
- `title` (string) - Tab/file title
- `createdOn` (string) - MySQL datetime timestamp
- `updatedOn` (string) - MySQL datetime timestamp

**Important Notes**:
- `orderID` is critical for maintaining correct execution order
- Files must be loaded in ascending `orderID` order
- Despite being numeric semantically, `orderID` is returned as a string

---

### Tag Entity

Returned by: `GET /api/tags` via `client.getTags(options)` (array of Tag objects)

**Fields** (from openprocessingapi.md lines 1177-1180):

- `tag` (string) - Tag name/text
- `quantity` (string) - Number of sketches using this tag

**Important API Quirk**:
- Despite representing a count, `quantity` is returned as a string ("10283", NOT 10283)

---

### Library Entity

Library reference embedded in Sketch entity's `libraries` array field.

**Fields** (from openprocessingapi.md lines 420-427):

- `libraryID` (string) - Unique library identifier
- `url` (string) - CDN URL for the library JavaScript file

**Context**:
- Appears as array element in Sketch.libraries
- Also returned as standalone array from `/api/sketch/{id}/libraries` endpoint

## List Items

These are simplified data structures returned by list/collection endpoints with pagination support.

### UserSketchItem

Returned by: `GET /api/user/{id}/sketches` via `client.getUserSketches(id, options)`

**Fields** (from openprocessingapi.md lines 125-157):

- `visualID` (string) - Sketch ID
- `title` (string) - Sketch title
- `description` (string) - Sketch description

---

### UserFollowerItem / UserFollowingItem

Returned by:
- `GET /api/user/{id}/followers` via `client.getUserFollowers(id, options)`
- `GET /api/user/{id}/following` via `client.getUserFollowing(id, options)`

**Fields** (from openprocessingapi.md lines 201-210, 280-299):

- `userID` (string) - User ID
- `fullname` (string) - User display name
- `membershipType` (string) - Membership tier ("0", "1", "2", "3")
- `followedOn` (string) - MySQL datetime timestamp of when follow occurred

---

### UserHeartItem

Returned by: `GET /api/user/{id}/hearts` via `client.getUserHearts(id, options)`

**Fields** (from openprocessingapi.md lines 342-365):

- `visualID` (string) - Sketch ID
- `title` (string) - Sketch title
- `mode` (string) - Sketch mode ("p5js", "processingjs", "html", "applet")

---

### SketchFile

Returned by: `GET /api/sketch/{id}/files` via `client.getSketchFiles(id, options)`

**Fields** (from openprocessingapi.md lines 528-534):

- `name` (string) - Filename (e.g., "example.png")
- `lastModified` (string) - ISO 8601 timestamp with timezone
- `size` (string) - File size in bytes (returned as string)
- `url` (string) - S3 URL for downloading the file

---

### SketchForkItem

Returned by: `GET /api/sketch/{id}/forks` via `client.getSketchForks(id, options)`

**Fields** (from openprocessingapi.md lines 633-681):

- `visualID` (string) - Fork sketch ID
- `title` (string) - Fork title
- `userID` (string) - Fork creator user ID
- `fullname` (string) - Fork creator display name
- `createdOn` (string) - Fork creation timestamp
- `updatedOn` (string) - Fork last update timestamp

---

### SketchHeartItem

Returned by: `GET /api/sketch/{id}/hearts` via `client.getSketchHearts(id, options)`

**Fields** (from openprocessingapi.md lines 722-772):

- `userID` (string) - User ID who hearted
- `fullname` (string) - User display name
- `createdOn` (string) - MySQL datetime timestamp of when heart occurred

---

### CurationSketchItem

Returned by: `GET /api/curation/{id}/sketches` via `client.getCurationSketches(id, options)`

**Fields** (from openprocessingapi.md lines 860-1135):

- `visualID` (string) - Sketch ID
- `title` (string) - Sketch title
- `description` (string) - Sketch description
- `userID` (string) - Sketch creator user ID
- `parentID` (string | null) - Parent sketch ID if fork, "0" or null if original
- `thumbnailUpdatedOn` (string) - Thumbnail update timestamp
- `fullname` (string) - Sketch creator display name
- `membershipType` (string) - Creator membership tier ("0", "1", "2", "3")
- `status` (string) - Approval status ("1" = approved, only approved shown in API)
- `submittedOn` (string) - Timestamp of submission to curation

**Notes**:
- Only approved and public sketches appear in this list
- Pending/rejected submissions are filtered out by the API

## Parameter Types

### ListOptions

Used by: All list endpoints (getUserSketches, getUserFollowers, getUserFollowing, getUserHearts, getSketchFiles, getSketchLibraries, getSketchForks, getSketchHearts, getCurationSketches, getTags)

**Fields** (from openprocessingapi.md lines 37-41):

- `limit` (number, optional) - Maximum results per page (1-100, default 20)
- `offset` (number, optional) - Number of results to skip (≥0, default 0)
- `sort` (string, optional) - Sort order: "asc" or "desc" (default "desc")

**Validation Rules** (from clarification session FR-038):
- `limit`: Must be number in range 1-100, default 20 if undefined
- `offset`: Must be number ≥ 0, default 0 if undefined
- `sort`: Must be "asc" or "desc" enum value, default "desc" if undefined
- Return ValidationResult with normalized values

---

### TagsOptions

Used by: `client.getTags(options)`

**Fields** (from openprocessingapi.md lines 1141-1148):

- `limit` (number, optional) - Maximum results (1-100, default 20)
- `offset` (number, optional) - Number of results to skip (≥0, default 0)
- `duration` (string, optional) - Time period: "thisWeek" | "thisMonth" | "thisYear" | "anytime" (default "anytime")

**Validation Rules** (from clarification session FR-039):
- Extends ListOptions validation
- `duration`: Must be one of the four allowed enum values, default "anytime" if undefined
- Return ValidationResult with normalized values

**Note**: `sort` parameter not documented for tags endpoint in API docs

---

### ValidationResult

Returned by: All validator functions in `src/api/validator.js`

**Fields** (from clarification session FR-012, FR-040):

- `valid` (boolean) - Whether validation passed
- `message` (string) - Developer-facing validation message (may contain technical details)
- `data` (any) - Normalized/validated data if valid, original data if invalid
- `meta` (object, optional) - Response metadata like `{ hasMore: boolean }` for list endpoints

**Usage Pattern**:
```javascript
const validation = validateListOptions({ limit: 50, offset: 10 });
if (!validation.valid) {
  throw new Error(validation.message);
}
// Use validation.data (normalized options)
```

---

## Validation Scope

Per FR-011 (updated in remediation):

**Required Validation**:
- Top-level required field presence
- Correct types (string/number/array/object)
- Array structure validation

**Optional Validation**:
- Deep nested object validation

**Example**:
- MUST validate: Sketch object has `visualID` (string), `libraries` (array)
- MAY validate: Each library object in `libraries` array has valid `libraryID` and `url`

---

## Cross-Reference

All entity field definitions are sourced from the official OpenProcessing API documentation at `.claude/openprocessingapi.md`. Any discrepancies between this document and the API documentation should be resolved in favor of the API documentation (source of truth).

**Verification Process** (per SC-013):
Compare JSDoc typedefs in `src/api/types.js` against the example responses in `openprocessingapi.md` to ensure complete field coverage.

---

## Type Definitions

**Location**: `src/api/types.js`

All entity types will be defined as JSDoc typedefs following the format specified in the remediation plan:

```javascript
/**
 * @typedef {Object} Sketch
 * @property {string} visualID - Unique sketch identifier
 * @property {string} title - Sketch title
 * @property {string} [parentID] - Parent sketch ID if this is a fork
 * // ... all other fields
 */
```

**JSDoc Format Guidelines** (from remediation M-6):
- Use `@typedef` JSDoc syntax
- Include field descriptions from OpenProcessing API docs
- Mark optional fields with `[fieldName]` syntax
- Document nullable fields with `| null` type union

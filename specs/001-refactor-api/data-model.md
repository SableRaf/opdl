# Data Model: OpenProcessing API Entities

**Feature Branch**: `001-refactor-api`
**Date**: 2025-12-27
**Source of Truth**: Actual API responses (verified via curl on 2025-12-27)
**Reference**: [.claude/openprocessingapi.md](../../.claude/openprocessingapi.md) (documentation is outdated/incomplete)

## Overview

This document provides complete field mappings for all OpenProcessing API entities. All field names, types, and structures are derived from **actual API responses** verified via curl, as the official documentation was found to contain numerous inaccuracies and omissions.

**⚠️ Documentation Discrepancies**: The API documentation in openprocessingapi.md contains incorrect field names, missing fields, and wrong data types. This document reflects the actual API behavior.

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

**Fields** (from actual API response):

- `userID` (number) - Unique user identifier
- `fullname` (string) - User's display name
- `bio` (string) - User biography/description
- `createdOn` (string) - MySQL datetime timestamp of account creation (YYYY-MM-DD HH:MM:SS)
- `website` (string) - User's website URL
- `location` (string) - User's location string

**Additional Fields in List Endpoints**:

- `membershipType` (number) - Membership tier:
  - 0 = free account
  - 1 = plus account
  - 2 = pro account
  - 3 = educator account

**⚠️ Documentation Error**:
- **WRONG**: Documentation shows `memberSince`
- **ACTUAL**: API returns `createdOn`
- `userID` is a **number**, not a string
- `membershipType` is a **number**, not a string

---

### Curation Entity

Returned by: `GET /api/curation/{id}` via `client.getCuration(id)`

**Fields** (from actual API response):

- `title` (string) - Curation title
- `description` (string) - Curation description (can be markdown/long text)
- `userID` (number) - ID of curation creator
- `createdOn` (string) - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
- `curationID` (number) - Unique curation identifier

**⚠️ Important API Behavior**:
- Field order in response: title, description, userID, createdOn, curationID
- The API returns `curationID` as the field name (verified in actual response)
- Documentation showed `collectionID` but actual API uses `curationID`
- `curationID` and `userID` are **numbers**, not strings

---

### CodeFile Entity

Returned by: `GET /api/sketch/{id}/code` via `client.getSketchCode(id)` (array of CodeFile objects)

**Fields** (from actual API response):

- `codeID` (number) - Unique code file identifier
- `orderID` (number) - Tab order (0 = first tab, 1 = second, etc.)
- `code` (string) - Full source code content
- `title` (string) - Tab/file title
- `updatedOn` (string) - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
- `createdOn` (string) - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)

**Important Notes**:
- `orderID` is critical for maintaining correct execution order
- Files must be loaded in ascending `orderID` order
- **⚠️ Type Error**: `codeID` and `orderID` are **numbers**, not strings

---

### Tag Entity

Returned by: `GET /api/tags` via `client.getTags(options)` (array of Tag objects)

**Fields** (from actual API response):

- `tag` (string) - Tag name/text
- `quantity` (number) - Number of sketches using this tag

**⚠️ Documentation Error**:
- **WRONG**: Documentation shows `quantity` as string
- **ACTUAL**: API returns `quantity` as **number**

---

### Library Entity

Library reference embedded in Sketch entity's `libraries` array field.

**Fields** (from actual API response):

- `libraryID` (number) - Unique library identifier
- `url` (string) - CDN URL for the library JavaScript file

**Context**:
- Appears as array element in Sketch.libraries
- Also returned as standalone array from `/api/sketch/{id}/libraries` endpoint

**⚠️ Type Error**:
- `libraryID` is a **number**, not a string

## List Items

These are simplified data structures returned by list/collection endpoints with pagination support.

### UserSketchItem

Returned by: `GET /api/user/{id}/sketches` via `client.getUserSketches(id, options)`

**Fields** (from actual API response):

- `visualID` (number) - Sketch ID
- `title` (string) - Sketch title
- `description` (string) - Sketch description
- `instructions` (string | null) - User instructions for interacting with the sketch
- `createdOn` (string) - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
- `mode` (string) - Sketch mode: "p5js", "processingjs", "html", or "applet"

**⚠️ Missing Fields in Documentation**:
- Documentation omits: `instructions`, `createdOn`, `mode`
- `visualID` is a **number**, not a string

---

### UserFollowerItem / UserFollowingItem

Returned by:
- `GET /api/user/{id}/followers` via `client.getUserFollowers(id, options)`
- `GET /api/user/{id}/following` via `client.getUserFollowing(id, options)`

**Fields** (from actual API response):

- `userID` (number) - User ID
- `fullname` (string) - User display name
- `membershipType` (number) - Membership tier (0, 1, 2, or 3)
- `followedOn` (string) - MySQL datetime timestamp of when follow occurred (YYYY-MM-DD HH:MM:SS)

**⚠️ Type Errors**:
- `userID` is a **number**, not a string
- `membershipType` is a **number**, not a string

---

### UserHeartItem

Returned by: `GET /api/user/{id}/hearts` via `client.getUserHearts(id, options)`

**Fields** (from actual API response):

- `visualID` (number) - Sketch ID
- `title` (string) - Sketch title
- `mode` (string) - Sketch mode ("p5js", "processingjs", "html", "applet")

**⚠️ Type Error**:
- `visualID` is a **number**, not a string

---

### SketchFile

Returned by: `GET /api/sketch/{id}/files` via `client.getSketchFiles(id, options)`

**Fields** (from actual API response - based on documentation example):

- `name` (string) - Filename (e.g., "example.png")
- `lastModified` (string) - ISO 8601 timestamp with timezone (e.g., "2023-09-13T12:25:24+00:00")
- `size` (string) - File size in bytes (returned as string)
- `url` (string) - S3 URL for downloading the file

**Note**: Could not verify with actual data as test sketches had no uploaded files

---

### SketchForkItem

Returned by: `GET /api/sketch/{id}/forks` via `client.getSketchForks(id, options)`

**Fields** (from actual API response):

- `visualID` (number) - Fork sketch ID
- `title` (string) - Fork title
- `userID` (number) - Fork creator user ID
- `fullname` (string) - Fork creator display name
- `createdOn` (string) - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
- `updatedOn` (string) - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)

**⚠️ Type Errors**:
- `visualID` is a **number**, not a string
- `userID` is a **number**, not a string

---

### SketchHeartItem

Returned by: `GET /api/sketch/{id}/hearts` via `client.getSketchHearts(id, options)`

**Fields** (from actual API response):

- `userID` (number) - User ID who hearted
- `fullname` (string) - User display name
- `createdOn` (string) - MySQL datetime timestamp of when heart occurred (YYYY-MM-DD HH:MM:SS)

**⚠️ Type Error**:
- `userID` is a **number**, not a string

---

### CurationSketchItem

Returned by: `GET /api/curation/{id}/sketches` via `client.getCurationSketches(id, options)`

**Fields** (from actual API response):

- `visualID` (number) - Sketch ID
- `title` (string) - Sketch title
- `description` (string) - Sketch description
- `instructions` (string) - User instructions for interacting with the sketch
- `parentID` (number | null) - Parent sketch ID if fork, null if original
- `thumbnailUpdatedOn` (string) - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
- `videoUpdatedOn` (string | null) - Video update timestamp, null if no video
- `mode` (string) - Sketch mode ("p5js", "processingjs", "html", "applet")
- `createdOn` (string) - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
- `userID` (number) - Sketch creator user ID
- `fullname` (string) - Sketch creator display name
- `membershipType` (number) - Creator membership tier (0, 1, 2, or 3)
- `submittedOn` (string) - MySQL datetime timestamp of submission to curation
- `status` (number) - Approval status (1 = approved, only approved shown in API)

**⚠️ Missing Fields in Documentation**:
- Documentation omits: `instructions`, `videoUpdatedOn`, `mode`, `createdOn`

**⚠️ Type Errors**:
- All numeric IDs and flags are **numbers**, not strings
- `parentID` can be `null` (not "0" or string "null")

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
- MUST validate: Sketch object has `visualID` (number), `libraries` (array)
- MAY validate: Each library object in `libraries` array has valid `libraryID` and `url`

---

## API Documentation vs Reality: Summary of Discrepancies

**Verified on**: 2025-12-27 via curl requests to all documented endpoints

### Critical Field Name Errors

| Endpoint | Documentation Says | API Actually Returns |
|----------|-------------------|---------------------|
| GET /api/user/{id} | `memberSince` | `createdOn` |
| GET /api/curation/{id} | `collectionID` | `curationID` |

### Critical Type Mismatches

**All numeric IDs returned as numbers, NOT strings**:
- `userID`, `visualID`, `codeID`, `orderID`, `libraryID`, `engineID`, `parentID`, `templateID`, `curationID`

**All boolean flags returned as numbers (0/1), NOT strings**:
- `isDraft`, `isTutorial`, `isTemplate`, `hasTimeline`, `status`

**All membership types returned as numbers, NOT strings**:
- `membershipType`: 0, 1, 2, or 3 (not "0", "1", "2", "3")

**Tag quantities returned as numbers, NOT strings**:
- `quantity` in Tag entity

### Missing Fields in Documentation

**User Sketches** (`GET /api/user/{id}/sketches`):
- Missing: `instructions`, `createdOn`, `mode`

**Curation Sketches** (`GET /api/curation/{id}/sketches`):
- Missing: `instructions`, `videoUpdatedOn`, `mode`, `createdOn`

**Sketch Entity** (`GET /api/sketch/{id}`):
- Missing: `videoUpdatedOn` (new field added after docs were written)

### Null Handling

Fields that can be `null` (not "0", "null" as string, or missing):
- `parentID`, `templateID`, `updatedOn`, `filesUpdatedOn`, `videoUpdatedOn`, `instructions`

### Response Headers

**Pagination metadata** in HTTP headers:
- `hasmore`: "true" or "false" (lowercase string in header)
- This header is present but format differs from docs

---

## Cross-Reference

**⚠️ IMPORTANT**: The official OpenProcessing API documentation at `.claude/openprocessingapi.md` contains numerous errors and omissions. This document reflects the actual API behavior verified via curl.

**Source of Truth**: Actual API responses take precedence over documentation.

**Verification Process** (per SC-013):
1. All field definitions verified via curl on 2025-12-27
2. Compare JSDoc typedefs in `src/api/types.js` against this document (not openprocessingapi.md)
3. When in doubt, test against the live API

---

## Type Definitions

**Location**: `src/api/types.js`

All entity types will be defined as JSDoc typedefs following the format specified in the remediation plan:

```javascript
/**
 * @typedef {Object} Sketch
 * @property {number} visualID - Unique sketch identifier
 * @property {string} title - Sketch title
 * @property {number|null} parentID - Parent sketch ID if this is a fork, null if original
 * @property {number} isDraft - Draft status (0 = published, 1 = draft)
 * @property {Library[]} libraries - Array of library objects
 * // ... all other fields
 */
```

**JSDoc Format Guidelines** (from remediation M-6):
- Use `@typedef` JSDoc syntax
- Include field descriptions from this verified data model
- Use correct types: `number` for IDs/flags, `string` for text, `null` for nullable fields
- Document nullable fields with `|null` type union (e.g., `{number|null}`)
- Mark truly optional fields (might not be present) with `[fieldName]` syntax

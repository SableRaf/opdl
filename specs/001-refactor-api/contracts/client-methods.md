# OpenProcessingClient Method Contracts

**Feature Branch**: `001-refactor-api`
**Date**: 2025-12-27
**Source**: Remediation Plan CR-3

This document defines explicit method contracts for all 14 OpenProcessing API client methods, specifying parameter types, return types, and the distinction between single entity endpoints and list endpoints.

## Return Type Conventions

**Single Entity Endpoints** (return raw data object):
- `getUser(userId)` → `Promise<User>`
- `getSketch(sketchId)` → `Promise<Sketch>`
- `getCuration(curationId)` → `Promise<Curation>`

**List Endpoints** (return `{ data, hasMore }` structure):
- All list methods return `Promise<{ data: T[], hasMore: boolean }>`
- `hasMore` indicates whether more results are available beyond the current page
- Parsed from response headers per FR-038

**Special Endpoint**:
- `getSketchCode(sketchId)` → `Promise<CodeFile[]>` (returns array directly, not paginated)

---

## Method Contracts

### Single Entity Endpoints

```typescript
getUser(userId: number|string): Promise<User>
getSketch(sketchId: number|string): Promise<Sketch>
getCuration(curationId: number|string): Promise<Curation>
```

### List Endpoints

```typescript
getUserSketches(userId: number|string, options?: ListOptions): Promise<{ data: UserSketchItem[], hasMore: boolean }>
getUserFollowers(userId: number|string, options?: ListOptions): Promise<{ data: UserFollowerItem[], hasMore: boolean }>
getUserFollowing(userId: number|string, options?: ListOptions): Promise<{ data: UserFollowingItem[], hasMore: boolean }>
getUserHearts(userId: number|string, options?: ListOptions): Promise<{ data: UserHeartItem[], hasMore: boolean }>
getSketchForks(sketchId: number|string, options?: ListOptions): Promise<{ data: SketchForkItem[], hasMore: boolean }>
getSketchHearts(sketchId: number|string, options?: ListOptions): Promise<{ data: SketchHeartItem[], hasMore: boolean }>
getSketchFiles(sketchId: number|string, options?: ListOptions): Promise<{ data: SketchFile[], hasMore: boolean }>
getSketchLibraries(sketchId: number|string, options?: ListOptions): Promise<{ data: Library[], hasMore: boolean }>
getCurationSketches(curationId: number|string, options?: ListOptions): Promise<{ data: CurationSketchItem[], hasMore: boolean }>
getTags(options?: TagsOptions): Promise<{ data: Tag[], hasMore: boolean }>
```

### Special Endpoint

```typescript
getSketchCode(sketchId: number|string): Promise<CodeFile[]>
// Note: Returns array directly (not paginated per API docs)
```

---

## Parameter Types

### ListOptions

```typescript
{
  limit?: number    // 1-100, default 20
  offset?: number   // ≥0, default 0
  sort?: "asc" | "desc"  // default "desc"
}
```

### TagsOptions

```typescript
{
  limit?: number    // 1-100, default 20
  offset?: number   // ≥0, default 0
  sort?: "asc" | "desc"  // default "desc"
  duration?: "thisWeek" | "thisMonth" | "thisYear" | "anytime"  // default "anytime"
}
```

**Note**: TagsOptions extends ListOptions with additional `duration` parameter. The `sort` parameter is not documented for the tags endpoint in the OpenProcessing API but it DOES function.

---

## Detailed Method Signatures

### Class Constructor

```javascript
/**
 * Create a new OpenProcessing API client
 * @param {string} [apiKey] - Optional API key for authenticated requests (future use)
 */
constructor(apiKey)
```

**Example**:
```javascript
const client = new OpenProcessingClient();
// or with auth (future)
const authenticatedClient = new OpenProcessingClient('your-api-key');
```

## Sketch Methods

### getSketch

```javascript
/**
 * Get sketch metadata
 * @param {number|string} sketchId - Sketch ID
 * @returns {Promise<Sketch>} Sketch metadata
 * @throws {Error} If sketch is not found, private, or API returns an error
 */
async getSketch(sketchId)
```

**Example**:
```javascript
const sketch = await client.getSketch(123456);
console.log(sketch.title, sketch.userID, sketch.mode);
```

### getSketchCode

```javascript
/**
 * Get sketch source code
 * @param {string} sketchId - Sketch ID
 * @returns {Promise<CodeFile[]>} Array of code files
 * @throws {Error} If code is hidden or sketch is private
 */
async getSketchCode(sketchId)
```

**Example**:
```javascript
const codeParts = await client.getSketchCode("123456");
// Returns array directly (NOT wrapped in { data, hasMore })
codeParts.forEach(file => {
  console.log(`File: ${file.title} (order: ${file.orderID})`);
  console.log(file.code);
});
```

**Note**: This endpoint returns a raw array, not the `{ data, hasMore }` structure used by other list endpoints, because the API docs indicate it's not paginated.

### getSketchFiles

```javascript
/**
 * Get sketch asset files
 * @param {string} sketchId - Sketch ID
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<{data: SketchFile[], hasMore: boolean}>} Files and pagination info
 */
async getSketchFiles(sketchId, options = {})
```

**Example**:
```javascript
const result = await client.getSketchFiles("123456", { limit: 10 });
result.data.forEach(file => {
  console.log(`${file.name} (${file.size} bytes) - ${file.url}`);
});
if (result.hasMore) {
  console.log("More files available");
}
```

### getSketchLibraries

```javascript
/**
 * Get sketch libraries
 * @param {string} sketchId - Sketch ID
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<{data: Library[], hasMore: boolean}>} Libraries and pagination info
 */
async getSketchLibraries(sketchId, options = {})
```

**Example**:
```javascript
const result = await client.getSketchLibraries("123456");
result.data.forEach(lib => {
  console.log(`Library ${lib.libraryID}: ${lib.url}`);
});
```

### getSketchForks

```javascript
/**
 * Get sketch forks
 * @param {string} sketchId - Sketch ID
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<{data: SketchForkItem[], hasMore: boolean}>} Forks and pagination info
 */
async getSketchForks(sketchId, options = {})
```

**Example**:
```javascript
const result = await client.getSketchForks("123456", { limit: 20, sort: 'desc' });
console.log(`Found ${result.data.length} forks`);
if (result.hasMore) {
  // Can fetch more with increased offset
}
```

### getSketchHearts

```javascript
/**
 * Get users who hearted a sketch
 * @param {string} sketchId - Sketch ID
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<{data: SketchHeartItem[], hasMore: boolean}>} Hearts and pagination info
 */
async getSketchHearts(sketchId, options = {})
```

**Example**:
```javascript
const result = await client.getSketchHearts("123456");
result.data.forEach(heart => {
  console.log(`${heart.fullname} hearted on ${heart.createdOn}`);
});
```

## User Methods

### getUser

```javascript
/**
 * Get user information
 * @param {string} userId - User ID
 * @returns {Promise<User>} User information
 * @throws {Error} If user is not found or API returns an error
 */
async getUser(userId)
```

**Example**:
```javascript
const user = await client.getUser("1");
console.log(user.fullname, user.bio, user.memberSince);
```

### getUserSketches

```javascript
/**
 * Get user sketches
 * @param {string} userId - User ID
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<{data: UserSketchItem[], hasMore: boolean}>} Sketches and pagination info
 */
async getUserSketches(userId, options = {})
```

**Example**:
```javascript
const result = await client.getUserSketches("1", { limit: 50, offset: 0 });
result.data.forEach(sketch => {
  console.log(`${sketch.visualID}: ${sketch.title}`);
});
```

### getUserFollowers

```javascript
/**
 * Get user followers
 * @param {string} userId - User ID
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<{data: UserFollowerItem[], hasMore: boolean}>} Followers and pagination info
 */
async getUserFollowers(userId, options = {})
```

**Example**:
```javascript
const result = await client.getUserFollowers("1");
console.log(`${result.data.length} followers`);
if (result.hasMore) {
  // More followers available
}
```

### getUserFollowing

```javascript
/**
 * Get users being followed
 * @param {string} userId - User ID
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<{data: UserFollowingItem[], hasMore: boolean}>} Following and pagination info
 */
async getUserFollowing(userId, options = {})
```

**Example**:
```javascript
const result = await client.getUserFollowing("1");
console.log(`Following ${result.data.length} users`);
```

### getUserHearts

```javascript
/**
 * Get sketches hearted by user
 * @param {string} userId - User ID
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<{data: UserHeartItem[], hasMore: boolean}>} Hearts and pagination info
 */
async getUserHearts(userId, options = {})
```

**Example**:
```javascript
const result = await client.getUserHearts("1", { limit: 30 });
result.data.forEach(heart => {
  console.log(`Hearted: ${heart.title} (${heart.mode})`);
});
```

## Curation Methods

### getCuration

```javascript
/**
 * Get curation metadata
 * @param {string} curationId - Curation ID
 * @returns {Promise<Curation>} Curation metadata
 * @throws {Error} If curation is not found or API returns an error
 */
async getCuration(curationId)
```

**Example**:
```javascript
const curation = await client.getCuration("78544");
console.log(curation.title, curation.userID, curation.collectionID);
```

**Note**: API returns `collectionID` field, not `curationID`.

### getCurationSketches

```javascript
/**
 * Get sketches in curation
 * @param {string} curationId - Curation ID
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<{data: CurationSketchItem[], hasMore: boolean}>} Sketches and pagination info
 */
async getCurationSketches(curationId, options = {})
```

**Example**:
```javascript
const result = await client.getCurationSketches("78544");
result.data.forEach(sketch => {
  console.log(`${sketch.title} by ${sketch.fullname} (submitted ${sketch.submittedOn})`);
});
```

## Tags Methods

### getTags

```javascript
/**
 * Get popular tags
 * @param {TagsOptions} [options] - Tags query options
 * @returns {Promise<{data: Tag[], hasMore: boolean}>} Tags and pagination info
 */
async getTags(options = {})
```

**Example**:
```javascript
const result = await client.getTags({ duration: 'thisWeek', limit: 10 });
result.data.forEach(tag => {
  console.log(`${tag.tag}: ${tag.quantity} sketches`);  // Note: quantity is a string
});
```

## Method Summary Table

| Method | Endpoint | Returns | New in Refactor |
|--------|----------|---------|-----------------|
| `getSketch(id)` | `/api/sketch/{id}` | `Sketch` | ❌ Existing |
| `getSketchCode(id)` | `/api/sketch/{id}/code` | `CodeFile[]` | ⚠️ Adds validation |
| `getSketchFiles(id, opts)` | `/api/sketch/{id}/files` | `SketchFile[]` | ❌ Existing |
| `getSketchLibraries(id, opts)` | `/api/sketch/{id}/libraries` | `Library[]` | ❌ Existing |
| `getSketchForks(id, opts)` | `/api/sketch/{id}/forks` | `SketchForkItem[]` | ✅ New |
| `getSketchHearts(id, opts)` | `/api/sketch/{id}/hearts` | `SketchHeartItem[]` | ✅ New |
| `getUser(id)` | `/api/user/{id}` | `User` | ❌ Existing |
| `getUserSketches(id, opts)` | `/api/user/{id}/sketches` | `UserSketchItem[]` | ❌ Existing |
| `getUserFollowers(id, opts)` | `/api/user/{id}/followers` | `UserFollowerItem[]` | ✅ New |
| `getUserFollowing(id, opts)` | `/api/user/{id}/following` | `UserFollowingItem[]` | ✅ New |
| `getUserHearts(id, opts)` | `/api/user/{id}/hearts` | `UserHeartItem[]` | ✅ New |
| `getCuration(id)` | `/api/curation/{id}` | `Curation` | ❌ Existing |
| `getCurationSketches(id, opts)` | `/api/curation/{id}/sketches` | `CurationSketchItem[]` | ✅ New |
| `getTags(opts)` | `/api/tags` | `Tag[]` | ✅ New |

**Total**: 14 methods (7 existing, 1 enhanced, 6 new)

## Error Handling

All methods follow consistent error handling:

1. **Network/HTTP errors**: Throw generic Error with message
2. **Validation errors**: Throw Error with validation.message from validator
3. **Expected API errors** (404, 403): Throw Error with user-friendly message

**Example Error Handling**:
```javascript
try {
  const sketch = await client.getSketch(123456);
} catch (error) {
  if (error.message.includes('private')) {
    console.error('Sketch is private');
  } else if (error.message.includes('not found')) {
    console.error('Sketch does not exist');
  } else {
    console.error('API error:', error.message);
  }
}
```

## Validation

All methods validate:
- **Request parameters**: IDs must be valid (numbers > 0 or non-empty strings)
- **List options**: limit, offset, sort validated via `validateListOptions()`
- **API responses**: Validated via appropriate validator function before returning

**Validation Flow**:
```javascript
async getSketch(id) {
  // 1. Make HTTP request
  const response = await this.client.get(`/api/sketch/${id}`);

  // 2. Validate response
  const validation = validateSketch(response.data, { type: 'metadata' });

  // 3. Throw on validation failure
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  // 4. Return validated data
  return response.data;
}
```

## Type Definitions

All types are defined in `src/api/types.js` with JSDoc comments:

```javascript
/**
 * @typedef {Object} ListOptions
 * @property {number} [limit] - Maximum results (1-100)
 * @property {number} [offset] - Skip N results (>= 0)
 * @property {'asc'|'desc'} [sort] - Sort order
 */

/**
 * @typedef {Object} TagsOptions
 * @property {'allTime'|'thisYear'|'thisMonth'|'thisWeek'|'today'} [duration='allTime']
 * @property {number} [limit=20] - Maximum tags (1-100)
 */

/**
 * @typedef {Object} Sketch
 * @property {number} visualID
 * @property {string} title
 * @property {string} description
 * // ... all fields from data-model.md
 */

// ... all other types
```

## Backward Compatibility

**Existing methods maintain signatures**:
- `getSketch()`, `getUser()`, `getCuration()` - no changes
- `getUserSketches()`, `getSketchFiles()`, `getSketchLibraries()` - no changes
- `getSketchCode()` - adds validation but maintains signature

**New methods follow established patterns**:
- Same `options` parameter structure as existing list methods
- Same error handling approach
- Same validation flow

No breaking changes to public API.

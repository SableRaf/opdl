# OpenProcessingClient Method Signatures

**Feature Branch**: `001-refactor-api`
**Date**: 2025-12-27

This document defines the JavaScript/JSDoc method signatures for the `OpenProcessingClient` class.

## Class Constructor

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
 * @param {number} id - Sketch ID
 * @returns {Promise<Sketch>} Sketch metadata
 * @throws {Error} If sketch is not found, private, or API returns an error
 */
async getSketch(id)
```

**Example**:
```javascript
const sketch = await client.getSketch(123456);
console.log(sketch.title, sketch.userName, sketch.hearts);
```

### getSketchCode

```javascript
/**
 * Get sketch source code
 * @param {number} id - Sketch ID
 * @returns {Promise<CodeFile[]>} Array of code files with {title, code} structure
 * @throws {Error} If code is hidden or sketch is private
 */
async getSketchCode(id)
```

**Example**:
```javascript
const codeParts = await client.getSketchCode(123456);
codeParts.forEach(file => {
  console.log(`File: ${file.title}`);
  console.log(file.code);
});
```

### getSketchFiles

```javascript
/**
 * Get sketch asset files
 * @param {number} id - Sketch ID
 * @param {ListOptions} [options] - Pagination and sorting options
 * @param {number} [options.limit] - Maximum number of results
 * @param {number} [options.offset] - Number of results to skip
 * @param {'asc'|'desc'} [options.sort] - Sort order
 * @returns {Promise<SketchFile[]>} Array of asset files
 */
async getSketchFiles(id, options = {})
```

**Example**:
```javascript
const files = await client.getSketchFiles(123456, { limit: 10 });
files.forEach(file => {
  console.log(`${file.filename} (${file.size} bytes) - ${file.url}`);
});
```

### getSketchLibraries

```javascript
/**
 * Get sketch libraries
 * @param {number} id - Sketch ID
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<Library[]>} Array of libraries
 */
async getSketchLibraries(id, options = {})
```

**Example**:
```javascript
const libraries = await client.getSketchLibraries(123456);
libraries.forEach(lib => {
  console.log(`${lib.name} ${lib.version} - ${lib.url}`);
});
```

### getSketchForks

```javascript
/**
 * Get sketch forks
 * @param {number} id - Sketch ID
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<SketchForkItem[]>} Array of fork sketches
 */
async getSketchForks(id, options = {})
```

**Example**:
```javascript
const forks = await client.getSketchForks(123456, { limit: 20, sort: 'desc' });
console.log(`Found ${forks.length} forks`);
```

### getSketchHearts

```javascript
/**
 * Get users who hearted a sketch
 * @param {number} id - Sketch ID
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<SketchHeartItem[]>} Array of users who hearted
 */
async getSketchHearts(id, options = {})
```

**Example**:
```javascript
const hearts = await client.getSketchHearts(123456);
hearts.forEach(heart => {
  console.log(`${heart.username} hearted on ${heart.heartedOn}`);
});
```

## User Methods

### getUser

```javascript
/**
 * Get user information
 * @param {number|string} id - User ID or username
 * @returns {Promise<User>} User information
 * @throws {Error} If user is not found or API returns an error
 */
async getUser(id)
```

**Example**:
```javascript
const user = await client.getUser(12345);
// or by username
const userByName = await client.getUser('username');
console.log(user.username, user.sketchCount, user.followerCount);
```

### getUserSketches

```javascript
/**
 * Get user sketches
 * @param {number|string} id - User ID or username
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<UserSketchItem[]>} Array of user sketches
 */
async getUserSketches(id, options = {})
```

**Example**:
```javascript
const sketches = await client.getUserSketches('username', { limit: 50, offset: 0 });
sketches.forEach(sketch => {
  console.log(`${sketch.title} - ${sketch.hearts} hearts, ${sketch.views} views`);
});
```

### getUserFollowers

```javascript
/**
 * Get user followers
 * @param {number|string} id - User ID or username
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<UserFollowerItem[]>} Array of followers
 */
async getUserFollowers(id, options = {})
```

**Example**:
```javascript
const followers = await client.getUserFollowers('username');
console.log(`${followers.length} followers`);
```

### getUserFollowing

```javascript
/**
 * Get users being followed
 * @param {number|string} id - User ID or username
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<UserFollowingItem[]>} Array of users being followed
 */
async getUserFollowing(id, options = {})
```

**Example**:
```javascript
const following = await client.getUserFollowing(12345);
console.log(`Following ${following.length} users`);
```

### getUserHearts

```javascript
/**
 * Get sketches hearted by user
 * @param {number|string} id - User ID or username
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<UserHeartItem[]>} Array of hearted sketches
 */
async getUserHearts(id, options = {})
```

**Example**:
```javascript
const hearts = await client.getUserHearts('username', { limit: 30 });
hearts.forEach(heart => {
  console.log(`Hearted: ${heart.title} by ${heart.userName}`);
});
```

## Curation Methods

### getCuration

```javascript
/**
 * Get curation metadata
 * @param {number} id - Curation ID
 * @returns {Promise<Curation>} Curation metadata
 * @throws {Error} If curation is not found or API returns an error
 */
async getCuration(id)
```

**Example**:
```javascript
const curation = await client.getCuration(789);
console.log(curation.title, curation.curatorName, curation.sketchCount);
```

### getCurationSketches

```javascript
/**
 * Get sketches in curation
 * @param {number} id - Curation ID
 * @param {ListOptions} [options] - Pagination and sorting options
 * @returns {Promise<CurationSketchItem[]>} Array of sketches in curation
 */
async getCurationSketches(id, options = {})
```

**Example**:
```javascript
const sketches = await client.getCurationSketches(789);
sketches.forEach(sketch => {
  console.log(`${sketch.title} by ${sketch.userName} (added ${sketch.addedOn})`);
});
```

## Tags Methods

### getTags

```javascript
/**
 * Get popular tags
 * @param {TagsOptions} [options] - Tags query options
 * @param {'allTime'|'thisYear'|'thisMonth'|'thisWeek'|'today'} [options.duration='allTime'] - Time period
 * @param {number} [options.limit=20] - Maximum number of tags
 * @returns {Promise<Tag[]>} Array of popular tags
 */
async getTags(options = {})
```

**Example**:
```javascript
const popularTags = await client.getTags({ duration: 'thisWeek', limit: 10 });
popularTags.forEach(tag => {
  console.log(`${tag.tag}: ${tag.count} sketches`);
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

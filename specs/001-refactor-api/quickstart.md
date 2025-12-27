# Quickstart Guide: OpenProcessing API Refactor

**Feature Branch**: `001-refactor-api`
**Date**: 2025-12-27

This guide helps developers implement the OpenProcessing API architecture refactor. Follow the phases in order to minimize risk and maintain backward compatibility.

## Prerequisites

Before starting implementation:

1. **Read the design documents**:
   - [spec.md](spec.md) - Feature requirements and user stories
   - [research.md](research.md) - Architectural decisions and patterns
   - [data-model.md](data-model.md) - Entity definitions and relationships
   - [contracts/](contracts/) - API contracts and method signatures

2. **Verify environment**:
   ```bash
   node --version  # Should be >= 14.0.0
   npm test        # All existing tests should pass
   npm run test:coverage  # Should be > 90%
   ```

3. **Understand current structure**:
   ```bash
   # Current key files
   src/api/client.js     # Partially implemented client (7/14 endpoints)
   src/fetcher.js        # Legacy fetcher with business logic
   src/validator.js      # Centralized validation
   src/downloader.js     # Download orchestration
   ```

## Implementation Phases

### Phase 1: Complete API Client Layer

**Goal**: Implement all 14 OpenProcessing API endpoints with consistent validation

**Tasks**:

1. **Add missing client methods** in `src/api/client.js`:
   ```javascript
   // New methods to add:
   async getSketchForks(id, options = {}) { /* ... */ }
   async getSketchHearts(id, options = {}) { /* ... */ }
   async getUserFollowers(id, options = {}) { /* ... */ }
   async getUserFollowing(id, options = {}) { /* ... */ }
   async getUserHearts(id, options = {}) { /* ... */ }
   async getCurationSketches(id, options = {}) { /* ... */ }
   async getTags(options = {}) { /* ... */ }
   ```

   **Pattern to follow** (from existing `getUserSketches`):
   ```javascript
   async getUserSketches(id, options = {}) {
     const response = await this.client.get(`/api/user/${id}/sketches`, {
       params: options,
     });
     return response.data;
   }
   ```

2. **Add validation to `getSketchCode()`**:
   ```javascript
   async getSketchCode(id) {
     const response = await this.client.get(`/api/sketch/${id}/code`, {
       validateStatus: () => true
     });
     const validation = validateSketch(response.data, { type: 'code' });

     if (!validation.valid) {
       throw new Error(validation.message);
     }

     return validation.data;  // Returns validated codeParts array
   }
   ```

3. **Add validation functions** in `src/validator.js`:
   ```javascript
   /**
    * Validate list options (limit, offset, sort)
    * @param {Object} options - List options
    * @returns {ValidationResult}
    */
   const validateListOptions = (options = {}) => {
     const { limit, offset, sort } = options;

     if (limit !== undefined) {
       if (typeof limit !== 'number' || limit < 1 || limit > 100) {
         return {
           valid: false,
           reason: VALIDATION_REASONS.INVALID_ID,
           message: 'Limit must be a number between 1 and 100',
           data: null,
           canRetry: false,
         };
       }
     }

     if (offset !== undefined) {
       if (typeof offset !== 'number' || offset < 0) {
         return {
           valid: false,
           reason: VALIDATION_REASONS.INVALID_ID,
           message: 'Offset must be a number >= 0',
           data: null,
           canRetry: false,
         };
       }
     }

     if (sort !== undefined) {
       if (sort !== 'asc' && sort !== 'desc') {
         return {
           valid: false,
           reason: VALIDATION_REASONS.INVALID_ID,
           message: 'Sort must be "asc" or "desc"',
           data: null,
           canRetry: false,
         };
       }
     }

     return {
       valid: true,
       reason: null,
       message: '',
       data: options,
       canRetry: false,
     };
   };

   /**
    * Validate tags options
    * @param {Object} options - Tags options
    * @returns {ValidationResult}
    */
   const validateTagsOptions = (options = {}) => {
     const { duration, limit } = options;
     const validDurations = ['allTime', 'thisYear', 'thisMonth', 'thisWeek', 'today'];

     if (duration !== undefined && !validDurations.includes(duration)) {
       return {
         valid: false,
         reason: VALIDATION_REASONS.INVALID_ID,
         message: `Duration must be one of: ${validDurations.join(', ')}`,
         data: null,
         canRetry: false,
       };
     }

     if (limit !== undefined) {
       if (typeof limit !== 'number' || limit < 1 || limit > 100) {
         return {
           valid: false,
           reason: VALIDATION_REASONS.INVALID_ID,
           message: 'Limit must be a number between 1 and 100',
           data: null,
           canRetry: false,
         };
       }
     }

     return {
       valid: true,
       reason: null,
       message: '',
       data: options,
       canRetry: false,
     };
   };

   module.exports = {
     // ... existing exports
     validateListOptions,
     validateTagsOptions,
   };
   ```

4. **Create type definitions** in `src/api/types.js`:
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
    * // ... all properties from data-model.md
    */

   // ... all other type definitions from data-model.md
   ```

5. **Write tests** in `tests/api/client.test.mjs`:
   ```javascript
   import { describe, it, expect, beforeEach, afterEach } from 'vitest';
   import nock from 'nock';
   import { OpenProcessingClient } from '../../src/api/client.js';

   describe('OpenProcessingClient - New Methods', () => {
     let client;

     beforeEach(() => {
       client = new OpenProcessingClient();
     });

     afterEach(() => {
       nock.cleanAll();
     });

     describe('getSketchForks', () => {
       it('should fetch sketch forks', async () => {
         const mockForks = [
           { visualID: 789, title: 'Fork 1', userName: 'user1' }
         ];

         nock('https://openprocessing.org')
           .get('/api/sketch/123/forks')
           .reply(200, mockForks);

         const forks = await client.getSketchForks(123);
         expect(forks).toEqual(mockForks);
       });

       it('should pass options as query params', async () => {
         nock('https://openprocessing.org')
           .get('/api/sketch/123/forks')
           .query({ limit: 10, offset: 20, sort: 'desc' })
           .reply(200, []);

         await client.getSketchForks(123, { limit: 10, offset: 20, sort: 'desc' });
       });
     });

     // ... tests for other new methods
   });
   ```

**Verification**:
```bash
npm test -- tests/api/client.test.mjs
npm run test:coverage  # Should maintain > 90%
```

### Phase 2: Create Download Service Layer

**Goal**: Extract orchestration logic from fetcher.js into service layer

**Tasks**:

1. **Create service** in `src/download/service.js`:
   ```javascript
   /**
    * Download Service
    * Orchestrates multiple API calls to aggregate sketch data
    */

   class DownloadService {
     /**
      * @param {OpenProcessingClient} client - API client instance
      */
     constructor(client) {
       this.client = client;
     }

     /**
      * Get complete sketch information for download
      * @param {number} id - Sketch ID
      * @param {Object} [options] - Options
      * @param {boolean} [options.quiet=false] - Suppress console output
      * @returns {Promise<SketchInfo>} Complete sketch data
      */
     async getCompleteSketchInfo(id, options = {}) {
       const { quiet = false } = options;

       // Initialize result structure (matches current fetchSketchInfo)
       const sketchInfo = {
         sketchId: id,
         isFork: false,
         author: '',
         title: '',
         codeParts: [],
         files: [],
         libraries: [],
         mode: '',
         available: true,
         unavailableReason: null,
         error: '', // Deprecated but kept for compatibility
         parent: {
           sketchID: null,
           author: '',
           title: '',
         },
         metadata: {},
       };

       try {
         // 1. Fetch sketch metadata
         const sketch = await this.client.getSketch(id);
         sketchInfo.metadata = sketch;
         sketchInfo.title = sketch.title;
         sketchInfo.mode = sketch.mode;
         sketchInfo.isFork = !!sketch.parentVisualId;

         // 2. Fetch author info
         const author = await this.client.getUser(sketch.userId);
         sketchInfo.author = author.username;

         // 3. Fetch code (handle hidden/private)
         try {
           const code = await this.client.getSketchCode(id);
           sketchInfo.codeParts = code;
         } catch (error) {
           // Code hidden or private - set availability
           sketchInfo.available = false;
           sketchInfo.unavailableReason = error.message;
           sketchInfo.error = error.message; // Deprecated field
           return sketchInfo;
         }

         // 4. Fetch files and libraries (parallel)
         const [files, libraries] = await Promise.all([
           this.client.getSketchFiles(id),
           this.client.getSketchLibraries(id),
         ]);
         sketchInfo.files = files;
         sketchInfo.libraries = libraries;

         // 5. If fork, fetch parent info
         if (sketchInfo.isFork) {
           try {
             const parent = await this.client.getSketch(sketch.parentVisualId);
             const parentAuthor = await this.client.getUser(parent.userId);
             sketchInfo.parent = {
               sketchID: parent.visualID,
               author: parentAuthor.username,
               title: parent.title,
             };
           } catch (error) {
             // Parent not available - not critical
             if (!quiet) {
               console.warn(`Could not fetch parent sketch: ${error.message}`);
             }
           }
         }

         return sketchInfo;

       } catch (error) {
         // Handle errors (not found, private, etc.)
         sketchInfo.available = false;
         sketchInfo.unavailableReason = error.message;
         sketchInfo.error = error.message;
         return sketchInfo;
       }
     }
   }

   module.exports = { DownloadService };
   ```

2. **Update downloader.js** to use service:
   ```javascript
   const { OpenProcessingClient } = require('./api/client');
   const { DownloadService } = require('./download/service');
   const { fetchSketchInfo } = require('./fetcher'); // Temporary - will deprecate

   // In download function:
   async function downloadSketch(sketchId, options = {}) {
     // Option 1: Use new service (preferred)
     const client = new OpenProcessingClient();
     const service = new DownloadService(client);
     const sketchInfo = await service.getCompleteSketchInfo(sketchId, { quiet });

     // Option 2: Use old fetcher (deprecated, for comparison)
     // const sketchInfo = await fetchSketchInfo(sketchId, { quiet });

     // Rest of download logic unchanged...
   }
   ```

3. **Write service tests** in `tests/download/service.test.mjs`:
   ```javascript
   import { describe, it, expect, vi } from 'vitest';
   import { DownloadService } from '../../src/download/service.js';

   describe('DownloadService', () => {
     it('should aggregate sketch data correctly', async () => {
       const mockClient = {
         getSketch: vi.fn().mockResolvedValue({
           visualID: 123,
           title: 'Test Sketch',
           userId: 456,
           mode: 'p5js',
           parentVisualId: null,
         }),
         getUser: vi.fn().mockResolvedValue({ username: 'testuser' }),
         getSketchCode: vi.fn().mockResolvedValue([{ title: 'sketch.js', code: '// code' }]),
         getSketchFiles: vi.fn().mockResolvedValue([]),
         getSketchLibraries: vi.fn().mockResolvedValue([]),
       };

       const service = new DownloadService(mockClient);
       const result = await service.getCompleteSketchInfo(123);

       expect(result).toMatchObject({
         sketchId: 123,
         title: 'Test Sketch',
         author: 'testuser',
         mode: 'p5js',
         isFork: false,
         available: true,
         codeParts: [{ title: 'sketch.js', code: '// code' }],
       });
     });

     // ... more tests for forks, errors, etc.
   });
   ```

**Verification**:
```bash
npm test -- tests/download/service.test.mjs
# Verify download still works:
node bin/opdl.js 123456  # Should download identical to before
```

### Phase 3: Reorganize File Structure

**Goal**: Move files into api/, download/, cli/ directories with re-exports for compatibility

**Tasks**:

1. **Create directory structure**:
   ```bash
   mkdir -p src/api src/download src/cli/commands
   mkdir -p tests/api tests/download tests/cli/commands
   ```

2. **Move API files**:
   ```bash
   # Already in src/api/client.js
   mv src/validator.js src/api/validator.js
   mv src/types/api.js src/api/types.js
   ```

3. **Move download files**:
   ```bash
   mv src/downloader.js src/download/downloader.js
   mv src/htmlGenerator.js src/download/htmlGenerator.js
   mv src/codeAttributor.js src/download/codeAttributor.js
   mv src/licenseHandler.js src/download/licenseHandler.js
   mv src/metadataWriter.js src/download/metadataWriter.js
   mv src/serverRunner.js src/download/serverRunner.js
   mv src/viteScaffolder.js src/download/viteScaffolder.js
   # service.js already created in Phase 2
   ```

4. **Move CLI files**:
   ```bash
   mv src/cli.js src/cli/index.js
   mv src/formatters.js src/cli/formatters.js
   # Merge fieldRegistry + fieldSelector into fields.js:
   cat src/fieldRegistry.js src/fieldSelector.js > src/cli/fields.js
   # Commands already in src/commands/, move to src/cli/commands/
   mv src/commands/* src/cli/commands/
   ```

5. **Update import paths** in all moved files:
   ```javascript
   // Before: const { validateSketch } = require('./validator');
   // After:  const { validateSketch } = require('../api/validator');

   // Before: const { OpenProcessingClient } = require('./api/client');
   // After:  const { OpenProcessingClient } = require('../api/client');
   ```

6. **Create deprecation re-exports** for old paths:
   ```javascript
   // src/fetcher.js (deprecated re-export)
   const { DownloadService } = require('./download/service');
   const { OpenProcessingClient } = require('./api/client');

   console.warn(
     'WARNING: fetcher.js is deprecated and will be removed in v1.0.0. ' +
     'Use src/download/service.js (DownloadService) instead.'
   );

   // Provide backward-compatible wrapper
   const fetchSketchInfo = async (sketchId, options) => {
     const client = new OpenProcessingClient();
     const service = new DownloadService(client);
     return service.getCompleteSketchInfo(sketchId, options);
   };

   module.exports = { fetchSketchInfo };
   ```

7. **Update main entry point** (`src/index.js`):
   ```javascript
   // Keep public API unchanged
   const { downloadSketch } = require('./download/downloader');
   const { OpenProcessingClient } = require('./api/client');

   // Main opdl function
   async function opdl(sketchId, options = {}) {
     return downloadSketch(sketchId, options);
   }

   module.exports = opdl;
   module.exports.downloadSketch = downloadSketch;
   module.exports.OpenProcessingClient = OpenProcessingClient;
   ```

8. **Move test files** to match source structure:
   ```bash
   # Tests should mirror src/ structure
   mv tests/client.test.mjs tests/api/client.test.mjs
   mv tests/validator.test.mjs tests/api/validator.test.mjs
   # etc.
   ```

**Verification**:
```bash
npm test  # All tests should pass
node bin/opdl.js 123456  # Should work identically
npm run test:coverage  # Should maintain > 90%
```

### Phase 4: Finalize and Document

**Goal**: Clean up, verify backward compatibility, update documentation

**Tasks**:

1. **Run full test suite**:
   ```bash
   npm test
   npm run test:coverage
   ```

2. **Verify CLI commands**:
   ```bash
   node bin/opdl.js 123456
   node bin/opdl.js sketch 123456 --info title,author
   node bin/opdl.js user testuser sketches --limit 5
   node bin/opdl.js curation 789 sketches
   ```

3. **Test programmatic API**:
   ```javascript
   // test-api.js
   const opdl = require('./src/index.js');
   const { OpenProcessingClient } = require('./src/index.js');

   (async () => {
     // Test main function
     await opdl(123456, { quiet: true });

     // Test client directly
     const client = new OpenProcessingClient();
     const sketch = await client.getSketch(123456);
     console.log(sketch.title);

     const tags = await client.getTags({ duration: 'thisWeek', limit: 10 });
     console.log(tags);
   })();
   ```

4. **Update documentation**:
   - Update README.md with new API client methods
   - Add migration guide for internal API changes
   - Document deprecation timeline for fetcher.js
   - Add examples using new endpoints

5. **Create CHANGELOG entry**:
   ```markdown
   ## [0.5.0] - 2025-XX-XX

   ### Added
   - Complete OpenProcessing API coverage (14 endpoints total)
   - New client methods: `getSketchForks()`, `getSketchHearts()`, `getUserFollowers()`,
     `getUserFollowing()`, `getUserHearts()`, `getCurationSketches()`, `getTags()`
   - Centralized validation for all API operations
   - Organized file structure (api/, download/, cli/ directories)
   - Comprehensive JSDoc type definitions

   ### Changed
   - Refactored internal architecture (no breaking changes to public API)
   - Improved error handling consistency
   - Added validation to `getSketchCode()` method

   ### Deprecated
   - `src/fetcher.js` - Use `DownloadService` from `src/download/service.js` instead

   ### Fixed
   - Consistent error messages across all API operations
   ```

## Common Issues and Solutions

### Issue: Import paths broken after reorganization

**Solution**: Use find-replace to update all imports:
```bash
# Find all require/import statements that need updating
grep -r "require('./validator')" src/
grep -r "require('./api/client')" src/

# Update systematically from innermost to outermost directories
```

### Issue: Tests failing after moving files

**Solution**: Update test imports and ensure mocks use new paths:
```javascript
// Update imports
import { OpenProcessingClient } from '../../src/api/client.js';

// Update dynamic imports if using vi.mock()
vi.mock('../../src/api/validator.js', () => ({ /* ... */ }));
```

### Issue: Backward compatibility broken

**Solution**: Ensure re-exports exist at old locations:
```javascript
// src/fetcher.js must still export fetchSketchInfo
// src/index.js must still export opdl as default and named exports
```

### Issue: Coverage drops below 90%

**Solution**: Add tests for new methods and edge cases:
```javascript
// Test each new endpoint
// Test validation functions
// Test error paths
```

## Next Steps After Implementation

1. **Deploy to test environment**: Verify in real usage
2. **Beta release**: Get user feedback on new endpoints
3. **Gather performance data**: Confirm < 5% latency increase
4. **Plan fetcher.js removal**: Target v1.0.0 for removal
5. **Consider CLI enhancements**: Expose new endpoints via commands

## Getting Help

- **Spec questions**: Refer to [spec.md](spec.md)
- **Design questions**: Check [research.md](research.md)
- **API structure**: See [data-model.md](data-model.md) and [contracts/](contracts/)
- **Constitution alignment**: Review [.specify/memory/constitution.md](../../.specify/memory/constitution.md)

## Summary Checklist

Before merging:

- [ ] All 14 API endpoints implemented
- [ ] All endpoints have validation
- [ ] JSDoc types defined for all entities
- [ ] Files organized into api/, download/, cli/
- [ ] Re-exports for backward compatibility
- [ ] All tests passing
- [ ] Coverage > 90%
- [ ] CLI commands work identically
- [ ] Programmatic API unchanged
- [ ] Documentation updated
- [ ] CHANGELOG entry added

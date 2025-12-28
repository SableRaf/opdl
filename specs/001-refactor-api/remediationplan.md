# Remediation Plan for Specification Analysis Issues

**Document Version:** 1.0
**Date:** 2025-12-27
**Feature:** 001-refactor-api
**Based on:** Specification Analysis Report (post-clarification session)

---

## Executive Summary

The clarification session resolved **5 critical ambiguities** related to pagination, parameter validation, and data modeling. However, the analysis identified **additional gaps** that require spec and plan updates before implementation. This remediation plan addresses:

- **3 Remaining Critical Issues** (data model completeness, response header parsing, contract specifications)
- **8 High-Priority Issues** (missing fields in entity types, test coverage gaps)
- **6 Medium-Priority Issues** (documentation, edge cases)

**Total Remediation Tasks:** 17
**Estimated Effort:** 2-3 hours of spec/plan updates
**Target Completion:** Before running `/speckit.implement`

---

## Phase 1: CRITICAL - Spec & Plan Updates (MUST Complete First)

### CR-1: Update data-model.md with Complete API Field Mappings

**Issue:** Missing 8+ fields in Sketch entity, incomplete User/CodeFile/Curation types
**Severity:** CRITICAL
**Rationale:** Violates constitution principle I (1:1 API mapping), breaks FR-033

**Actions:**

1. Create or update `specs/001-refactor-api/data-model.md`
2. Document **Sketch** entity with ALL fields from API docs:
   ```
   - visualID, title, description, instructions, tags, license
   - isDraft, createdOn, updatedOn, filesUpdatedOn, thumbnailUpdatedOn
   - parentID, engineID, engineURL, fileBase
   - isTutorial, isTemplate, hasTimeline
   - userID, mode, libraries (array)
   ```
3. Document **User** entity with ALL fields:
   ```
   - userID, fullname, bio, memberSince, website, location
   - membershipType (0=free, 1=plus, 2=pro, 3=educator - from API examples)
   ```
4. Document **CodeFile** entity with ALL fields:
   ```
   - codeID, orderID, code, title
   - createdOn, updatedOn
   ```
5. Document **Curation** entity, clarify collectionID vs curationID:
   ```
   - collectionID (API field name)
   - title, description, createdOn, userID
   Note: spec should use "curationId" in method params but map to "collectionID" from API
   ```
6. Document **Tag** entity:
   ```
   - tag (string), quantity (string - note: API returns as string, not number)
   ```

**Acceptance Criteria:**
- All 5 entity types fully documented with field names, types, and notes
- Reference to openprocessingapi.md as source of truth
- Any discrepancies (like Tag.quantity being string) documented

**Files to Update:**
- Create/update: `specs/001-refactor-api/data-model.md`

---

### CR-2: Add Response Header Parsing to Plan & Tasks

**Issue:** No implementation plan for parsing `hasMore` from response headers
**Severity:** CRITICAL
**Rationale:** FR-038 requires it, but no tasks exist to implement it

**Actions:**

1. Update `specs/001-refactor-api/plan.md`:
   - Add to Technical Context: "Response header parsing required for hasMore pagination indicator"
   - Add to client.js implementation notes: "Must extract hasMore boolean from response headers for all list endpoints"

2. Update `specs/001-refactor-api/tasks.md`:
   - Insert new task after T011:
     ```
     T011b [US1] Implement response header parsing utility in src/api/client.js
     - Parse hasMore boolean from axios response headers
     - Return { data: response.data, hasMore: headers.hasMore || false }
     - Handle missing header gracefully (default false)
     ```
   - Update T015-T021 descriptions to include: "Return { data, hasMore } structure"
   - Update T023-T029 test descriptions to include: "Verify hasMore field in response"

**Acceptance Criteria:**
- Plan documents header parsing requirement
- New task T011b created
- All list endpoint tasks (T015-T021) updated to mention return structure
- All list endpoint tests (T023-T029) updated to verify hasMore

**Files to Update:**
- `specs/001-refactor-api/plan.md`
- `specs/001-refactor-api/tasks.md`

---

### CR-3: Create Client Method Contract Documentation

**Issue:** No explicit contract documentation for client method signatures
**Severity:** CRITICAL
**Rationale:** "1:1 API mapping" claim needs concrete contracts

**Actions:**

1. Create `specs/001-refactor-api/contracts/client-methods.md`:
   ```markdown
   # OpenProcessingClient Method Contracts

   ## Single Entity Endpoints (return raw data)
   - getUser(userId: string): Promise<User>
   - getSketch(sketchId: string): Promise<Sketch>
   - getCuration(curationId: string): Promise<Curation>

   ## List Endpoints (return { data, hasMore })
   - getUserSketches(userId, options?: ListOptions): Promise<{ data: UserSketchItem[], hasMore: boolean }>
   - getUserFollowers(userId, options?: ListOptions): Promise<{ data: UserFollowerItem[], hasMore: boolean }>
   - getUserFollowing(userId, options?: ListOptions): Promise<{ data: UserFollowingItem[], hasMore: boolean }>
   - getUserHearts(userId, options?: ListOptions): Promise<{ data: UserHeartItem[], hasMore: boolean }>
   - getSketchForks(sketchId, options?: ListOptions): Promise<{ data: SketchForkItem[], hasMore: boolean }>
   - getSketchHearts(sketchId, options?: ListOptions): Promise<{ data: SketchHeartItem[], hasMore: boolean }>
   - getSketchFiles(sketchId, options?: ListOptions): Promise<{ data: SketchFile[], hasMore: boolean }>
   - getSketchLibraries(sketchId, options?: ListOptions): Promise<{ data: Library[], hasMore: boolean }>
   - getCurationSketches(curationId, options?: ListOptions): Promise<{ data: CurationSketchItem[], hasMore: boolean }>
   - getTags(options?: TagsOptions): Promise<{ data: Tag[], hasMore: boolean }>

   ## Special Endpoints
   - getSketchCode(sketchId: string): Promise<CodeFile[]>
     Note: Returns array directly (not paginated per API docs)

   ## Parameter Types
   - ListOptions: { limit?: number (1-100, default 20), offset?: number (≥0, default 0), sort?: "asc"|"desc" (default "desc") }
   - TagsOptions: extends ListOptions with { duration?: "thisWeek"|"thisMonth"|"thisYear"|"anytime" (default "anytime") }
   ```

2. Reference this file in plan.md under "Project Structure > Documentation"

**Acceptance Criteria:**
- All 14 client methods documented with TypeScript-style signatures
- Return types explicitly show { data, hasMore } for list endpoints
- Parameter types documented with constraints and defaults
- File linked from plan.md

**Files to Create:**
- `specs/001-refactor-api/contracts/client-methods.md`

**Files to Update:**
- `specs/001-refactor-api/plan.md` (add reference)

---

## Phase 2: HIGH PRIORITY - Data Model & Test Coverage

### H-1: Update Type Definition Tasks with Complete Field Lists

**Issue:** Tasks T003-T010 don't specify which fields to include
**Severity:** HIGH
**Rationale:** Implementer won't know which fields to add without spec

**Actions:**

Update `specs/001-refactor-api/tasks.md`:

```markdown
- [ ] T003 [P] Create JSDoc type definitions for Sketch entity in src/api/types.js
  Acceptance: Include ALL fields from openprocessingapi.md: visualID, title, description, instructions, tags, license, isDraft, createdOn, updatedOn, filesUpdatedOn, thumbnailUpdatedOn, parentID, engineID, engineURL, fileBase, isTutorial, isTemplate, hasTimeline, userID, mode, libraries

- [ ] T004 [P] Create JSDoc type definitions for User entity in src/api/types.js
  Acceptance: Include ALL fields: userID, fullname, bio, memberSince, website, location, membershipType

- [ ] T005 [P] Create JSDoc type definitions for Curation entity in src/api/types.js
  Acceptance: Include ALL fields: collectionID (note: API uses collectionID, not curationID), title, description, createdOn, userID

- [ ] T006 [P] Create JSDoc type definitions for CodeFile entity in src/api/types.js
  Acceptance: Include ALL fields: codeID, orderID, code, title, createdOn, updatedOn

- [ ] T007 [P] Create JSDoc type definitions for Tag entity in src/api/types.js
  Acceptance: Include ALL fields: tag (string), quantity (string - note API returns string)
```

**Files to Update:**
- `specs/001-refactor-api/tasks.md`

---

### H-2: Add Multi-Page Pagination Integration Test

**Issue:** No integration test for hasMore pagination flow
**Severity:** HIGH
**Rationale:** Critical feature lacks end-to-end validation

**Actions:**

Update `specs/001-refactor-api/tasks.md`, insert after T030:

```markdown
- [ ] T030b [US1] Write integration test for multi-page pagination flow in tests/api/client.test.mjs
  Acceptance Criteria:
  - Mock API returning { data: [...], headers: { hasMore: true } } for first page
  - Call getUserSketches with limit=10, offset=0
  - Verify hasMore=true in first response
  - Call getUserSketches with limit=10, offset=10
  - Mock second page returning { data: [...], headers: { hasMore: false } }
  - Verify hasMore=false in second response
  - Verify correct data concatenation across pages
```

**Files to Update:**
- `specs/001-refactor-api/tasks.md`

---

### H-3: Update Validation Task Acceptance Criteria

**Issue:** T011-T012 don't specify what to validate
**Severity:** HIGH
**Rationale:** Validation rules now defined in clarifications but not reflected in tasks

**Actions:**

Update `specs/001-refactor-api/tasks.md`:

```markdown
- [ ] T011 [US5] Implement validateListOptions() function in src/api/validator.js
  Acceptance Criteria:
  - Validate limit: must be number, range 1-100, default 20 if undefined
  - Validate offset: must be number, minimum 0, default 0 if undefined
  - Validate sort: must be "asc" or "desc" enum, default "desc" if undefined
  - Return ValidationResult { valid: boolean, message: string, data: normalized_options, meta: {} }
  - Reject invalid types, out-of-range values with descriptive messages

- [ ] T012 [US5] Implement validateTagsOptions() function in src/api/validator.js
  Acceptance Criteria:
  - Extend validateListOptions validation
  - Validate duration: must be "thisWeek"|"thisMonth"|"thisYear"|"anytime" enum, default "anytime"
  - Return ValidationResult with same structure
  - Reject invalid duration values with descriptive messages
```

**Files to Update:**
- `specs/001-refactor-api/tasks.md`

---

### H-4: Add Success Criterion for Complete Field Coverage

**Issue:** SC-001 verifies endpoint count but not field completeness
**Severity:** HIGH
**Rationale:** Need to verify 1:1 API mapping claim

**Actions:**

Update `specs/001-refactor-api/spec.md` Success Criteria:

```markdown
- **SC-013**: All client method return values include ALL fields documented in OpenProcessing API (verified by comparing API response samples from openprocessingapi.md against JSDoc typedefs in src/api/types.js)
```

Also add to tasks.md:

```markdown
- [ ] T083b Verify JSDoc typedefs include all API fields (compare types.js against openprocessingapi.md examples)
```

**Files to Update:**
- `specs/001-refactor-api/spec.md`
- `specs/001-refactor-api/tasks.md`

---

### H-5: Clarify "Validation Applied" for getSketchCode

**Issue:** Spec says "with validation applied" but unclear what this means
**Severity:** HIGH
**Rationale:** Could be misinterpreted as code modification

**Actions:**

Update `specs/001-refactor-api/spec.md`:

```markdown
Change:
7. **Given** a valid sketch ID, **When** I call `getSketchCode(sketchId)`, **Then** I receive the sketch's source code with validation applied

To:
7. **Given** a valid sketch ID, **When** I call `getSketchCode(sketchId)`, **Then** I receive the sketch's source code as an array of CodeFile objects with response structure validation (checking codeID, orderID, code, title fields exist and are correct types)
```

Update `specs/001-refactor-api/tasks.md`:

```markdown
Change:
- [ ] T022 [US1] Add validation to existing getSketchCode(id) method in src/api/client.js

To:
- [ ] T022 [US1] Add response structure validation to existing getSketchCode(id) method in src/api/client.js
  Acceptance: Validate array structure, each CodeFile has required fields (codeID, orderID, code, title), orderID is numeric for tab ordering
```

**Files to Update:**
- `specs/001-refactor-api/spec.md`
- `specs/001-refactor-api/tasks.md`

---

### H-6: Document Rate Limit Handling Strategy

**Issue:** API has 40 calls/minute limit but no handling strategy
**Severity:** HIGH
**Rationale:** Users will hit rate limits without guidance

**Actions:**

Update `specs/001-refactor-api/spec.md` Edge Cases:

```markdown
Add:
- What happens when the client exceeds the OpenProcessing API rate limit (40 calls/minute)? Client should detect 429 errors, provide clear error message with retry-after guidance, but NOT implement automatic rate limiting (user responsibility).
```

Update `specs/001-refactor-api/spec.md` Functional Requirements:

```markdown
Add:
- **FR-041**: Client MUST detect HTTP 429 (Too Many Requests) errors and provide descriptive error messages indicating rate limit exceeded (40 calls/minute) with suggestion to implement retry logic or reduce request frequency
```

Update tasks.md:

```markdown
Add after T022:
- [ ] T022b [US1] Add 429 rate limit error detection in src/api/client.js
  Acceptance: Catch 429 errors, throw descriptive error: "OpenProcessing API rate limit exceeded (40 calls/minute). Please wait before retrying."
```

**Files to Update:**
- `specs/001-refactor-api/spec.md`
- `specs/001-refactor-api/tasks.md`

---

## Phase 3: MEDIUM PRIORITY - Documentation & Polish

### M-1: Add Empty Array Edge Case

**Issue:** No edge case for empty list responses
**Severity:** MEDIUM

**Actions:**

Update `specs/001-refactor-api/spec.md` Edge Cases:

```markdown
Add:
- What happens when a list endpoint returns an empty array (user with 0 sketches, sketch with 0 libraries)? Client should return { data: [], hasMore: false } with no errors.
```

**Files to Update:**
- `specs/001-refactor-api/spec.md`

---

### M-2: Add API Response Examples to Quickstart

**Issue:** No reference examples for implementers
**Severity:** MEDIUM

**Actions:**

Update `specs/001-refactor-api/quickstart.md` (or create if missing):

```markdown
Add section:

## API Response Examples

All examples from official OpenProcessing API documentation (openprocessingapi.md).

### Sketch Response
[Include example from openprocessingapi.md line 402-434]

### User Response
[Include example from openprocessingapi.md line 82-90]

### CodeFile Array Response
[Include example from openprocessingapi.md line 473-490]

[Continue for all entity types...]
```

**Files to Update:**
- `specs/001-refactor-api/quickstart.md` (or create)

---

### M-3: Define Validation Depth

**Issue:** FR-011 doesn't specify how deep validation goes
**Severity:** MEDIUM

**Actions:**

Update `specs/001-refactor-api/spec.md`:

```markdown
Change:
- **FR-011**: All API response validation MUST occur in validator.js functions

To:
- **FR-011**: All API response validation MUST occur in validator.js functions with scope: top-level required field presence, correct types (string/number/array/object), and array structure validation; deep nested object validation optional
```

**Files to Update:**
- `specs/001-refactor-api/spec.md`

---

### M-4: Add Performance Baseline Task

**Issue:** SC-009 requires 5% performance but no baseline
**Severity:** MEDIUM

**Actions:**

Update `specs/001-refactor-api/tasks.md`:

```markdown
Insert after T002:
- [ ] T002b Benchmark current sketch download performance (time from opdl 123456 to completion)
  Acceptance: Record average time over 5 runs for baseline comparison (verify SC-009 later)
```

**Files to Update:**
- `specs/001-refactor-api/tasks.md`

---

### M-5: Clarify ValidationResult Message Audience

**Issue:** Unclear if messages are user-facing or developer-facing
**Severity:** MEDIUM

**Actions:**

Update `specs/001-refactor-api/spec.md`:

```markdown
Change:
- **FR-012**: Validation functions MUST return consistent ValidationResult objects with `{ valid, message, data, meta }` structure, where `meta` is optional and contains response metadata like `{ hasMore }` for list endpoints

To:
- **FR-012**: Validation functions MUST return consistent ValidationResult objects with `{ valid, message, data, meta }` structure, where `meta` is optional and contains response metadata like `{ hasMore }` for list endpoints. The `message` field is developer-facing and may contain technical details.
```

**Files to Update:**
- `specs/001-refactor-api/spec.md`

---

### M-6: Add JSDoc Format Guidance to Type Tasks

**Issue:** T003-T010 don't specify JSDoc format
**Severity:** MEDIUM

**Actions:**

Update `specs/001-refactor-api/tasks.md`, add note to Phase 2:

```markdown
Add before T003:

**Type Definition Guidelines**:
- Use @typedef JSDoc syntax
- Include field descriptions from OpenProcessing API docs
- Mark optional fields with `[fieldName]` syntax
- Example:
  /**
   * @typedef {Object} Sketch
   * @property {string} visualID - Unique sketch identifier
   * @property {string} title - Sketch title
   * @property {string} [parentID] - Parent sketch ID if this is a fork
   */
```

**Files to Update:**
- `specs/001-refactor-api/tasks.md`

---

## Phase 4: Plan & Data Model Sync

### PM-1: Update Plan Constitution Re-Check

**Issue:** Plan constitution check doesn't account for new FRs
**Severity:** MEDIUM

**Actions:**

Update `specs/001-refactor-api/plan.md`:

In "Constitution Check - Post-Design Re-Evaluation" section, add note:

```markdown
**Note**: Post-clarification updates (FR-038 through FR-041) added after initial constitution check. These additions strengthen alignment:
- FR-038, FR-039, FR-040: Formalize API contracts (supports Principle I)
- FR-041: Rate limit error handling (supports Principle IV - graceful degradation)
```

**Files to Update:**
- `specs/001-refactor-api/plan.md`

---

## Summary of File Changes

| File | Changes | Phase |
|------|---------|-------|
| `specs/001-refactor-api/spec.md` | Add FR-041, update FR-011, FR-012, edge cases, SC-013, clarify acceptance scenario #7 | 1, 2, 3 |
| `specs/001-refactor-api/plan.md` | Add header parsing notes, update constitution re-check | 1, 4 |
| `specs/001-refactor-api/tasks.md` | Add T002b, T011b, T022b, T030b, T083b; update T003-T012, T022 acceptance criteria | 1, 2, 3 |
| `specs/001-refactor-api/data-model.md` | **CREATE**: Document all 5 entity types with complete fields | 1 |
| `specs/001-refactor-api/contracts/client-methods.md` | **CREATE**: Document all 14 client method signatures | 1 |
| `specs/001-refactor-api/quickstart.md` | Add API response examples section | 3 |

**Total Files:** 6 (2 new, 4 updates)

---

## Execution Plan

### Step 1: Create Missing Documentation (30 min)
1. Create `data-model.md` with complete entity definitions (CR-1)
2. Create `contracts/client-methods.md` with method signatures (CR-3)

### Step 2: Update Spec (45 min)
1. Add FR-041 (rate limiting)
2. Update FR-011, FR-012 (validation scope, message audience)
3. Add SC-013 (field completeness)
4. Update Edge Cases (empty arrays, rate limits)
5. Clarify acceptance scenario #7 (getSketchCode)

### Step 3: Update Plan (15 min)
1. Add header parsing notes (CR-2)
2. Update constitution re-check (PM-1)

### Step 4: Update Tasks (60 min)
1. Add new tasks: T002b, T011b, T022b, T030b, T083b
2. Update acceptance criteria for T003-T012, T022
3. Add JSDoc format guidelines

### Step 5: Update Quickstart (30 min)
1. Add API response examples from openprocessingapi.md

**Total Estimated Time:** 3 hours

---

## Validation Checklist

After completing remediation:

- [ ] All CRITICAL issues (CR-1 through CR-3) resolved
- [ ] All HIGH priority issues (H-1 through H-6) resolved
- [ ] Data model includes all fields from openprocessingapi.md
- [ ] Client method contracts explicitly documented
- [ ] Task acceptance criteria specify validation rules
- [ ] New FRs (FR-041, SC-013) added
- [ ] Plan references new documentation files
- [ ] No contradictions between spec, plan, tasks, data-model

---

## Next Steps After Remediation

1. **Verify Consistency**: Run a final check that spec.md, plan.md, tasks.md, and data-model.md are aligned
2. **Review Against API Docs**: Compare all entity typedefs against openprocessingapi.md examples
3. **Proceed to Implementation**: Run `/speckit.implement` with high confidence

---

**End of Remediation Plan**

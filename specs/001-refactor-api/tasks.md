# Tasks: OpenProcessing API Architecture Refactor

**Feature Branch**: `001-refactor-api`
**Date**: 2025-12-27
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Overview

This document provides an actionable task breakdown for implementing the OpenProcessing API refactor. Tasks are organized by user story to enable independent implementation and testing.

**Total Estimated Tasks**: 47
**Parallelization Opportunities**: 28 tasks marked [P]

## Implementation Strategy

**MVP Scope** (Minimum Viable Product):
- Phase 1: Setup
- Phase 2: Foundational
- Phase 3: User Story 1 (Complete API Access)
- Phase 4: User Story 2 (Single Source of Truth)

This MVP delivers complete API coverage with centralized validation and eliminates redundancy, providing immediate value while maintaining backward compatibility.

**Incremental Delivery**:
1. Foundation first (Setup + Foundational phases)
2. Core functionality (US1 + US2 - both P1 priority)
3. Code organization (US3 + US5 - both P2 priority)
4. Verification (US4 runs throughout, final validation at end)

## User Story Mapping

### User Story 1 - Complete API Access (P1)
**Goal**: All 14 OpenProcessing API endpoints accessible through client methods
**Independent Test**: Call each of the 14 methods and verify they return valid data
**Delivers**: 7 new client methods, enhanced validation, comprehensive types

### User Story 2 - Single Source of Truth (P1)
**Goal**: All HTTP requests go through OpenProcessingClient
**Independent Test**: Search codebase for axios calls (should only be in client.js)
**Delivers**: Download service using client, fetcher.js deprecated

### User Story 3 - Clear Separation of Concerns (P2)
**Goal**: Code organized into api/, download/, cli/ directories
**Independent Test**: Verify file locations and import dependencies flow correctly
**Delivers**: Organized structure, moved files, updated imports

### User Story 4 - Backward Compatibility (P1)
**Goal**: Public API and CLI work identically to before
**Independent Test**: All existing tests pass, CLI output unchanged
**Delivers**: Re-exports, deprecation warnings, identical behavior

### User Story 5 - Centralized Validation (P2)
**Goal**: All validation in src/api/validator.js
**Independent Test**: Search for validation logic (all in validator.js)
**Delivers**: validateListOptions, validateTagsOptions, consistent errors

---

## Phase 1: Setup

**Goal**: Initialize directory structure and prepare for refactor

### Tasks

- [ ] T001 Create new directory structure (src/api/, src/download/, src/cli/commands/, tests/api/, tests/download/, tests/cli/commands/)
- [ ] T002 Verify existing tests pass to establish baseline (npm test)

**Phase Completion Criteria**:
- ✅ All required directories exist
- ✅ Current test suite passes (baseline established)

---

## Phase 2: Foundational - Type Definitions & Validation

**Goal**: Establish shared types and validation foundation used by all user stories

**Why Foundational**: These are blocking prerequisites - all user stories depend on having proper types and validation functions defined.

### Tasks

- [ ] T003 [P] Create JSDoc type definitions for Sketch entity in src/api/types.js
- [ ] T004 [P] Create JSDoc type definitions for User entity in src/api/types.js
- [ ] T005 [P] Create JSDoc type definitions for Curation entity in src/api/types.js
- [ ] T006 [P] Create JSDoc type definitions for CodeFile entity in src/api/types.js
- [ ] T007 [P] Create JSDoc type definitions for Tag entity in src/api/types.js
- [ ] T008 [P] Create JSDoc type definitions for ListOptions in src/api/types.js
- [ ] T009 [P] Create JSDoc type definitions for TagsOptions in src/api/types.js
- [ ] T010 [P] Create JSDoc type definitions for all list item types (UserSketchItem, SketchForkItem, etc.) in src/api/types.js
- [ ] T011 [US5] Implement validateListOptions() function in src/validator.js
- [ ] T012 [US5] Implement validateTagsOptions() function in src/validator.js
- [ ] T013 [US5] Add unit tests for validateListOptions() in tests/validator.test.mjs
- [ ] T014 [US5] Add unit tests for validateTagsOptions() in tests/validator.test.mjs

**Phase Completion Criteria**:
- ✅ All JSDoc types defined (10 types total)
- ✅ Validation functions implemented and tested
- ✅ Test coverage >90% for validator.js

**Parallel Execution**: Tasks T003-T010 can run in parallel (different type definitions)

---

## Phase 3: User Story 1 - Complete API Access (P1)

**Goal**: Implement all 14 OpenProcessing API endpoints with validation

**Independent Test Criteria**:
- All 14 client methods callable and return valid data
- Each method has proper JSDoc types
- Validation applied to all responses
- Tests verify success paths and error cases

### New Client Methods (7 new + 1 enhanced)

- [ ] T015 [P] [US1] Implement getUserFollowers(id, options) method in src/api/client.js
- [ ] T016 [P] [US1] Implement getUserFollowing(id, options) method in src/api/client.js
- [ ] T017 [P] [US1] Implement getUserHearts(id, options) method in src/api/client.js
- [ ] T018 [P] [US1] Implement getSketchForks(id, options) method in src/api/client.js
- [ ] T019 [P] [US1] Implement getSketchHearts(id, options) method in src/api/client.js
- [ ] T020 [P] [US1] Implement getCurationSketches(id, options) method in src/api/client.js
- [ ] T021 [P] [US1] Implement getTags(options) method in src/api/client.js
- [ ] T022 [US1] Add validation to existing getSketchCode(id) method in src/api/client.js

### Client Tests

- [ ] T023 [P] [US1] Write tests for getUserFollowers() in tests/api/client.test.mjs
- [ ] T024 [P] [US1] Write tests for getUserFollowing() in tests/api/client.test.mjs
- [ ] T025 [P] [US1] Write tests for getUserHearts() in tests/api/client.test.mjs
- [ ] T026 [P] [US1] Write tests for getSketchForks() in tests/api/client.test.mjs
- [ ] T027 [P] [US1] Write tests for getSketchHearts() in tests/api/client.test.mjs
- [ ] T028 [P] [US1] Write tests for getCurationSketches() in tests/api/client.test.mjs
- [ ] T029 [P] [US1] Write tests for getTags() in tests/api/client.test.mjs
- [ ] T030 [US1] Write tests for enhanced getSketchCode() validation in tests/api/client.test.mjs
- [ ] T030a [US1] Write tests for HTTP 429 error handling in tests/api/client.test.mjs (mock 429 response, verify error message)

### Verification

- [ ] T031 [US1] Run full client test suite and verify all 14 methods work (npm test -- tests/api/client.test.mjs)
- [ ] T031a [US1] Add HTTP 429 rate limit error detection to client.js axios error handler with descriptive message ("Rate limit exceeded: 40 calls/minute. Implement retry logic or reduce request frequency.")
- [ ] T032 [US1] Verify test coverage >90% for src/api/client.js (npm run test:coverage)

**Phase Completion Criteria**:
- ✅ All 14 client methods implemented with JSDoc
- ✅ All methods have corresponding tests
- ✅ Test coverage >90%
- ✅ Independent test: Can call all 14 methods successfully

**Parallel Execution**:
- Tasks T015-T021 can run in parallel (different methods, no dependencies)
- Tasks T023-T029 can run in parallel (different test files)

---

## Phase 4: User Story 2 - Single Source of Truth (P1)

**Goal**: Create download service to eliminate fetcher.js redundancy

**Independent Test Criteria**:
- Search for axios.get/axios.create finds only src/api/client.js
- Download service uses only client methods
- Existing download functionality works identically

### Download Service Implementation

- [ ] T033 [US2] Create DownloadService class in src/download/service.js
- [ ] T034 [US2] Implement getCompleteSketchInfo(id, options) method in src/download/service.js
- [ ] T035 [US2] Add error handling for partial failures (e.g., parent sketch unavailable) in src/download/service.js
- [ ] T036 [US2] Ensure SketchInfo structure matches current fetchSketchInfo() output in src/download/service.js

### Service Tests

- [ ] T037 [US2] Write tests for DownloadService.getCompleteSketchInfo() success path in tests/download/service.test.mjs
- [ ] T038 [US2] Write tests for fork sketch handling in tests/download/service.test.mjs
- [ ] T039 [US2] Write tests for error cases (private, hidden code, not found) in tests/download/service.test.mjs
- [ ] T040 [US2] Write tests for partial failure graceful degradation in tests/download/service.test.mjs

### Integration & Deprecation

- [ ] T041 [US2] Update src/downloader.js to use DownloadService instead of fetcher.js - replace fetchSketchInfo() import from fetcher.js with DownloadService.getCompleteSketchInfo(), update function calls, ensure identical return structure
- [ ] T042 [US2] Create deprecation re-export in src/fetcher.js with console.warn()
- [ ] T043 [US2] Verify no direct axios calls outside src/api/client.js (grep -r "axios\\." src/ | grep -v client.js)

### Verification

- [ ] T044 [US2] Run existing downloader tests to verify backward compatibility (npm test -- tests/downloader.test.mjs)
- [ ] T045 [US2] Test actual sketch download with CLI (node bin/opdl.js 123456) and verify identical output

**Phase Completion Criteria**:
- ✅ DownloadService implemented and tested
- ✅ Download functionality works identically
- ✅ Only src/api/client.js contains axios calls
- ✅ Independent test: grep confirms single source of truth

**Dependencies**:
- Requires Phase 3 complete (needs all client methods available)

---

## Phase 5: User Story 3 - Clear Separation of Concerns (P2)

**Goal**: Reorganize files into api/, download/, cli/ directories

**Independent Test Criteria**:
- Files in correct directories (api/, download/, cli/)
- Imports respect layer boundaries (CLI → Service → Client)
- All tests still pass after moves

### Move API Files

- [ ] T046 [P] [US3] Move src/validator.js to src/api/validator.js and update imports
- [ ] T047 [P] [US3] Move src/types/api.js to src/api/types.js and update imports

### Move Download Files

- [ ] T048 [P] [US3] Move src/downloader.js to src/download/downloader.js and update imports
- [ ] T049 [P] [US3] Move src/htmlGenerator.js to src/download/htmlGenerator.js and update imports
- [ ] T050 [P] [US3] Move src/codeAttributor.js to src/download/codeAttributor.js and update imports
- [ ] T051 [P] [US3] Move src/licenseHandler.js to src/download/licenseHandler.js and update imports
- [ ] T052 [P] [US3] Move src/metadataWriter.js to src/download/metadataWriter.js and update imports
- [ ] T053 [P] [US3] Move src/serverRunner.js to src/download/serverRunner.js and update imports
- [ ] T054 [P] [US3] Move src/viteScaffolder.js to src/download/viteScaffolder.js and update imports

### Move CLI Files

- [ ] T055 [P] [US3] Move src/cli.js to src/cli/index.js and update imports
- [ ] T056 [P] [US3] Move src/formatters.js to src/cli/formatters.js and update imports
- [ ] T057 [US3] Merge src/fieldRegistry.js and src/fieldSelector.js into src/cli/fields.js
- [ ] T058 [P] [US3] Move src/commands/sketch.js to src/cli/commands/sketch.js and update imports
- [ ] T059 [P] [US3] Move src/commands/user.js to src/cli/commands/user.js and update imports
- [ ] T060 [P] [US3] Move src/commands/curation.js to src/cli/commands/curation.js and update imports

### Move Test Files

- [ ] T061 [P] [US3] Move test files to match source structure (tests/api/, tests/download/, tests/cli/)
- [ ] T062 [US3] Update test imports to use new file paths

### Update Root Files

- [ ] T063 [US3] Update src/index.js imports to use new paths (src/download/downloader, src/api/client)
- [ ] T064 [US3] Update bin/opdl.js imports to use new paths

### Verification

- [ ] T065 [US3] Run all tests to verify moves successful (npm test)
- [ ] T066 [US3] Verify file count at src/ root is 2 (index.js, utils.js) excluding fetcher.js
- [ ] T067 [US3] Verify import dependencies flow correctly (CLI → Service → Client) using grep analysis

**Phase Completion Criteria**:
- ✅ All files in correct directories
- ✅ src/ root has only 2 files (+ deprecated fetcher.js)
- ✅ All tests pass after reorganization
- ✅ Independent test: Directory structure matches plan.md

**Parallel Execution**:
- Tasks T046-T047 can run in parallel (different files)
- Tasks T048-T054 can run in parallel (different files)
- Tasks T055-T060 can run in parallel (different files, except T057 merges two files)

---

## Phase 6: User Story 4 - Backward Compatibility Verification (P1)

**Goal**: Verify all existing functionality works identically

**Independent Test Criteria**:
- All existing test suites pass without modification
- CLI commands produce identical output
- Public API function works with same signature
- Download features (--vite, --run) work correctly

### Test Suite Verification

- [ ] T068 [US4] Run full test suite and verify 100% pass rate (npm test)
- [ ] T069 [US4] Verify test coverage remains >90% (npm run test:coverage)

### CLI Verification

- [ ] T070 [US4] Test basic download: opdl 123456 (verify identical file structure and content)
- [ ] T071 [US4] Test sketch info command: opdl sketch 123456 --info title,author (verify identical output)
- [ ] T072 [US4] Test user sketches command: opdl user testuser sketches --limit 5 (verify works)
- [ ] T073 [US4] Test curation command: opdl curation 789 sketches (verify works)
- [ ] T074 [US4] Test --vite flag: opdl 123456 --vite (verify scaffold created correctly)
- [ ] T075 [US4] Test --run flag: timeout 5 npm run dev from downloaded sketch (verify server starts)

### Programmatic API Verification

- [ ] T076 [US4] Test opdl() function: const opdl = require('opdl'); await opdl(123456) (verify works)
- [ ] T077 [US4] Test OpenProcessingClient export: const { OpenProcessingClient } = require('opdl') (verify accessible)

**Phase Completion Criteria**:
- ✅ All tests pass (100% success rate)
- ✅ CLI commands work identically
- ✅ Public API unchanged
- ✅ Independent test: Existing workflows unbroken

**Dependencies**:
- Requires all previous phases complete

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Final cleanup and documentation

### Documentation

- [ ] T078 Update README.md with new client methods and examples
- [ ] T079 Add migration guide for internal API changes in CHANGELOG
- [ ] T080 Document deprecation timeline for fetcher.js in CHANGELOG

### Final Verification

- [ ] T081 Run final test suite and coverage report (npm run test:coverage)
- [ ] T082 Verify no TODO/FIXME comments left in refactored code (grep -r "TODO\|FIXME" src/)
- [ ] T083 Verify all JSDoc types complete (check @typedef coverage in src/api/)

**Phase Completion Criteria**:
- ✅ Documentation updated
- ✅ Final test coverage >90%
- ✅ No outstanding TODOs

---

## Dependencies & Sequencing

### Phase Dependencies

```
Phase 1 (Setup)
  ↓
Phase 2 (Foundational: Types & Validation)
  ↓
Phase 3 (US1: Complete API Access) ←─ Needs types from Phase 2
  ↓
Phase 4 (US2: Single Source of Truth) ←─ Needs client methods from Phase 3
  ↓
Phase 5 (US3: File Organization) ←─ Needs all code in place from Phase 4
  ↓
Phase 6 (US4: Backward Compatibility) ←─ Needs all refactoring complete
  ↓
Phase 7 (Polish)
```

### User Story Dependencies

- **US1** (Complete API Access): Independent - can be implemented first after foundation
- **US2** (Single Source of Truth): Depends on US1 (needs all client methods available)
- **US3** (Clear Separation): Depends on US1 + US2 (needs all code written before moving)
- **US4** (Backward Compatibility): Validates US1 + US2 + US3 (runs throughout, final check at end)
- **US5** (Centralized Validation): Independent - implemented in Phase 2 as foundation

### Critical Path

The critical path for MVP delivery:
1. Phase 1: Setup
2. Phase 2: Types & Validation (includes US5)
3. Phase 3: US1 (API methods)
4. Phase 4: US2 (Service layer)
5. Phase 6: US4 (Verification)

**US3 (File Organization) is NOT on critical path** - it can be done after MVP or skipped if only API functionality is needed.

---

## Parallel Execution Examples

### Phase 2 - Maximum Parallelization

Run all type definitions in parallel (8 concurrent tasks):
```
T003 [P] Sketch type     │ T004 [P] User type       │ T005 [P] Curation type │ T006 [P] CodeFile type
T007 [P] Tag type        │ T008 [P] ListOptions     │ T009 [P] TagsOptions   │ T010 [P] List item types
```

Then validation functions (can overlap with types if careful):
```
T011 validateListOptions │ T012 validateTagsOptions
```

Then tests:
```
T013 Test validateList   │ T014 Test validateTags
```

### Phase 3 - Maximum Parallelization

Implement all 7 new methods in parallel:
```
T015 getUserFollowers    │ T016 getUserFollowing    │ T017 getUserHearts
T018 getSketchForks      │ T019 getSketchHearts     │ T020 getCurationSketches
T021 getTags
```

Then enhance existing method:
```
T022 Add validation to getSketchCode
```

Then write all tests in parallel:
```
T023 Test getUserFollowers │ T024 Test getUserFollowing │ T025 Test getUserHearts
T026 Test getSketchForks   │ T027 Test getSketchHearts  │ T028 Test getCurationSketches
T029 Test getTags          │ T030 Test getSketchCode
```

Finally, sequential verification:
```
T031 Run full test suite
  ↓
T032 Verify coverage
```

### Phase 5 - Maximum Parallelization

Move files in three parallel groups:

**Group 1 - API files**:
```
T046 Move validator.js   │ T047 Move types.js
```

**Group 2 - Download files** (7 concurrent):
```
T048 Move downloader     │ T049 Move htmlGenerator │ T050 Move codeAttributor │ T051 Move licenseHandler
T052 Move metadataWriter │ T053 Move serverRunner  │ T054 Move viteScaffolder
```

**Group 3 - CLI files** (5 concurrent):
```
T055 Move cli.js         │ T056 Move formatters    │ T058 Move sketch.js      │ T059 Move user.js
T060 Move curation.js
```

**Sequential** (must wait for moves):
```
T057 Merge fields        (depends on T056)
T061 Move test files     (after all source moves)
T062 Update test imports (after T061)
T063 Update src/index.js (after all moves)
T064 Update bin/opdl.js  (after all moves)
```

---

## Task Checklist Summary

**Total Tasks**: 85
**Parallelizable**: 28 tasks marked [P]
**Sequential**: 57 tasks

**By Phase**:
- Phase 1 (Setup): 2 tasks
- Phase 2 (Foundational): 12 tasks (8 parallelizable)
- Phase 3 (US1): 20 tasks (14 parallelizable) - includes T030a, T031a
- Phase 4 (US2): 13 tasks
- Phase 5 (US3): 22 tasks (15 parallelizable)
- Phase 6 (US4): 10 tasks
- Phase 7 (Polish): 3 tasks

**By User Story**:
- US1 (Complete API Access): 20 tasks (Phase 3) - includes rate limit error handling
- US2 (Single Source of Truth): 13 tasks (Phase 4)
- US3 (Clear Separation): 22 tasks (Phase 5)
- US4 (Backward Compatibility): 10 tasks (Phase 6)
- US5 (Centralized Validation): 4 tasks (Phase 2)
- Setup/Foundation: 14 tasks (Phases 1-2)
- Polish: 3 tasks (Phase 7)

---

## Success Metrics

After completing all tasks, verify:

- ✅ **SC-001**: All 14 endpoints accessible (verify with T031)
- ✅ **SC-002**: Zero axios calls outside client.js (verify with T043)
- ✅ **SC-003**: All tests pass (verify with T068)
- ✅ **SC-004**: Coverage >90% (verify with T069, T081)
- ✅ **SC-005**: All methods have JSDoc (verify with T083)
- ✅ **SC-006**: 3 main directories (verify with T066)
- ✅ **SC-007**: opdl() function identical (verify with T076)
- ✅ **SC-008**: CLI output identical (verify with T070-T075)
- ✅ **SC-009**: Performance within 5% (manual benchmark)
- ✅ **SC-010**: src/ root has 2 files (verify with T066)
- ✅ **SC-011**: All validation in validator.js (verify with T067)
- ✅ **SC-012**: Service uses only client methods (verify with T043, T045)

---

## Notes

**Tests Are Included**: This refactor includes comprehensive tests for all new code to maintain >90% coverage requirement.

**Incremental Approach**: Tasks are designed to allow incremental commits and verification at each phase.

**Rollback Safety**: Each phase can be verified independently, allowing easy rollback if issues are discovered.

**MVP Fast Track**: To deliver MVP quickly, implement Phases 1-4 + 6 (skip Phase 5 file reorganization initially).

# GitHub Copilot Code Review Instructions

## Review Philosophy
- Only comment when you have HIGH CONFIDENCE (>80%) that an issue exists
- Be concise: one sentence per comment when possible
- Focus on actionable feedback, not observations
- When reviewing text, only comment on clarity issues if the text is genuinely confusing or could lead to errors. "Could be clearer" is not the same as "is confusing" - stay silent unless HIGH confidence it will cause problems

## Priority Areas (Review These)

### Security & Safety
- Path traversal or overwriting outside the target sketch directory during download flows
- Unsafe handling of OpenProcessing API responses, asset URLs, or user-supplied paths/flags
- Credential leakage in logs or outputs (no API keys, tokens, etc.)
- Missing validation of sketch IDs, CLI args, or API-dependent inputs that could corrupt downloads
- Command injection via unsanitized filenames or asset paths

### Correctness Issues
- Logic errors in download workflows (missing files, incorrect HTML generation, failed asset downloads)
- HTML generation bugs that produce invalid sketch entry points
- Failure to handle API responses correctly (sketch metadata, assets, hidden code)
- Async/promise misuse (missing awaits, unhandled rejections) in file/network operations
- Boundary conditions for sketch IDs, CLI flags (`--outputDir`, `--quiet`), and API options
- Unexpected behavior when combining multiple flags or API options
- Tests that don't cover new logic paths or mutate shared global state between runs

### Architecture & Patterns
- Mixing concerns: keep core download logic in `src/`, utilities in `src/utils/`, formatters/selectors separate
- Bypassing shared utilities with ad-hoc logic (filename sanitization, HTML generation, etc.)
- Tight coupling between CLI layer and core logic (keep API boundary clear for programmatic use)


## Project-Specific Context
- CLI tool for downloading OpenProcessing sketches with Node 14+ CommonJS entry point
- Core logic lives in `src/index.js` (main API), utilities in `src/utils/`, formatters/selectors in dedicated modules
- Fetches sketch data from OpenProcessing API, downloads assets, generates HTML, preserves licensing metadata
- Output structure: `sketch_{id}/` with HTML, code files, assets, LICENSE, OPENPROCESSING.md, and metadata/
- Filename sanitization is critical (uses `sanitize-filename` package)

### Non-Negotiable Requirements
- **Library-Oriented**: Keep validation, filename sanitization, HTML generation, and asset handling in shared modules instead of duplicating work
- **Security-First**: Never relax safety checks for path traversal, filename sanitization, or API response validation
- **Attribution & Licensing**: Always preserve original sketch licensing info, generate proper attribution comments and LICENSE files
- **Testing Mindset**: Vitest tests (`tests/`) should accompany new logic—if they exist they must fail before the fix (red-green-refactor philosophy). New features must include tests.

## CI Pipeline Context

**Important**: You review PRs immediately, before CI completes. Do not flag issues that CI will catch.

### What Our CI Would Check

- `npm test` (Vitest) – unit/integration coverage for download logic, utilities, formatters, selectors
- `npm run test:coverage` when requested – same suite with coverage reporting
- `npm run` commands rely on dependencies installed via `npm ci` (root only)

**Setup steps CI performs:**
- Runs `npm ci` in repo root (single workspace)
- Uses Node 14+ environment (CommonJS)
- Tests mock axios for OpenProcessing API calls and nock for HTTP requests

**Key insight**: Commands like `node bin/opdl.js`, `npx opdl`, and Vitest rely on local `node_modules`; assume CI already ran `npm ci` unless something in the repo prevents it.

## Skip These (Low Value)

Do not comment on:
- **Style/formatting** - CI handles this (ESLint, Prettier)
- **Linting warnings** - CI handles this (ESLint)
- **Test failures** - CI handles this (full test suite)
- **Missing dependencies** - CI handles this (npm ci will fail)
- **Minor naming suggestions** - unless truly confusing
- **Suggestions to add comments** - for self-documenting code
- **Refactoring suggestions** - unless there's a clear bug or maintainability issue
- **Multiple issues in one comment** - choose the single most critical issue
- **Logging suggestions** - unless for errors or security events (the codebase needs less logging, not more)
- **Pedantic accuracy in text** - unless it would cause actual confusion or errors. No one likes a reply guy

## Response Format

When you identify an issue:
1. **State the problem** (1 sentence)
2. **Why it matters** (1 sentence, only if not obvious)
3. **Suggested fix** (code snippet or specific action)

Example:
```
This could crash if the array is empty. Consider using `arr[0]` with a length check or `arr?.at(0)`.
```

## Excluded Files and Directories

Do NOT review changes in:
- `.specify/**` - auto-generated files from speckit

## When to Stay Silent

If you're uncertain whether something is an issue, don't comment. False positives create noise and reduce trust in the review process.

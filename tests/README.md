# Tests

This directory contains tests for the opdl CLI tool.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/validate-fields.test.mjs
```

## Field Validation Tests

The `validate-fields.test.mjs` file contains comprehensive tests that validate all field registries against the live OpenProcessing API.

### Purpose

These tests ensure that:
1. All fields registered in the field registry actually exist in the API responses
2. The tool doesn't claim to support fields that don't exist
3. Changes to the OpenProcessing API are caught early

### Running Field Validation

```bash
npm test -- tests/validate-fields.test.mjs
```

The tests will:
- ✅ **Pass** if all registered fields exist in the API
- ❌ **Fail** if registered fields are missing from the API (indicating outdated registry)
- ℹ️  **Log** fields that exist in the API but aren't in the registry (informational only)

### When to Run

Run these tests:
- **Before each release** to ensure field registry is up-to-date
- **Periodically** (weekly/monthly) to catch API changes
- **When adding new field sets** to validate they're correct
- **When users report field-related issues**

### API Requirements

The field validation tests require:
- An active internet connection
- Access to the OpenProcessing API
- Optional: `OP_API_KEY` environment variable (for authenticated endpoints)

### Understanding Test Output

**Example output:**
```
✓ Sketch fields > should match actual API response from /api/sketch/:id

ℹ️  Sketch fields in API but not in registry: engineID, engineURL, fileBase
```

This means:
- ✅ All registered sketch fields exist in the API response
- ℹ️  The API returns additional fields (`engineID`, `engineURL`, `fileBase`) that we haven't exposed to users
  - This is expected - we don't need to expose every internal API field
  - These fields can be added to the registry if users need them

**Failure example:**
```
✗ User fields > should match actual API response from /api/user/:id
  Expected field 'memberSince' not found in API response
```

This indicates:
- ❌ The registry claims `memberSince` is available but it's not in the API
- **Action needed:** Remove `memberSince` from the user field registry or update it to the correct field name

### Maintaining Tests

When the OpenProcessing API changes:

1. **Field removed from API:**
   - Test will fail
   - Remove the field from the corresponding registry in `src/fieldRegistry.js`
   - Update examples in `HELP.md`

2. **Field renamed in API:**
   - Test will fail
   - Update the field name in the registry
   - Update examples in `HELP.md`

3. **New field added to API:**
   - Test will log it as informational
   - Decide if users would benefit from access to this field
   - If yes, add it to the registry and update documentation

4. **Field type changed:**
   - Update the field type in the registry
   - Verify formatters handle the new type correctly

## Other Tests

The test suite includes:
- Unit tests for core functionality
- Integration tests for CLI commands
- Mock tests for API interactions (using nock)
- Field validation tests (live API)

See individual test files for details on specific test coverage.

## Running locally

Clone the repo and install dependencies:

```bash
git clone https://github.com/SableRaf/opdl.git
cd opdl
npm install
```

Link the package globally so the `opdl` command runs your local source. 

From the project root directory, run:

```bash
npm link
```

You can now run `opdl` from anywhere and it will use your local changes. To unlink when you're done:

```bash
npm unlink -g opdl
```

## Running tests

```bash
npm test
```

Tests use [Vitest](https://vitest.dev/) and include a live API integration test that makes real requests to OpenProcessing. Set `OP_API_KEY` before running tests to avoid rate limiting:

```bash
OP_API_KEY=YOUR_API_TOKEN npm test
```

## Releasing

Publish releases to npm from a clean working tree on the branch you intend to release.

### 1. Preflight checks

Confirm you are on the right branch and do not have uncommitted changes:

```bash
git status
git branch --show-current
```

Run the test suite before publishing:

```bash
npm install
npm test
```

Review the package version:

```bash
node -p "require('./package.json').version"
```

### 2. Verify npm access

Check whether you are already authenticated with npm:

```bash
npm whoami
```

If that fails or shows the wrong account, log in:

```bash
npm login
```

Verify you can publish this package name:

```bash
npm owner ls opdl
```

### 3. Dry run the package

Inspect exactly what would be included in the published tarball:

```bash
npm run pack:dry-run
```

This should include only the files listed in `package.json` under `files` plus package metadata. Check in particular that `bin/`, `src/`, `README.md`, `HELP.md`, and `LICENSE` are present.

You can also generate the tarball locally for an extra sense check:

```bash
npm pack
```

### 4. Bump the version

Choose the appropriate semantic version bump:

```bash
npm version patch
# or
npm version minor
# or
npm version major
```

This updates `package.json`, creates a git commit, and creates a git tag. Push both after reviewing the result:

```bash
git push
git push --tags
```

### 5. Publish to npm

Run one final authentication check:

```bash
npm whoami
```

Then publish:

```bash
npm publish
```

The package is configured for public npm publishing via `publishConfig.access = "public"` in [`package.json`](package.json).

### 6. Post-release checks

Confirm the published version:

```bash
npm view opdl version
```

If needed, verify the package contents from the registry:

```bash
npm view opdl files
```

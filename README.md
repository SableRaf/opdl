# opdl

With `opdl`, you can take an OpenProcessing sketch, download it by ID, and get a ready-to-run local version that includes all files, assets, and credits.

## Quick start (no installation required)

Download sketch ID `2063664` to a folder named `sketch_2063664`:

```
npx opdl 2063664
```

> [!NOTE] Since v2 of the OpenProcessing API, unauthenticated requests are heavily rate limited. A Bearer token is recommended for regular use (see [Authentication](#authentication)).

## Installation

With npm:
```bash
npm install -g opdl
```

With yarn:
```bash
yarn global add opdl
```

With pnpm:
```bash
pnpm add -g opdl
```

With bun:
```bash
bun install -g opdl
```

## Authentication

Unauthenticated requests to the OpenProcessing API are heavily rate limited. A Bearer token is strongly recommended. Generate one from your OpenProcessing account settings: go to `Profile` > `Edit Profile` > `API Tokens`.

### Save your token (recommended)

```bash
opdl auth --token YOUR_API_TOKEN
```

This writes the token to `~/.opdlrc` so every subsequent `opdl` command picks it up automatically.

```bash
opdl auth            # check token status
opdl auth --clear    # remove saved token
```

### Environment variable

```bash
export OP_API_KEY=YOUR_API_TOKEN
opdl 2063664
```

Useful for CI/CD pipelines or when you prefer not to write the token to disk.

### One-off flag

```bash
opdl 2063664 --token YOUR_API_TOKEN
```

### Resolution order

When a command runs, the token is resolved in this priority order:

1. `--token` flag (highest)
2. `OP_API_KEY` environment variable
3. `token` in `~/.opdlrc`

## Usage

### Command Line

```bash
opdl <sketchId> [--outputDir=dir] [--quiet]
```

**Examples:**

```bash
# Check version
opdl --version

# Show command help
opdl --help

# Download sketch 2063664 to default directory (sketch_2063664)
opdl 2063664

# Download to a specific directory
opdl 2063664 --outputDir=./my-sketch

# Download quietly (suppress warnings)
opdl 2063664 --quiet

# Download and automatically run a dev server
opdl 2063664 --run

# Download with Vite setup and run the dev server
opdl 2063664 --vite --run

# With npx (no global install)
npx opdl 2063664
```

### Advanced CLI Options

See the [documentation](HELP.md) file for a full list of CLI options and flags.

### Programmatic API

**Simple Download:**

```javascript
const opdl = require('opdl');

(async () => {
  const result = await opdl('2063664', { token: process.env.OP_API_KEY });

  if (result.success) {
    console.log(`Downloaded sketch: ${result.sketchInfo.title} by ${result.sketchInfo.author}`);
    console.log(`Location: ${result.outputPath}`);
  } else {
    console.error(result.sketchInfo.error);
  }
})();
```

**Direct API Client Access:**

```javascript
const { OpenProcessingClient } = require('opdl');

(async () => {
  const client = new OpenProcessingClient(process.env.OP_API_KEY);

  // Get sketch details
  const sketch = await client.getSketch(2063664);
  console.log(`${sketch.title} by userID ${sketch.userID}`);

  // Get user information
  const user = await client.getUser(sketch.userID);
  console.log(`Author: ${user.userName}`);

  // Get sketch code
  const code = await client.getSketchCode(2063664);
  console.log(`Code files:`, code.files.map(f => f.name));

  // List user's sketches with pagination
  const userSketches = await client.getUserSketches(sketch.userID, {
    limit: 10,
    offset: 0,
    sort: 'desc'
  });

  // Get popular tags
  const tags = await client.getTags({ duration: 'thisMonth' });
})();
```

**Available API Methods:**

- **Sketch**: `getSketch(id)`, `getSketchCode(id)`, `getSketchFiles(id)`, `getSketchLibraries(id)`, `getSketchForks(id, options)`, `getSketchHearts(id, options)`
- **User**: `getUser(id)`, `getUserSketches(id, options)`, `getUserFollowers(id, options)`, `getUserFollowing(id, options)`, `getUserHearts(id, options)`
- **Curation**: `getCuration(id)`, `getCurationSketches(id, options)`
- **Tags**: `getTags(options)`

All list methods accept optional `options` parameter with `limit` (1-100), `offset` (>=0), and `sort` ('asc'|'desc').

## Options

| Option | Default | Description |
| --- | --- | --- |
| `outputDir` | `./sketch_{id}` | Path to download the sketch. If omitted, the directory is automatically named `sketch_{id}`. |
| `downloadThumbnail` | `true` | Controls whether the sketch thumbnail is saved under `metadata/thumbnail.jpg`. |
| `saveMetadata` | `true` | When true, the raw API metadata is written to `metadata/metadata.json`. |
| `addSourceComments` | `true` | Prepends attribution comments to each shipped code file. |
| `createLicenseFile` | `true` | Generates a `LICENSE` file derived from the sketch license. |
| `createOpMetadata` | `true` | Produces `OPENPROCESSING.md` with title, description, assets, and tags. |
| `vite` | `false` | Set up a Vite project structure for modern web development. |
| `run` | `false` | Automatically run a dev server after download and open it in your browser. Uses Vite dev server if `--vite` is set, otherwise uses a simple HTTP server. |
| `quiet` | `false` | Silence console warnings (errors still surface via the return object). |

## Output Structure

```
sketch_{id}/
├── index.html             # Generated HTML for JS/CSS sketches
├── [code files].js/.css   # Sanitized originals with attribution comments
├── [assets]               # Images, sounds, etc.
├── LICENSE                # Creative Commons notice (if provided)
├── OPENPROCESSING.md      # Human-friendly metadata summary
└── metadata/
    ├── metadata.json      # Raw API response
    └── thumbnail.jpg      # Visual thumbnail (if enabled)
```

## Error Handling

- Invalid or malformed sketch IDs immediately resolve with `success: false` and an appropriate error message.
- Private sketches and sketches with hidden code abort the download and populate `sketchInfo.error` with details.
- Network or file-system errors populate `sketchInfo.error` while still returning a structured result.
- Asset-download failures are logged (unless `quiet: true`) but do not abort the operation.
- **Rate Limiting**: The OpenProcessing API has dynamic rate-limits that depend on your account type. When exceeded, you'll receive a descriptive error message with retry guidance.

## Attribution

All downloads preserve the original licensing information. `LICENSE` reflects Creative Commons licenses when provided, and `OPENPROCESSING.md` records metadata, tags, and library dependencies. Attribution comments at the top of each code file explain the sketch origin and link back to OpenProcessing.

## Development

### Running locally

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

### Running tests

```bash
npm test
```

Tests use [Vitest](https://vitest.dev/) and include a live API integration test that makes real requests to OpenProcessing. Set `OP_API_KEY` before running tests to avoid rate limiting:

```bash
OP_API_KEY=YOUR_API_TOKEN npm test
```

## Thanks
Thanks to Sinan Ascioglu for creating OpenProcessing and providing the API at https://openprocessing.org/api
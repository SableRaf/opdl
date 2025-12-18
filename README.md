# opdl

With `opdl`, you can take an OpenProcessing sketch, download it by ID, and get a ready-to-run local version that includes all files, assets, and credits.

## Quick start (no installation required)

Download sketch ID `2063664` to a folder named `sketch_2063664`:

```
npx opdl 2063664
```

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

## Usage

### Command Line

```bash
opdl <sketchId> [--outputDir=dir] [--quiet]
```

**Examples:**

```bash
# Check version
opdl --version

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

See the [HELP.md](HELP.md) file for a full list of CLI options and flags.

You can also run `opdl --help` to see all available options.

### Programmatic API

```javascript
const opdl = require('opdl');

(async () => {
  const result = await opdl('2063664');
  if (!result.success && result.sketchInfo.hiddenCode) {
    console.log('Sketch source is private');
    return;
  }

  if (result.success) {
    console.log(`Downloaded sketch: ${result.sketchInfo.title} by ${result.sketchInfo.author}`);
    console.log(`Location: ${result.outputPath}`);
  } else {
    console.error(result.sketchInfo.error);
  }
})();
```

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
- Hidden sketches abort the download and set `sketchInfo.hiddenCode = true`.
- Network or file-system errors populate `sketchInfo.error` while still returning a structured result.
- Asset-download failures are logged (unless `quiet: true`) but do not abort the operation.

## Attribution

All downloads preserve the original licensing information. `LICENSE` reflects Creative Commons licenses when provided, and `OPENPROCESSING.md` records metadata, tags, and library dependencies. Attribution comments at the top of each code file explain the sketch origin and link back to OpenProcessing.

## Thanks
Thanks to Sinan Ascioglu for creating OpenProcessing and providing the API at https://openprocessing.org/api
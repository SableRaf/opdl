# opdl

With `opdl`, you can take an OpenProcessing sketch, download it by ID, and get a ready-to-run local version that includes all files, assets, and credits. This is ideal for offline access, archiving, or using OpenProcessing sketches as a starting point for your own projects.

This also serves as a command-line client for the OpenProcessing API, so you can do much more than just download sketches. See the [documentation](HELP.md) for a full list of features.

## Quick start (no installation required)

Download sketch ID `2063664` to a folder named `sketch_2063664`:

```
npx opdl 2063664
```

> [!NOTE] 
> Since v2 of the OpenProcessing API, unauthenticated requests are heavily rate limited. A Bearer token is recommended for regular use (see [Authentication](#authentication)).

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

See the [documentation](HELP.md#authentication) for details on how to use your API token with `opdl`.

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

See the [documentation](HELP.md) file for a full list of CLI options and flags.

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

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to the project, including setup instructions.

## Thanks
Thanks to Sinan Ascioglu for creating OpenProcessing and providing the API at https://openprocessing.org/api
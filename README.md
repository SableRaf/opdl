# opdl

Enter `opdl <sketchId>` in a terminal to create a ready-to-run local copy of an [OpenProcessing](https://openprocessing.org/) project (sketch) with its code, files, assets, credits, and available license information.

This is useful when you want to:

* run a sketch without an internet connection
* keep a local archive of your sketches
* study or modify a sketch on your computer
* use an existing sketch as a starting point for a new project (provided the license allows it)

`opdl` can also access other features of the OpenProcessing API from the command line. See the [documentation](HELP.md) for the full list of commands and options.

This is not an official OpenProcessing project, and is not affiliated with or endorsed by OpenProcessing. See the [Acknowledgements](#acknowledgements) section for more information.

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

Here is a more beginner-friendly version:

## Authentication

You can use `opdl` without signing in, but OpenProcessing limits how many unauthenticated requests you can make per minute. For regular use, we recommend creating an authentication token (also known as "API token", or "bearer token").

To create one:

1. Sign in to your OpenProcessing account.
2. Go to `Profile` > `Edit Profile` > `API Tokens`.
3. Create a new token.

You can pass the token with your command using the `--token` flag:

```bash
opdl 2063664 --token YOUR_API_TOKEN
```

Or, to save it for future use, set it as an environment variable:

```bash
export OP_API_KEY=YOUR_API_TOKEN
```

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

When you download a sketch, `opdl` creates a new directory with the following structure:

```
sketch_{id}/
├── sketch/
│   └── {name}/             # Named after the sketch's main code file
│       ├── index.html      # Generated HTML for JS/CSS/pjs sketches
│       ├── [code files]    # Sanitized originals with attribution comments
│       └── [assets]        # Images, sounds, etc.
├── LICENSE                 # Creative Commons notice (if provided)
├── OPENPROCESSING.md       # Human-friendly metadata summary
└── metadata/
    ├── metadata.json       # Raw API response
    └── thumbnail.jpg       # Visual thumbnail (if enabled)
```

The runnable sketch (code, `index.html`, assets) lives in `sketch/{name}/`, separate from opdl's own bookkeeping (`metadata/`, `LICENSE`, `OPENPROCESSING.md`) at the top level. `{name}` is derived from the sketch's main code file, so `sketch/{name}/` opens cleanly on its own — handy when sharing or zipping just the sketch.

**Processing.js (`pjs`) sketches** are downloaded as `.pde` files (real Processing/Java-like code, not JavaScript) alongside a generated `index.html` that loads them via a `<canvas data-processing-sources="...">` element — the same folder opens natively in the Processing PDE (no `sketch.properties` needed, since the folder is named after the main `.pde` file) and also runs in a browser via `--run` or `--vite`. Any `.js` tabs on a pjs sketch are helper scripts that run in the browser only — they won't execute inside the Processing PDE.

## Licenses and attribution

OpenProcessing sketches come with a license that explains how you may use, modify, and share them. Many sketches use a [Creative Commons license](https://creativecommons.org/share-your-work/cclicenses/), but the exact license may differs from one sketch to another.

`opdl` includes license and attribution information based on the metadata provided by OpenProcessing. However, you should also check the sketch’s source code and included files, as they may contain additional or more specific license information.

Always respect the license terms when using, modifying, or sharing someone else’s work. If you are unsure about the license or how to comply with it, contact the sketch author for clarification.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to the project, including setup instructions.

## Acknowledgements

This project is not affiliated with [OpenProcessing](https://openprocessing.org/), and is not officially supported. Thanks to Sinan Ascioglu for creating OpenProcessing and providing the API at https://openprocessing.org/api, making this project possible. Thanks to the Processing community for sharing their creative work for others to learn from and enjoy.
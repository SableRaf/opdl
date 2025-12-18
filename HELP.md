# opdl - OpenProcessing Downloader CLI

Complete command reference and documentation for opdl.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [Field Discovery](#field-discovery)
  - [Sketch Commands](#sketch-commands)
  - [User Commands](#user-commands)
  - [Curation Commands](#curation-commands)
- [Options](#options)
  - [Output Control](#output-control)
  - [List Options](#list-options)
  - [Download Options](#download-options)
- [Examples](#examples)
- [Field Selection](#field-selection)
- [Environment Variables](#environment-variables)

## Overview

`opdl` is a command-line tool for downloading OpenProcessing sketches, and exploring the OpenProcessing API. It allows you to query information about sketches, users, and curations. 

It supports:

- Downloading complete sketches with all assets
- Querying metadata for sketches, users, and curations
- Flexible field selection for customized output
- Multiple output formats (table, JSON)
- List operations with pagination

## Installation

```bash
npm install -g opdl
```

Or use directly with npx:

```bash
npx opdl <command>
```

## Quick Start

```bash
# Download a sketch
opdl 1142958

# Get sketch information
opdl sketch info 1142958

# Get specific fields
opdl 1142958 --info title,license,libraries

# List user's sketches
opdl user sketches 12345

# Output as JSON
opdl user 12345 --json
```

## Commands

### Field Discovery

Discover available fields for different entity types.

#### List all field sets

```bash
opdl fields
```

Shows all available field sets:
- `sketch` - Sketch metadata fields
- `user` - User profile fields
- `curation` - Curation fields
- `user.sketches` - Fields for user's sketch list
- `user.followers` - Fields for user's followers list
- `user.following` - Fields for user's following list
- `curation.sketches` - Fields for curation's sketch list

#### Show fields for a specific field set

```bash
opdl fields <fieldSet>
```

**Examples:**
```bash
opdl fields sketch
opdl fields user
opdl fields user.sketches
```

Displays all available fields with their types and descriptions.

### Sketch Commands

Work with OpenProcessing sketches.

#### Download a sketch (shortcut)

```bash
opdl <sketchId> [options]
```

**Example:**
```bash
opdl 1142958
opdl 1142958 --outputDir ./my-sketches
```

#### Download a sketch (explicit)

```bash
opdl sketch download <sketchId> [options]
```

**Example:**
```bash
opdl sketch download 1142958 --outputDir ./projects
```

Downloads the sketch files including:
- Source code (sketch.js or other main files)
- HTML template
- Assets (images, data files)
- Thumbnail image (optional)
- Metadata (optional)
- License file (optional)

#### Display sketch metadata

```bash
opdl sketch info <sketchId> [options]
```

**Example:**
```bash
opdl sketch info 1142958
opdl sketch info 1142958 --json
opdl sketch info 1142958 --info title,license,createdOn
```

#### Display selected sketch fields (shortcut)

```bash
opdl <sketchId> --info <fields>
```

**Example:**
```bash
opdl 1142958 --info title,license,libraries
opdl 1142958 --info all --json
```

### User Commands

Work with OpenProcessing users.

#### Display user information

```bash
opdl user <userId> [options]
```

**Example:**
```bash
opdl user 1
opdl user 1 --info fullname,website,createdOn
opdl user 1 --json
```

#### List user's sketches

```bash
opdl user sketches <userId> [options]
```

**Example:**
```bash
opdl user sketches 1
opdl user sketches 1 --limit 10
opdl user sketches 1 --info visualID,title,createdOn
opdl user sketches 1 --json
```

**Note:** The user sketches list endpoint returns limited fields. Use `opdl fields user.sketches` to see available fields. For full sketch details including license and other metadata, fetch each sketch individually with `opdl sketch info <sketchId>`.

#### List user's followers

```bash
opdl user followers <userId> [options]
```

**Example:**
```bash
opdl user followers 1
opdl user followers 1 --limit 20 --json
opdl user followers 1 --info userID,fullname
```

#### List users being followed

```bash
opdl user following <userId> [options]
```

**Example:**
```bash
opdl user following 1
opdl user following 1 --limit 20 --json
```

### Curation Commands

Work with OpenProcessing curations (collections).

#### Display curation information

```bash
opdl curation <curationId> [options]
```

**Example:**
```bash
opdl curation 12
opdl curation 12 --info title,description
opdl curation 12 --json
```

#### List sketches in a curation

```bash
opdl curation sketches <curationId> [options]
```

**Example:**
```bash
opdl curation sketches 12
opdl curation sketches 12 --limit 10
opdl curation sketches 12 --sort desc
opdl curation sketches 12 --json
```

**Note:** Like user sketches, the curation sketches list endpoint returns limited fields. Use `opdl fields curation.sketches` to see available fields.

## Options

### Output Control

Options that control how data is displayed.

#### `--info <fields|all>`

Select specific fields to display. Can be:
- Comma-separated field names: `--info field1,field2,field3`
- The keyword `all`: `--info all` (shows all available fields)

**Examples:**
```bash
opdl 1142958 --info title,license
opdl user 1 --info fullname,website,location
opdl user sketches 1 --info visualID,title,createdOn
```

#### `--json`

Output data in JSON format instead of table format.

**Examples:**
```bash
opdl sketch info 1142958 --json
opdl user 1 --json
opdl user sketches 1 --json
```

#### `--quiet`

Suppress non-essential output messages. Useful for scripting.

**Examples:**
```bash
opdl 1142958 --quiet
opdl sketch download 1142958 --quiet
```

### List Options

Options for commands that return lists (user sketches, followers, etc.).

#### `--limit <n>`

Limit the number of results returned.

**Examples:**
```bash
opdl user sketches 1 --limit 10
opdl user followers 1 --limit 50
opdl curation sketches 12 --limit 20
```

#### `--offset <n>`

Skip the first n results. Useful for pagination.

**Examples:**
```bash
opdl user sketches 1 --offset 10 --limit 10  # Get results 11-20
opdl user followers 1 --offset 100 --limit 50
```

#### `--sort <asc|desc>`

Sort order for results.

**Examples:**
```bash
opdl user sketches 1 --sort desc
opdl curation sketches 12 --sort asc
```

### Download Options

Options specific to sketch download operations.

#### `--outputDir <path>`

Specify the output directory for downloaded files. Defaults to current directory.

**Examples:**
```bash
opdl 1142958 --outputDir ./projects
opdl sketch download 1142958 --outputDir ~/Documents/sketches
```

#### `--downloadThumbnail`

Download the sketch thumbnail image.

**Example:**
```bash
opdl 1142958 --downloadThumbnail
```

#### `--saveMetadata`

Save sketch metadata as a JSON file.

**Example:**
```bash
opdl 1142958 --saveMetadata
```

#### `--skipAssets`

Skip downloading asset files (images, data files, etc.).

**Example:**
```bash
opdl 1142958 --skipAssets
```

#### `--vite`

Set up a Vite project structure for modern web development.

This will:
- Create a `package.json` with Vite as a dependency
- Create a `vite.config.js` configuration file
- Move code files to a `src/` directory
- Move assets to a `public/` directory
- Update `index.html` to work with Vite's module system
- Install dependencies automatically (unless `--quiet` is set)

**Requirements:**
- Node.js 20 or higher (required by Vite 6)

**Example:**
```bash
opdl 1142958 --vite
opdl sketch download 1142958 --vite --outputDir ./projects
```

After setup, run `npm run dev` in the sketch directory to start the development server.

## Examples

### Field Discovery Workflow

```bash
# List all available field sets
opdl fields

# Check what fields are available for sketches
opdl fields sketch

# Check what fields are available for user sketches list
opdl fields user.sketches
```

### Getting Sketch Information

```bash
# Get basic sketch info in table format
opdl sketch info 1142958

# Get specific fields
opdl 1142958 --info title,license,tags,updatedOn

# Get all fields as JSON
opdl sketch info 1142958 --info all --json

# Get just the title (quiet mode)
opdl 1142958 --info title --quiet
```

### Downloading Sketches

```bash
# Simple download
opdl 1142958

# Download to specific directory
opdl 1142958 --outputDir ./my-projects

# Download with thumbnail and metadata
opdl 1142958 --downloadThumbnail --saveMetadata

# Download multiple sketches (using shell loop)
for id in 1142958 1142959 1142960; do
  opdl $id --outputDir ./sketches
done
```

### Vite Project Setup

```bash
# Download sketch with Vite project structure
opdl 1142958 --vite

# Download to specific directory with Vite
opdl 1142958 --vite --outputDir ./projects

# Download with Vite in quiet mode (skip npm install)
opdl 1142958 --vite --quiet

# After download, start development server
cd sketch_1142958
npm run dev

# Build for production
npm run build
```

### Working with Users

```bash
# Get user profile
opdl user 1

# Get specific user fields
opdl user 1 --info fullname,website,location,createdOn

# List user's recent sketches
opdl user sketches 1 --limit 10 --sort desc

# Get sketch IDs and titles only
opdl user sketches 1 --info visualID,title

# List first 50 followers as JSON
opdl user followers 1 --limit 50 --json

# Check who a user is following
opdl user following 1 --info userID,fullname,membershipType
```

### Working with Curations

```bash
# Get curation info
opdl curation 12

# List sketches in curation
opdl curation sketches 12

# Get first 20 sketches with specific fields
opdl curation sketches 12 --limit 20 --info visualID,title,createdOn

# Export curation data as JSON
opdl curation 12 --json > curation-12.json
opdl curation sketches 12 --json > curation-12-sketches.json
```

### Pagination Examples

```bash
# Get first page (results 0-9)
opdl user sketches 1 --limit 10 --offset 0

# Get second page (results 10-19)
opdl user sketches 1 --limit 10 --offset 10

# Get third page (results 20-29)
opdl user sketches 1 --limit 10 --offset 20
```

### Combining with Shell Tools

```bash
# Count user's sketches
opdl user sketches 1 --json | jq 'length'

# Extract just titles
opdl user sketches 1 --info title --quiet

# Get sketch IDs and download them
opdl user sketches 1 --info visualID --quiet | while read id; do
  opdl $id --outputDir ./user-1-sketches
done

# Search for sketches with "p5js" in title (mode field)
opdl user sketches 1 --json | jq '.[] | select(.mode == "p5js")'

# Get full details for sketches in a user's list
opdl user sketches 1 --info visualID --quiet | while read id; do
  opdl sketch info $id --info title,license,tags,updatedOn
done
```

## Field Selection

The `--info` option allows you to select specific fields from API responses.

### Syntax

```bash
--info field1,field2,field3  # Select specific fields
--info all                   # Select all available fields
```

### Available Fields

Use `opdl fields <fieldSet>` to see all available fields for a specific entity type.

### Understanding Endpoint Differences

**Important:** Different API endpoints return different fields. The OpenProcessing API has two types of sketch endpoints:

1. **Single sketch endpoint** (`/api/sketch/:id`) - Returns full metadata
   - Accessed via: `opdl sketch info <sketchId>` or `opdl <sketchId> --info`
   - Use `opdl fields sketch` to see all available fields
   - Includes fields like: `license`, `libraries`, `tags`, `isDraft`, `parentID`, etc.

2. **List endpoints** - Return limited fields for performance

   **User sketches** (`/api/user/:id/sketches`):
   - Accessed via: `opdl user sketches <userId>`
   - Use `opdl fields user.sketches` to see available fields
   - Includes basic fields: `visualID`, `title`, `description`, `instructions`, `createdOn`, `mode`

   **Curation sketches** (`/api/curation/:id/sketches`):
   - Accessed via: `opdl curation sketches <curationId>`
   - Use `opdl fields curation.sketches` to see available fields
   - Includes more fields than user.sketches: `visualID`, `title`, `description`, `instructions`, `createdOn`, `submittedOn`, `mode`, `userID`, `fullname`, `membershipType`, `parentID`, `status`

   Both list endpoints do not include: `license`, `libraries`, `tags`, or other detailed metadata

**To get full details for sketches in a list:**
```bash
# Get sketch IDs from list
opdl user sketches 1 --info visualID --quiet | while read id; do
  # Fetch full details for each sketch
  opdl sketch info $id --info title,license,tags,libraries
done
```

### Common Sketch Fields

When using `opdl sketch info <sketchId>` or `opdl <sketchId> --info`:
- `visualID` - Sketch ID
- `title` - Sketch title
- `description` - Sketch description
- `instructions` - Usage instructions
- `license` - License type (CC BY-SA, MIT, etc.)
- `tags` - Sketch tags
- `libraries` - Libraries used (p5.js, p5.sound, etc.)
- `createdOn` - Creation date
- `updatedOn` - Last modification date
- `mode` - Sketch mode (p5.js, processing, etc.)
- `userID` - Author's user ID
- `parentID` - Parent sketch ID (if forked)
- `isDraft` - Whether sketch is a draft
- `isTemplate` - Whether sketch is a template
- `isTutorial` - Whether sketch is a tutorial

**Note:** The OpenProcessing API does not expose `hearts` or `views` counts in sketch metadata.

When using `opdl user sketches <userId>`:
- `visualID` - Sketch ID
- `title` - Sketch title
- `description` - Sketch description
- `instructions` - Usage instructions
- `createdOn` - Creation date
- `mode` - Sketch mode (p5js, processing, etc.)

When using `opdl curation sketches <curationId>` (includes author info):
- `visualID` - Sketch ID
- `title` - Sketch title
- `description` - Sketch description
- `instructions` - Usage instructions
- `createdOn` - Creation date
- `submittedOn` - Submission date
- `mode` - Sketch mode (p5js, processing, etc.)
- `userID` - Author user ID
- `fullname` - Author full name
- `membershipType` - Author membership type
- `parentID` - Parent sketch ID (if forked)
- `status` - Sketch status

Use `opdl fields user.sketches` or `opdl fields curation.sketches` for complete field listings.

### Common User Fields

- `userID` - User ID
- `fullname` - Full name
- `website` - Website URL
- `location` - Location
- `bio` - User biography
- `createdOn` - Account creation date

### Notes on Field Selection

- Fields not present in the response will be omitted from output
- Invalid field names will trigger a warning and be ignored
- Field validation only applies to registered field sets
- Nested field access with dot notation (e.g., `user.username`) is supported for unregistered field sets

## Environment Variables

### `OP_API_KEY`

OpenProcessing API key for authenticated requests (if required).

```bash
export OP_API_KEY="your-api-key-here"
opdl user 1
```

Or set it for a single command:

```bash
OP_API_KEY="your-api-key-here" opdl user 1
```

## Exit Codes

- `0` - Success
- `1` - Error (invalid command, API error, etc.)

## Tips and Best Practices

### Performance

- Use `--limit` to reduce API response size
- Use `--info` to select only needed fields
- Use `--quiet` in scripts to reduce output overhead

### Scripting

```bash
#!/bin/bash
# Download all sketches from a user

USER_ID=1
OUTPUT_DIR="./user-${USER_ID}-sketches"

# Get all sketch IDs
SKETCH_IDS=$(opdl user sketches $USER_ID --info visualID --quiet)

# Download each sketch
for id in $SKETCH_IDS; do
  echo "Downloading sketch $id..."
  opdl $id --outputDir "$OUTPUT_DIR" --quiet
done

echo "Done! Downloaded $(echo "$SKETCH_IDS" | wc -l) sketches"
```

### JSON Processing

Use `jq` for advanced JSON processing:

```bash
# Filter sketches by mode
opdl user sketches 1 --json | jq '.[] | select(.mode == "p5js")'

# Sort sketches by creation date
opdl user sketches 1 --json | jq 'sort_by(.createdOn) | reverse'

# Extract specific fields from sketch info
opdl sketch info 1142958 --json | jq '{title, license, mode}'
```

## Troubleshooting

### Command not found

Ensure opdl is installed globally:
```bash
npm install -g opdl
```

### API errors

- Check your internet connection
- Verify the entity ID exists (sketch, user, or curation)
- If using API key, ensure `OP_API_KEY` is set correctly

### Permission errors

If you get permission errors during download:
```bash
opdl 1142958 --outputDir ~/Documents/sketches  # Use absolute path
```

## Getting Help

- Run `opdl --help` or `opdl -h` for quick help
- View this documentation: `cat $(npm root -g)/opdl/HELP.md`
- Report issues: https://github.com/SableRaf/opdl/issues

## See Also

- [README.md](README.md) - Project overview and quick start
- [OpenProcessing API Documentation](https://openprocessing.org/api)
- [GitHub Repository](https://github.com/SableRaf/opdl)

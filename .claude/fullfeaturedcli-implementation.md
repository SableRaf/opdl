# Full-Featured CLI Implementation Plan

**Based on**: [fullfeaturedplan.md](fullfeaturedplan.md) and [openprocessingapi.md](openprocessingapi.md).

This document provides a concrete, step-by-step implementation plan to transform `opdl` into a full-featured CLI supporting field selection, multiple entities (sketch, user, curation), and list endpoints.

---

## Implementation Overview

### Phase 1: Foundation & Architecture (Steps 1-5)
- Set up TypeScript types for all API entities
- Create field discovery system
- Refactor CLI parser to support entity commands
- Implement base API client infrastructure

### Phase 2: Core Commands (Steps 6-10)
- Implement sketch commands (download, info)
- Implement user commands (info, sketches, followers, following)
- Implement curation commands (info, sketches)
- Add field selection (`--info`) support

### Phase 3: Output & Polish (Steps 11-14) ✅ COMPLETED
- ✅ Implement output formatters (JSON, table, quiet)
- ✅ Add pagination support (limit, offset, sort)
- ✅ Update help system and documentation
- ✅ Add comprehensive tests
- ✅ Create a HELP.md file documenting all commands and options

---

## Step-by-Step Implementation

### Step 1: Define TypeScript Types for All Entities

**File**: [src/types/api.ts](src/types/api.ts)

Create comprehensive TypeScript interfaces for all OpenProcessing API entities:

```typescript
// Sketch entity
export interface Sketch {
  visualID: number;
  title: string;
  description: string;
  license: string;
  libraries: string[];
  createdOn: string;
  modifiedOn: string;
  user: SketchUser;
  // ... all other sketch fields from API
}

// User entity
export interface User {
  userID: number;
  username: string;
  fullname: string;
  website: string;
  location: string;
  memberSince: string;
  bio: string;
  // ... all other user fields from API
}

// Curation entity
export interface Curation {
  curationID: number;
  title: string;
  description: string;
  createdOn: string;
  createdBy: User;
  // ... all other curation fields from API
}

// List item types
export interface UserSketchItem {
  visualID: number;
  title: string;
  submittedOn: string;
  // ... fields returned in user sketches list
}

export interface UserFollowerItem {
  userID: number;
  fullname: string;
  followedOn: string;
  // ... fields returned in followers list
}

export interface UserFollowingItem {
  userID: number;
  fullname: string;
  followedOn: string;
  // ... fields returned in following list
}

export interface CurationSketchItem {
  visualID: number;
  title: string;
  submittedOn: string;
  // ... fields returned in curation sketches list
}
```

**Why first**: Type safety ensures correct field names throughout implementation.

---

### Step 2: Create Field Registry System

**File**: [src/fieldRegistry.ts](src/fieldRegistry.ts)

Build a centralized system to:
- Register all available fields for each entity/relation
- Provide field discovery
- Validate field selections

```typescript
export type FieldSetName =
  | 'sketch'
  | 'user'
  | 'curation'
  | 'user.sketches'
  | 'user.followers'
  | 'user.following'
  | 'curation.sketches';

export interface FieldDefinition {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
}

export interface FieldSet {
  name: FieldSetName;
  description: string;
  fields: FieldDefinition[];
  endpoint: string; // API endpoint this corresponds to
}

class FieldRegistry {
  private fieldSets: Map<FieldSetName, FieldSet> = new Map();

  register(fieldSet: FieldSet): void {
    this.fieldSets.set(fieldSet.name, fieldSet);
  }

  get(name: FieldSetName): FieldSet | undefined {
    return this.fieldSets.get(name);
  }

  listFieldSets(): FieldSetName[] {
    return Array.from(this.fieldSets.keys());
  }

  getFields(name: FieldSetName): FieldDefinition[] {
    return this.fieldSets.get(name)?.fields || [];
  }

  validateFields(fieldSetName: FieldSetName, fieldNames: string[]): string[] {
    const fieldSet = this.get(fieldSetName);
    if (!fieldSet) return fieldNames; // unknown field set, pass through

    const validFields = new Set(fieldSet.fields.map(f => f.name));
    const invalid = fieldNames.filter(name => !validFields.has(name));
    return invalid;
  }
}

export const fieldRegistry = new FieldRegistry();

// Initialize with all field sets
fieldRegistry.register({
  name: 'sketch',
  description: 'Fields available for sketch objects',
  endpoint: '/api/sketch/:id',
  fields: [
    { name: 'visualID', description: 'Sketch ID', type: 'number' },
    { name: 'title', description: 'Sketch title', type: 'string' },
    { name: 'description', description: 'Sketch description', type: 'string' },
    { name: 'license', description: 'License type', type: 'string' },
    { name: 'libraries', description: 'Libraries used', type: 'array' },
    // ... all other fields
  ]
});

// Register all other field sets...
```

**Why second**: Provides infrastructure for field discovery and validation.

---

### Step 3: Implement Field Discovery Commands

**File**: [src/commands/fields.ts](src/commands/fields.ts)

Create the `opdl fields` command:

```typescript
import { fieldRegistry, FieldSetName } from '../fieldRegistry';
import { formatFieldList, formatFieldSetList } from '../formatters';

export async function handleFieldsCommand(args: {
  fieldSetName?: FieldSetName;
  json?: boolean;
}): Promise<void> {
  if (!args.fieldSetName) {
    // List all field sets: opdl fields
    const fieldSets = fieldRegistry.listFieldSets();

    if (args.json) {
      console.log(JSON.stringify(fieldSets, null, 2));
    } else {
      console.log('Available field sets:\n');
      console.log(formatFieldSetList(fieldSets));
    }
    return;
  }

  // Show fields for specific field set: opdl fields sketch
  const fieldSet = fieldRegistry.get(args.fieldSetName);

  if (!fieldSet) {
    throw new Error(`Unknown field set: ${args.fieldSetName}`);
  }

  if (args.json) {
    console.log(JSON.stringify(fieldSet.fields, null, 2));
  } else {
    console.log(`Fields for ${args.fieldSetName}:\n`);
    console.log(`Endpoint: ${fieldSet.endpoint}\n`);
    console.log(formatFieldList(fieldSet.fields));
  }
}
```

**Integration point**: Add to CLI parser (Step 4).

---

### Step 4: Refactor CLI Parser for Entity-Based Commands

**File**: [src/cli.ts](src/cli.ts)

Restructure the CLI parser to support the new command structure:

```typescript
interface ParsedCommand {
  command: 'fields' | 'sketch' | 'user' | 'curation';
  subcommand?: string; // download, info, sketches, followers, etc.
  id?: string | number;
  options: {
    info?: string; // comma-separated fields or "all"
    json?: boolean;
    quiet?: boolean;
    outputDir?: string;
    limit?: number;
    offset?: number;
    sort?: 'asc' | 'desc';
    // ... other existing options
  };
}

export function parseArgs(argv: string[]): ParsedCommand {
  // Handle: opdl fields [fieldSetName]
  if (argv[0] === 'fields') {
    return {
      command: 'fields',
      options: { json: argv.includes('--json') }
    };
  }

  // Handle: opdl sketch <subcommand> <id>
  if (argv[0] === 'sketch') {
    const subcommand = argv[1]; // download, info
    const id = argv[2];
    return {
      command: 'sketch',
      subcommand,
      id,
      options: parseOptions(argv.slice(3))
    };
  }

  // Handle: opdl user <subcommand> <id>
  if (argv[0] === 'user') {
    const subcommand = argv[1]; // sketches, followers, following, or omit for info
    const id = argv[2];
    return {
      command: 'user',
      subcommand,
      id,
      options: parseOptions(argv.slice(3))
    };
  }

  // Handle: opdl curation <subcommand> <id>
  if (argv[0] === 'curation') {
    const subcommand = argv[1]; // sketches, or omit for info
    const id = argv[2];
    return {
      command: 'curation',
      subcommand,
      id,
      options: parseOptions(argv.slice(3))
    };
  }

  // Handle shortcut: opdl <id> [options]
  // Assumes first arg is sketch ID if numeric
  if (!isNaN(Number(argv[0]))) {
    return {
      command: 'sketch',
      subcommand: argv.some(a => a.startsWith('--info')) ? 'info' : 'download',
      id: argv[0],
      options: parseOptions(argv.slice(1))
    };
  }

  throw new Error(`Unknown command: ${argv[0]}`);
}

function parseOptions(args: string[]): ParsedCommand['options'] {
  // Parse all flags and options
  const options: ParsedCommand['options'] = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--json') options.json = true;
    else if (arg === '--quiet') options.quiet = true;
    else if (arg.startsWith('--info=')) {
      options.info = arg.split('=')[1];
    } else if (arg === '--info') {
      options.info = args[++i];
    } else if (arg.startsWith('--outputDir=')) {
      options.outputDir = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--offset=')) {
      options.offset = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--sort=')) {
      options.sort = arg.split('=')[1] as 'asc' | 'desc';
    }
    // ... parse other options
  }

  return options;
}
```

**Why fourth**: Provides routing infrastructure before implementing commands.

---

### Step 5: Create API Client Infrastructure

**File**: [src/api/client.ts](src/api/client.ts)

Build a unified API client to handle all OpenProcessing API requests:

```typescript
import axios, { AxiosInstance } from 'axios';
import { Sketch, User, Curation, UserSketchItem, UserFollowerItem, UserFollowingItem, CurationSketchItem } from '../types/api';

export interface ListOptions {
  limit?: number;
  offset?: number;
  sort?: 'asc' | 'desc';
}

export class OpenProcessingClient {
  private client: AxiosInstance;

  constructor(private apiKey?: string) {
    this.client = axios.create({
      baseURL: 'https://openprocessing.org',
      headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
    });
  }

  // Sketch methods
  async getSketch(id: number): Promise<Sketch> {
    const response = await this.client.get(`/sketch/${id}/json`);
    return response.data;
  }

  // User methods
  async getUser(id: number): Promise<User> {
    const response = await this.client.get(`/api/user/${id}`);
    return response.data;
  }

  async getUserSketches(userId: number, options?: ListOptions): Promise<UserSketchItem[]> {
    const response = await this.client.get(`/api/user/${userId}/sketches`, {
      params: options
    });
    return response.data;
  }

  async getUserFollowers(userId: number, options?: ListOptions): Promise<UserFollowerItem[]> {
    const response = await this.client.get(`/api/user/${userId}/followers`, {
      params: options
    });
    return response.data;
  }

  async getUserFollowing(userId: number, options?: ListOptions): Promise<UserFollowingItem[]> {
    const response = await this.client.get(`/api/user/${userId}/following`, {
      params: options
    });
    return response.data;
  }

  // Curation methods
  async getCuration(id: number): Promise<Curation> {
    const response = await this.client.get(`/api/curation/${id}`);
    return response.data;
  }

  async getCurationSketches(curationId: number, options?: ListOptions): Promise<CurationSketchItem[]> {
    const response = await this.client.get(`/api/curation/${curationId}/sketches`, {
      params: options
    });
    return response.data;
  }
}
```

**Why fifth**: Provides clean API abstraction for all commands.

---

### Step 6: Implement Field Selection Logic

**File**: [src/fieldSelector.ts](src/fieldSelector.ts)

Create logic to select and format specific fields from objects:

```typescript
import { fieldRegistry, FieldSetName } from './fieldRegistry';

export interface FieldSelectionOptions {
  fields: string | string[]; // comma-separated string or array
  fieldSetName: FieldSetName;
}

export function selectFields<T extends Record<string, any>>(
  data: T | T[],
  options: FieldSelectionOptions
): any {
  // Parse field list
  let fieldList: string[];
  if (options.fields === 'all') {
    const fieldSet = fieldRegistry.get(options.fieldSetName);
    fieldList = fieldSet ? fieldSet.fields.map(f => f.name) : Object.keys(Array.isArray(data) ? data[0] : data);
  } else if (typeof options.fields === 'string') {
    fieldList = options.fields.split(',').map(f => f.trim());
  } else {
    fieldList = options.fields;
  }

  // Validate fields
  const invalid = fieldRegistry.validateFields(options.fieldSetName, fieldList);
  if (invalid.length > 0) {
    console.warn(`Warning: Unknown fields will be ignored: ${invalid.join(', ')}`);
    fieldList = fieldList.filter(f => !invalid.includes(f));
  }

  // Select fields from data
  if (Array.isArray(data)) {
    return data.map(item => selectFieldsFromObject(item, fieldList));
  } else {
    return selectFieldsFromObject(data, fieldList);
  }
}

function selectFieldsFromObject<T extends Record<string, any>>(
  obj: T,
  fields: string[]
): Partial<T> {
  const result: any = {};

  for (const field of fields) {
    // Support nested fields with dot notation
    if (field.includes('.')) {
      const value = getNestedValue(obj, field);
      setNestedValue(result, field, value);
    } else {
      if (field in obj) {
        result[field] = obj[field];
      }
    }
  }

  return result;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!(key in current)) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}
```

**Why sixth**: Core functionality needed by all info commands.

---

### Step 7: Implement Output Formatters

**File**: [src/formatters.ts](src/formatters.ts)

Create formatters for different output modes:

```typescript
import { FieldDefinition, FieldSetName } from './fieldRegistry';

// Format field list for discovery
export function formatFieldList(fields: FieldDefinition[]): string {
  const maxNameLength = Math.max(...fields.map(f => f.name.length));

  return fields.map(f => {
    const name = f.name.padEnd(maxNameLength);
    return `  ${name}  ${f.type.padEnd(8)}  ${f.description}`;
  }).join('\n');
}

// Format field set list for discovery
export function formatFieldSetList(fieldSets: FieldSetName[]): string {
  return fieldSets.map(name => `  ${name}`).join('\n');
}

// Format single object for display
export function formatObject(data: Record<string, any>, options: { json?: boolean }): string {
  if (options.json) {
    return JSON.stringify(data, null, 2);
  }

  // Table format
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    const formattedValue = formatValue(value);
    lines.push(`${key}: ${formattedValue}`);
  }
  return lines.join('\n');
}

// Format array for display
export function formatArray(data: any[], options: { json?: boolean }): string {
  if (options.json) {
    return JSON.stringify(data, null, 2);
  }

  if (data.length === 0) {
    return 'No results found.';
  }

  // Table format with headers
  const keys = Object.keys(data[0]);
  const columnWidths = keys.map(key =>
    Math.max(key.length, ...data.map(item => String(item[key] || '').length))
  );

  // Header
  const header = keys.map((key, i) => key.padEnd(columnWidths[i])).join('  ');
  const separator = columnWidths.map(w => '-'.repeat(w)).join('  ');

  // Rows
  const rows = data.map(item =>
    keys.map((key, i) => String(item[key] || '').padEnd(columnWidths[i])).join('  ')
  );

  return [header, separator, ...rows].join('\n');
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
```

**Why seventh**: Needed for presenting command output.

---

### Step 8: Implement Sketch Commands

**File**: [src/commands/sketch.ts](src/commands/sketch.ts)

Implement all sketch-related commands:

```typescript
import { OpenProcessingClient } from '../api/client';
import { selectFields } from '../fieldSelector';
import { formatObject } from '../formatters';
import { downloadSketch } from '../downloader'; // existing functionality

export async function handleSketchCommand(args: {
  subcommand: 'download' | 'info';
  id: string | number;
  options: {
    info?: string;
    json?: boolean;
    quiet?: boolean;
    outputDir?: string;
    // ... other download options
  };
}): Promise<void> {
  const client = new OpenProcessingClient(process.env.OP_API_KEY);
  const sketchId = Number(args.id);

  if (args.subcommand === 'info' || args.options.info) {
    // Get sketch metadata
    const sketch = await client.getSketch(sketchId);

    // Select fields if --info specified
    let output = sketch;
    if (args.options.info) {
      output = selectFields(sketch, {
        fields: args.options.info,
        fieldSetName: 'sketch'
      });
    }

    // Format and print
    if (!args.options.quiet) {
      console.log(formatObject(output, { json: args.options.json }));
    }
  } else {
    // Download sketch (existing functionality)
    await downloadSketch(sketchId, {
      outputDir: args.options.outputDir,
      quiet: args.options.quiet,
      // ... pass other options
    });
  }
}
```

**Why eighth**: Start with core sketch functionality (already partially exists).

---

### Step 9: Implement User Commands

**File**: [src/commands/user.ts](src/commands/user.ts)

Implement all user-related commands:

```typescript
import { OpenProcessingClient, ListOptions } from '../api/client';
import { selectFields } from '../fieldSelector';
import { formatObject, formatArray } from '../formatters';

export async function handleUserCommand(args: {
  subcommand?: 'sketches' | 'followers' | 'following';
  id: string | number;
  options: {
    info?: string;
    json?: boolean;
    quiet?: boolean;
    limit?: number;
    offset?: number;
    sort?: 'asc' | 'desc';
  };
}): Promise<void> {
  const client = new OpenProcessingClient(process.env.OP_API_KEY);
  const userId = Number(args.id);

  const listOptions: ListOptions = {
    limit: args.options.limit,
    offset: args.options.offset,
    sort: args.options.sort
  };

  if (!args.subcommand) {
    // opdl user <id> --info ...
    const user = await client.getUser(userId);

    let output = user;
    if (args.options.info) {
      output = selectFields(user, {
        fields: args.options.info,
        fieldSetName: 'user'
      });
    }

    if (!args.options.quiet) {
      console.log(formatObject(output, { json: args.options.json }));
    }
  } else if (args.subcommand === 'sketches') {
    // opdl user sketches <id> [--info ...]
    const sketches = await client.getUserSketches(userId, listOptions);

    let output = sketches;
    if (args.options.info) {
      output = selectFields(sketches, {
        fields: args.options.info,
        fieldSetName: 'user.sketches'
      });
    }

    if (!args.options.quiet) {
      console.log(formatArray(output, { json: args.options.json }));
    }
  } else if (args.subcommand === 'followers') {
    // opdl user followers <id> [--info ...]
    const followers = await client.getUserFollowers(userId, listOptions);

    let output = followers;
    if (args.options.info) {
      output = selectFields(followers, {
        fields: args.options.info,
        fieldSetName: 'user.followers'
      });
    }

    if (!args.options.quiet) {
      console.log(formatArray(output, { json: args.options.json }));
    }
  } else if (args.subcommand === 'following') {
    // opdl user following <id> [--info ...]
    const following = await client.getUserFollowing(userId, listOptions);

    let output = following;
    if (args.options.info) {
      output = selectFields(following, {
        fields: args.options.info,
        fieldSetName: 'user.following'
      });
    }

    if (!args.options.quiet) {
      console.log(formatArray(output, { json: args.options.json }));
    }
  }
}
```

**Why ninth**: User commands follow same pattern as sketch commands.

---

### Step 10: Implement Curation Commands

**File**: [src/commands/curation.ts](src/commands/curation.ts)

Implement all curation-related commands:

```typescript
import { OpenProcessingClient, ListOptions } from '../api/client';
import { selectFields } from '../fieldSelector';
import { formatObject, formatArray } from '../formatters';

export async function handleCurationCommand(args: {
  subcommand?: 'sketches';
  id: string | number;
  options: {
    info?: string;
    json?: boolean;
    quiet?: boolean;
    limit?: number;
    offset?: number;
    sort?: 'asc' | 'desc';
  };
}): Promise<void> {
  const client = new OpenProcessingClient(process.env.OP_API_KEY);
  const curationId = Number(args.id);

  const listOptions: ListOptions = {
    limit: args.options.limit,
    offset: args.options.offset,
    sort: args.options.sort
  };

  if (!args.subcommand) {
    // opdl curation <id> --info ...
    const curation = await client.getCuration(curationId);

    let output = curation;
    if (args.options.info) {
      output = selectFields(curation, {
        fields: args.options.info,
        fieldSetName: 'curation'
      });
    }

    if (!args.options.quiet) {
      console.log(formatObject(output, { json: args.options.json }));
    }
  } else if (args.subcommand === 'sketches') {
    // opdl curation sketches <id> [--info ...]
    const sketches = await client.getCurationSketches(curationId, listOptions);

    let output = sketches;
    if (args.options.info) {
      output = selectFields(sketches, {
        fields: args.options.info,
        fieldSetName: 'curation.sketches'
      });
    }

    if (!args.options.quiet) {
      console.log(formatArray(output, { json: args.options.json }));
    }
  }
}
```

**Why tenth**: Complete entity command implementations.

---

### Step 11: Wire Up Main Entry Point

**File**: [src/index.ts](src/index.ts) or [src/cli.ts](src/cli.ts)

Connect all commands to the CLI router:

```typescript
import { parseArgs } from './cli';
import { handleFieldsCommand } from './commands/fields';
import { handleSketchCommand } from './commands/sketch';
import { handleUserCommand } from './commands/user';
import { handleCurationCommand } from './commands/curation';

export async function main(argv: string[]): Promise<void> {
  try {
    const parsed = parseArgs(argv);

    switch (parsed.command) {
      case 'fields':
        await handleFieldsCommand({
          fieldSetName: parsed.id as any,
          json: parsed.options.json
        });
        break;

      case 'sketch':
        await handleSketchCommand({
          subcommand: parsed.subcommand as 'download' | 'info',
          id: parsed.id!,
          options: parsed.options
        });
        break;

      case 'user':
        await handleUserCommand({
          subcommand: parsed.subcommand as any,
          id: parsed.id!,
          options: parsed.options
        });
        break;

      case 'curation':
        await handleCurationCommand({
          subcommand: parsed.subcommand as any,
          id: parsed.id!,
          options: parsed.options
        });
        break;

      default:
        console.error(`Unknown command: ${parsed.command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Entry point
if (require.main === module) {
  main(process.argv.slice(2));
}
```

**Why eleventh**: Integration point for all commands.

---

### Step 12: Update Help System

**File**: [src/help.ts](src/help.ts)

Create comprehensive help documentation:

```typescript
export function showHelp(): void {
  console.log(`
opdl - OpenProcessing Downloader CLI

USAGE:
  opdl <command> [options]

COMMANDS:

  Field Discovery:
    opdl fields                           List all available field sets
    opdl fields <fieldSet>                Show fields for a specific field set

  Sketch Commands:
    opdl <sketchId> [options]             Download sketch (shortcut)
    opdl sketch download <id> [options]   Download sketch files
    opdl sketch info <id> [options]       Display sketch metadata
    opdl <sketchId> --info <fields>       Display selected sketch fields

  User Commands:
    opdl user <userId> [options]          Display user information
    opdl user sketches <userId> [options] List user's sketches
    opdl user followers <userId> [opts]   List user's followers
    opdl user following <userId> [opts]   List users being followed

  Curation Commands:
    opdl curation <id> [options]          Display curation information
    opdl curation sketches <id> [options] List sketches in curation

OPTIONS:

  Output Control:
    --info <fields|all>    Select specific fields to display (comma-separated)
    --json                 Output in JSON format
    --quiet                Suppress output messages

  List Options (for list commands):
    --limit <n>            Limit number of results
    --offset <n>           Skip first n results
    --sort <asc|desc>      Sort order

  Download Options (for sketch download):
    --outputDir <path>     Output directory for files
    --downloadThumbnail    Download thumbnail image
    --saveMetadata         Save metadata JSON file
    --skipCode             Skip downloading code files
    --skipAssets           Skip downloading asset files

EXAMPLES:

  # Field discovery
  opdl fields
  opdl fields sketch
  opdl fields user.sketches

  # Sketch operations
  opdl 1142958 --info title,license,libraries
  opdl sketch download 1142958 --outputDir=./projects
  opdl 1142958 --outputDir=./projects --downloadThumbnail

  # User operations
  opdl user 1 --info fullname,website,memberSince
  opdl user sketches 1 --limit 10 --info visualID,title
  opdl user followers 1 --json

  # Curation operations
  opdl curation 12 --info title,description
  opdl curation sketches 12 --limit 20 --sort desc

ENVIRONMENT:
  OP_API_KEY    OpenProcessing API key (if required)

For more information, visit: https://github.com/yourusername/opdl
`);
}
```

**Why twelfth**: User-facing documentation for the new CLI.

---

### Step 13: Add Comprehensive Tests

**Files**:
- [tests/fieldRegistry.test.ts](tests/fieldRegistry.test.ts)
- [tests/fieldSelector.test.ts](tests/fieldSelector.test.ts)
- [tests/commands/sketch.test.ts](tests/commands/sketch.test.ts)
- [tests/commands/user.test.ts](tests/commands/user.test.ts)
- [tests/commands/curation.test.ts](tests/commands/curation.test.ts)
- [tests/cli.test.ts](tests/cli.test.ts)

Create test suites covering:

1. **Field Registry Tests**:
   - Field set registration
   - Field validation
   - Discovery functionality

2. **Field Selector Tests**:
   - Field selection from objects
   - Field selection from arrays
   - "all" keyword handling
   - Nested field access
   - Invalid field handling

3. **Command Tests** (for each entity):
   - API client mocking
   - Response parsing
   - Field selection integration
   - Output formatting
   - Error handling

4. **CLI Parser Tests**:
   - Command parsing
   - Option parsing
   - Shortcut syntax
   - Error cases

5. **Integration Tests**:
   - End-to-end command execution
   - Multiple command sequences
   - Error scenarios

**Why thirteenth**: Ensure reliability and prevent regressions.

---

### Step 14: Update Documentation

**Files**:
- [README.md](../README.md)
- [docs/CLI.md](docs/CLI.md) (new)
- [docs/API.md](docs/API.md) (new)

Update documentation to cover:

1. **README.md**:
   - Quick start with new commands
   - Feature highlights
   - Installation instructions
   - Basic examples

2. **CLI.md**:
   - Complete command reference
   - All options and flags
   - Advanced usage examples
   - Field discovery guide

3. **API.md**:
   - OpenProcessing API endpoints used
   - Field mappings
   - Rate limiting information
   - Authentication details

**Why last**: Documentation reflects completed implementation.

---

## Testing Strategy

### Manual Testing Checklist

After implementation, test these scenarios:

- [ ] `opdl fields` - Lists all field sets
- [ ] `opdl fields sketch` - Shows sketch fields
- [ ] `opdl fields user.sketches` - Shows user sketches list fields
- [ ] `opdl 1142958 --info title,license` - Shows selected sketch fields
- [ ] `opdl 1142958 --info all` - Shows all sketch fields
- [ ] `opdl 1142958 --outputDir=./test` - Downloads sketch
- [ ] `opdl sketch download 1142958` - Downloads sketch (explicit)
- [ ] `opdl sketch info 1142958 --json` - Shows sketch in JSON
- [ ] `opdl user 1 --info fullname,website` - Shows user fields
- [ ] `opdl user sketches 1 --limit 5` - Lists user sketches
- [ ] `opdl user followers 1 --json` - Lists followers in JSON
- [ ] `opdl user following 1 --sort desc` - Lists following sorted
- [ ] `opdl curation 12 --info title` - Shows curation field
- [ ] `opdl curation sketches 12 --limit 10` - Lists curation sketches
- [ ] Invalid field name warning
- [ ] Unknown command error
- [ ] Missing ID error

### Automated Test Coverage Goals

- Unit tests: >80% coverage
- Integration tests: All command paths
- Error handling: All error scenarios

---

## Migration Considerations

### Backwards Compatibility

The shortcut syntax `opdl <sketchId>` maintains compatibility with existing usage:

```bash
# Old usage - still works
opdl 1142958
opdl 1142958 --outputDir=./projects

# New usage - explicit commands
opdl sketch download 1142958 --outputDir=./projects
opdl sketch info 1142958 --info title,license
```

### Configuration

If API keys or other configuration is needed:

1. Check environment variable: `OP_API_KEY`
2. Check config file: `~/.opdlrc` or `.opdlrc`
3. Prompt user if required and not found

---

## Future Enhancements (Not in This Plan)

These features should be kept in mind but are not part of the current implementation:

1. **Vite Project Generation**: `opdl sketch download <id> --vite`
2. **Batch Downloads**: `opdl sketch download 123 456 789`
3. **Selective File Downloads**: `opdl sketch download <id> --only=code`
4. **Search Commands**: `opdl search sketches <query>`
5. **Cache Management**: `opdl cache clear`
6. **Configuration Commands**: `opdl config set apiKey <key>`

These should be architecturally compatible with the current implementation.

---

## Implementation Timeline Estimate

**Note**: Estimates provided for planning purposes only. Focus is on completing features correctly.

- **Phase 1 (Foundation)**: Steps 1-5
- **Phase 2 (Core Commands)**: Steps 6-10
- **Phase 3 (Polish)**: Steps 11-14

Each phase should be completed and tested before moving to the next.

---

## Success Criteria

Implementation is complete when:

1. ✅ All commands from [fullfeaturedplan.md](fullfeaturedplan.md) are implemented
2. ✅ Field discovery works for all entities
3. ✅ Field selection works with `--info` flag
4. ✅ Output formatting supports both table and JSON
5. ✅ List commands support pagination (limit, offset, sort)
6. ✅ Backwards compatibility maintained for existing usage
7. ✅ Comprehensive tests pass
8. ✅ Documentation is complete and accurate
9. ✅ Error messages are clear and helpful
10. ✅ Help system is comprehensive

---

## API Verification Needed

Before or during implementation, verify these OpenProcessing API endpoints:

- [ ] `/sketch/:id/json` - Get sketch metadata
- [ ] `/api/user/:id` - Get user information
- [ ] `/api/user/:id/sketches` - List user sketches
- [ ] `/api/user/:id/followers` - List user followers
- [ ] `/api/user/:id/following` - List users being followed
- [ ] `/api/curation/:id` - Get curation information
- [ ] `/api/curation/:id/sketches` - List curation sketches

Confirm:
- Exact endpoint paths
- Available fields in responses
- Query parameters supported (limit, offset, sort)
- Authentication requirements
- Rate limiting rules

---

## Notes

- **Field Registry**: The field registry can be populated incrementally. Start with a subset of fields for each entity and expand as needed.

- **Error Handling**: Each command should handle network errors, API errors, and invalid input gracefully with clear error messages.

- **Performance**: For list commands, consider implementing streaming or pagination display for large result sets.

- **Extensibility**: The architecture supports adding new entities (e.g., `sketch.comments`, `sketch.forks`) by registering new field sets and adding corresponding API client methods.

- **API Key Management**: Consider implementing a `opdl auth` command to manage API key storage securely.

---

**End of Implementation Plan**

#!/usr/bin/env node
/**
 * Scan a set of OpenProcessing sketches for ones that use the OPC library
 * (https://github.com/msawired/OPC, any version, any CDN) and have at
 * least a minimum number of hearts (likes).
 *
 * Usage:
 *   node scripts/find-opc-sketches.js --curation 78544
 *   node scripts/find-opc-sketches.js --range 1530000-1535000
 *   node scripts/find-opc-sketches.js --ids 1532131,1532200
 *
 * Options:
 *   --minHearts <n>   Minimum number of hearts required (default: 2)
 *   --token <token>   API token (or set OP_API_KEY)
 *   --verbose         Log the outcome of every sketch checked, not just matches
 *
 * Respects the OpenProcessing API rate limit of 40 requests/minute.
 */

const { OpenProcessingClient } = require('../src/index');

const RATE_LIMIT_PER_MINUTE = 120;
const MIN_DELAY_MS = Math.ceil(60000 / RATE_LIMIT_PER_MINUTE);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const args = { minHearts: 2 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--curation') args.curation = argv[++i];
    else if (arg === '--range') args.range = argv[++i];
    else if (arg === '--ids') args.ids = argv[++i];
    else if (arg === '--minHearts') args.minHearts = parseInt(argv[++i], 10);
    else if (arg === '--token') args.token = argv[++i];
    else if (arg === '--verbose') args.verbose = true;
  }
  return args;
}

async function collectCurationSketchIds(client, curationId, verbose) {
  const ids = [];
  const limit = 100;
  let offset = 0;
  for (;;) {
    if (verbose) console.error(`  fetching curation sketches (offset ${offset})...`);
    const page = await client.getCurationSketches(curationId, { limit, offset });
    await sleep(MIN_DELAY_MS);
    if (!Array.isArray(page) || page.length === 0) break;
    for (const sketch of page) {
      ids.push(sketch.visualID);
      if (verbose) console.error(`  found sketch ${sketch.visualID}: "${sketch.title}"`);
    }
    if (page.length < limit) break;
    offset += limit;
  }
  return ids;
}

function isOpcLibrary(lib) {
  const url = (lib && lib.url) || '';
  return /msawired\/OPC/i.test(url) || /\/opc\.js/i.test(url);
}

async function checkSketch(client, id, minHearts) {
  let libraries;
  try {
    libraries = await client.getSketchLibraries(id);
  } catch (err) {
    return { id, skipped: true, reason: err.message };
  }
  await sleep(MIN_DELAY_MS);

  if (!Array.isArray(libraries) || !libraries.some(isOpcLibrary)) {
    return { id, match: false, reason: 'no OPC library' };
  }

  let hearts;
  try {
    hearts = await client.getSketchHearts(id, { limit: 1000 });
  } catch (err) {
    return { id, skipped: true, reason: err.message };
  }
  await sleep(MIN_DELAY_MS);

  const heartCount = Array.isArray(hearts) ? hearts.length : 0;
  if (heartCount < minHearts) {
    return { id, match: false, heartCount, reason: `only ${heartCount} heart(s), need ${minHearts}` };
  }

  let title = null;
  let url = `https://openprocessing.org/sketch/${id}`;
  try {
    const sketch = await client.getSketch(id);
    title = sketch.title;
    if (sketch.username) url = `https://openprocessing.org/@${sketch.username}/${id}`;
  } catch {
    // ignore - title/username are cosmetic, fall back to the generic sketch URL
  }
  await sleep(MIN_DELAY_MS);

  return { id, url, match: true, heartCount, title };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const client = new OpenProcessingClient(args.token || process.env.OP_API_KEY);

  let ids = [];
  if (args.curation) {
    console.error(`Fetching sketch IDs from curation ${args.curation}...`);
    ids = await collectCurationSketchIds(client, args.curation, args.verbose);
  } else if (args.range) {
    const [start, end] = args.range.split('-').map(Number);
    for (let i = start; i <= end; i++) ids.push(i);
  } else if (args.ids) {
    ids = args.ids.split(',').map(Number);
  } else {
    console.error('Provide one of --curation <id>, --range <start-end>, or --ids <id,id,...>');
    process.exit(1);
  }

  console.error(`Scanning ${ids.length} sketch(es) for OPC library usage with >= ${args.minHearts} hearts...`);
  console.error(`Estimated time: ~${Math.ceil((ids.length * 2 * MIN_DELAY_MS) / 1000)}s (rate-limited to ${RATE_LIMIT_PER_MINUTE}/min)`);

  const matches = [];
  let scanned = 0;
  for (const id of ids) {
    const result = await checkSketch(client, id, args.minHearts);
    scanned++;
    if (result.skipped) {
      console.error(`[${scanned}/${ids.length}] ${id}: skipped (${result.reason})`);
      continue;
    }
    if (result.match) {
      matches.push(result);
      console.error(`[${scanned}/${ids.length}] MATCH - "${result.title}" (${result.heartCount} hearts) - ${result.url}`);
    } else if (args.verbose) {
      console.error(`[${scanned}/${ids.length}] ${id}: no match (${result.reason})`);
    } else if (scanned % 10 === 0) {
      console.error(`[${scanned}/${ids.length}] scanning...`);
    }
  }

  console.error(`\nDone. Found ${matches.length} matching sketch(es).\n`);
  for (const match of matches) console.log(match.url);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});

// Silence console output during tests unless --verbose or TEST_VERBOSE=1 is provided.
// Run tests normally: `npm test` (quiet).
// To see logs: `npm run test -- --verbose` or `TEST_VERBOSE=1 npm test`.

const verboseFlag = process.argv.includes('--verbose') || process.env.TEST_VERBOSE === '1';

if (!verboseFlag) {
  const noop = () => {};
  // Preserve originals in case other tools want to restore
  if (!console._orig) {
    console._orig = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      debug: console.debug,
    };
  }

  console.log = noop;
  console.info = noop;
  console.warn = noop;
  console.debug = noop;
} else {
  // If verbose, ensure originals are restored
  if (console._orig) {
    console.log = console._orig.log;
    console.info = console._orig.info;
    console.warn = console._orig.warn;
    console.debug = console._orig.debug;
  }
}

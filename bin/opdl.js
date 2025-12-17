#!/usr/bin/env node
(async () => {
  const path = require('path');
  const opdl = require(path.join('..', 'src', 'index.js'));

  const argv = process.argv.slice(2);

  const usage = () => {
    console.log('Usage: opdl <sketchId> [--outputDir=dir] [--quiet]');
    console.log('Example: opdl 2063664 --outputDir=./sketch_2063664');
  };

  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    usage();
    process.exit(0);
  }

  // Simple arg parsing
  const sketchId = argv.find(a => !a.startsWith('--'));
  if (!sketchId) {
    console.error('Error: missing sketchId');
    usage();
    process.exit(1);
  }

  const options = {};
  argv.forEach(a => {
    if (a.startsWith('--outputDir=')) options.outputDir = a.split('=')[1];
    if (a === '--quiet') options.quiet = true;
  });

  try {
    const result = await opdl(sketchId, options);
    if (result.success) {
      console.log(`Downloaded: ${result.sketchInfo.title || sketchId}`);
      if (result.outputPath) console.log(`Location: ${result.outputPath}`);
      process.exit(0);
    }

    if (result.sketchInfo && result.sketchInfo.hiddenCode) {
      console.error('Sketch source is private (hidden).');
      process.exit(2);
    }

    console.error('Failed:', result.sketchInfo && result.sketchInfo.error ? result.sketchInfo.error : 'unknown error');
    process.exit(1);
  } catch (err) {
    console.error('Unexpected error:', err && err.message ? err.message : err);
    process.exit(1);
  }

})();

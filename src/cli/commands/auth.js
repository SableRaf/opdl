const { readConfig, writeConfig, CONFIG_PATH } = require('../../config');

/**
 * Handle auth-related commands
 * @param {Object} args
 * @param {string} [args.token] - Token to save (from --token flag)
 * @param {boolean} [args.clear] - Remove saved token
 */
function handleAuthCommand(args) {
  if (args.clear) {
    const config = readConfig();
    delete config.token;
    writeConfig(config);
    console.log('Token cleared from', CONFIG_PATH);
    return;
  }

  if (args.token) {
    const config = readConfig();
    config.token = args.token;
    writeConfig(config);
    console.log('Token saved to', CONFIG_PATH);
    return;
  }

  // Status check
  const config = readConfig();
  if (config.token) {
    console.log('Token is configured in', CONFIG_PATH);
  } else if (process.env.OP_API_KEY) {
    console.log('Token is configured via OP_API_KEY environment variable');
  } else {
    console.log('No token configured. Use: opdl auth --token <your-token>');
  }
}

module.exports = { handleAuthCommand };

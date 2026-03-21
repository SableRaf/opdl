const fs = require('fs');
const os = require('os');
const path = require('path');

const CONFIG_PATH = path.join(os.homedir(), '.opdlrc');

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeConfig(data) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/**
 * Resolve the API token from (in priority order):
 * 1. cliToken  — from --token flag
 * 2. OP_API_KEY env var
 * 3. token field in ~/.opdlrc
 *
 * @param {string} [cliToken]
 * @returns {string|undefined}
 */
function getToken(cliToken) {
  return cliToken || process.env.OP_API_KEY || readConfig().token;
}

module.exports = { getToken, readConfig, writeConfig, CONFIG_PATH };

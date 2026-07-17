const { OpenProcessingClient } = require('../../api/client');
const { getToken } = require('../../config');
const c = require('../colors');

/**
 * Query the OpenProcessing API health endpoint.
 *
 * Network failures are caught and surfaced as an unreachable result rather than
 * thrown, so callers (including the automatic post-error check) can report a
 * clean status instead of crashing.
 *
 * @param {Object} [options]
 * @param {string} [options.token] - Optional bearer token override
 * @returns {Promise<{ok: boolean, status: string|null, version: string|null, timestamp: string|null, httpStatus: number|null, reachable: boolean, error: string|null}>}
 */
async function checkHealth(options = {}) {
  const client = new OpenProcessingClient(getToken(options.token));
  try {
    // Pick explicit fields rather than spreading — getHealth() also returns
    // `raw` (the full API envelope, which includes the caller's account id),
    // and we don't want that leaking into `--json` output.
    const { ok, status, version, timestamp, httpStatus } = await client.getHealth();
    return { ok, status, version, timestamp, httpStatus, reachable: true, error: null };
  } catch (error) {
    return {
      ok: false,
      status: null,
      version: null,
      timestamp: null,
      httpStatus: null,
      reachable: false,
      error: error?.message || 'Unknown error',
    };
  }
}

/**
 * Render a health result as human-readable lines.
 * @param {Awaited<ReturnType<typeof checkHealth>>} health
 * @returns {string}
 */
function formatHealth(health) {
  if (!health.reachable) {
    return [
      `${c.bold('OpenProcessing API')}: ${c.red('unreachable')}`,
      health.error ? `  ${c.dim(health.error)}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  }

  const statusLabel = health.ok
    ? c.green('OK')
    : c.red(health.status ? health.status : `HTTP ${health.httpStatus}`);

  const lines = [`${c.bold('OpenProcessing API')}: ${statusLabel}`];
  if (health.version) {
    lines.push(`API version: ${health.version}`);
  }
  return lines.join('\n');
}

/**
 * Handle the `opdl health` command.
 * @param {Object} args
 * @param {Object} [args.options]
 */
async function handleHealthCommand(args = {}) {
  const options = args.options || {};
  const health = await checkHealth({ token: options.token });

  if (!options.quiet) {
    if (options.json) {
      console.log(JSON.stringify(health, null, 2));
    } else {
      console.log(formatHealth(health));
    }
  }

  // A degraded or unreachable API is a non-zero exit so scripts can react.
  if (!health.ok) {
    const err = new Error(
      health.reachable
        ? 'OpenProcessing API is not healthy'
        : 'OpenProcessing API is unreachable'
    );
    err.exitCode = 1;
    // This command owns its own reporting (or deliberately suppresses it under
    // --quiet), so the global handler must not tack on an "Error:" line either
    // way — otherwise --quiet would still leak output.
    err.reported = true;
    throw err;
  }
}

/**
 * Run a health check after an unexpected failure and print a short diagnostic
 * hint to stderr. Never throws — this is a best-effort aid layered on top of an
 * error that is already being surfaced elsewhere.
 *
 * @param {Object} [options]
 * @param {string} [options.token] - Optional bearer token override
 * @param {boolean} [options.quiet] - Suppress the diagnostic output
 */
async function reportHealthAfterFailure(options = {}) {
  if (options.quiet) {
    return;
  }

  const health = await checkHealth({ token: options.token });

  if (health.ok) {
    console.error(
      c.dim(
        `[opdl] The OpenProcessing API reports healthy (version ${health.version || 'unknown'}), so this looks like a bug in opdl or an issue with this specific sketch. Please report it: https://github.com/SableRaf/opdl/issues`
      )
    );
  } else if (!health.reachable) {
    console.error(
      c.yellow(
        `[opdl] Could not reach the OpenProcessing API (${health.error}). This failure is likely a connectivity or API outage rather than a bug in opdl.`
      )
    );
  } else {
    console.error(
      c.yellow(
        `[opdl] The OpenProcessing API reports as ${health.status || `HTTP ${health.httpStatus}`}. This failure is likely an OpenProcessing API issue rather than a bug in opdl.`
      )
    );
  }
}

module.exports = { handleHealthCommand, checkHealth, formatHealth, reportHealthAfterFailure };

/**
 * Sketch mode names and their aliases.
 *
 * OpenProcessing's API returns `pjs` for Processing.js sketches, but its own
 * documentation lists the value as `processingjs`, and the wire value has
 * changed before. To stay robust to either, we canonicalize both to `pjs`
 * before any mode comparison. Add future aliases here so every mode check
 * (filters, CSS gating, etc.) stays consistent.
 */

// alias -> canonical mode name
const MODE_ALIASES = {
  processingjs: 'pjs',
  pjs: 'pjs',
};

/**
 * Canonicalize a single mode value: lowercased, trimmed, and mapped through
 * MODE_ALIASES. Unknown/empty values pass through as their lowercased form.
 * @param {string} mode
 * @returns {string}
 */
function canonicalizeMode(mode) {
  const normalized = String(mode || '').trim().toLowerCase();
  return MODE_ALIASES[normalized] || normalized;
}

module.exports = { canonicalizeMode, MODE_ALIASES };

/**
 * Client-side filters applied to a curation's sketch listing before download.
 *
 * The listing from getCurationSketches already carries each sketch's mode, so
 * filtering here means non-matching sketches are never fetched. Filters run on
 * whatever page --limit/--offset requested from the API (they do not fetch more
 * pages to "fill" a limit).
 */

const { canonicalizeMode } = require('./sketchMode');

/**
 * Normalize a --mode option into a list of canonical mode names.
 * Accepts an array (already split) or a comma-separated string. Aliases such as
 * "processingjs" are mapped to their canonical form ("pjs") so user input and
 * the API's mode value compare equal regardless of which spelling either uses.
 * @param {string|string[]|undefined} mode
 * @returns {string[]} canonical, non-empty mode names
 */
function normalizeModes(mode) {
  if (mode == null) return [];
  const list = Array.isArray(mode) ? mode : String(mode).split(',');
  return list.map((m) => canonicalizeMode(m)).filter(Boolean);
}

/**
 * Filter a sketch listing by the requested criteria.
 * @param {Array<Object>} sketches - listing entries (must expose `mode`)
 * @param {Object} [criteria]
 * @param {string|string[]} [criteria.mode] - keep only these modes (csv or array)
 * @returns {Array<Object>} the subset of sketches matching every criterion
 */
function filterSketches(sketches, criteria = {}) {
  const list = Array.isArray(sketches) ? sketches : [];
  const modes = normalizeModes(criteria.mode);
  if (modes.length === 0) return list;
  return list.filter((sketch) => modes.includes(canonicalizeMode(sketch.mode)));
}

module.exports = { filterSketches, normalizeModes };

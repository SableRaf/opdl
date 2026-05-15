const useColor =
  (process.stdout.isTTY &&
    !process.env.NO_COLOR &&
    process.env.TERM !== 'dumb') ||
  process.env.FORCE_COLOR === '1';

const wrap = (open, close) => (s) =>
  useColor ? `\x1b[${open}m${s}\x1b[${close}m` : String(s);

module.exports = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  cyan: wrap(36, 39),
};

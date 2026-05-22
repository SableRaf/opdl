const axios = require('axios');

const DEFAULT_SLEEP = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const PAGE_RETRY_DELAYS_MS = [1000, 2000]; // 2 backoff sleeps -> 3 attempts total
const TUTORIAL_INDEX_RE = /^\/api\/tutorial\/(\d+)\/?$/;
const TUTORIAL_PAGE_RE = /^\/api\/tutorial\/(\d+)\/page\/(\d+)\/?$/;

/**
 * Determine whether a sketch's tutorialMode value indicates it is a tutorial.
 * Explicitly handles the historical numeric variant from /api/sketch/ and the
 * string variants from /api/tutorial/.
 *
 * @param {*} value
 * @returns {boolean}
 */
function isTutorialMode(value) {
  if (value === 1 || value === '1') return true;
  if (value === 'normal' || value === 'singleCode') return true;
  return false;
}

function is429(error) {
  if (!error) return false;
  if (error.status === 429) return true;
  if (error.response && error.response.status === 429) return true;
  return false;
}

/**
 * Fetch a tutorial bundle (index + all pages) for a sketch.
 *
 * @param {Object} params
 * @param {(path: string) => Promise<any>} params.httpGet - Transport-agnostic GET that returns the parsed body or throws.
 * @param {number|string} params.sketchId
 * @param {boolean} [params.quiet]
 * @param {boolean} [params.verbose]
 * @param {(ms: number) => Promise<void>} [params.sleep] - Injectable sleep for tests.
 * @returns {Promise<{ tutorial: any, pages: Array, failedPages: Array }>}
 */
async function fetchTutorialBundle({
  httpGet,
  sketchId,
  quiet = false,
  verbose = false,
  sleep = DEFAULT_SLEEP,
}) {
  const tutorial = await httpGet(`/api/tutorial/${sketchId}`);
  const totalPages = Number(tutorial?.totalPages);
  const pages = [];
  const failedPages = [];

  if (!Number.isFinite(totalPages) || totalPages <= 0) {
    return { tutorial, pages, failedPages };
  }

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    let attempt = 0;
    let lastError = null;
    let succeeded = false;

    while (attempt < PAGE_RETRY_DELAYS_MS.length + 1) {
      try {
        const page = await httpGet(`/api/tutorial/${sketchId}/page/${pageNumber}/`);
        pages.push({
          pageNumber,
          markdown: String(page?.markdown ?? ''),
          codeObjects: Array.isArray(page?.codeObjects) ? page.codeObjects : [],
          raw: page,
        });
        succeeded = true;
        break;
      } catch (error) {
        lastError = error;
        if (!is429(error)) {
          // Non-429: no retry.
          break;
        }
        if (attempt < PAGE_RETRY_DELAYS_MS.length) {
          if (verbose && !quiet) {
            console.warn(
              `opdl: tutorial page ${pageNumber} hit 429, retrying after ${PAGE_RETRY_DELAYS_MS[attempt]}ms`
            );
          }
          await sleep(PAGE_RETRY_DELAYS_MS[attempt]);
        }
        attempt += 1;
      }
    }

    if (!succeeded) {
      failedPages.push({ pageNumber, error: lastError });
    }
  }

  return { tutorial, pages, failedPages };
}

/**
 * Adapter: route paths through an OpenProcessingClient instance.
 * Strictly matches the two supported path shapes; throws otherwise.
 *
 * @param {import('../api/client').OpenProcessingClient} client
 * @returns {(path: string) => Promise<any>}
 */
function httpGetViaClient(client) {
  return async (requestPath) => {
    let match = requestPath.match(TUTORIAL_INDEX_RE);
    if (match) {
      return client.getTutorial(Number(match[1]));
    }
    match = requestPath.match(TUTORIAL_PAGE_RE);
    if (match) {
      return client.getTutorialPage(Number(match[1]), Number(match[2]));
    }
    throw new Error(`httpGetViaClient: unsupported path ${requestPath}`);
  };
}

/**
 * Adapter: legacy axios path used by fetcher.js. Bypasses fetchData() because
 * fetchData() discards HTTP status; we need 429 to be visible for retry logic.
 *
 * @param {Object} [opts]
 * @param {string} [opts.token]
 * @param {boolean} [opts.quiet]
 * @returns {(path: string) => Promise<any>}
 */
function httpGetViaAxios({ token, quiet = false } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return async (requestPath) => {
    const url = `https://openprocessing.org${requestPath}`;
    let response;
    try {
      response = await axios.get(url, { headers, validateStatus: () => true });
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unknown error';
      const err = new Error(message);
      err.cause = error;
      throw err;
    }

    if (response.status === 429) {
      const err = new Error('Rate limit exceeded');
      err.status = 429;
      err.response = response;
      throw err;
    }

    const body = response.data;
    if (body && body.success === false) {
      const err = new Error(body.message || 'API error');
      err.status = response.status;
      throw err;
    }

    if (response.status >= 400) {
      const message = body?.message || `HTTP ${response.status} for ${requestPath}`;
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }

    return body;
  };
}

module.exports = {
  fetchTutorialBundle,
  httpGetViaClient,
  httpGetViaAxios,
  isTutorialMode,
};

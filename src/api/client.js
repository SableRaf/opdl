/**
 * OpenProcessing API Client
 *
 * Unified client for all OpenProcessing API requests.
 */

const axios = require('axios');
const {
  validateSketch,
  validateUser,
  validateCuration,
  isStrictPositiveIntegerId,
  isValidUsernameSegment,
} = require('./validator');

/**
 * Format a user path segment for OpenProcessing API URLs.
 * Accepts positive integer userIDs or @username strings; throws on anything else.
 * @param {number|string} id
 * @returns {string}
 */
function formatUserPathSegment(id) {
  if (isStrictPositiveIntegerId(id)) {
    return String(id);
  }
  if (isValidUsernameSegment(id)) {
    return id;
  }
  throw new Error(
    'User identifier must be a username with "@" prefix (e.g. "@Sableraph") or a positive integer userID. Numeric userIDs are deprecated by OpenProcessing.'
  );
}

/**
 * Throw if a list-endpoint response is an API error envelope ({ success: false, ... }).
 * @param {*} responseData
 */
function ensureNotApiError(responseData) {
  if (responseData && responseData.success === false) {
    throw new Error(responseData.message || 'API error');
  }
}

/**
 * @typedef {import('../types/api')} API
 */

/**
 * OpenProcessing API Client
 */
class OpenProcessingClient {
  /**
   * Create a new API client
   * @param {string} [apiKey] - Optional API key for authenticated requests
   */
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://openprocessing.org',
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 429) {
          const enhancedError = new Error(
            'Rate limit exceeded: 40 calls/minute. Implement retry logic or reduce request frequency.'
          );
          enhancedError.status = 429;
          enhancedError.response = error.response;
          throw enhancedError;
        }
        throw error;
      }
    );
  }

  /**
   * Get sketch metadata
   * @param {number} id - Sketch ID
   * @returns {Promise<any>} Sketch data
   * @throws {Error} If sketch is not found, private, or API returns an error
   */
  async getSketch(id) {
    const response = await this.client.get(`/api/sketch/${id}`, { validateStatus: () => true });
    const validation = validateSketch(response.data, { type: 'metadata' });

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return response.data;
  }

  /**
   * Get sketch code
   * @param {number} id - Sketch ID
   * @returns {Promise<any>} Sketch code data
   * @throws {Error} If code is hidden, sketch is private, or API returns an error
   */
  async getSketchCode(id) {
    const response = await this.client.get(`/api/sketch/${id}/code`, { validateStatus: () => true });
    const validation = validateSketch(response.data, { type: 'code' });

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return validation.data;
  }

  /**
   * Get sketch files/assets
   * @param {number} id - Sketch ID
   * @param {Object} [options] - List options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {'asc'|'desc'} [options.sort] - Sort order
   * @returns {Promise<any[]>} Sketch files
   */
  async getSketchFiles(id, options = {}) {
    const response = await this.client.get(`/api/sketch/${id}/files`, {
      params: options,
    });
    return response.data;
  }

  /**
   * Get sketch libraries
   * @param {number} id - Sketch ID
   * @param {Object} [options] - List options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {'asc'|'desc'} [options.sort] - Sort order
   * @returns {Promise<any[]>} Sketch libraries
   */
  async getSketchLibraries(id, options = {}) {
    const response = await this.client.get(`/api/sketch/${id}/libraries`, {
      params: options,
    });
    return response.data;
  }

  /**
   * Get sketch forks
   * @param {number} id - Sketch ID
   * @param {Object} [options] - List options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {'asc'|'desc'} [options.sort] - Sort order
   * @returns {Promise<any[]>} Sketch forks
   */
  async getSketchForks(id, options = {}) {
    const response = await this.client.get(`/api/sketch/${id}/forks`, {
      params: options,
    });
    return response.data;
  }

  /**
   * Get users who hearted a sketch
   * @param {number} id - Sketch ID
   * @param {Object} [options] - List options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {'asc'|'desc'} [options.sort] - Sort order
   * @returns {Promise<any[]>} Users who hearted the sketch
   */
  async getSketchHearts(id, options = {}) {
    const response = await this.client.get(`/api/sketch/${id}/hearts`, {
      params: options,
    });
    return response.data;
  }

  /**
   * Get user information
   * @param {number|string} id - Username (with @ prefix, e.g. "@Sableraph") or numeric userID (deprecated)
   * @returns {Promise<any>} User data
   * @throws {Error} If user is not found or API returns an error
   */
  async getUser(id) {
    const segment = formatUserPathSegment(id);
    const response = await this.client.get(`/api/user/${segment}`, { validateStatus: () => true });
    const validation = validateUser(response.data);

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return response.data;
  }

  /**
   * Get user's sketches
   * @param {number|string} userId - Username (with @ prefix, e.g. "@Sableraph") or numeric userID (deprecated)
   * @param {Object} [options] - List options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {'asc'|'desc'} [options.sort] - Sort order
   * @returns {Promise<any[]>} User sketches
   */
  async getUserSketches(userId, options = {}) {
    const segment = formatUserPathSegment(userId);
    const response = await this.client.get(`/api/user/${segment}/sketches`, {
      params: options,
    });
    ensureNotApiError(response.data);
    return response.data;
  }

  /**
   * Get user's followers
   * @param {number|string} userId - Username (with @ prefix, e.g. "@Sableraph") or numeric userID (deprecated)
   * @param {Object} [options] - List options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {'asc'|'desc'} [options.sort] - Sort order
   * @returns {Promise<any[]>} User followers
   */
  async getUserFollowers(userId, options = {}) {
    const segment = formatUserPathSegment(userId);
    const response = await this.client.get(`/api/user/${segment}/followers`, {
      params: options,
    });
    ensureNotApiError(response.data);
    return response.data;
  }

  /**
   * Get users followed by user
   * @param {number|string} userId - Username (with @ prefix, e.g. "@Sableraph") or numeric userID (deprecated)
   * @param {Object} [options] - List options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {'asc'|'desc'} [options.sort] - Sort order
   * @returns {Promise<any[]>} Users being followed
   */
  async getUserFollowing(userId, options = {}) {
    const segment = formatUserPathSegment(userId);
    const response = await this.client.get(`/api/user/${segment}/following`, {
      params: options,
    });
    ensureNotApiError(response.data);
    return response.data;
  }

  /**
   * Get sketches hearted by user
   * @param {number|string} userId - Username (with @ prefix, e.g. "@Sableraph") or numeric userID (deprecated)
   * @param {Object} [options] - List options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {'asc'|'desc'} [options.sort] - Sort order
   * @returns {Promise<any[]>} Hearted sketches
   */
  async getUserHearts(userId, options = {}) {
    const segment = formatUserPathSegment(userId);
    const response = await this.client.get(`/api/user/${segment}/hearts`, {
      params: options,
    });
    ensureNotApiError(response.data);
    return response.data;
  }

  /**
   * Get curation information
   * @param {number} id - Curation ID
   * @returns {Promise<any>} Curation data
   * @throws {Error} If curation is not found or API returns an error
   */
  async getCuration(id) {
    const response = await this.client.get(`/api/curation/${id}`, { validateStatus: () => true });
    const validation = validateCuration(response.data);

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return response.data;
  }

  /**
   * Get sketches in a curation
   * @param {number} curationId - Curation ID
   * @param {Object} [options] - List options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {'asc'|'desc'} [options.sort] - Sort order
   * @returns {Promise<any[]>} Curation sketches
   */
  async getCurationSketches(curationId, options = {}) {
    const response = await this.client.get(`/api/curation/${curationId}/sketches`, {
      params: options,
    });
    return response.data;
  }

  /**
   * Get popular tags
   * @param {Object} [options] - Tags options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {'thisWeek'|'thisMonth'|'thisYear'|'anytime'} [options.duration] - Time period for tag popularity
   * @returns {Promise<any[]>} Popular tags
   */
  async getTags(options = {}) {
    const response = await this.client.get('/api/tags', {
      params: options,
    });
    return response.data;
  }
}

module.exports = { OpenProcessingClient };

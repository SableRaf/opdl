/**
 * OpenProcessing API Client
 *
 * Unified client for all OpenProcessing API requests.
 */

const axios = require('axios');
const { validateSketch, validateUser, validateCuration } = require('../validator');

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
   * Get sketch code (legacy endpoint)
   * @param {number} id - Sketch ID
   * @returns {Promise<any>} Sketch code data
   */
  async getSketchCode(id) {
    const response = await this.client.get(`/api/sketch/${id}/code`);
    return response.data;
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
   * Get user information
   * @param {number|string} id - User ID
   * @returns {Promise<any>} User data
   * @throws {Error} If user is not found or API returns an error
   */
  async getUser(id) {
    const response = await this.client.get(`/api/user/${id}`, { validateStatus: () => true });
    const validation = validateUser(response.data);

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    return response.data;
  }

  /**
   * Get user's sketches
   * @param {number|string} userId - User ID
   * @param {Object} [options] - List options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {'asc'|'desc'} [options.sort] - Sort order
   * @returns {Promise<any[]>} User sketches
   */
  async getUserSketches(userId, options = {}) {
    const response = await this.client.get(`/api/user/${userId}/sketches`, {
      params: options,
    });
    return response.data;
  }

  /**
   * Get user's followers
   * @param {number|string} userId - User ID
   * @param {Object} [options] - List options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {'asc'|'desc'} [options.sort] - Sort order
   * @returns {Promise<any[]>} User followers
   */
  async getUserFollowers(userId, options = {}) {
    const response = await this.client.get(`/api/user/${userId}/followers`, {
      params: options,
    });
    return response.data;
  }

  /**
   * Get users followed by user
   * @param {number|string} userId - User ID
   * @param {Object} [options] - List options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {'asc'|'desc'} [options.sort] - Sort order
   * @returns {Promise<any[]>} Users being followed
   */
  async getUserFollowing(userId, options = {}) {
    const response = await this.client.get(`/api/user/${userId}/following`, {
      params: options,
    });
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
}

module.exports = { OpenProcessingClient };

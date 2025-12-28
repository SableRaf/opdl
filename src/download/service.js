/**
 * Download Service
 * Orchestrates multiple API calls to aggregate complete sketch data for download
 */

const { OpenProcessingClient } = require('../api/client');

/**
 * @typedef {Object} SketchInfo
 * @property {number} sketchId - Sketch ID
 * @property {boolean} isFork - Whether this is a forked sketch
 * @property {string} author - Sketch author username
 * @property {string} title - Sketch title
 * @property {Array} codeParts - Array of code files
 * @property {Array} files - Array of uploaded files/assets
 * @property {Array} libraries - Array of libraries used
 * @property {string} mode - Sketch mode (p5js, processingjs, html, applet)
 * @property {boolean} available - Whether sketch is available for download
 * @property {string|null} unavailableReason - Reason if unavailable
 * @property {string} error - Deprecated error field (kept for compatibility)
 * @property {Object} parent - Parent sketch info if fork
 * @property {number|null} parent.sketchID - Parent sketch ID
 * @property {string} parent.author - Parent sketch author
 * @property {string} parent.title - Parent sketch title
 * @property {Object} metadata - Full sketch metadata
 */

/**
 * Download Service Class
 * Provides high-level orchestration of API calls for downloading sketches
 */
class DownloadService {
  /**
   * Create a new download service
   * @param {OpenProcessingClient} [client] - Optional API client instance
   */
  constructor(client) {
    this.client = client || new OpenProcessingClient();
  }

  /**
   * Get complete sketch information for download
   * Orchestrates multiple API calls to gather all necessary data
   *
   * @param {number} id - Sketch ID
   * @param {Object} [options] - Options
   * @param {boolean} [options.quiet=false] - Suppress console output
   * @returns {Promise<SketchInfo>} Complete sketch data
   */
  async getCompleteSketchInfo(id, options = {}) {
    const { quiet = false } = options;

    // Initialize result structure (matches current fetchSketchInfo)
    const sketchInfo = {
      sketchId: id,
      isFork: false,
      author: '',
      title: '',
      codeParts: [],
      files: [],
      libraries: [],
      mode: '',
      available: true,
      unavailableReason: null,
      error: '', // Deprecated but kept for compatibility
      parent: {
        sketchID: null,
        author: '',
        title: '',
      },
      metadata: {},
    };

    try {
      // 1. Fetch sketch metadata
      const sketch = await this.client.getSketch(id);
      sketchInfo.metadata = sketch;
      sketchInfo.title = sketch.title;
      sketchInfo.mode = sketch.mode;
      sketchInfo.isFork = !!sketch.parentID;

      // 2. Fetch author info
      const author = await this.client.getUser(sketch.userID);
      sketchInfo.author = author.fullname || author.username || `user_${sketch.userID}`;

      // 3. Fetch code (handle hidden/private)
      try {
        const code = await this.client.getSketchCode(id);
        sketchInfo.codeParts = code;
      } catch (error) {
        // Code hidden or private - set availability
        sketchInfo.available = false;
        sketchInfo.unavailableReason = error.message;
        sketchInfo.error = error.message; // Deprecated field
        return sketchInfo;
      }

      // 4. Fetch files and libraries (parallel)
      const [files, libraries] = await Promise.all([
        this.client.getSketchFiles(id).catch(() => []),
        this.client.getSketchLibraries(id).catch(() => []),
      ]);
      sketchInfo.files = files;
      sketchInfo.libraries = libraries;

      // 5. If fork, fetch parent info
      if (sketchInfo.isFork && sketch.parentID) {
        try {
          const parent = await this.client.getSketch(sketch.parentID);
          const parentAuthor = await this.client.getUser(parent.userID);
          sketchInfo.parent = {
            sketchID: parent.visualID,
            author: parentAuthor.fullname || parentAuthor.username || `user_${parent.userID}`,
            title: parent.title,
          };
        } catch (error) {
          // Parent not available - not critical
          if (!quiet) {
            console.warn(`Could not fetch parent sketch: ${error.message}`);
          }
        }
      }

      return sketchInfo;
    } catch (error) {
      // Handle errors (not found, private, network issues, etc.)
      sketchInfo.available = false;
      sketchInfo.unavailableReason = error.message;
      sketchInfo.error = error.message;
      return sketchInfo;
    }
  }
}

module.exports = { DownloadService };

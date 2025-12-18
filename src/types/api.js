/**
 * API Type Definitions
 *
 * This file contains JSDoc type definitions for OpenProcessing API entities.
 * These types are based on the OpenProcessing API documentation.
 */

/**
 * @typedef {Object} SketchUser
 * @property {number} userID - User ID
 * @property {string} fullname - User's full name
 */

/**
 * @typedef {Object} Sketch
 * @property {number} visualID - Sketch ID
 * @property {string} title - Sketch title
 * @property {string} description - Sketch description
 * @property {string} instructions - Usage instructions
 * @property {string} license - License type
 * @property {string[]} libraries - Array of library names
 * @property {string} createdOn - Creation date (ISO 8601)
 * @property {string} modifiedOn - Last modification date (ISO 8601)
 * @property {string} submittedOn - Submission date (ISO 8601)
 * @property {string} mode - Sketch mode (e.g., "p5.js", "processing")
 * @property {number} userID - Author's user ID
 * @property {number|null} parentID - Parent sketch ID if forked
 * @property {number} hearts - Number of hearts
 * @property {number} views - Number of views
 * @property {boolean} isPublic - Whether sketch is public
 * @property {boolean} isFeatured - Whether sketch is featured
 */

/**
 * @typedef {Object} User
 * @property {string} userID - User ID
 * @property {string} username - Username
 * @property {string} fullname - User's full name
 * @property {string} website - User's website URL
 * @property {string} location - User's location
 * @property {string} memberSince - Member since date (ISO 8601)
 * @property {string} bio - User biography
 * @property {string} [avatarUrl] - Avatar image URL
 */

/**
 * @typedef {Object} Curation
 * @property {number} curationID - Curation ID
 * @property {string} title - Curation title
 * @property {string} description - Curation description
 * @property {string} createdOn - Creation date (ISO 8601)
 * @property {User} createdBy - User who created the curation
 * @property {number} sketchCount - Number of sketches in curation
 */

/**
 * @typedef {Object} UserSketchItem
 * @property {number} visualID - Sketch ID
 * @property {string} title - Sketch title
 * @property {string} submittedOn - Submission date (ISO 8601)
 * @property {string} [thumbnailUrl] - Thumbnail URL
 * @property {number} hearts - Number of hearts
 * @property {number} views - Number of views
 */

/**
 * @typedef {Object} UserFollowerItem
 * @property {string} userID - User ID
 * @property {string} fullname - User's full name
 * @property {string} followedOn - Date when follow occurred (ISO 8601)
 * @property {string} [avatarUrl] - Avatar image URL
 */

/**
 * @typedef {Object} UserFollowingItem
 * @property {string} userID - User ID
 * @property {string} fullname - User's full name
 * @property {string} followedOn - Date when follow occurred (ISO 8601)
 * @property {string} [avatarUrl] - Avatar image URL
 */

/**
 * @typedef {Object} CurationSketchItem
 * @property {number} visualID - Sketch ID
 * @property {string} title - Sketch title
 * @property {string} submittedOn - Submission date (ISO 8601)
 * @property {string} [thumbnailUrl] - Thumbnail URL
 * @property {number} hearts - Number of hearts
 * @property {number} views - Number of views
 */

/**
 * @typedef {Object} ListOptions
 * @property {number} [limit] - Maximum number of results to return
 * @property {number} [offset] - Number of results to skip
 * @property {'asc'|'desc'} [sort] - Sort order
 */

// Export types (for documentation purposes)
module.exports = {};

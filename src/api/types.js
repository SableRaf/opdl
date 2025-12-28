/**
 * JSDoc Type Definitions for OpenProcessing API Entities
 *
 * All types based on actual API responses verified via curl on 2025-12-27
 * Source of truth: /specs/001-refactor-api/data-model.md
 */

/**
 * @typedef {Object} Sketch
 * @property {number} visualID - Sketch ID (also used for thumbnail URL generation)
 * @property {string} title - Sketch title
 * @property {string} description - Sketch description
 * @property {string} instructions - User instructions for interacting with the sketch
 * @property {string[]} tags - Array of tag strings associated with the sketch
 * @property {string} license - License type (e.g., "by-nc-sa")
 * @property {number} isDraft - Draft status (0 = published, 1 = draft)
 * @property {string} createdOn - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
 * @property {string|null} updatedOn - MySQL datetime timestamp, null if never updated
 * @property {string|null} filesUpdatedOn - Files update timestamp, null if no file updates
 * @property {string} thumbnailUpdatedOn - Thumbnail update timestamp
 * @property {string|null} videoUpdatedOn - Video update timestamp, null if no video
 * @property {number|null} parentID - Parent sketch ID if this is a fork, null if original
 * @property {number} engineID - Processing engine version ID
 * @property {string} engineURL - CDN URL for the selected p5.js/processing.js engine
 * @property {string} fileBase - S3 base URL for sketch assets
 * @property {number} isTutorial - Tutorial flag (0 = not tutorial, 1 = tutorial)
 * @property {number} isTemplate - Template flag (0 = not template, 1 = template)
 * @property {number} hasTimeline - Timeline feature flag (0 = no timeline, 1 = has timeline)
 * @property {number} userID - ID of sketch creator
 * @property {string} mode - Sketch mode: "p5js", "processingjs", "html", or "applet"
 * @property {Library[]} libraries - Array of Library objects
 * @property {number|null} templateID - Template ID if based on template, null otherwise
 */

/**
 * @typedef {Object} User
 * @property {number} userID - Unique user identifier
 * @property {string} fullname - User's display name
 * @property {string} bio - User biography/description
 * @property {string} createdOn - MySQL datetime timestamp of account creation (YYYY-MM-DD HH:MM:SS)
 * @property {string} website - User's website URL
 * @property {string} location - User's location string
 * @property {number} [membershipType] - Membership tier (0 = free, 1 = plus, 2 = pro, 3 = educator)
 */

/**
 * @typedef {Object} Curation
 * @property {string} title - Curation title
 * @property {string} description - Curation description (can be markdown/long text)
 * @property {number} userID - ID of curation creator
 * @property {string} createdOn - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
 * @property {number} curationID - Unique curation identifier
 */

/**
 * @typedef {Object} CodeFile
 * @property {number} codeID - Unique code file identifier
 * @property {number} orderID - Tab order (0 = first tab, 1 = second, etc.)
 * @property {string} code - Full source code content
 * @property {string} title - Tab/file title
 * @property {string} updatedOn - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
 * @property {string} createdOn - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
 */

/**
 * @typedef {Object} Tag
 * @property {string} tag - Tag name/text
 * @property {number} quantity - Number of sketches using this tag
 */

/**
 * @typedef {Object} Library
 * @property {number} libraryID - Unique library identifier
 * @property {string} url - CDN URL for the library JavaScript file
 */

/**
 * List Item Types
 * These are simplified structures returned by list/collection endpoints
 */

/**
 * @typedef {Object} UserSketchItem
 * @property {number} visualID - Sketch ID
 * @property {string} title - Sketch title
 * @property {string} description - Sketch description
 * @property {string|null} instructions - User instructions for interacting with the sketch
 * @property {string} createdOn - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
 * @property {string} mode - Sketch mode: "p5js", "processingjs", "html", or "applet"
 */

/**
 * @typedef {Object} UserFollowerItem
 * @property {number} userID - User ID
 * @property {string} fullname - User display name
 * @property {number} membershipType - Membership tier (0, 1, 2, or 3)
 * @property {string} followedOn - MySQL datetime timestamp of when follow occurred (YYYY-MM-DD HH:MM:SS)
 */

/**
 * @typedef {Object} UserFollowingItem
 * @property {number} userID - User ID
 * @property {string} fullname - User display name
 * @property {number} membershipType - Membership tier (0, 1, 2, or 3)
 * @property {string} followedOn - MySQL datetime timestamp of when follow occurred (YYYY-MM-DD HH:MM:SS)
 */

/**
 * @typedef {Object} UserHeartItem
 * @property {number} visualID - Sketch ID
 * @property {string} title - Sketch title
 * @property {string} mode - Sketch mode ("p5js", "processingjs", "html", "applet")
 */

/**
 * @typedef {Object} SketchFile
 * @property {string} name - Filename (e.g., "example.png")
 * @property {string} lastModified - ISO 8601 timestamp with timezone (e.g., "2023-09-13T12:25:24+00:00")
 * @property {string} size - File size in bytes (returned as string)
 * @property {string} url - S3 URL for downloading the file
 */

/**
 * @typedef {Object} SketchForkItem
 * @property {number} visualID - Fork sketch ID
 * @property {string} title - Fork title
 * @property {number} userID - Fork creator user ID
 * @property {string} fullname - Fork creator display name
 * @property {string} createdOn - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
 * @property {string} updatedOn - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
 */

/**
 * @typedef {Object} SketchHeartItem
 * @property {number} userID - User ID who hearted
 * @property {string} fullname - User display name
 * @property {string} createdOn - MySQL datetime timestamp of when heart occurred (YYYY-MM-DD HH:MM:SS)
 */

/**
 * @typedef {Object} CurationSketchItem
 * @property {number} visualID - Sketch ID
 * @property {string} title - Sketch title
 * @property {string} description - Sketch description
 * @property {string} instructions - User instructions for interacting with the sketch
 * @property {number|null} parentID - Parent sketch ID if fork, null if original
 * @property {string} thumbnailUpdatedOn - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
 * @property {string|null} videoUpdatedOn - Video update timestamp, null if no video
 * @property {string} mode - Sketch mode ("p5js", "processingjs", "html", "applet")
 * @property {string} createdOn - MySQL datetime timestamp (YYYY-MM-DD HH:MM:SS)
 * @property {number} userID - Sketch creator user ID
 * @property {string} fullname - Sketch creator display name
 * @property {number} membershipType - Creator membership tier (0, 1, 2, or 3)
 * @property {string} submittedOn - MySQL datetime timestamp of submission to curation
 * @property {number} status - Approval status (1 = approved, only approved shown in API)
 */

/**
 * Options Types
 */

/**
 * @typedef {Object} ListOptions
 * @property {number} [limit] - Maximum results per page (1-100, default 20)
 * @property {number} [offset] - Number of results to skip (>=0, default 0)
 * @property {'asc'|'desc'} [sort] - Sort order (default "desc")
 */

/**
 * @typedef {Object} TagsOptions
 * @property {number} [limit] - Maximum results (1-100, default 20)
 * @property {number} [offset] - Number of results to skip (>=0, default 0)
 * @property {'thisWeek'|'thisMonth'|'thisYear'|'anytime'} [duration] - Time period (default "anytime")
 */

/**
 * Validation Types
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {string|null} reason - Validation failure reason code (VALIDATION_REASONS constant)
 * @property {string} message - Developer-facing validation message (may contain technical details)
 * @property {*} data - Normalized/validated data if valid, original data if invalid
 * @property {boolean} canRetry - Whether the operation can be retried (for transient errors)
 * @property {Object} [meta] - Optional response metadata like { hasMore: boolean } for list endpoints
 */

module.exports = {};

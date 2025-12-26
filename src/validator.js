/**
 * Centralized validation module for OpenProcessing resources
 * Provides unified validation for sketches, users, and curations
 */

// Validation reason constants
const VALIDATION_REASONS = {
  NOT_FOUND: 'not_found',
  PRIVATE: 'private',
  CODE_HIDDEN: 'code_hidden',
  DELETED: 'deleted',
  API_ERROR: 'api_error',
  INVALID_ID: 'invalid_id',
};

// Standard error messages
const MESSAGES = {
  PRIVATE_SKETCH: 'This sketch is private and cannot be downloaded.',
  HIDDEN_CODE: 'The source code for this sketch is hidden by the author.',
  NOT_FOUND_SKETCH: 'Sketch not found.',
  NOT_FOUND_USER: 'User not found.',
  NOT_FOUND_CURATION: 'Curation not found.',
  API_ERROR: 'An API error occurred.',
  INVALID_ID: 'Invalid ID provided.',
};

// Known API message patterns
const API_PATTERNS = {
  HIDDEN_CODE: 'Sketch source code is hidden.',
  PRIVATE_SKETCH: 'private sketch',
};

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the resource is valid and available
 * @property {string|null} reason - Specific reason if unavailable (from VALIDATION_REASONS)
 * @property {string} message - User-friendly error message
 * @property {*} data - The original data/response
 * @property {boolean} canRetry - Whether this error is transient and can be retried
 */

/**
 * Check if a response indicates a private resource
 * @param {*} responseData - API response data
 * @returns {boolean}
 */
const isPrivateResponse = (responseData) => {
  if (!responseData) {
    return false;
  }

  if (responseData.success === false && typeof responseData.message === 'string') {
    return responseData.message.toLowerCase().includes(API_PATTERNS.PRIVATE_SKETCH);
  }

  return false;
};

/**
 * Check if a response indicates hidden code
 * @param {*} responseData - API response data
 * @returns {boolean}
 */
const isCodeHidden = (responseData) => {
  if (!responseData) {
    return false;
  }

  if (responseData.success === false && responseData.message === API_PATTERNS.HIDDEN_CODE) {
    return true;
  }

  return false;
};

/**
 * Validate common API response patterns
 * @param {*} responseData - API response data
 * @param {string} resourceType - Type of resource ('sketch', 'user', 'curation')
 * @returns {ValidationResult|null} - Validation result or null if no common error found
 */
const validateResponse = (responseData, resourceType) => {
  // Null or undefined response
  if (!responseData) {
    const messages = {
      sketch: MESSAGES.NOT_FOUND_SKETCH,
      user: MESSAGES.NOT_FOUND_USER,
      curation: MESSAGES.NOT_FOUND_CURATION,
    };
    return {
      valid: false,
      reason: VALIDATION_REASONS.NOT_FOUND,
      message: messages[resourceType] || MESSAGES.API_ERROR,
      data: responseData,
      canRetry: false,
    };
  }

  // Check for private resource
  if (isPrivateResponse(responseData)) {
    return {
      valid: false,
      reason: VALIDATION_REASONS.PRIVATE,
      message: MESSAGES.PRIVATE_SKETCH,
      data: responseData,
      canRetry: false,
    };
  }

  // Check for hidden code
  if (isCodeHidden(responseData)) {
    return {
      valid: false,
      reason: VALIDATION_REASONS.CODE_HIDDEN,
      message: MESSAGES.HIDDEN_CODE,
      data: responseData,
      canRetry: false,
    };
  }

  // Check for generic API error
  if (responseData.success === false) {
    return {
      valid: false,
      reason: VALIDATION_REASONS.API_ERROR,
      message: responseData.message || MESSAGES.API_ERROR,
      data: responseData,
      canRetry: true, // API errors might be transient
    };
  }

  return null; // No common error found
};

/**
 * Validate a sketch response
 * @param {*} responseData - API response data for sketch
 * @param {Object} options - Validation options
 * @param {string} options.type - Type of sketch data ('metadata', 'code', 'files', 'libraries')
 * @returns {ValidationResult}
 */
const validateSketch = (responseData, options = {}) => {
  const { type = 'metadata' } = options;

  // Check common validation patterns first
  const commonValidation = validateResponse(responseData, 'sketch');
  if (commonValidation) {
    return commonValidation;
  }

  // Type-specific validation
  if (type === 'code') {
    // Code response should be an array
    if (Array.isArray(responseData)) {
      return {
        valid: true,
        reason: null,
        message: '',
        data: responseData,
        canRetry: false,
      };
    }
  }

  if (type === 'metadata') {
    // Metadata should be an object with expected properties
    if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
      return {
        valid: true,
        reason: null,
        message: '',
        data: responseData,
        canRetry: false,
      };
    }
  }

  if (type === 'files' || type === 'libraries') {
    // Files and libraries can be arrays or empty
    if (Array.isArray(responseData) || (responseData && typeof responseData === 'object')) {
      return {
        valid: true,
        reason: null,
        message: '',
        data: responseData,
        canRetry: false,
      };
    }
  }

  // If we reach here, response format is unexpected
  return {
    valid: false,
    reason: VALIDATION_REASONS.API_ERROR,
    message: `Unexpected response format for sketch ${type}`,
    data: responseData,
    canRetry: false,
  };
};

/**
 * Validate a user response
 * @param {*} responseData - API response data for user
 * @returns {ValidationResult}
 */
const validateUser = (responseData) => {
  // Check common validation patterns
  const commonValidation = validateResponse(responseData, 'user');
  if (commonValidation) {
    return commonValidation;
  }

  // User should be an object with expected properties
  if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
    return {
      valid: true,
      reason: null,
      message: '',
      data: responseData,
      canRetry: false,
    };
  }

  // Unexpected format
  return {
    valid: false,
    reason: VALIDATION_REASONS.API_ERROR,
    message: 'Unexpected response format for user',
    data: responseData,
    canRetry: false,
  };
};

/**
 * Validate a curation response
 * @param {*} responseData - API response data for curation
 * @returns {ValidationResult}
 */
const validateCuration = (responseData) => {
  // Check common validation patterns
  const commonValidation = validateResponse(responseData, 'curation');
  if (commonValidation) {
    return commonValidation;
  }

  // Curation should be an object with expected properties
  if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
    return {
      valid: true,
      reason: null,
      message: '',
      data: responseData,
      canRetry: false,
    };
  }

  // Unexpected format
  return {
    valid: false,
    reason: VALIDATION_REASONS.API_ERROR,
    message: 'Unexpected response format for curation',
    data: responseData,
    canRetry: false,
  };
};

/**
 * Validate an ID value
 * @param {*} id - ID to validate
 * @returns {ValidationResult}
 */
const validateId = (id) => {
  const parsedId = Number(id);
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    return {
      valid: false,
      reason: VALIDATION_REASONS.INVALID_ID,
      message: MESSAGES.INVALID_ID,
      data: id,
      canRetry: false,
    };
  }

  return {
    valid: true,
    reason: null,
    message: '',
    data: parsedId,
    canRetry: false,
  };
};

module.exports = {
  // Validation functions
  validateSketch,
  validateUser,
  validateCuration,
  validateId,
  validateResponse,

  // Helper functions
  isPrivateResponse,
  isCodeHidden,

  // Constants
  VALIDATION_REASONS,
  MESSAGES,
};

const axios = require('axios');
const { validateSketch, VALIDATION_REASONS, MESSAGES } = require('./validator');

const logError = (message, quiet) => {
  if (!quiet) {
    console.error(message);
  }
};

const fetchData = async (url, description, options = {}) => {
  const { quiet = false } = options;
  try {
    const response = await axios.get(url, { validateStatus: () => true });
    const responseData = response.data;
    if (!responseData) {
      const message = `Unexpected response format for ${description}`;
      logError(message, quiet);
      return { data: null, error: message };
    }

    if (responseData.success === false) {
      return { data: responseData, error: responseData.message || 'API error' };
    }

    return { data: responseData, error: null };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    logError(`Error fetching ${description}: ${errorMessage}`, quiet);
    return { data: null, error: errorMessage };
  }
};


const fetchCodeResponse = async (sketchId, options = {}) => {
  const { quiet = false } = options;
  const { data: responseData, error } = await fetchData(`https://openprocessing.org/api/sketch/${sketchId}/code`, `sketch code ${sketchId}`, { quiet });

  // Validate responseData if it exists, regardless of error field
  // This allows proper categorization of errors (private, hidden code, etc.)
  if (responseData) {
    const validation = validateSketch(responseData, { type: 'code' });

    if (!validation.valid) {
      if (validation.message) {
        logError(`Error for sketch ${sketchId}: ${validation.message}`, quiet);
      }
      return { codeParts: [], error: validation.message };
    }

    return { codeParts: validation.data, error: '' };
  }

  // Only return the error string if responseData is null
  if (error) {
    return { codeParts: [], error };
  }

  // This should not be reached, but handle it just in case
  return { codeParts: [], error: 'Unexpected response format' };
};

const fetchUserInfo = async (userId, options = {}) => {
  if (!userId) {
    return {};
  }
  const { data, error } = await fetchData(`https://openprocessing.org/api/user/${userId}`, `user ${userId}`, options);
  if (error) {
    return {}; 
  }
  return data || {};
};

const fetchSketchInfo = async (sketchId, options = {}) => {
  const { quiet = false } = options;
  const parsedId = Number(sketchId);
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    return null;
  }

  const sketchInfo = {
    sketchId: parsedId,
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

  const setError = (message) => {
    if (message && !sketchInfo.error) {
      sketchInfo.error = message;
    }
  };

  const setUnavailable = (reason, message) => {
    sketchInfo.available = false;
    sketchInfo.unavailableReason = reason;
    setError(message);
  };

  // Fetch metadata
  const { data: metadata } = await fetchData(`https://openprocessing.org/api/sketch/${parsedId}`, `metadata of sketch ${parsedId}`, { quiet });

  // Validate metadata
  const metadataValidation = validateSketch(metadata, { type: 'metadata' });
  if (!metadataValidation.valid) {
    setUnavailable(metadataValidation.reason, metadataValidation.message);
    sketchInfo.metadata = {};
    return sketchInfo;
  }

  if (metadata) {
    sketchInfo.metadata = metadata;
    sketchInfo.mode = metadata.mode || '';
    sketchInfo.title = metadata.title || '';
    sketchInfo.isFork = metadata.parentID != null && metadata.parentID !== 0 && metadata.parentID !== '0';
    sketchInfo.parent.sketchID = metadata.parentID || null;
  }

  // Fetch parent metadata if fork
  if (sketchInfo.isFork && sketchInfo.parent.sketchID) {
    const { data: parentMetadata } = await fetchData(`https://openprocessing.org/api/sketch/${sketchInfo.parent.sketchID}`, `parent sketch ${sketchInfo.parent.sketchID}`, { quiet });

    if (parentMetadata) {
      sketchInfo.parent.title = parentMetadata.title || '';
      const parentUser = await fetchUserInfo(parentMetadata.userID, { quiet });
      sketchInfo.parent.author = parentUser.fullname || '';
    }
  }

  // Fetch user info
  if (sketchInfo.metadata.userID) {
    const { data: user } = await fetchData(`https://openprocessing.org/api/user/${sketchInfo.metadata.userID}`, `user ${sketchInfo.metadata.userID}`, { quiet });

    if (user) {
      sketchInfo.author = user.fullname || '';
    }
  }

  // Fetch code
  const codeResponse = await fetchCodeResponse(parsedId, { quiet });
  sketchInfo.codeParts = codeResponse.codeParts || [];
  if (codeResponse.error) {
    // Note: fetchCodeResponse now properly validates and categorizes errors
    // Check the error message to determine if it indicates unavailability
    const isPrivateError = codeResponse.error === MESSAGES.PRIVATE_SKETCH;
    const isHiddenError = codeResponse.error === MESSAGES.HIDDEN_CODE;

    if (isPrivateError) {
      setUnavailable(VALIDATION_REASONS.PRIVATE, codeResponse.error);
    } else if (isHiddenError) {
      setUnavailable(VALIDATION_REASONS.CODE_HIDDEN, codeResponse.error);
    } else {
      setError(codeResponse.error);
    }
  }

  // Fetch assets
  const { data: assets, error: assetsError } = await fetchData(`https://openprocessing.org/api/sketch/${parsedId}/files?limit=100&offset=0`, `assets for sketch ${parsedId}`, { quiet });
  if (assetsError) {
    setError(assetsError);
  }
  if (assets) {
    sketchInfo.files = assets;
  }

  // Fetch libraries
  const { data: libraries, error: librariesError } = await fetchData(`https://openprocessing.org/api/sketch/${parsedId}/libraries?limit=100&offset=0`, `libraries for sketch ${parsedId}`, { quiet });
  if (librariesError) {
    setError(librariesError);
  }
  if (libraries) {
    sketchInfo.libraries = libraries;
  }

  sketchInfo.metadata = sketchInfo.metadata || {};
  sketchInfo.metadata.libraries = sketchInfo.metadata.libraries || sketchInfo.libraries;

  return sketchInfo;
};

module.exports = { fetchSketchInfo, fetchUserInfo };

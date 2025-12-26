const axios = require('axios');
const { validateSketch, validateUser, VALIDATION_REASONS } = require('./validator');

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

  if (error) {
    return { codeParts: [], error };
  }

  const validation = validateSketch(responseData, { type: 'code' });

  if (!validation.valid) {
    if (!quiet && validation.message) {
      logError(`Error for sketch ${sketchId}: ${validation.message}`, quiet);
    }
    return { codeParts: [], error: validation.message };
  }

  return { codeParts: validation.data, error: '' };
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
  const { data: metadata, error: metadataError } = await fetchData(`https://openprocessing.org/api/sketch/${parsedId}`, `metadata of sketch ${parsedId}`, { quiet });
  if (metadataError) {
    setError(metadataError);
  }

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
    const { data: parentMetadata, error: parentMetadataError } = await fetchData(`https://openprocessing.org/api/sketch/${sketchInfo.parent.sketchID}`, `parent sketch ${sketchInfo.parent.sketchID}`, { quiet });
    if (parentMetadataError) {
      setError(parentMetadataError);
    }

    if (parentMetadata) {
      sketchInfo.parent.title = parentMetadata.title || '';
      const parentUser = await fetchUserInfo(parentMetadata.userID, { quiet });
      sketchInfo.parent.author = parentUser.fullname || '';
    }
  }

  // Fetch user info
  if (sketchInfo.metadata.userID) {
    const { data: user, error: userError } = await fetchData(`https://openprocessing.org/api/user/${sketchInfo.metadata.userID}`, `user ${sketchInfo.metadata.userID}`, { quiet });
    if (userError) {
      setError(userError);
    }

    if (user) {
      sketchInfo.author = user.fullname || '';
    }
  }

  // Fetch code
  const { codeParts, error: codeError } = await fetchCodeResponse(parsedId, { quiet });
  sketchInfo.codeParts = codeParts || [];
  if (codeError) {
    setError(codeError);
    // Check if code error indicates unavailability
    const codeValidation = validateSketch({ success: false, message: codeError }, { type: 'code' });
    if (!codeValidation.valid && (codeValidation.reason === VALIDATION_REASONS.PRIVATE || codeValidation.reason === VALIDATION_REASONS.CODE_HIDDEN)) {
      setUnavailable(codeValidation.reason, codeValidation.message);
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

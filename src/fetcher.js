const axios = require('axios');
const { validateSketch, VALIDATION_REASONS, MESSAGES } = require('./api/validator');

const logError = (message, quiet) => {
  if (!quiet) {
    console.error(message);
  }
};

const fetchData = async (url, description, options = {}) => {
  const { quiet = false, token } = options;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const response = await axios.get(url, { headers, validateStatus: () => true });
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
  const { quiet = false, token } = options;
  const { data: responseData, error } = await fetchData(`https://openprocessing.org/api/sketch/${sketchId}/code`, `sketch code ${sketchId}`, { quiet, token });

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

  if (error) {
    return { codeParts: [], error };
  }

  return { codeParts: [], error: 'Unexpected response format' };
};

const fetchUserInfo = async (userId, options = {}) => {
  if (!userId) {
    return {};
  }
  const { quiet, token } = options;
  const { data, error } = await fetchData(`https://openprocessing.org/api/user/${userId}`, `user ${userId}`, { quiet, token });
  if (error) {
    return {}; 
  }
  return data || {};
};

const fetchSketchInfo = async (sketchId, options = {}) => {
  const { quiet = false, token } = options;
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
  const { data: metadata } = await fetchData(`https://openprocessing.org/api/sketch/${parsedId}`, `metadata of sketch ${parsedId}`, { quiet, token });

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

  const fetchOptions = { quiet, token };

  const [parentResult, userResult, codeResponse, assetsResult, librariesResult] = await Promise.all([
    sketchInfo.isFork && sketchInfo.parent.sketchID
      ? fetchData(`https://openprocessing.org/api/sketch/${sketchInfo.parent.sketchID}`, `parent sketch ${sketchInfo.parent.sketchID}`, fetchOptions)
      : Promise.resolve({ data: null }),
    sketchInfo.metadata.userID
      ? fetchData(`https://openprocessing.org/api/user/${sketchInfo.metadata.userID}`, `user ${sketchInfo.metadata.userID}`, fetchOptions)
      : Promise.resolve({ data: null }),
    fetchCodeResponse(parsedId, fetchOptions),
    fetchData(`https://openprocessing.org/api/sketch/${parsedId}/files?limit=100&offset=0`, `assets for sketch ${parsedId}`, fetchOptions),
    fetchData(`https://openprocessing.org/api/sketch/${parsedId}/libraries?limit=100&offset=0`, `libraries for sketch ${parsedId}`, fetchOptions),
  ]);

  if (parentResult.data) {
    sketchInfo.parent.title = parentResult.data.title || '';
    const parentUser = await fetchUserInfo(parentResult.data.userID, fetchOptions);
    sketchInfo.parent.author = parentUser.fullname || '';
  }

  if (userResult.data) {
    sketchInfo.author = userResult.data.fullname || '';
  }

  sketchInfo.codeParts = codeResponse.codeParts || [];
  if (codeResponse.error) {
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

  if (assetsResult.error) {
    setError(assetsResult.error);
  }
  if (assetsResult.data) {
    sketchInfo.files = assetsResult.data;
  }

  if (librariesResult.error) {
    setError(librariesResult.error);
  }
  if (librariesResult.data) {
    sketchInfo.libraries = librariesResult.data;
  }

  sketchInfo.metadata = sketchInfo.metadata || {};
  sketchInfo.metadata.libraries = sketchInfo.metadata.libraries || sketchInfo.libraries;

  return sketchInfo;
};

module.exports = { fetchSketchInfo, fetchUserInfo };

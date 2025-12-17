const axios = require('axios');

const HIDDEN_CODE_MESSAGE = 'Sketch source code is hidden.';

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

const isSketchCodeHidden = (responseData) => {
  if (!responseData) {
    return false;
  }

  if (responseData.success === false && responseData.message === HIDDEN_CODE_MESSAGE) {
    return true;
  }

  return false;
};

const fetchCodeResponse = async (sketchId, options = {}) => {
  const { quiet = false } = options;
  const { data: responseData, error } = await fetchData(`https://openprocessing.org/api/sketch/${sketchId}/code`, `sketch code ${sketchId}`, { quiet });
  const isHidden = isSketchCodeHidden(responseData);

  if (isHidden) {
    return { isHidden: true, codeParts: [], error: '' };
  }

  if (error) {
    return { isHidden: false, codeParts: [], error };
  }

  if (Array.isArray(responseData)) {
    return { isHidden: false, codeParts: responseData, error: '' };
  }

  if (responseData && responseData.success === false) {
    logError(`The API responded with an error for sketch ${sketchId}: "${responseData.message}"`, quiet);
    return { isHidden: false, codeParts: [], error: responseData.message || 'API error' };
  }

  const errorMessage = `Unexpected response format for sketch code ${sketchId}`;
  logError(errorMessage, quiet);
  return { isHidden: false, codeParts: [], error: errorMessage };
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
    hiddenCode: false,
    error: '',
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

  const { data: metadata, error: metadataError } = await fetchData(`https://openprocessing.org/api/sketch/${parsedId}`, `metadata of sketch ${parsedId}`, { quiet });
  if (metadataError) {
    setError(metadataError);
  }

  if (metadata) {
    sketchInfo.metadata = metadata;
    sketchInfo.mode = metadata.mode || '';
    sketchInfo.title = metadata.title || '';
    sketchInfo.isFork = metadata.parentID != null && metadata.parentID !== 0 && metadata.parentID !== '0';
    sketchInfo.parent.sketchID = metadata.parentID || null;
  }

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

  if (sketchInfo.metadata.userID) {
    const { data: user, error: userError } = await fetchData(`https://openprocessing.org/api/user/${sketchInfo.metadata.userID}`, `user ${sketchInfo.metadata.userID}`, { quiet });
    if (userError) {
      setError(userError);
    }

    if (user) {
      sketchInfo.author = user.fullname || '';
    }
  }

  const { isHidden, codeParts, error: codeError } = await fetchCodeResponse(parsedId, { quiet });
  sketchInfo.hiddenCode = isHidden;
  sketchInfo.codeParts = codeParts || [];
  if (codeError) {
    setError(codeError);
  }

  const { data: assets, error: assetsError } = await fetchData(`https://openprocessing.org/api/sketch/${parsedId}/files?limit=100&offset=0`, `assets for sketch ${parsedId}`, { quiet });
  if (assetsError) {
    setError(assetsError);
  }
  if (assets) {
    sketchInfo.files = assets;
  }

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

module.exports = { fetchSketchInfo, fetchUserInfo, isSketchCodeHidden };

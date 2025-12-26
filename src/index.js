const { fetchSketchInfo } = require('./fetcher');
const { downloadSketch } = require('./downloader');

const defaultOptions = {
  outputDir: null,
  downloadAssets: true,
  downloadThumbnail: true,
  saveMetadata: true,
  addSourceComments: true,
  createLicenseFile: true,
  createOpMetadata: true,
  quiet: false,
  vite: false,
};

const opdl = async (sketchId, options = {}) => {
  const mergedOptions = { ...defaultOptions, ...options };
  const result = {
    success: false,
    sketchId: String(sketchId || ''),
    outputPath: null,
    sketchInfo: {
      title: '',
      author: '',
      mode: '',
      isFork: false,
      error: '',
    },
  };

  if (!sketchId) {
    result.sketchInfo.error = 'Invalid sketch ID';
    return result;
  }

  const sketchInfo = await fetchSketchInfo(sketchId, { quiet: mergedOptions.quiet });

  if (!sketchInfo) {
    result.sketchInfo.error = 'Invalid sketch ID';
    return result;
  }

  result.sketchInfo.title = sketchInfo.title || sketchInfo.metadata?.title || '';
  result.sketchInfo.author = sketchInfo.author || '';
  result.sketchInfo.mode = sketchInfo.mode || sketchInfo.metadata?.mode || '';
  result.sketchInfo.isFork = sketchInfo.isFork;
  if (sketchInfo.error) {
    result.sketchInfo.error = sketchInfo.error;
  }

  if (!sketchInfo.available) {
    return result;
  }

  if (!sketchInfo.metadata || !Object.keys(sketchInfo.metadata).length) {
    result.sketchInfo.error = result.sketchInfo.error || 'Unable to fetch sketch metadata';
    return result;
  }

  try {
    const downloadResult = await downloadSketch(sketchInfo, mergedOptions);
    result.success = true;
    result.outputPath = downloadResult.outputDir;
  } catch (error) {
    result.sketchInfo.error = error?.message || 'Failed to download sketch';
  }

  return result;
};

module.exports = opdl;

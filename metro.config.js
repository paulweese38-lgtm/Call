const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for audio files and PDFs
config.resolver.assetExts.push('mp3', 'wav', 'm4a', 'pdf');

// Add SVG transformer
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;

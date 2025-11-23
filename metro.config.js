const { getDefaultConfig, mergeConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg', 'ts', 'tsx', 'js', 'jsx'],
    alias: {
      '@': './src',
      '@components': './src/components',
      '@screens': './src/screens',
      '@services': './src/services',
      '@lib': './src/lib',
      '@utils': './src/utils',
      '@types': './src/types',
      '@assets': './assets'
    }
  },
  watchFolders: [
    './src'
  ],
  maxWorkers: 2,
};

module.exports = mergeConfig(defaultConfig, config);
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
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
        }
      ],
      'react-native-reanimated/plugin'
    ],
    env: {
      production: {
        plugins: ['transform-remove-console']
      }
    }
  };
};
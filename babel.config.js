module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          extensions: [
            '.js',
            '.jsx',
            '.ts',
            '.tsx',
            '.android.js',
            '.android.tsx',
            '.ios.js',
            '.ios.tsx',
          ],
          alias: {
            '@': './',
          },
        },
      ],
      'babel-plugin-transform-import-meta',
      'react-native-reanimated/plugin',
      '@babel/plugin-transform-export-namespace-from',
    ],
  }
}
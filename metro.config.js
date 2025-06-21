// Polyfill for os.availableParallelism if it doesn't exist
const os = require('os');
if (!os.availableParallelism) {
  os.availableParallelism = () => os.cpus().length;
}

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  maxWorkers: 2,  // 明确设置工作进程数
  server: {
    port: 8081
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
        sourceMap: true,
        inlineSourceMap: false,
      },
    }),
  },
  watchFolders: [__dirname],
  resolver: {
    nodeModulesPaths: [__dirname + '/node_modules'],
  }
};

// 使用自定义配置覆盖默认配置
module.exports = mergeConfig(getDefaultConfig(__dirname), config);

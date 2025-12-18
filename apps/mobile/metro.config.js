const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Handle SVGs
const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
  // Let Metro know where to resolve packages (Monorepo)
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ],
  // Force resolve React and Expo from mobile's context to avoid version conflicts
  extraNodeModules: {
    react: require.resolve('react', { paths: [projectRoot] }),
    'react-native': require.resolve('react-native', { paths: [projectRoot] }),
    expo: path.resolve(projectRoot, 'node_modules/expo'),
  },
};

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

module.exports = config;

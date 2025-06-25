// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const {withNativeWind} = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add additional resolver for React Native
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native': require.resolve('react-native'),
};

// Add support for Hermes
config.transformer.unstable_allowRequireContext = true;

// Add platform extensions
config.resolver.platforms = [
  'native',
  'android',
  'ios',
  'web'
];

module.exports = withNativeWind(config);
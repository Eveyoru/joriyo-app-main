// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolver configuration for web-streams-polyfill
config.resolver.alias = {
  ...config.resolver.alias,
  'web-streams-polyfill/ponyfill/es6': 'web-streams-polyfill/ponyfill/es2018'
};

// Add platform extensions
config.resolver.platforms = [
  'native',
  'android',
  'ios',
  'web'
];

module.exports = config;
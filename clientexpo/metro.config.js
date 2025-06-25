// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);


// Add platform extensions
config.resolver.platforms = [
  'native',
  'android',
  'ios',
  'web'
];

module.exports = config;
// Expo SDK 52+ auto-detects the pnpm monorepo root and configures resolution for it —
// do not add manual watchFolders/disableHierarchicalLookup, see docs.expo.dev/guides/monorepos.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

module.exports = config;

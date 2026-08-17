const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web implementation bundles a WASM SQLite build (wa-sqlite) —
// Metro doesn't treat .wasm as an asset by default.
config.resolver.assetExts.push('wasm');

// Native build intermediates (CMake's .cxx dirs, Gradle's build/ output)
// churn directories in and out of existence fast enough that Metro's file
// watcher can crash trying to watch one that's already gone by the time it
// gets there (ENOENT) — this actually happened running `expo start` and a
// local `gradlew` build against the same node_modules at once. Excluded so
// the dev server survives a concurrent native build.
const nativeBuildExclusions = [/.*\/android\/\.cxx\/.*/, /.*\/android\/build\/.*/, /.*\/ios\/build\/.*/];
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = existingBlockList
  ? [...(Array.isArray(existingBlockList) ? existingBlockList : [existingBlockList]), ...nativeBuildExclusions]
  : nativeBuildExclusions;

// wa-sqlite needs cross-origin isolation (SharedArrayBuffer) to persist data
// via OPFS in the browser. Applies to the local dev server; the equivalent
// headers for the deployed static export are set in vercel.json.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return middleware(req, res, next);
  };
};

module.exports = config;

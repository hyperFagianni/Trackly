const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web implementation bundles a WASM SQLite build (wa-sqlite) —
// Metro doesn't treat .wasm as an asset by default.
config.resolver.assetExts.push('wasm');

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

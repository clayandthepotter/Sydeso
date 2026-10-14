const nodeExternals = require("webpack-node-externals");

/**
 * Bundles the API into one file so the workspace packages (resolved from TypeScript source
 * through tsconfig paths) ship inside dist/main.js. Everything in node_modules stays external
 * and is installed in the runtime image.
 */
module.exports = options => ({
  ...options,
  externals: [nodeExternals({ allowlist: [/^@sydeso\//] })],
});

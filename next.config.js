import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  experimental: {
    serverComponentsExternalPackages: ['@0glabs/0g-ts-sdk']
  },
  webpack: (config) => {
    // Fallbacks for Node core modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      util: require.resolve('util'),
      events: require.resolve('events'),
      fs: false,
      'fs/promises': false,
      path: false,
      os: false,
      net: false,
      tls: false,
      child_process: false,
    };

    // Strip "node:" prefix → map them directly
    config.resolve.alias = {
      ...config.resolve.alias,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      util: require.resolve('util'),
      events: require.resolve('events'),
      'node:crypto': require.resolve('crypto-browserify'),
      'node:stream': require.resolve('stream-browserify'),
      'node:buffer': require.resolve('buffer'),
      'node:util': require.resolve('util'),
      'node:events': require.resolve('events'),
      'node:fs': false,
      'node:fs/promises': false,
      'node:path': false,
      'node:os': false,
      'node:net': false,
      'node:tls': false,
      'node:child_process': false,
    };

    // Add NormalModuleReplacementPlugin for node: scheme handling
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:crypto$/, 'crypto-browserify'),
      new webpack.NormalModuleReplacementPlugin(/^node:stream$/, 'stream-browserify'),
      new webpack.NormalModuleReplacementPlugin(/^node:buffer$/, 'buffer'),
      new webpack.NormalModuleReplacementPlugin(/^node:util$/, 'util'),
      new webpack.NormalModuleReplacementPlugin(/^node:events$/, 'events'),
      new webpack.NormalModuleReplacementPlugin(/^node:fs$/, 'data:text/javascript,module.exports = {}'),
      new webpack.NormalModuleReplacementPlugin(/^node:fs\/promises$/, 'data:text/javascript,module.exports = { open: async () => ({ close: async () => {} }) };'),
      new webpack.NormalModuleReplacementPlugin(/^node:path$/, 'data:text/javascript,module.exports = {}'),
      new webpack.NormalModuleReplacementPlugin(/^node:os$/, 'data:text/javascript,module.exports = {}'),
      new webpack.NormalModuleReplacementPlugin(/^node:net$/, 'data:text/javascript,module.exports = {}'),
      new webpack.NormalModuleReplacementPlugin(/^node:tls$/, 'data:text/javascript,module.exports = {}'),
      new webpack.NormalModuleReplacementPlugin(/^node:child_process$/, 'data:text/javascript,module.exports = {}')
    );

    // Add Buffer + process polyfills
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );

    return config;
  },
};

export default nextConfig;

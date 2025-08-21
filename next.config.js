/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
  },
  webpack: (config) => {
    config.resolve.fallback = {
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
    };
    
    // Handle node: protocol imports
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:crypto': require.resolve('crypto-browserify'),
      'node:stream': require.resolve('stream-browserify'),
      'node:buffer': require.resolve('buffer'),
      'node:util': require.resolve('util'),
      'node:events': require.resolve('events'),
    };
    
    const webpack = require('webpack');
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );

    return config;
  },
};

module.exports = nextConfig;
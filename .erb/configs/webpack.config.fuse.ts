/**
 * Build config for electron renderer process
 */

import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { merge } from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import baseConfig from './webpack.config.base';
import webpackPaths from './webpack.paths';
import Dotenv from 'dotenv-webpack';

const configuration: webpack.Configuration = {
  mode: process.env.NODE_ENV,

  target: 'electron-renderer',

  module: {
    rules: [{ test: /\.node$/, loader: 'node-loader' }],
  },

  entry: [
    'core-js',
    'regenerator-runtime/runtime',
    path.join(webpackPaths.srcFusePath, 'index.ts'),
  ],

  output: {
    path: webpackPaths.distFusePath,
    publicPath: './',
    filename: 'renderer.js',
    library: {
      type: 'umd',
    },
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
    ],
  },

  plugins: [
    new Dotenv({ ignoreStub: true }),

    new HtmlWebpackPlugin({
      filename: 'index.html',
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true,
      },
      isBrowser: false,
      isDevelopment: process.env.NODE_ENV !== 'production',
    }),
  ],
};

export default merge(baseConfig, configuration);

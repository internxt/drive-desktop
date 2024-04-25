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
import checkNodeEnv from '../scripts/check-node-env';
import deleteSourceMaps from '../scripts/delete-source-maps';

checkNodeEnv('production');
deleteSourceMaps();

const configuration: webpack.Configuration = {
  mode: process.env.NODE_ENV,

  target: 'electron-main',

  module: {
    rules: [{ test: /\.node$/, loader: 'node-loader' }],
  },

  entry: [
    'core-js',
    'regenerator-runtime/runtime',
    path.join(webpackPaths.srcVirtualDrivePath, 'index.ts'),
  ],

  output: {
    path: webpackPaths.distVirtualDrivePath,
    filename: '[name].js',
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
    ],
  },

  plugins: [new Dotenv({ ignoreStub: true })],
};

export default merge(baseConfig, configuration);

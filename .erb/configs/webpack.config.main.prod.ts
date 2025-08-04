import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import Dotenv from 'dotenv-webpack';
import baseConfig from './webpack.config.base';
import webpackPaths from './webpack.paths';
import checkNodeEnv from '../scripts/check-node-env';

checkNodeEnv('production');

const configuration: webpack.Configuration = {
  mode: 'production',
  target: 'electron-main',
  devtool: 'source-map',

  module: {
    rules: [{ test: /\.node$/, loader: 'node-loader' }],
  },

  entry: {
    main: path.join(webpackPaths.srcMainPath, 'main.ts'),
    preload: path.join(webpackPaths.srcMainPath, 'preload.js'),
  },

  output: {
    path: webpackPaths.distMainPath,
    filename: '[name].js',
  },

  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
    ],
  },

  plugins: [
    new BundleAnalyzerPlugin({ analyzerMode: process.env.ANALYZE === 'true' ? 'server' : 'disabled' }),
    new webpack.EnvironmentPlugin({ NODE_ENV: 'production' }),
    new Dotenv({ ignoreStub: true }),
  ],

  /**
   * Disables webpack processing of __dirname and __filename.
   * If you run the bundle in node.js it falls back to these values of node.js.
   * https://github.com/webpack/webpack/issues/2010
   */
  node: {
    __dirname: false,
    __filename: false,
  },
};

// ts-prune-ignore-next
export default merge(baseConfig, configuration);

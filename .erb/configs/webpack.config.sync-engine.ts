import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import baseConfig from './webpack.config.base';
import webpackPaths from './webpack.paths';
import Dotenv from 'dotenv-webpack';

const configuration: webpack.Configuration = {
  devtool: 'source-map',
  mode: 'production',
  target: 'electron-main',

  module: {
    rules: [{ test: /\.node$/, loader: 'node-loader' }],
  },

  entry: [path.join(webpackPaths.srcSyncEnginePath, 'index.ts')],

  output: {
    path: webpackPaths.distSyncEnginePath,
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

  plugins: [
    new Dotenv({ ignoreStub: true }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
    }),
  ],
};

export default merge(baseConfig, configuration);

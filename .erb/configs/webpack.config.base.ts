import path from 'path';
import { cwd } from 'process';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import webpack from 'webpack';
import webpackPaths, { nativeDeps } from './webpack.paths';
import { validateProcessEnv } from '../scripts/validate-process-env';

validateProcessEnv();

const aliases: Record<string, string> = {};
if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_NODE_WIN === 'true') {
  aliases['@internxt/node-win/dist'] = path.resolve(cwd(), '../node-win/dist');
}

const configuration: webpack.Configuration = {
  externals: nativeDeps,

  stats: 'errors-only',

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            // Remove this line to enable type checking in webpack builds
            transpileOnly: true,
          },
        },
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack'],
      },
    ],
  },

  output: {
    path: webpackPaths.srcPath,
    // https://github.com/webpack/webpack/issues/1114
    library: {
      type: 'commonjs2',
    },
  },

  resolve: {
    alias: { ...aliases },
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [webpackPaths.rootPath, 'node_modules'],
    plugins: [new TsconfigPathsPlugin()],
  },

  plugins: [new webpack.EnvironmentPlugin({ NODE_ENV: 'production' })],
};

export default configuration;

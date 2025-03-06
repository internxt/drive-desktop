import path from 'path';
import { cwd } from 'process';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import webpack from 'webpack';
import webpackPaths from './webpack.paths';

const aliases = {};
if (process.env.NODE_ENV === 'development') {
  aliases['virtual-drive/dist'] = path.resolve(cwd(), '../node-win/dist');
}

const configuration: webpack.Configuration = {
  /*
   * These libraries use native code and should be treated differently.
   * Run yarn ts-node .erb/scripts/check-native-deps.ts to check which libraries have native dependencies.
   * We have ruled out the use of two package.json.
   * https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/1827#issuecomment-427991777
   * https://electron-react-boilerplate.js.org/docs/adding-dependencies/#module-structure
   */
  externals: ['@rudderstack/rudder-sdk-node', 'typeorm', 'better-sqlite3', 'virtual-drive'],

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
    modules: [webpackPaths.srcPath, 'node_modules'],
    plugins: [new TsconfigPathsPlugin()],
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
    }),
  ],
};

export default configuration;

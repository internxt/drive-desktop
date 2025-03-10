import rimraf from 'rimraf';
import webpackPaths from '../configs/webpack.paths.ts';

rimraf.sync(webpackPaths.distPath);

import rimraf from 'rimraf';
import webpackPaths from '../configs/webpack.paths';

rimraf.sync(webpackPaths.distPath);

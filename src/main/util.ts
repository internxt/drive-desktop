/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import { URL } from 'url';
import path from 'path';

export let resolveHtmlPath: (pathname: string) => string;
const htmlFileName = 'index.html';

if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 1212;
  resolveHtmlPath = (pathname: string) => {
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    url.hash = `/${pathname}`;
    return url.href;
  };
} else {
  resolveHtmlPath = (pathname: string) => {
    return `file://${path.resolve(
      __dirname,
      '../renderer/',
      htmlFileName
    )}#/${pathname}`;
  };
}

export const preloadPath = path.join(__dirname, 'preload.js');

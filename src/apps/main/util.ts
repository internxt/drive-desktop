import path from 'path';
import { URL } from 'url';

export let resolveHtmlPath: (pathname: string, query?: string) => string;
const htmlFileName = 'index.html';

if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 1212;
  resolveHtmlPath = (pathname: string, query = '') => {
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    url.hash = `/${pathname}`;
    url.search = query;

    return url.href;
  };
} else {
  resolveHtmlPath = (pathname: string, query = '') => {
    return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}${query ? `?${query}` : ''}#/${pathname}`;
  };
}

export const preloadPath = path.join(__dirname, 'preload.js');

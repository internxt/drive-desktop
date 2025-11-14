import path from 'node:path';
import { URL } from 'node:url';

export let resolveHtmlPath: (pathname: string, query?: string) => string;
const htmlFileName = 'index.html';

if (process.env.NODE_ENV === 'development') {
  resolveHtmlPath = (pathname: string, query = '') => {
    const url = new URL(`http://localhost:${process.env.PORT}`);
    url.pathname = htmlFileName;
    url.hash = `/${pathname}`;
    url.search = query;

    return url.href;
  };
} else {
  resolveHtmlPath = (pathname: string, query = '') => {
    const basePath = path.resolve(__dirname, '../renderer/', htmlFileName);
    const queryString = query ? `?${query}` : '';
    return `file://${basePath}${queryString}#/${pathname}`;
  };
}

export const preloadPath = path.join(__dirname, 'preload.js');

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

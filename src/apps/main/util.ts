import { ENV } from '@/core/env/env';
import path from 'path';
import { URL } from 'url';

export let resolveHtmlPath: (pathname: string, query?: string) => string;
const htmlFileName = 'index.html';

if (ENV.NODE_ENV === 'development') {
  resolveHtmlPath = (pathname: string, query = '') => {
    const url = new URL(`http://localhost:${ENV.PORT}`);
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

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isAbsolutePath(pathname: string): boolean {
  const windowsPath = /^[a-zA-Z]:\\/;
  return windowsPath.test(pathname);
}

const { path } = window.electron;

export function getBaseName(pathname: string): string {
  return path.parse(pathname).base;
}

export function getExtension(pathname: string): string {
  return path.parse(pathname).ext.replace(/^./, '');
}

export function getParentDir(pathname: string): string {
  return path.parse(pathname).dir;
}

export const getPathArray = (pathname: string): string[] =>
  pathname.split(path.sep).filter(function (path) {
    return path !== null && path.trim() !== '';
  });

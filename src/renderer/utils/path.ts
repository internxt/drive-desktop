const { path } = window.electron;

export function getBaseName(pathname: string): string {
  return path.parse(pathname).base;
}

export function getParentDir(pathname: string): string {
  return path.parse(pathname).dir;
}

const { path } = window.electron;

export function getBaseName(pathname: string): string {
  return path.parse(pathname).base;
}

export function getExtension(pathname: string): string {
  return path.parse(pathname).ext.replace(/^./, '');
}

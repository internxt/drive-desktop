import path from 'path-browserify';

export default function getDisplayName(pathname: string): string {
  return path.parse(pathname).base;
}

import path from 'path';

export function relative(root: string, to: string): string {
  const r = path.posix.relative(root, to);

  return r.startsWith('/') ? r : `/${r}`;
}

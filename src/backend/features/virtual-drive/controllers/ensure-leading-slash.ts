export function ensureLeadingSlash(rawPath: string): string {
  if (rawPath === '' || rawPath === '/') return '/';
  return rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
}

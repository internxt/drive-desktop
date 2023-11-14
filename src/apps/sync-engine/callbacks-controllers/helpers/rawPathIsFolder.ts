export function rawPathIsFolder(raw: string) {
  return raw.endsWith('\\') || raw.endsWith('/');
}

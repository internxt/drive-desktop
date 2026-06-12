import { win32 } from 'node:path';

export function normalizeWindowsPath(path: string) {
  return win32.resolve(path).toLowerCase();
}

export function isValidInternxtDrivePath(selectedPath: string, rootPath: string) {
  const relativePath = win32.relative(rootPath, selectedPath);

  return relativePath !== '' && relativePath !== '..' && !relativePath.startsWith(`..${win32.sep}`) && !win32.isAbsolute(relativePath);
}

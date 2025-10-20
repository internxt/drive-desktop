import { PathLike, mkdirSync } from 'node:fs';

export function ensureFolderExists(folder: PathLike) {
  mkdirSync(folder, { recursive: true });
}

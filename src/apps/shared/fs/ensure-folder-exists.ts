import { PathLike, mkdirSync } from 'fs';

export function ensureFolderExists(folder: PathLike) {
  mkdirSync(folder, { recursive: true });
}

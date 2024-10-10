import { FolderPath } from '../FolderPath';

export class FolderInPathAlreadyExistsError extends Error {
  constructor(path: FolderPath) {
    super(`Folder in ${path.value} already exists`);
  }
}

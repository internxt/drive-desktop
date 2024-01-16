import { Folder } from '../Folder';

export class FolderAlreadyExists extends Error {
  constructor(folder: Folder) {
    super(`Folder ${folder.path} already exists with id: ${folder.uuid}`);
  }
}

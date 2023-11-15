export class FolderNotFoundError extends Error {
  constructor(folder: string) {
    super(`Folder ${folder} not found`);
  }
}

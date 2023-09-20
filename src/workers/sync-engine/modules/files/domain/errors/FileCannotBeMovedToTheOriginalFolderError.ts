export class FileCannotBeMovedToTheOriginalFolderError extends Error {
  constructor(filePath: string) {
    super(`Cannot move ${filePath} to its current folder`);
  }
}

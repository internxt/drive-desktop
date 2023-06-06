export class FileAlreadyExistsError extends Error {
  constructor(path: string) {
    super(`File ${path} already exists`);
  }
}

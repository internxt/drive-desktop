export class FileAlreadyExists extends Error {
  constructor(path: string) {
    super(`File ${path} already exists`);
  }
}

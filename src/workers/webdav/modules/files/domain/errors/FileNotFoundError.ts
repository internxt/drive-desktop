export class FileNotFoundError extends Error {
  constructor(path: string) {
    super(`File ${path} not found`);
  }
}

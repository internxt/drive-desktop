export class FileNotFoundError extends Error {
  constructor(id: string | number) {
    super(`File ${id} not found`);
  }
}

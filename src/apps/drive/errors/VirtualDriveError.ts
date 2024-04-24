export class VirtualDriveError extends Error {}

export class FileNotFoundVirtualDriveError extends VirtualDriveError {
  constructor(path: string) {
    super(`File with path ${path} was not found`);
  }
}

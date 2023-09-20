export class FileNameShouldDifferFromOriginalError extends Error {
  constructor(action: string) {
    super(`File name should differ form the original in ${action}`);
  }
}

export class FileNameShouldBeEqualToOriginalError extends Error {
  constructor(action: string) {
    super(`File name should be equal to the original in ${action}`);
  }
}

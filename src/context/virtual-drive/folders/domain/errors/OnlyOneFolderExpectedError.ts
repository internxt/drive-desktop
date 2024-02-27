export class OnlyOneFolderExpectedError extends Error {
  constructor() {
    super('Expected to find only one folder');
  }
}

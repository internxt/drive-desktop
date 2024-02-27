export class OnlyOneFileExpectedError extends Error {
  constructor() {
    super('Expected to find only one file');
  }
}

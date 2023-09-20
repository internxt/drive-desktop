export class ActionNotPermitedError extends Error {
  constructor(action: string) {
    super(`${action} is not permited on folders`);
  }
}

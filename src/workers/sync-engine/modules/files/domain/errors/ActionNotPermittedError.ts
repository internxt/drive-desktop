export class ActionNotPermittedError extends Error {
  constructor(action: string) {
    super(`${action} is not permitted on files`);
  }
}

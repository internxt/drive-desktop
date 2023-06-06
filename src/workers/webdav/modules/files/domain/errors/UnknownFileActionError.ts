export class UnknownFileActionError extends Error {
  constructor(where: string) {
    super(`Unknown action to perfrom on ${where}`);
  }
}

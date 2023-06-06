export class UnknownFileAction extends Error {
  constructor(where: string) {
    super(`Unknown action to perfrom on ${where}`);
  }
}

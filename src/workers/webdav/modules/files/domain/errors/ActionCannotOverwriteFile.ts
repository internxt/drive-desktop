export class ActionCannotOverwriteFile extends Error {
  constructor(action: string) {
    super(`File ${action} cannot overwrite existing file`);
  }
}

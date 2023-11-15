export class FileActionCannotModifyExtension extends Error {
  constructor(action: string) {
    super(`${action} file cannot modify it's extension`);
  }
}

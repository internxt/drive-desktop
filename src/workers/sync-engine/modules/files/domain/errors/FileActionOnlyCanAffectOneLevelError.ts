export class FileActionOnlyCanAffectOneLevelError extends Error {
  constructor(action: string) {
    super(`File action ${action} only can affect one level`);
  }
}

export class MpCmdRunNotFoundError extends Error {
  constructor() {
    super('MpCmdRun.exe not found.');
  }
}

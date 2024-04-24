import { NotifyFuseCallback } from './FuseCallback';

export class ChownCallback extends NotifyFuseCallback {
  constructor() {
    super('Chown', { input: true, output: true });
  }

  async execute(_path: string, _uid: number, _gid: number) {
    return this.right();
  }
}

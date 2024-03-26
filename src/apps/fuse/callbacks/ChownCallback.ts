import { NotifyFuseCallback } from './FuseCallback';

export class ChownCallback extends NotifyFuseCallback {
  constructor() {
    super('Chown', { input: true, output: true });
  }

  async execute(path: string, uid: number, gid: number) {
    return this.right();
  }
}

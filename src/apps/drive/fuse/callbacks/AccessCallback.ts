/*TODO: DELETE DEAD CODE */
import { NotifyFuseCallback } from './FuseCallback';

export class AccessCallback extends NotifyFuseCallback {
  constructor() {
    super('Access', { input: true, output: true });
  }

  async execute() {
    return this.right();
  }
}

import { PullQueue, DeleteQueue, RenameQueue } from './action-queue';

export class SyncQueues {
  public readonly pull: PullQueue;

  public readonly delete: DeleteQueue;

  public readonly rename: RenameQueue;

  constructor() {
    this.pull = new PullQueue();
    this.delete = new DeleteQueue();
    this.rename = new RenameQueue();
  }

  areEmpty = (): boolean => {
    return (
      [...this.pull.getAll(), ...this.delete.getAll(), ...this.rename.getAll()]
        .length === 0
    );
  };
}

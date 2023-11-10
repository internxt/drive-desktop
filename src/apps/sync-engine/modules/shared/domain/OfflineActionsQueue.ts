export type OfflineAction = () => Promise<void>;
export type OfflineActions = Array<OfflineAction>;

export class OfflineActionsQueue {
  private queue: OfflineActions = [];

  add(action: OfflineAction): void {
    this.queue.push(action);
  }
}

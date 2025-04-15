import { SynchronizeOfflineModificationsOnFolderCreated } from '../../folders/application/SynchronizeOfflineModificationsOnFolderCreated';
import { AllowedEvents } from './AllowedEvents';
import { InMemoryEventRepository } from './InMemoryEventHistory';
import { NodeJsEventBus } from './NodeJsEventBus';

export class EventRecorder {
  constructor(
    private readonly history: InMemoryEventRepository,
    private readonly bus: NodeJsEventBus,
  ) {}

  async publish(events: Array<AllowedEvents>): Promise<void> {
    const stored = events.map((event) => this.history.store(event));
    await Promise.all(stored);

    await this.bus.publish(events);
  }

  addSubscribers(subscriber: SynchronizeOfflineModificationsOnFolderCreated): void {
    this.bus.addSubscribers(subscriber);
  }
}

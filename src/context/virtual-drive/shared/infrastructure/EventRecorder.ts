import { DomainEventSubscriber } from '@/context/shared/domain/DomainEventSubscriber';
import { DomainEvent } from '../../../shared/domain/DomainEvent';
import { InMemoryEventRepository } from './InMemoryEventHistory';
import { NodeJsEventBus } from './NodeJsEventBus';

export class EventRecorder {
  constructor(
    private readonly history: InMemoryEventRepository,
    private readonly bus: NodeJsEventBus,
  ) {}

  async publish(events: Array<DomainEvent>): Promise<void> {
    const stored = events.map((event) => this.history.store(event));
    await Promise.all(stored);

    await this.bus.publish(events);
  }

  addSubscribers(subscribers: Array<DomainEventSubscriber<DomainEvent>>): void {
    this.bus.addSubscribers(subscribers);
  }
}

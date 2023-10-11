import { DomainEvent } from '../domain/DomainEvent';
import { EventBus } from '../domain/EventBus';
import { EventHistory } from '../domain/EventRepository';
import { DomainEventSubscribers } from './DomainEventSubscribers';

export class EventRecorder implements EventBus {
  constructor(
    private readonly history: EventHistory,
    private readonly bus: EventBus
  ) {}

  async publish(events: Array<DomainEvent>): Promise<void> {
    const stored = events.map((event) => this.history.store(event));
    await Promise.all(stored);

    await this.bus.publish(events);
  }

  addSubscribers(subscribers: DomainEventSubscribers): void {
    this.bus.addSubscribers(subscribers);
  }
}

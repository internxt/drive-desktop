import { DomainEvent } from '../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../shared/domain/DomainEventSubscriber';
import { EventBus } from '../domain/EventBus';
import { EventRepository } from '../domain/EventRepository';

export class EventRecorder implements EventBus {
  constructor(
    private readonly history: EventRepository,
    private readonly bus: EventBus
  ) {}

  async publish(events: Array<DomainEvent>): Promise<void> {
    const stored = events.map((event) => this.history.store(event));
    await Promise.all(stored);

    await this.bus.publish(events);
  }

  addSubscribers(subscribers: Array<DomainEventSubscriber<DomainEvent>>): void {
    this.bus.addSubscribers(subscribers);
  }

  instance() {
    return this;
  }
}

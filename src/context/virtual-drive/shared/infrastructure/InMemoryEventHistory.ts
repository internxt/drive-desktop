import { Optional } from '../../../../shared/types/Optional';
import { DomainEvent } from '../../../shared/domain/DomainEvent';
import { EventRepository } from '../domain/EventRepository';

export class InMemoryEventRepository implements EventRepository {
  private static readonly MAX_EVENTS_STORED = 3_000;
  private events: Array<DomainEvent> = [];

  store(event: DomainEvent): Promise<void> {
    if (this.events.length >= InMemoryEventRepository.MAX_EVENTS_STORED) {
      const eventsToRemove =
        this.events.length - InMemoryEventRepository.MAX_EVENTS_STORED + 1;
      this.events.splice(0, eventsToRemove);
    }

    this.events.push(event);

    return Promise.resolve();
  }

  search(aggregateId: string): Promise<Array<DomainEvent>> {
    return Promise.resolve(
      this.events.filter((e) => e.aggregateId === aggregateId)
    );
  }

  async filter<Event extends typeof DomainEvent>(
    aggregateId: string,
    event: Event
  ): Promise<Array<Event>> {
    const events = await this.search(aggregateId);

    const filtered = events.filter((e) => e.eventName === event.EVENT_NAME);

    return filtered as unknown as Event[];
  }

  async last<Event extends DomainEvent>(
    eventName: Event['eventName']
  ): Promise<Optional<Event>> {
    const event = this.events.findLast((e) => e.eventName === eventName);

    return new Optional(event as Event);
  }
}

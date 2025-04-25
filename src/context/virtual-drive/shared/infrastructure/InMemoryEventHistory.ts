import { DomainEvent } from '../../../shared/domain/DomainEvent';

export class InMemoryEventRepository {
  private static readonly MAX_EVENTS_STORED = 3_000;
  private events: Array<DomainEvent> = [];

  store(event: DomainEvent): void {
    if (this.events.length >= InMemoryEventRepository.MAX_EVENTS_STORED) {
      const eventsToRemove = this.events.length - InMemoryEventRepository.MAX_EVENTS_STORED + 1;
      this.events.splice(0, eventsToRemove);
    }

    this.events.push(event);
  }

  search(aggregateId: string): Array<DomainEvent> {
    return this.events.filter((e) => e.aggregateId === aggregateId);
  }
}

import { DomainEvent } from '../../../shared/domain/DomainEvent';
import { EventRepository } from '../domain/EventRepository';
import { Optional } from '../../../../shared/types/Optional';

export class EventRepositoryMock implements EventRepository {
  public readonly storeMock = vi.fn();
  public readonly searchMock = vi.fn();
  public readonly lastMock = vi.fn();

  store(event: DomainEvent): Promise<void> {
    return this.storeMock(event);
  }

  search(aggregateId: string): Promise<DomainEvent[]> {
    return this.searchMock(aggregateId);
  }

  last<Event extends DomainEvent>(event: Event['eventName']): Promise<Optional<Event>> {
    return this.lastMock(event);
  }
}

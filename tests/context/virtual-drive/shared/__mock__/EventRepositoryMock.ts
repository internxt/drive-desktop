import { DomainEvent } from '../../domain/DomainEvent';
import { EventRepository } from '../../domain/EventRepository';

export class EventRepositoryMock implements EventRepository {
  public readonly storeMock = jest.fn();
  public readonly searchMock = jest.fn();

  store(event: DomainEvent): Promise<void> {
    return this.storeMock(event);
  }
  search(aggregateId: string): Promise<DomainEvent[]> {
    return this.searchMock(aggregateId);
  }
}

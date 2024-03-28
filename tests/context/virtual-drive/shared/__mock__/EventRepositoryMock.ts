import { DomainEvent } from '../../../../../src/context/shared/domain/DomainEvent';
import { EventRepository } from '../../../../../src/context/virtual-drive/shared/domain/EventRepository';
import { Optional } from '../../../../../src/shared/types/Optional';

export class EventRepositoryMock implements EventRepository {
  public readonly storeMock = jest.fn();
  public readonly searchMock = jest.fn();
  public readonly lastMock = jest.fn();

  store(event: DomainEvent): Promise<void> {
    return this.storeMock(event);
  }

  search(aggregateId: string): Promise<DomainEvent[]> {
    return this.searchMock(aggregateId);
  }

  last<Event extends DomainEvent>(
    event: Event['eventName']
  ): Promise<Optional<Event>> {
    return this.lastMock(event);
  }
}

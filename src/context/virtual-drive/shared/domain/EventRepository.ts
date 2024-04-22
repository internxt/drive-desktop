import { Optional } from '../../../../shared/types/Optional';
import { DomainEvent } from '../../../shared/domain/DomainEvent';

export abstract class EventRepository {
  abstract store(event: DomainEvent): Promise<void>;
  abstract search(aggregateId: string): Promise<Array<DomainEvent>>;
  abstract last<Event extends DomainEvent>(
    event: Event['eventName']
  ): Promise<Optional<Event>>;
}

import { Optional } from '../../../../shared/types/Optional';
import { DomainEvent } from '../../../shared/domain/DomainEvent';

export interface EventRepository {
  store(event: DomainEvent): Promise<void>;
  search(aggregateId: string): Promise<Array<DomainEvent>>;
  last<Event extends DomainEvent>(
    event: Event['eventName']
  ): Promise<Optional<Event>>;
}

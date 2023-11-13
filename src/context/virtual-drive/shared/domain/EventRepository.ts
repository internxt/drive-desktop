import { DomainEvent } from '../../../shared/domain/DomainEvent';

export interface EventRepository {
  store(event: DomainEvent): Promise<void>;
  search(aggregateId: string): Promise<Array<DomainEvent>>;
}

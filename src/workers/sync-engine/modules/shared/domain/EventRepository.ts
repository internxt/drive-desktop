import { DomainEvent } from './DomainEvent';

export interface EventHistory {
  store(event: DomainEvent): Promise<void>;
  search(aggregateId: string): Promise<Array<DomainEvent>>;
}

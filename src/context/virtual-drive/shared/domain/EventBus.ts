import { DomainEventSubscribers } from '../infrastructure/DomainEventSubscribers';
import { DomainEvent } from '../../../shared/domain/DomainEvent';

export interface EventBus {
  publish(events: Array<DomainEvent>): Promise<void>;
  addSubscribers(subscribers: DomainEventSubscribers): void;
}

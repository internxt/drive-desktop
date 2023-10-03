import { DomainEventSubscribers } from '../infrastructure/DomainEventSubscribers';
import { DomainEvent } from './DomainEvent';

export interface EventBus {
  publish(events: Array<DomainEvent>): Promise<void>;
  addSubscribers(subscribers: DomainEventSubscribers): void;
}

import { DomainEventSubscribers } from '../infrastructure/DomainEventSubscribers';
import { DomainEvent } from './DomainEvent';

export interface WebdavServerEventBus {
  publish(events: Array<DomainEvent>): Promise<void>;
  addSubscribers(subscribers: DomainEventSubscribers): void;
}

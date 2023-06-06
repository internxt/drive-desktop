import { DomainEventSubscribers } from '../infrastructure/DomainEventSubscribers';
import { WebdavDomainEvent } from './WebdavDomainEvent';

export interface WebdavServerEventBus {
  publish(events: Array<WebdavDomainEvent>): Promise<void>;
  addSubscribers(subscribers: DomainEventSubscribers): void;
}

import { WebdavDomainEvent } from './WebdavDomainEvent';

export interface WebdavServerEventBus {
  publish(events: Array<WebdavDomainEvent>): Promise<void>;
}

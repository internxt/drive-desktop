import { DomainEventClass, WebdavDomainEvent } from './WebdavDomainEvent';

export interface WebdavDomainEventSubscriber<T extends WebdavDomainEvent> {
  subscribedTo(): Array<DomainEventClass>;
  on(domainEvent: T): Promise<void>;
}

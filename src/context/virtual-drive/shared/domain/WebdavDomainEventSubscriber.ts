import { DomainEventClass, DomainEvent } from './DomainEvent';

export interface WebdavDomainEventSubscriber<T extends DomainEvent> {
  subscribedTo(): Array<DomainEventClass>;
  on(domainEvent: T): Promise<void>;
}

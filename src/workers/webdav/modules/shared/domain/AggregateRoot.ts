import { Primitives } from '../../../../../shared/types/Primitives';
import { WebdavDomainEvent } from './WebdavDomainEvent';

export abstract class AggregateRoot {
  private domainEvents: Array<WebdavDomainEvent>;

  constructor() {
    this.domainEvents = [];
  }

  pullDomainEvents(): Array<WebdavDomainEvent> {
    const domainEvents = this.domainEvents.slice();
    this.domainEvents = [];

    return domainEvents;
  }

  record(event: WebdavDomainEvent): void {
    this.domainEvents.push(event);
  }

  abstract toPrimitives(): Record<string, Primitives>;
}

import { WebdavDomainEventSubscriber } from '../domain/WebdavDomainEventSubscriber';
import { DomainEvent } from '../domain/DomainEvent';
import { DependencyContainer } from '../../../../apps/sync-engine/dependency-injection/DependencyContainer';
import { DependencyContainerFactory } from '../../../../apps/sync-engine/dependency-injection/DependencyContainerFactory';

export class DomainEventSubscribers {
  constructor(public items: Array<WebdavDomainEventSubscriber<DomainEvent>>) {}

  static from(container: DependencyContainer): DomainEventSubscribers {
    const subscribers = DependencyContainerFactory.subscribers.map(
      (subscriber) => {
        return container[subscriber];
      }
    ) as unknown as Array<WebdavDomainEventSubscriber<DomainEvent>>;

    return new DomainEventSubscribers(subscribers);
  }
}

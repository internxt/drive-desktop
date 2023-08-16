import { DependencyContainerFactory } from 'workers/webdav/dependencyInjection/DependencyContainerFactory';
import { DependencyContainer } from 'workers/webdav/dependencyInjection/DependencyContainer';
import { WebdavDomainEventSubscriber } from '../domain/WebdavDomainEventSubscriber';
import { DomainEvent } from '../domain/DomainEvent';

export class DomainEventSubscribers {
  constructor(public items: Array<WebdavDomainEventSubscriber<DomainEvent>>) {}

  static from(container: DependencyContainer): DomainEventSubscribers {
    const subscribers = DependencyContainerFactory.subscriptors.map(
      (subscriber) => {
        return container[subscriber];
      }
    ) as unknown as Array<WebdavDomainEventSubscriber<DomainEvent>>;

    return new DomainEventSubscribers(subscribers);
  }
}

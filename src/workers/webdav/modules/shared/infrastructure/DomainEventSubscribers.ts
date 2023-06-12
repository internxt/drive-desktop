import { DependencyContainerFactory } from 'workers/webdav/dependencyInjection/DependencyContainerFactory';
import { DependencyContainer } from 'workers/webdav/dependencyInjection/DependencyContainer';
import { WebdavDomainEventSubscriber } from '../domain/WebdavDomainEventSubscriber';
import { WebdavDomainEvent } from '../domain/WebdavDomainEvent';

export class DomainEventSubscribers {
  constructor(
    public items: Array<WebdavDomainEventSubscriber<WebdavDomainEvent>>
  ) {}

  static from(container: DependencyContainer): DomainEventSubscribers {
    const subscribers = DependencyContainerFactory.subscriptors.map(
      (subscriber) => {
        return container[subscriber];
      }
    ) as unknown as Array<WebdavDomainEventSubscriber<WebdavDomainEvent>>;

    return new DomainEventSubscribers(subscribers);
  }
}

import { DomainEvent } from '../../../context/shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../context/shared/domain/DomainEventSubscriber';
import { SubscribeDomainEventsHandlerToTheirEvents } from '../../../context/shared/infrastructure/domain-events/SubscribeDomainEventsHandlerToTheirEvents';
import { FileRepositoryInitializer } from '../../../context/virtual-drive/files/application/FileRepositoryInitializer';
import { FolderRepositoryInitializer } from '../../../context/virtual-drive/folders/application/FolderRepositoryInitializer';
import { TreeBuilder } from '../../../context/virtual-drive/tree/application/TreeBuilder';
import { mainProcessSharedInfraBuilder } from '../../shared/dependency-injection/main/mainProcessSharedInfraContainer';
import { OfflineDependencyContainerFactory } from './offline-drive/OfflineDependencyContainerFactory';
import { VirtualDriveDependencyContainerFactory } from './virtual-drive/VirtualDriveDependencyContainerFactory';
import { Container } from 'diod';

export class DriveDependencyContainerFactory {
  private static async buildContexts(): Promise<Container> {
    const builder = await mainProcessSharedInfraBuilder();

    await VirtualDriveDependencyContainerFactory.build(builder);

    await OfflineDependencyContainerFactory.build(builder);

    return builder.build();
  }

  private static async addEventSubscribers(
    container: Container
  ): Promise<void> {
    const subscribers = container
      .findTaggedServiceIdentifiers<DomainEventSubscriber<DomainEvent>>(
        'event-handler'
      )
      .map((identifier) => container.get(identifier));

    const subscribe = container.get(SubscribeDomainEventsHandlerToTheirEvents);
    subscribe.run(subscribers);
  }

  static async build(): Promise<Container> {
    const container = await DriveDependencyContainerFactory.buildContexts();

    await DriveDependencyContainerFactory.addEventSubscribers(container);

    // init
    const tree = await container.get(TreeBuilder).run();

    await container.get(FolderRepositoryInitializer).run(tree.folders);

    await container.get(FileRepositoryInitializer).run(tree.files);

    return container;
  }
}

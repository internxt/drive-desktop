import { DomainEvent } from '../../../context/shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../context/shared/domain/DomainEventSubscriber';
import { FileRepositoryInitializer } from '../../../context/virtual-drive/files/application/FileRepositoryInitializer';
import { FolderRepositoryInitializer } from '../../../context/virtual-drive/folders/application/FolderRepositoryInitializer';
import { EventBus } from '../../../context/virtual-drive/shared/domain/EventBus';
import { TreeBuilder } from '../../../context/virtual-drive/tree/application/TreeBuilder';
import { mainProcessSharedInfraBuilder } from '../../shared/dependency-injection/main/mainProcessSharedInfraContainer';
import { OfflineDependencyContainerFactory } from './offline/OfflineDependencyContainerFactory';
import { VirtualDriveDependencyContainerFactory } from './virtual-drive/VirtualDriveDependencyContainerFactory';
import { Container } from 'diod';

export class DriveDependencyContainerFactory {
  static async build(): Promise<Container> {
    const builder = await mainProcessSharedInfraBuilder();

    await VirtualDriveDependencyContainerFactory.build(builder);

    await OfflineDependencyContainerFactory.build(builder);

    const container = builder.build();

    const subscribers = container
      .findTaggedServiceIdentifiers<DomainEventSubscriber<DomainEvent>>(
        'event-handler'
      )
      .map((identifier) => container.get(identifier));

    const eventBus = container.get(EventBus);
    eventBus.addSubscribers(subscribers);

    // init
    const tree = await container.get(TreeBuilder).run();

    const folderRepositoryInitiator = container.get(
      FolderRepositoryInitializer
    );

    const fileRepositoryInitiator = container.get(FileRepositoryInitializer);

    await folderRepositoryInitiator.run(tree.folders);
    await fileRepositoryInitiator.run(tree.files);

    return container;
  }
}

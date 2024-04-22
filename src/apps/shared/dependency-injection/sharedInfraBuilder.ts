import { ContainerBuilder } from 'diod';
import { DependencyInjectionMainProcessUserProvider } from './main/DependencyInjectionMainProcessUserProvider';
import { Environment } from '@internxt/inxt-js';
import { EventBus } from '../../../context/virtual-drive/shared/domain/EventBus';
import { EventRepository } from '../../../context/virtual-drive/shared/domain/EventRepository';
import { EventRecorder } from '../../../context/virtual-drive/shared/infrastructure/EventRecorder';
import { NodeJsEventBus } from '../../../context/virtual-drive/shared/infrastructure/NodeJsEventBus';
import { Traverser } from '../../../context/virtual-drive/tree/application/Traverser';
import crypt from '../../../context/shared/infrastructure/crypt';
import { DependencyInjectionMainProcessMnemonicProvider } from './main/DependencyInjectionMainProcessMnemonicProvider';
import { InMemoryEventRepository } from '../../../context/virtual-drive/shared/infrastructure/InMemoryEventHistory';

export function sharedInfraBuilder(): ContainerBuilder {
  const builder = new ContainerBuilder();

  const user = DependencyInjectionMainProcessUserProvider.get();
  const mnemonic = DependencyInjectionMainProcessMnemonicProvider.get();

  const environment = new Environment({
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
    encryptionKey: mnemonic,
  });

  builder.register(Environment).useInstance(environment).addTag('shared');
  // TODO: make it private

  builder
    .register(EventRepository)
    .use(InMemoryEventRepository)
    .asSingleton()
    .addTag('shared');
  // TODO: should be private

  builder
    .register(EventBus)
    .useFactory((c) => {
      const bus = new NodeJsEventBus();
      return new EventRecorder(c.get(EventRepository), bus);
    })
    .asSingleton()
    .addTag('shared');
  // TODO: should be private

  builder
    .register(Traverser)
    .useFactory(() => {
      return Traverser.existingItems(crypt, user.root_folder_id);
    })
    .asSingleton()
    .addTag('shared');
  // TODO: should be private

  return builder;
}

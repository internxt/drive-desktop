import { ContainerBuilder } from 'diod';
import { HttpRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { SimpleFileCreator } from '../../../../context/virtual-drive/files/application/create/SimpleFileCreator';
import { getConfig } from '@/apps/sync-engine/config';

export function registerFilesServices(builder: ContainerBuilder) {
  // Infra

  builder
    .register(HttpRemoteFileSystem)
    .useFactory((c) => new HttpRemoteFileSystem(getConfig().bucket))
    .private();

  // Services

  builder.registerAndUse(SimpleFileCreator);
}

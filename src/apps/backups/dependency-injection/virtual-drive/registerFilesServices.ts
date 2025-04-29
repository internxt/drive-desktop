import { ContainerBuilder } from 'diod';
import { SimpleFileOverrider } from '../../../../context/virtual-drive/files/application/override/SimpleFileOverrider';
import { HttpRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { FileDeleter } from '../../../../context/virtual-drive/files/application/delete/FileDeleter';
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
  builder.registerAndUse(SimpleFileOverrider);
  builder.registerAndUse(FileDeleter);
}

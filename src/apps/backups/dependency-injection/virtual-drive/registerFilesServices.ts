import { ContainerBuilder } from 'diod';
import { SimpleFileOverrider } from '../../../../context/virtual-drive/files/application/override/SimpleFileOverrider';
import crypt from '../../../../context/shared/infrastructure/crypt';
import { HttpRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { FileDeleter } from '../../../../context/virtual-drive/files/application/delete/FileDeleter';
import { SimpleFileCreator } from '../../../../context/virtual-drive/files/application/create/SimpleFileCreator';
import { getConfig } from '@/apps/sync-engine/config';

export async function registerFilesServices(builder: ContainerBuilder) {
  builder
    .register(HttpRemoteFileSystem)
    .useFactory((c) => new HttpRemoteFileSystem(crypt, getConfig().bucket))
    .private();

  // Services

  builder.registerAndUse(SimpleFileCreator);
  builder.registerAndUse(SimpleFileOverrider);
  builder.registerAndUse(FileDeleter);
}

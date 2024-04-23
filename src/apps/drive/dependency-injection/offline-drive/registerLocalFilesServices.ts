import { ContainerBuilder } from 'diod';
import { app } from 'electron';
import path from 'path';
import { LocalFileCacheDeleter } from '../../../../context/offline-drive/LocalFile/application/delete/LocalFileCacheDeleter';
import { LocalFileIsAvailable } from '../../../../context/offline-drive/LocalFile/application/find/LocalFileIsAvaliable';
import { LocalFileChunkReader } from '../../../../context/offline-drive/LocalFile/application/read/LocalFileChunkReader';
import { LocalFileWriter } from '../../../../context/offline-drive/LocalFile/application/write/LocalFileWriter';
import { LocalFileCache } from '../../../../context/offline-drive/LocalFile/domain/LocalFileCache';
import { LocalFileRepository } from '../../../../context/offline-drive/LocalFile/domain/LocalFileRepository';
import { NodeLocalFilesRepository } from '../../../../context/offline-drive/LocalFile/infrastructure/NodeLocalFilesRepository';
import { InMemoryLocalFileCache } from '../../../../context/offline-drive/LocalFile/infrastructure/cache/InMemoryLocalFileCache';
import { LocalFileDeleter } from '../../../../context/offline-drive/LocalFile/application/delete/LocalFileDeleter';
import { ClearLocalFiles } from '../../../../context/offline-drive/LocalFile/application/delete/ClearLocalFiles';

export async function registerLocalFilesServices(
  builder: ContainerBuilder
): Promise<void> {
  // Infra

  const appData = app.getPath('appData');
  const local = path.join(appData, 'internxt-drive', 'downloaded');

  const repo = new NodeLocalFilesRepository(local);
  await repo.init();

  builder.register(LocalFileRepository).useInstance(repo).private();

  builder
    .register(LocalFileCache)
    .use(InMemoryLocalFileCache)
    .asSingleton()
    .private();

  // Services
  builder.registerAndUse(LocalFileIsAvailable);
  builder.registerAndUse(LocalFileChunkReader);
  builder.registerAndUse(LocalFileCacheDeleter);
  builder.registerAndUse(LocalFileWriter);
  builder.registerAndUse(LocalFileDeleter);
  builder.registerAndUse(ClearLocalFiles);
}

import { Environment } from '@internxt/inxt-js';
import { ContainerBuilder } from 'diod';
import { ContentsChunkReader } from '../../../../context/offline-drive/contents/application/ContentsChunkReader';
import { OfflineContentsAppender } from '../../../../context/offline-drive/contents/application/OfflineContentsAppender';
import { OfflineContentsByteByByteComparator } from '../../../../context/offline-drive/contents/application/OfflineContentsByteByByteComparator';
import { OfflineContentsCacheCleaner } from '../../../../context/offline-drive/contents/application/OfflineContentsCacheCleaner';
import { OfflineContentsCreator } from '../../../../context/offline-drive/contents/application/OfflineContentsCreator';
import { OfflineContentsUploader } from '../../../../context/offline-drive/contents/application/OfflineContentsUploader';
import { AuxiliarOfflineContentsChucksReader } from '../../../../context/offline-drive/contents/application/auxiliar/AuxiliarOfflineContentsChucksReader';
import { AuxiliarOfflineContentsDeleter } from '../../../../context/offline-drive/contents/application/auxiliar/AuxiliarOfflineContentsDeleter';
import { OfflineContentsManagersFactory } from '../../../../context/offline-drive/contents/domain/OfflineContentsManagersFactory';
import { OfflineContentsRepository } from '../../../../context/offline-drive/contents/domain/OfflineContentsRepository';
import { EnvironmentOfflineContentsManagersFactory } from '../../../../context/offline-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { NodeFSOfflineContentsRepository } from '../../../../context/offline-drive/contents/infrastructure/NodeFSOfflineContentsRepository';
import { UploadProgressTracker } from '../../../../context/shared/domain/UploadProgressTracker';
import { LocalFileContentsDirectoryProvider } from '../../../../context/virtual-drive/shared/domain/LocalFileContentsDirectoryProvider';
import { DependencyInjectionMainProcessUserProvider } from '../../../shared/dependency-injection/main/DependencyInjectionMainProcessUserProvider';

export async function registerOfflineContentsServices(
  builder: ContainerBuilder
): Promise<void> {
  const user = DependencyInjectionMainProcessUserProvider.get();

  // Infra

  builder
    .register(OfflineContentsRepository)
    .useFactory((c) => {
      const repository = new NodeFSOfflineContentsRepository(
        c.get(LocalFileContentsDirectoryProvider),
        'uploads'
      );

      repository.init();

      return repository;
    })
    .private();

  // Services
  builder.registerAndUse(OfflineContentsAppender);

  builder
    .register(OfflineContentsManagersFactory)
    .useFactory(
      (c) =>
        new EnvironmentOfflineContentsManagersFactory(
          c.get(Environment),
          user.bucket,
          c.get(UploadProgressTracker)
        )
    );

  builder.registerAndUse(OfflineContentsUploader);
  builder.registerAndUse(OfflineContentsCreator);
  builder.registerAndUse(ContentsChunkReader);
  builder.registerAndUse(OfflineContentsCacheCleaner);
  builder.registerAndUse(OfflineContentsByteByByteComparator);
  builder.registerAndUse(AuxiliarOfflineContentsChucksReader);
  builder.registerAndUse(AuxiliarOfflineContentsDeleter);
}

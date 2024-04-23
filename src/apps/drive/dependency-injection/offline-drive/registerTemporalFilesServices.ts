import { Environment } from '@internxt/inxt-js';
import { ContainerBuilder } from 'diod';
import path from 'path';
import { TemporalFileByteByByteComparator } from '../../../../context/offline-drive/TemporalFiles/application/comparation/TemporalFileByteByByteComparator';
import { TemporalFileCreator } from '../../../../context/offline-drive/TemporalFiles/application/creation/TemporalFileCreator';
import { DeleteTemporalFileOnFileCreated } from '../../../../context/offline-drive/TemporalFiles/application/deletion/DeleteTemporalFileOnFileCreated';
import { TemporalFileDeleter } from '../../../../context/offline-drive/TemporalFiles/application/deletion/TemporalFileDeleter';
import { TemporalFileByFolderFinder } from '../../../../context/offline-drive/TemporalFiles/application/find/TemporalFileByFolderFinder';
import { TemporalFileByPathFinder } from '../../../../context/offline-drive/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFilePathsByFolderFinder } from '../../../../context/offline-drive/TemporalFiles/application/find/TemporalFilePathsByFolderFinder';
import { TemporalFileChunkReader } from '../../../../context/offline-drive/TemporalFiles/application/read/TemporalFileChunkReader';
import { TemporalFileUploader } from '../../../../context/offline-drive/TemporalFiles/application/upload/TemporalFileUploader';
import { TemporalFileWriter } from '../../../../context/offline-drive/TemporalFiles/application/write/TemporalFileWriter';
import { TemporalFileRepository } from '../../../../context/offline-drive/TemporalFiles/domain/TemporalFileRepository';
import { TemporalFileUploaderFactory } from '../../../../context/offline-drive/TemporalFiles/domain/upload/TemporalFileUploaderFactory';
import { NodeTemporalFileRepository } from '../../../../context/offline-drive/TemporalFiles/infrastructure/NodeTemporalFileRepository';
import { EnvironmentTemporalFileUploaderFactory } from '../../../../context/offline-drive/TemporalFiles/infrastructure/upload/EnvironmentTemporalFileUploaderFactory';
import { UploadProgressTracker } from '../../../../context/shared/domain/UploadProgressTracker';
import { FuseAppDataLocalFileContentsDirectoryProvider } from '../../../../context/virtual-drive/shared/infrastructure/LocalFileContentsDirectoryProviders/FuseAppDataLocalFileContentsDirectoryProvider';
import { DependencyInjectionMainProcessUserProvider } from '../../../shared/dependency-injection/main/DependencyInjectionMainProcessUserProvider';

export async function registerTemporalFilesServices(builder: ContainerBuilder) {
  // Infra
  const localFileContentsDirectoryProvider =
    new FuseAppDataLocalFileContentsDirectoryProvider();

  const dir = await localFileContentsDirectoryProvider.provide();

  const user = DependencyInjectionMainProcessUserProvider.get();

  const read = path.join(dir, 'downloaded');
  const write = path.join(dir, 'uploads');

  builder
    .register(TemporalFileRepository)
    .useFactory(() => new NodeTemporalFileRepository(read, write))
    .private()
    .asSingleton();

  builder
    .register(TemporalFileUploaderFactory)
    .useFactory(
      (c) =>
        new EnvironmentTemporalFileUploaderFactory(
          c.get(Environment),
          user.bucket,
          c.get(UploadProgressTracker)
        )
    )
    .asSingleton()
    .private();

  // Services

  builder.registerAndUse(TemporalFileCreator);
  builder.registerAndUse(TemporalFileDeleter);
  builder.registerAndUse(TemporalFilePathsByFolderFinder);
  builder.registerAndUse(TemporalFileByPathFinder);
  builder.registerAndUse(TemporalFileChunkReader);
  builder.registerAndUse(TemporalFileUploader);
  builder.registerAndUse(TemporalFileWriter);
  builder.registerAndUse(TemporalFileByteByByteComparator);
  builder.registerAndUse(TemporalFileByFolderFinder);

  // Event handlers
  builder
    .registerAndUse(DeleteTemporalFileOnFileCreated)
    .addTag('event-handler');
}

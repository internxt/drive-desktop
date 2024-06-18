import { Environment } from '@internxt/inxt-js';
import { ContainerBuilder } from 'diod';
import { app } from 'electron';
import path from 'path';
import { UploadProgressTracker } from '../../../../context/shared/domain/UploadProgressTracker';
import { TemporalFileByteByByteComparator } from '../../../../context/storage/TemporalFiles/application/comparation/TemporalFileByteByByteComparator';
import { TemporalFileCreator } from '../../../../context/storage/TemporalFiles/application/creation/TemporalFileCreator';
import { DeleteTemporalFileOnFileCreated } from '../../../../context/storage/TemporalFiles/application/deletion/DeleteTemporalFileOnFileCreated';
import { TemporalFileDeleter } from '../../../../context/storage/TemporalFiles/application/deletion/TemporalFileDeleter';
import { TemporalFileByFolderFinder } from '../../../../context/storage/TemporalFiles/application/find/TemporalFileByFolderFinder';
import { TemporalFileByPathFinder } from '../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFilePathsByFolderFinder } from '../../../../context/storage/TemporalFiles/application/find/TemporalFilePathsByFolderFinder';
import { TemporalFileChunkReader } from '../../../../context/storage/TemporalFiles/application/read/TemporalFileChunkReader';
import { TemporalFileUploader } from '../../../../context/storage/TemporalFiles/application/upload/TemporalFileUploader';
import { TemporalFileWriter } from '../../../../context/storage/TemporalFiles/application/write/TemporalFileWriter';
import { TemporalFileRepository } from '../../../../context/storage/TemporalFiles/domain/TemporalFileRepository';
import { TemporalFileUploaderFactory } from '../../../../context/storage/TemporalFiles/domain/upload/TemporalFileUploaderFactory';
import { NodeTemporalFileRepository } from '../../../../context/storage/TemporalFiles/infrastructure/NodeTemporalFileRepository';
import { EnvironmentTemporalFileUploaderFactory } from '../../../../context/storage/TemporalFiles/infrastructure/upload/EnvironmentTemporalFileUploaderFactory';
import { DependencyInjectionUserProvider } from '../../../shared/dependency-injection/DependencyInjectionUserProvider';

export async function registerTemporalFilesServices(builder: ContainerBuilder) {
  // Infra
  const user = DependencyInjectionUserProvider.get();

  const temporal = app.getPath('temp');
  const write = path.join(temporal, 'internxt-drive-tmp');

  builder
    .register(TemporalFileRepository)
    .useFactory(() => {
      const repo = new NodeTemporalFileRepository(write);

      repo.init();

      return repo;
    })
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

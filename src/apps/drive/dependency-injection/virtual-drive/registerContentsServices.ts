import { Environment } from '@internxt/inxt-js';
import { ContainerBuilder } from 'diod';
import { AllLocalContentsDeleter } from '../../../../context/virtual-drive/contents/application/AllLocalContentsDeleter';
import { ContentsUploader } from '../../../../context/virtual-drive/contents/application/ContentsUploader';
import { DownloadContentsToPlainFile } from '../../../../context/virtual-drive/contents/application/DownloadContentsToPlainFile';
import { LocalContentChecker } from '../../../../context/virtual-drive/contents/application/LocalContentChecker';
import { LocalContentsMover } from '../../../../context/virtual-drive/contents/application/LocalContentsMover';
import { MoveOfflineContentsOnContentsUploaded } from '../../../../context/virtual-drive/contents/application/MoveOfflineContentsOnContentsUploaded';
import { RetryContentsUploader } from '../../../../context/virtual-drive/contents/application/RetryContentsUploader';
import { ContentsManagersFactory } from '../../../../context/virtual-drive/contents/domain/ContentsManagersFactory';
import { LocalContentsProvider } from '../../../../context/virtual-drive/contents/domain/LocalFileProvider';
import { LocalFileSystem } from '../../../../context/virtual-drive/contents/domain/LocalFileSystem';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../../../context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { FSLocalFileProvider } from '../../../../context/virtual-drive/contents/infrastructure/FSLocalFileProvider';
import { FSLocalFileSystem } from '../../../../context/virtual-drive/contents/infrastructure/FSLocalFileSystem';
import { LocalFileContentsDirectoryProvider } from '../../../../context/virtual-drive/shared/domain/LocalFileContentsDirectoryProvider';
import { FuseAppDataLocalFileContentsDirectoryProvider } from '../../../../context/virtual-drive/shared/infrastructure/LocalFileContentsDirectoryProviders/FuseAppDataLocalFileContentsDirectoryProvider';
import { DependencyInjectionMainProcessUserProvider } from '../../../shared/dependency-injection/main/DependencyInjectionMainProcessUserProvider';

export function registerContentsServices(builder: ContainerBuilder): void {
  const user = DependencyInjectionMainProcessUserProvider.get();

  builder
    .register(ContentsManagersFactory)
    .useFactory(
      (c) =>
        new EnvironmentRemoteFileContentsManagersFactory(
          c.get(Environment),
          user.bucket
        )
    )
    .private();

  builder
    .register(LocalFileContentsDirectoryProvider)
    .use(FuseAppDataLocalFileContentsDirectoryProvider)
    .private();

  builder
    .register(LocalFileSystem)
    .useFactory(
      (c) =>
        new FSLocalFileSystem(
          c.get(LocalFileContentsDirectoryProvider),
          'downloaded'
        )
    )
    .private();

  builder.register(LocalContentsProvider).use(FSLocalFileProvider).private();

  builder.registerAndUse(DownloadContentsToPlainFile);

  builder.registerAndUse(LocalContentChecker);

  builder.registerAndUse(ContentsUploader);
  builder.registerAndUse(RetryContentsUploader);
  builder.registerAndUse(LocalContentsMover);
  builder.registerAndUse(AllLocalContentsDeleter);

  // Event subscribers

  builder
    .registerAndUse(MoveOfflineContentsOnContentsUploaded)
    .addTag('event-handler');
}

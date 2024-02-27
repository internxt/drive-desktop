import { OfflineContentsAppender } from '../../../../../context/offline-drive/contents/application/OfflineContentsAppender';
import { OfflineContentsCreator } from '../../../../../context/offline-drive/contents/application/OfflineContentsCreator';
import { OfflineContentsUploader } from '../../../../../context/offline-drive/contents/application/OfflineContentsUploader';
import { EnvironmentOfflineContentsManagersFactory } from '../../../../../context/offline-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { NodeFSOfflineContentsRepository } from '../../../../../context/offline-drive/contents/infrastructure/NodeFSOfflineContentsRepository';
import { MainProcessUploadProgressTracker } from '../../../../../context/shared/infrastructure/MainProcessUploadProgressTracker';
import { FuseAppDataLocalFileContentsDirectoryProvider } from '../../../../../context/virtual-drive/shared/infrastructure/LocalFileContentsDirectoryProviders/FuseAppDataLocalFileContentsDirectoryProvider';
import { DependencyInjectionEventBus } from '../../../../fuse/dependency-injection/common/eventBus';
import { DependencyInjectionInxtEnvironment } from '../../common/inxt-environment';
import { DependencyInjectionUserProvider } from '../../common/user';
import { OfflineFilesContainer } from '../OfflineFiles/OfflineFilesContainer';
import { OfflineContentsDependencyContainer } from './OfflineDriveDependencyContainer';

export async function buildOfflineContentsContainer(
  offlineFilesContainer: OfflineFilesContainer
): Promise<OfflineContentsDependencyContainer> {
  const environment = DependencyInjectionInxtEnvironment.get();
  const user = DependencyInjectionUserProvider.get();
  const eventBus = DependencyInjectionEventBus.bus;

  const localFileContentsDirectoryProvider =
    new FuseAppDataLocalFileContentsDirectoryProvider();
  const repository = new NodeFSOfflineContentsRepository(
    localFileContentsDirectoryProvider,
    'uploads'
  );

  await repository.init();

  const tracker = new MainProcessUploadProgressTracker();

  const offlineContentsAppender = new OfflineContentsAppender(
    offlineFilesContainer.offlineFileFinder,
    offlineFilesContainer.offlineFileSizeIncreaser,
    repository
  );

  const environmentOfflineContentsManagersFactory =
    new EnvironmentOfflineContentsManagersFactory(
      environment,
      user.bucket,
      tracker
    );

  const offlineContentsUploader = new OfflineContentsUploader(
    repository,
    environmentOfflineContentsManagersFactory,
    eventBus
  );

  const offlineContentsCreator = new OfflineContentsCreator(repository);

  return {
    offlineContentsCreator,
    offlineContentsAppender,
    offlineContentsUploader,
  };
}

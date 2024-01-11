import { Environment } from '@internxt/inxt-js';
import { ContentsUploader } from '../../../../../context/virtual-drive/contents/application/ContentsUploader';
import { DownloadContentsToPlainFile } from '../../../../../context/virtual-drive/contents/application/DownloadContentsToPlainFile';
import { LocalContentChecker } from '../../../../../context/virtual-drive/contents/application/LocalContentChecker';
import { RetryContentsUploader } from '../../../../../context/virtual-drive/contents/application/RetryContentsUploader';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../../../../context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { FSLocalFileProvider } from '../../../../../context/virtual-drive/contents/infrastructure/FSLocalFileProvider';
import { FSLocalFileSystem } from '../../../../../context/virtual-drive/contents/infrastructure/FSLocalFileSystem';
import { FuseAppDataLocalFileContentsDirectoryProvider } from '../../../../../context/virtual-drive/shared/infrastructure/LocalFileContentsDirectoryProviders/FuseAppDataLocalFileContentsDirectoryProvider';
import { DependencyInjectionEventBus } from '../../common/eventBus';
import { DependencyInjectionMnemonicProvider } from '../../common/mnemonic';
import { DependencyInjectionUserProvider } from '../../common/user';
import { SharedContainer } from '../shared/SharedContainer';
import { ContentsContainer } from './ContentsContainer';
import { MoveOfflineContentsOnContentsUploaded } from '../../../../../context/virtual-drive/contents/application/MoveOfflineContentsOnContentsUploaded';
import { LocalContentsMover } from '../../../../../context/virtual-drive/contents/application/LocalContentsMover';
import { AllLocalContentsDeleter } from '../../../../../context/virtual-drive/contents/application/AllLocalContentsDeleter';
import { MainProcessUploadProgressTracker } from '../../../../../context/shared/infrastructure/MainProcessUploadProgressTracker';

export async function buildContentsContainer(
  sharedContainer: SharedContainer
): Promise<ContentsContainer> {
  const user = DependencyInjectionUserProvider.get();
  const mnemonic = DependencyInjectionMnemonicProvider.get();
  const { bus: eventBus } = DependencyInjectionEventBus;

  const contentsActionNotifier = new MainProcessUploadProgressTracker();

  const environment = new Environment({
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
    encryptionKey: mnemonic,
  });

  const contentsManagerFactory =
    new EnvironmentRemoteFileContentsManagersFactory(environment, user.bucket);

  const localFileContentsDirectoryProvider =
    new FuseAppDataLocalFileContentsDirectoryProvider();

  const localFS = new FSLocalFileSystem(
    localFileContentsDirectoryProvider,
    'downloaded'
  );

  const downloadContentsToPlainFile = new DownloadContentsToPlainFile(
    contentsManagerFactory,
    localFS,
    eventBus
  );

  const localContentChecker = new LocalContentChecker(localFS);

  const contentsUploader = new ContentsUploader(
    contentsManagerFactory,
    new FSLocalFileProvider(),
    sharedContainer.relativePathToAbsoluteConverter,
    eventBus,
    contentsActionNotifier
  );

  const retryContentsUploader = new RetryContentsUploader(contentsUploader);

  const localContentsMover = new LocalContentsMover(localFS);

  const allLocalContentsDeleter = new AllLocalContentsDeleter(localFS);

  // Event subscribers

  const moveOfflineContentsOnContentsUploaded =
    new MoveOfflineContentsOnContentsUploaded(localContentsMover);

  return {
    downloadContentsToPlainFile,
    localContentChecker,
    retryContentsUploader,
    allLocalContentsDeleter,
    moveOfflineContentsOnContentsUploaded,
  };
}

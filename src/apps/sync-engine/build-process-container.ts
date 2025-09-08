import { RelativePathToAbsoluteConverter } from '@/context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { Environment } from '@internxt/inxt-js';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';
import { EnvironmentRemoteFileContentsManagersFactory } from '@/context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { ContentsDownloader } from '@/context/virtual-drive/contents/application/ContentsDownloader';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { FileContentsHardUpdater } from '@/context/virtual-drive/files/application/FileContentsHardUpdater';
import { FileOverwriteContent } from '@/context/virtual-drive/files/application/FileOverwriteContent';
import { FileDangledManager } from '@/context/virtual-drive/boundaryBridge/application/FileDangledManager';
import { DownloadFileController } from './callbacks-controllers/controllers/DownloadFileController';
import { ProcessSyncContext } from './config';

export type ProcessContainer = {
  fileRepository: InMemoryFileRepository;
  fileDangledManager: FileDangledManager;
  downloadFile: DownloadFileController;
};

export function buildProcessContainer({ ctx }: { ctx: ProcessSyncContext }): ProcessContainer {
  const relativePathToAbsoluteConverter = new RelativePathToAbsoluteConverter(ctx.rootPath);

  const environment = new Environment({
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeUser: ctx.bridgeUser,
    bridgePass: ctx.bridgePass,
    encryptionKey: ctx.mnemonic,
    appDetails: {
      clientName: INTERNXT_CLIENT,
      clientVersion: INTERNXT_VERSION,
      desktopHeader: process.env.DESKTOP_HEADER,
    },
  });

  const contentsManagerFactory = new EnvironmentRemoteFileContentsManagersFactory(environment, ctx.bucket);

  const contentsDownloader = new ContentsDownloader(contentsManagerFactory);

  const fileRepository = new InMemoryFileRepository();

  const fileContentsHardUpdate = new FileContentsHardUpdater(relativePathToAbsoluteConverter);

  const fileOverwriteContent = new FileOverwriteContent(fileRepository, fileContentsHardUpdate);

  const fileDangledManager = new FileDangledManager(contentsManagerFactory, fileOverwriteContent);
  const downloadFile = new DownloadFileController(contentsDownloader);

  return {
    fileRepository,
    fileDangledManager,
    downloadFile,
  };
}

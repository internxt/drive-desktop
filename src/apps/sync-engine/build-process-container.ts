import { RelativePathToAbsoluteConverter } from '@/context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
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

  const fileRepository = new InMemoryFileRepository();

  const fileContentsHardUpdate = new FileContentsHardUpdater(relativePathToAbsoluteConverter);

  const fileOverwriteContent = new FileOverwriteContent(fileRepository, fileContentsHardUpdate);

  const fileDangledManager = new FileDangledManager(fileOverwriteContent);

  const downloadFile = new DownloadFileController(ctx.contentsDownloader);

  return {
    fileRepository,
    fileDangledManager,
    downloadFile,
  };
}

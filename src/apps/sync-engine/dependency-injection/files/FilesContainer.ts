import { FileCreator } from '../../../../context/virtual-drive/files/application/FileCreator';
import { FileCheckerStatusInRoot } from '../../../../context/virtual-drive/files/application/FileCheckerStatusInRoot';
import { FileOverwriteContent } from '../../../../context/virtual-drive/files/application/FileOverwriteContent';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { FilePlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-file-placeholder';

export interface FilesContainer {
  fileRepository: InMemoryFileRepository;
  fileCreator: FileCreator;
  filePlaceholderUpdater: FilePlaceholderUpdater;
  filesCheckerStatusInRoot: FileCheckerStatusInRoot;
  fileOverwriteContent: FileOverwriteContent;
}

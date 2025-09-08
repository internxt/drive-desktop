import { FileOverwriteContent } from '../../../../context/virtual-drive/files/application/FileOverwriteContent';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';

export interface FilesContainer {
  fileRepository: InMemoryFileRepository;
  fileOverwriteContent: FileOverwriteContent;
}

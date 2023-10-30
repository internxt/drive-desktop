import { InternxtFileSystem } from '../../shared/domain/InternxtFileSystem';
import { File } from './File';
import { OfflineFile } from './OfflineFile';

export interface FileInternxtFileSystem
  extends InternxtFileSystem<File, OfflineFile> {}

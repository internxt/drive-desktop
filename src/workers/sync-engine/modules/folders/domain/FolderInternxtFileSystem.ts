import { InternxtFileSystem } from '../../shared/domain/InternxtFileSystem';
import { Folder } from './Folder';
import { OfflineFolder } from './OfflineFolder';

export interface FolderInternxtFileSystem
  extends InternxtFileSystem<Folder, OfflineFolder> {}

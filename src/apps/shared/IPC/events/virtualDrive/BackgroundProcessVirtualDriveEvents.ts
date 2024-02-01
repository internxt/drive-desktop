import { FilesEvents } from './backgroundEvents/files';
import { FolderEvents } from './backgroundEvents/folders';
import { TreeEvents } from './backgroundEvents/tree';

export type BackgroundProcessVirtualDriveEvents = FilesEvents &
  FolderEvents &
  TreeEvents;

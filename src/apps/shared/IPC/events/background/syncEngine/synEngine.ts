import { FilesEvents } from './files';
import { FolderEvents } from './folders';
import { TreeEvents } from './tree';

export type BackgroundProcessSyncEngineEvents = FilesEvents &
  FolderEvents &
  TreeEvents;

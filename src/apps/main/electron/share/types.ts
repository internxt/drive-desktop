import { SyncContext } from '../../../sync-engine/config';
import { FileUuid } from '../../database/entities/DriveFile';
import { FolderUuid } from '../../database/entities/DriveFolder';

export type ContextMenuItem = { type: 'file'; uuid: FileUuid } | { type: 'folder'; uuid: FolderUuid };
export type ContextMenuSelection = { item: ContextMenuItem; ctx: SyncContext };

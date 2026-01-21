import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { CommonContext } from '@/apps/sync-engine/config';

type PersistMoveProps = {
  ctx: CommonContext;
  parentUuid: FolderUuid;
  path: AbsolutePath;
  action: 'move' | 'rename';
};
export type PersistMoveFileProps = PersistMoveProps & { uuid: FileUuid };
export type PersistMoveFolderProps = PersistMoveProps & { uuid: FolderUuid };

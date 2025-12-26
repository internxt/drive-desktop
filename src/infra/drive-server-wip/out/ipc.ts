import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { CommonContext } from '@/apps/sync-engine/config';

export type PersistMoveFileProps = {
  ctx: CommonContext;
  uuid: FileUuid;
  parentUuid: FolderUuid;
  path: AbsolutePath;
};
export type PersistMoveFolderProps = {
  ctx: CommonContext;
  uuid: FolderUuid;
  parentUuid: FolderUuid;
  path: AbsolutePath;
};

import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { driveServerWip } from '../drive-server-wip.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { CommonContext } from '@/apps/sync-engine/config';

export type DeleteFileByUuidProps = Parameters<typeof driveServerWip.storage.deleteFileByUuid>[0];
export type DeleteFolderByUuidProps = Parameters<typeof driveServerWip.storage.deleteFolderByUuid>[0];
export type PersistMoveFileProps = {
  ctx: CommonContext;
  uuid: FileUuid;
  workspaceToken: string;
  parentUuid: FolderUuid;
  path: AbsolutePath;
};
export type PersistMoveFolderProps = {
  ctx: CommonContext;
  uuid: FolderUuid;
  workspaceToken: string;
  parentUuid: FolderUuid;
  path: AbsolutePath;
};

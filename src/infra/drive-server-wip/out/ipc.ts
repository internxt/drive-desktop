import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { driveServerWip } from '../drive-server-wip.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

export type DeleteFileByUuidProps = { uuid: FileUuid; path: AbsolutePath; workspaceToken: string };
export type DeleteFolderByUuidProps = { uuid: FolderUuid; path: AbsolutePath; workspaceToken: string };
export type CreateFolderProps = { plainName: string; parentUuid: FolderUuid; path: string; userUuid: string; workspaceId: string };

export type FromProcess = {
  storageDeleteFileByUuid: (props: DeleteFileByUuidProps) => Awaited<ReturnType<typeof driveServerWip.storage.deleteFileByUuid>>;
  storageDeleteFolderByUuid: (props: DeleteFolderByUuidProps) => Awaited<ReturnType<typeof driveServerWip.storage.deleteFolderByUuid>>;
  persistFolder: (props: CreateFolderProps) => Awaited<ReturnType<typeof SqliteModule.FolderModule.createOrUpdate>>;
  moveFileByUuid: (props: {
    uuid: FileUuid;
    workspaceToken: string;
    parentUuid: FolderUuid;
    path: AbsolutePath;
  }) => Awaited<ReturnType<typeof driveServerWip.files.move>>;
  moveFolderByUuid: (props: {
    uuid: FolderUuid;
    workspaceToken: string;
    parentUuid: FolderUuid;
    path: AbsolutePath;
  }) => Awaited<ReturnType<typeof driveServerWip.folders.move>>;
};

export type FromMain = {};

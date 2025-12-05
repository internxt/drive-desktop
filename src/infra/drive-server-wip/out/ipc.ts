import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { driveServerWip } from '../drive-server-wip.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { HttpRemoteFolderSystem } from '@/context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { HttpRemoteFileSystem } from '@/context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';

export type DeleteFileByUuidProps = { uuid: FileUuid; path: AbsolutePath; workspaceToken: string };
export type DeleteFolderByUuidProps = { uuid: FolderUuid; path: AbsolutePath; workspaceToken: string };
export type PersistFileProps = Parameters<typeof HttpRemoteFileSystem.persist>[0];
export type PersistFolderProps = Parameters<typeof HttpRemoteFolderSystem.persist>[0];

export type FromProcess = {
  storageDeleteFileByUuid: (props: DeleteFileByUuidProps) => Awaited<ReturnType<typeof driveServerWip.storage.deleteFileByUuid>>;
  storageDeleteFolderByUuid: (props: DeleteFolderByUuidProps) => Awaited<ReturnType<typeof driveServerWip.storage.deleteFolderByUuid>>;
  persistFile: (props: PersistFileProps) => Awaited<ReturnType<typeof SqliteModule.FileModule.createOrUpdate>>;
  persistFolder: (props: PersistFolderProps) => Awaited<ReturnType<typeof SqliteModule.FolderModule.createOrUpdate>>;
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

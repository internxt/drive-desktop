import { CreateFolderProps } from '@/backend/features/local-sync/create-item/create-folder';
import { SqliteModule } from '../sqlite.module';
import { CreateFileProps } from '@/backend/features/local-sync/create-item/create-file';

export type FromProcess = {
  fileGetByName: (
    props: Parameters<typeof SqliteModule.FileModule.getByName>[0],
  ) => Awaited<ReturnType<typeof SqliteModule.FileModule.getByName>>;
  folderGetByName: (
    props: Parameters<typeof SqliteModule.FolderModule.getByName>[0],
  ) => Awaited<ReturnType<typeof SqliteModule.FolderModule.getByName>>;
  fileGetByUuid: (
    props: Parameters<typeof SqliteModule.FileModule.getByUuid>[0],
  ) => Awaited<ReturnType<typeof SqliteModule.FileModule.getByUuid>>;
  folderGetByUuid: (
    props: Parameters<typeof SqliteModule.FolderModule.getByUuid>[0],
  ) => Awaited<ReturnType<typeof SqliteModule.FolderModule.getByUuid>>;
  fileCreateOrUpdate: (props: CreateFileProps) => Awaited<ReturnType<typeof SqliteModule.FileModule.createOrUpdate>>;
  folderCreateOrUpdate: (props: CreateFolderProps) => Awaited<ReturnType<typeof SqliteModule.FolderModule.createOrUpdate>>;
};

export type FromMain = {};

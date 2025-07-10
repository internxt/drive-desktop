import { SqliteModule } from '../sqlite.module';

export type FromProcess = {
  fileGetByUuid: (
    props: Parameters<typeof SqliteModule.FileModule.getByUuid>[0],
  ) => Awaited<ReturnType<typeof SqliteModule.FileModule.getByUuid>>;
  folderGetByUuid: (
    props: Parameters<typeof SqliteModule.FolderModule.getByUuid>[0],
  ) => Awaited<ReturnType<typeof SqliteModule.FolderModule.getByUuid>>;
};

export type FromMain = {};

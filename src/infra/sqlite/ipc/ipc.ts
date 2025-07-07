import { SqliteModule } from '../sqlite.module';

export type FromProcess = {
  fileGetByUuid: (
    props: Parameters<typeof SqliteModule.FileModule.getByUuid>[0],
  ) => Awaited<ReturnType<typeof SqliteModule.FileModule.getByUuid>>;
};

export type FromMain = {};

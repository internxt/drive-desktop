import { SQLiteModule } from '../sqlite.module';

export type FromProcess = {
  getFile: (props: Parameters<typeof SQLiteModule.getFile>[0]) => Awaited<ReturnType<typeof SQLiteModule.getFile>>;
  getFolder: (props: Parameters<typeof SQLiteModule.getFolder>[0]) => Awaited<ReturnType<typeof SQLiteModule.getFolder>>;
};

export type FromMain = {};

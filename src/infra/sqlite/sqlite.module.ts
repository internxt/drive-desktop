import { CheckpointModule } from './services/checkpoint.module';
import { FileModule } from './services/file.module';
import { FolderModule } from './services/folder.module';

export const SqliteModule = {
  FileModule,
  FolderModule,
  CheckpointModule,
};

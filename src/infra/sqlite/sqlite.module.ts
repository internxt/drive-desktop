import { CheckpointModule } from './services/checkpoint.module';
import { FileModule } from './services/file.module';
import { FolderModule } from './services/folder.module';
import { RecoverySyncModule } from './services/recovery-sync.module';
import { SubtreeModule } from './services/subtree.module';

export const SqliteModule = {
  FileModule,
  FolderModule,
  CheckpointModule,
  RecoverySyncModule,
  SubtreeModule,
};

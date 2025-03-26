import { AuthService } from './services/auth.service';
import { BackupService } from './services/backup.service';
import { FilesService } from './services/files.service';
import { FoldersService } from './services/folders.service';
import { StorageService } from './services/storage.service';

export class DriveServerWipModule {
  constructor(
    public auth = new AuthService(),
    public backup = new BackupService(),
    public files = new FilesService(),
    public folders = new FoldersService(),
    public storage = new StorageService(),
  ) {}
}

export const driveServerWipModule = new DriveServerWipModule();

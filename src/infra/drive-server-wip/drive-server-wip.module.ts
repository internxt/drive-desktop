import { AuthService } from './services/auth.service';
import { BackupService } from './services/backup.service';
import { FilesService } from './services/files.service';
import { FoldersService } from './services/folders.service';
import { StorageService } from './services/storage.service';
import { UserService } from './services/user.service';
import { getCredentials, getWorkspaces } from './services/workspaces.service';

export class DriveServerWipModule {
  public workspaces = {
    getWorkspaces,
    getCredentials,
  };

  constructor(
    public auth = new AuthService(),
    public backup = new BackupService(),
    public files = new FilesService(),
    public folders = new FoldersService(),
    public storage = new StorageService(),
    public user = new UserService(),
  ) {}
}

export const driveServerWipModule = new DriveServerWipModule();

import { AuthService } from './services/auth.service';
import { FilesService } from './services/files.service';
import { FoldersService } from './services/folders.service';

export class DriveServerWipModule {
  constructor(
    public auth = new AuthService(),
    public files = new FilesService(),
    public folders = new FoldersService(),
  ) {}
}

export const driveServerWipModule = new DriveServerWipModule();

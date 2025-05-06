import { AuthService } from './services/auth/auth.service';
import { BackupService } from './services/backup/backup.service';

export class DriveServerModule {

  constructor(
    public auth = new AuthService(),
    public backup = new BackupService(),
  ) {}
}

export const driveServerModule = new DriveServerModule();

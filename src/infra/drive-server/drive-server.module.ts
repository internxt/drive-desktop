import { AuthService } from './services/auth/auth.service';
import { BackupService } from './services/backup/backup.service';
import { UserService } from './services/user/user.service';

export class DriveServerModule {

  constructor(
    public auth = new AuthService(),
    public backup = new BackupService(),
    public user = new UserService()
  ) {}
}

export const driveServerModule = new DriveServerModule();

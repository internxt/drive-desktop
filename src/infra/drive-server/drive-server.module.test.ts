
import { AuthService } from './services/auth/auth.service';
import { DriveServerModule } from './drive-server.module';
import { BackupService } from './services/backup/backup.service';

describe('DriveServerModule', () => {
  let module: DriveServerModule;

  beforeEach(() => {
    module = new DriveServerModule();
  });

  it('should be instantiated', () => {
    expect(module).toBeInstanceOf(DriveServerModule);
  });

  it('should have "auth" property as instance of AuthService', () => {
    expect(module.auth).toBeDefined();
    expect(module.auth).toBeInstanceOf(AuthService);
  });

  it('should have "backup" property as instance of BackupService', () => {
    expect(module.backup).toBeDefined();
    expect(module.backup).toBeInstanceOf(BackupService);
  });
});

import * as auth from './services/auth.service';
import * as backup from './services/backup.service';
import * as storage from './services/storage.service';
import * as user from './services/user.service';
import * as workspaces from './services/workspaces.service';
import * as files from './services/files.service';
import * as folders from './services/folders.service';

export const driveServerWip = {
  workspaces,
  auth,
  backup,
  files,
  folders,
  storage,
  user,
};
export const driveServerWipModule = driveServerWip;

import { auth } from './services/auth.service';
import { backup } from './services/backup.service';
import { storage } from './services/storage.service';
import { user } from './services/user.service';
import { files } from './services/files.service';
import { folders } from './services/folders.service';
import { workspaces } from './services/workspaces.service';

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

import { auth } from './services/auth.service';
import { backup } from './services/backup.service';
import { storage } from './services/storage.service';
import { user } from './services/user.service';
import { FileModule, files } from './services/files.service';
import { FolderModule, folders } from './services/folders.service';
import { WorkspaceModule, workspaces } from './services/workspaces.service';

export const driveServerWip = {
  workspaces,
  WorkspaceModule,
  auth,
  backup,
  files,
  FileModule,
  folders,
  FolderModule,
  storage,
  user,
};
export const driveServerWipModule = driveServerWip;
export const DriveServerWipModule = driveServerWip;

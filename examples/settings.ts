import { mkdirSync } from 'fs';
import { join } from 'path';
import { cwd } from 'process';

export const TMP_PATH = join(cwd(), 'examples', 'tmp');
mkdirSync(TMP_PATH, { recursive: true });

const settings = {
  driveName: 'Internxt',
  driveVersion: '2.0.4',
  providerid: '{12345678-1234-1234-1234-123456789012}',
  syncRootPath: join(TMP_PATH, 'sync-root'),
  iconPath: join(cwd(), 'assets', 'icon.ico'),
  defaultLogPath: join(TMP_PATH, 'drive.log'),
  watcherLogPath: join(TMP_PATH, 'watcher.log'),
  queuePersistPath: join(TMP_PATH, 'queue-manager.json'),
};

export default settings;

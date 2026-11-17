import { createLogger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

export const EPOCH = '1970-01-01T00:00:00.000Z';
export const recoverySynclogger = createLogger({ tag: 'RECOVERY-SYNC' });

export type PreserveRun = {
  startedAt: string;
  subfolder: string;
  rootPaths: AbsolutePath[];
  // Destination of each volume already allocated in this pass, so it is read from SQLite once per volume.
  destinations: Map<string, AbsolutePath>;
};

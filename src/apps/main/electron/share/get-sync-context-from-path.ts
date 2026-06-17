import { getSyncContexts } from '@/apps/main/remote-sync/store';
import { SyncContext } from '@/apps/sync-engine/config';
import { isValidInternxtDrivePath, normalizeWindowsPath } from './utils';

export function getSyncContextFromPath(selectedPath: string): SyncContext | null {
  const normalizedSelectedPath = normalizeWindowsPath(selectedPath);
  return getSyncContexts().find((ctx) => isValidInternxtDrivePath(normalizedSelectedPath, normalizeWindowsPath(ctx.rootPath))) ?? null;
}

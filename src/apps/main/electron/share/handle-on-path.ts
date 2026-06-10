import { logger } from '@/apps/shared/logger/logger';
import { resolveContextMenuItem } from './resolve-context-menu-item';

export async function handleOnPath(selectedPath: string) {
  const item = await resolveContextMenuItem(selectedPath);
  if (!item) return;

  logger.debug({ msg: 'Resolved context-menu item', selectedPath, item });
}

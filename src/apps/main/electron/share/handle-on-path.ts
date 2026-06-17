import { logger } from '@/apps/shared/logger/logger';
import { copyShareLinkToClipboard } from './copy-share-link-to-clipboard';
import { createPublicShareLink } from './create-public-share-link';
import { resolveContextMenuItem } from './resolve-context-menu-item';
import { showShareResultNotification } from './show-share-result-notification';

export async function handleOnPath(selectedPath: string) {
  const selection = await resolveContextMenuItem(selectedPath);
  if (!selection) return;

  const { data, error } = await createPublicShareLink(selection);
  if (error) {
    logger.error({
      msg: 'Error creating public share link from context menu',
      selectedPath,
      item: selection.item,
      workspaceId: selection.ctx.workspaceId,
      error,
    });
    showShareResultNotification('error');
    return;
  }

  const success = copyShareLinkToClipboard(data);
  if (success) {
    showShareResultNotification('success');
  } else {
    showShareResultNotification('error');
  }
}

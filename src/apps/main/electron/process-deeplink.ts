import { INTERNXT_PROTOCOL } from '@/core/utils/utils';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { shell } from 'electron';

type Props = { argv: string[] };

export function processDeeplink({ argv }: Props) {
  logger.debug({ msg: 'Process deeplink', argv });

  const url = argv.find((arg) => arg.startsWith(INTERNXT_PROTOCOL));

  if (!url) return;

  const query = url.slice(INTERNXT_PROTOCOL.length + 1);
  const params = new URLSearchParams(query);

  const action = params.get('action');
  const contentId = params.get('contentId');

  logger.debug({ msg: 'Deeplink', action, contentId });

  if (action === 'navigate' && contentId) {
    void shell.openExternal(contentId);
  }
}

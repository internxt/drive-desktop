import { INTERNXT_PROTOCOL } from '@/core/utils/utils';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { shell } from 'electron';

type Props = { argv: string[] };

export function processDeeplink({ argv }: Props) {
  logger.debug({ msg: 'Process deeplink', argv });

  const url = argv.find((arg) => arg.startsWith(INTERNXT_PROTOCOL));

  if (!url) return;

  const regex = /action=([^&]+)&contentId=(.+)$/;
  const match = regex.exec(url);

  if (!match) return;

  const action = match[1];
  const contentId = match[2];

  logger.debug({ msg: 'Deeplink', action, contentId });

  if (action === 'navigate' && contentId) {
    void shell.openExternal(contentId);
  }
}

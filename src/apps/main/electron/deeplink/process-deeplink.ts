import { logger } from '@internxt/drive-desktop-core/build/backend';
import { shell } from 'electron';
import { INTERNXT_PROTOCOL } from '@/core/utils/utils';
import { ALLOWED_HOSTNAMES, ALLOWED_PROTOCOLS, notificationPrefix } from './constants';
import { isValidUrl } from './is-valid-url';

type Props = { argv: string[] };

export function processDeeplink({ argv }: Props) {
  const url = argv.find((arg) => arg.startsWith(INTERNXT_PROTOCOL));

  if (!url) {
    logger.debug({ msg: 'Unknown deeplink', argv });
    return;
  }

  logger.debug({ msg: 'Known deeplink', url: url.slice(0, 50) });
  if (url.startsWith(notificationPrefix)) {
    const link = url.slice(notificationPrefix.length);
    if (isValidUrl(link, ALLOWED_PROTOCOLS, ALLOWED_HOSTNAMES)) {
      void shell.openExternal(link);
    }
  }
}

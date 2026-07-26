import { logger } from '@internxt/drive-desktop-core/build/backend';
import { shell } from 'electron';
import { INTERNXT_PROTOCOL } from '@/core/utils/utils';
import { validateUrl } from '@/apps/shared/urlValidation';

const notificationPrefix = 'internxt://notification/';

const ALLOWED_PROTOCOLS = ['https:'];
const ALLOWED_HOSTNAMES = ['internxt.com', 'drive.internxt.com'];

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
    if (!validateUrl(link, ALLOWED_PROTOCOLS, ALLOWED_HOSTNAMES)) return;
    void shell.openExternal(link);
  }
}

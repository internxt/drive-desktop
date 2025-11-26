import { INTERNXT_PROTOCOL } from '@/core/utils/utils';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { shell } from 'electron';
import { processLogin } from './process-login';

const loginPrefix = 'internxt://login-success/';
const notificationPrefix = 'internxt://notification/';

type Props = { argv: string[] };

export function processDeeplink({ argv }: Props) {
  const url = argv.find((arg) => arg.startsWith(INTERNXT_PROTOCOL));

  if (!url) {
    logger.debug({ msg: 'Unknown deeplink', argv });
    return;
  }

  logger.debug({ msg: 'Known deeplink', url: url.slice(0, 50) });

  if (url.startsWith(loginPrefix)) {
    void processLogin({ search: url.slice(loginPrefix.length) });
  } else if (url.startsWith(notificationPrefix)) {
    const link = url.slice(notificationPrefix.length);
    void shell.openExternal(link);
  }
}

import { logger } from '@/apps/shared/logger/logger';
import { processDeeplink } from './electron/deeplink/process-deeplink';
import { QUIT_FLAG, quitApp } from './quit';
import { getWidget, showFrontend } from './windows/widget';

type Props = { argv: string[] };

export function handleSecondInstance({ argv }: Props) {
  if (argv.includes(QUIT_FLAG)) {
    logger.debug({ msg: 'Quit requested by another instance' });
    void quitApp();
    return;
  }

  processDeeplink({ argv });

  if (getWidget()) showFrontend();
}

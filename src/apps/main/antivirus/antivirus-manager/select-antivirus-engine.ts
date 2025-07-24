import { isWindowsDefenderAvailable } from '../windows-defender/is-windows-defender-available';
import { initializeClamAV } from '../utils/initializeAntivirus';
import { checkClamdAvailability } from '../ClamAVDaemon';
import { logger } from '@/apps/shared/logger/logger';

export async function selectAntivirusEngine() {
  logger.debug({
    tag: 'ANTIVIRUS',
    msg: 'Selecting antivirus engine...',
  });

  if (await isWindowsDefenderAvailable()) {
    logger.info({
      tag: 'ANTIVIRUS',
      msg: 'Default antivirus selected as engine',
    });
    return 'windows-defender';
  }

  if (!(await checkClamdAvailability())) await initializeClamAV();
  if (await checkClamdAvailability()) {
    logger.info({
      tag: 'ANTIVIRUS',
      msg: 'ClamAV selected as fallback antivirus',
    });
    return 'clamav';
  }

  logger.warn({
    tag: 'ANTIVIRUS',
    msg: 'No antivirus engines available',
  });
  return null;
}

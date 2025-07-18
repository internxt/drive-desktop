import { isWindowsDefenderRealTimeProtectionActive } from '../../ipcs/ipcMainAntivirus';
import { initializeClamAV } from '../utils/initializeAntivirus';
import { checkClamdAvailability } from '../ClamAVDaemon';
import { sleep } from '@/apps/main/util';
import { logger } from '@/apps/shared/logger/logger';

export async function selectAntivirusEngine() {
  logger.debug({
    tag: 'ANTIVIRUS',
    msg: 'Selecting antivirus engine...',
  });

  if (await isWindowsDefenderRealTimeProtectionActive()) {
    logger.info({
      tag: 'ANTIVIRUS',
      msg: 'Windows Defender selected as primary antivirus',
    });
    return 'windows-defender';
  }

  if (!(await checkClamdAvailability())) await initializeClamAV();
  await sleep(5000);
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

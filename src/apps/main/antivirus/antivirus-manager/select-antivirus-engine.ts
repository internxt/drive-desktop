import { isWindowsDefenderRealTimeProtectionActive } from '../../ipcs/ipcMainAntivirus';
import { initializeClamAV } from '../utils/initializeAntivirus';
import { checkClamdAvailability } from '../ClamAVDaemon';
import { logger } from '@/apps/shared/logger/logger';

export async function selectAntivirusEngine() {
  logger.debug({
    tag: 'ANTIVIRUS',
    msg: 'Selecting antivirus engine...',
  });

  if (await isWindowsDefenderRealTimeProtectionActive()) {
    logger.debug({
      tag: 'ANTIVIRUS',
      msg: 'Default antivirus selected as engine',
    });
    return 'windows-defender';
  }

  const clamavAvailable = await checkClamdAvailability();
  if (!clamavAvailable) {
    const { antivirusEnabled } = await initializeClamAV();
    if (antivirusEnabled) {
      logger.debug({
        tag: 'ANTIVIRUS',
        msg: 'ClamAV selected as fallback antivirus',
      });
      return 'clamav';
    }
  }

  logger.warn({
    tag: 'ANTIVIRUS',
    msg: 'No antivirus engines available',
  });
  return null;
}

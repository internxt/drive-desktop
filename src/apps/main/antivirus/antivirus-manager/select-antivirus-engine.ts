import { isWindowsDefenderRealTimeProtectionActive } from '../../ipcs/ipcMainAntivirus';
import { initializeClamAV } from '../utils/initializeAntivirus';
import { checkClamdAvailability } from '../ClamAVDaemon';
import { sleep } from '@/apps/main/util';
import { AntivirusType } from './types';
import { logger } from '@/apps/shared/logger/logger';

/**
 * Determines which antivirus engine to use based on availability
 * Priority: Windows Defender -> ClamAV
 * @returns Promise<AntivirusType | null> - the selected antivirus type or null if none available
 */
export async function selectAntivirusEngine(): Promise<AntivirusType | null> {
  logger.debug({
    tag: 'ANTIVIRUS',
    msg: 'Selecting antivirus engine...',
  });

  // First priority: Windows Defender
  if (await isWindowsDefenderRealTimeProtectionActive()) {
    logger.info({
      tag: 'ANTIVIRUS',
      msg: 'Windows Defender selected as primary antivirus',
    });
    return 'windows-defender';
  }

  // Fallback: ClamAV
  if (!(await checkClamdAvailability())) await initializeClamAV();
  await sleep(5000); // Wait for ClamAV initialization
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

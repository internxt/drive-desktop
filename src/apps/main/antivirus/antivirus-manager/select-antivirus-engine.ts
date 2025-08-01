import { isWindowsDefenderAvailable } from '../windows-defender/is-windows-defender-available';
import { initializeClamAV } from '../utils/initializeAntivirus';
import { checkClamdAvailability } from '../ClamAVDaemon';
import { findMpCmdRun } from '../windows-defender/find-mcp-command';
import { logger } from '@/apps/shared/logger/logger';

export async function selectAntivirusEngine() {
  logger.debug({
    tag: 'ANTIVIRUS',
    msg: 'Selecting antivirus engine...',
  });

  const isWindowsDefenderActive = await isWindowsDefenderAvailable();
  const mpCmdRunPath = await findMpCmdRun();
  if (isWindowsDefenderActive && mpCmdRunPath) {
    logger.debug({
      tag: 'ANTIVIRUS',
      msg: 'Default antivirus selected as engine',
    });
    return 'windows-defender';
  }

  const clamavAvailable = await checkClamdAvailability();
  if (clamavAvailable) {
    logger.debug({
      tag: 'ANTIVIRUS',
      msg: 'ClamAV is already available, selected as engine',
    });
    return 'clamav';
  }

  const { antivirusEnabled } = await initializeClamAV();
  if (antivirusEnabled) {
    logger.debug({
      tag: 'ANTIVIRUS',
      msg: 'ClamAV initialized, selected as engine',
    });
    return 'clamav';
  }

  logger.warn({
    tag: 'ANTIVIRUS',
    msg: 'No antivirus engines available',
  });
  return null;
}

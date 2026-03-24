import { logger } from '@/apps/shared/logger/logger';
import { execAsync } from '@/core/utils/exec-async';
import { findMpCmdRun } from './find-mcp-command';

export async function isWindowsDefenderAvailable(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('powershell "Get-MpComputerStatus | Select-Object -Property AMServiceEnabled"');
    const mpCmdRunIsAvailable = await findMpCmdRun();
    return stdout.includes('True') && !!mpCmdRunIsAvailable;
  } catch (error) {
    logger.error({
      tag: 'ANTIVIRUS',
      msg: 'Error checking Windows Defender status.',
      exc: error,
    });
    return false;
  }
}

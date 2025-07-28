import { logger } from '@/apps/shared/logger/logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
export async function isWindowsDefenderAvailable(): Promise<boolean> {
  try {
    const { stdout } = await execPromise('powershell "Get-MpComputerStatus | Select-Object -Property AMServiceEnabled"');
    return stdout.includes('True');
  } catch (error) {
    logger.error({
      tag: 'ANTIVIRUS',
      msg: 'Error checking Windows Defender status.',
      exc: error,
    });
    return false;
  }
}

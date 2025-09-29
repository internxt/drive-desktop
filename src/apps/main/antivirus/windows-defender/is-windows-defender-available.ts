import { logger } from '@/apps/shared/logger/logger';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { findMpCmdRun } from './find-mcp-command';

const execPromise = promisify(exec);
export async function isWindowsDefenderAvailable(): Promise<boolean> {
  try {
    const { stdout } = await execPromise('powershell "Get-MpComputerStatus | Select-Object -Property AMServiceEnabled"');
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

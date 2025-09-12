import os from 'os';
import { LogFilesPaths } from '../cleaner.types';
import path from 'path';
/**
 * Get all relevant log file paths
 */
export function getLogfilesPaths(): LogFilesPaths {
  const homeDir = os.homedir();
  return {
    localShareLogs: path.join(homeDir, '.local', 'share'),
    varLogDir: '/var/log',
    xsessionErrorsFile: path.join(homeDir, '.xsession-errors'),
  };
}

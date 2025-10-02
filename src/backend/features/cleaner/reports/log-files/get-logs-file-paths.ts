import os from 'node:os';
import path from 'node:path';
import { LogFilesPaths } from '../../cleaner.types';

export function getLogsFilePaths() {
  const homeDir = os.homedir();
  const localAppData = process.env.LOCALAPPDATA ?? path.join(homeDir, 'AppData', 'Local');
  const appData = process.env.APPDATA ?? path.join(homeDir, 'AppData', 'Roaming');
  const userProfile = process.env.USERPROFILE ?? homeDir;
  const programData = process.env.ProgramData ?? 'C:\\ProgramData';

  return {
    localLogs: localAppData,
    roamingLogs: appData,
    systemLogs: 'C:\\Windows\\Logs',
    programDataLogs: programData,
    userProfileLogs: userProfile,
  } as LogFilesPaths;
}
